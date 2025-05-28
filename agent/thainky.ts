import * as fs from "fs"
import * as dotenv from "dotenv"

import express from "express"
import {
    AgentKit,
    CdpWalletProvider,
    wethActionProvider,
    walletActionProvider,
    erc20ActionProvider,
    cdpApiActionProvider,
    cdpWalletActionProvider,
    pythActionProvider,
} from "@coinbase/agentkit"

import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

import * as prompts from "./prompts.ts"

dotenv.config()

const WALLET_DATA_FILE = "wallet_data.txt"


async function initializeAgent() {
    try {
        const llm = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.5
        })

        let walletDataStr: string | null = null

        if (fs.existsSync(WALLET_DATA_FILE)) {
            try {
                walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8")
            } catch (error) {
                console.error("Error reading wallet data:", error)
            }
        }

        const config = {
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            cdpWalletData: walletDataStr || undefined,
            networkId: process.env.NETWORK_ID || "base-sepolia",
        }

        return { llm, config }
    } catch (error) {
        if (error instanceof Error) {
            console.error("Failed to initialize agent:", error.message)
        }
        throw error
    }
}


async function handleLLMPrompt(llm: ChatOpenAI, prompt: string, action: string, digest: string = "") {
    console.log("Constructed prompt for LLM:", prompt)

    try {
        const promptObject = JSON.parse(prompt);
        const stream = await llm.stream([
            new SystemMessage({ content: `${prompts.CONTEXT_HEADER}${promptObject.system}` }),
            new HumanMessage({ content: promptObject.user })
        ])

        let generatedResponse = ""
        for await (const chunk of stream) {
            generatedResponse += chunk.content
        }

        console.log("LLM generated response:", generatedResponse)

        let parsedResponse = {}
        try {
            parsedResponse = JSON.parse(generatedResponse.replace(/^```json|```$/g, ""))
            console.log("Parsed LLM response:", parsedResponse)
        } catch (e) {
            console.warn("LLM response could not be parsed as JSON, using raw content.")
            if (action.toLowerCase() === "hint") parsedResponse = { hint: generatedResponse }
            if (action.toLowerCase() === "evaluation") parsedResponse = { evaluation: generatedResponse }
            if (action.toLowerCase() === "prompt") parsedResponse = { reasoning: generatedResponse }
        }

        return {
            digest: parsedResponse.digest || digest,
            evaluation: parsedResponse.evaluation || (action.toLowerCase() === "evaluation" ? parsedResponse.evaluation : ""),
            hint: parsedResponse.hint || (action.toLowerCase() === "hint" ? parsedResponse.hint : ""),
            reasoning: parsedResponse.reasoning || (action.toLowerCase() === "prompt" ? parsedResponse.reasoning : "")
        }
    } catch (error) {
        console.error("Error during LLM prompt handling:", error)
        throw error
    }
}

async function runServerMode(llm: ChatOpenAI, config: any) {
    console.log("Initializing server mode...")
    console.log("Environment variables:", {
        AGENT_MODE: process.env.AGENT_MODE,
        NODE_ENV: process.env.NODE_ENV,
        CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME ? "Set" : "Not set",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Set" : "Not set",
        NETWORK_ID: process.env.NETWORK_ID
    })

    const app = express()
    const port = process.env.AGENT_PORT || 3001

    app.use(express.json())

    app.get('/health', (req, res) => {
        console.log("Health check endpoint called")
        res.json({ status: 'ok' })
    })

    app.post('/chat', async (req, res) => {
        console.log("Chat endpoint invoked with body:", req.body)
        const { action, idea = "", digest = "", note = "", prompt = "" } = req.body

        // Validate required fields
        if (!action || !idea || !digest) {
            console.error("Missing required fields: 'action', 'idea', and 'digest' are required")
            return res.status(400).json({ error: "'action', 'idea', and 'digest' are required" })
        }

        // Construct the prompt based on the action
        let finalPrompt = ""
        switch (action.toLowerCase()) {
            case "hint":
                finalPrompt = prompts.HINT_PROMPT_TEMPLATE(idea, digest)
                break
            case "evaluation":
                if (!note) {
                    return res.status(400).json({ error: "'note' is required for evaluation action" })
                }
                finalPrompt = prompts.EVALUATION_PROMPT_TEMPLATE(idea, digest, note)
                break
            case "digest":
                if (!note || !digest) {
                    return res.status(400).json({ error: "'note' and 'digest' are required for digest action" })
                }
                finalPrompt = prompts.DIGEST_PROMPT_TEMPLATE(idea, digest, note)
                break
            case "evaluate_and_digest":
                if (!note) {
                    return res.status(400).json({ error: "'note' is required for evaluate_and_digest action" })
                }
                try {
                    const evaluationPrompt = prompts.EVALUATION_PROMPT_TEMPLATE(idea, digest, note)
                    const evaluationResult = await handleLLMPrompt(llm, evaluationPrompt, "evaluation", digest)
                    const evaluation = evaluationResult.evaluation

                    const parsedEval = typeof evaluation === 'string' ? JSON.parse(evaluation) : evaluation

                    let digestResult = null
                    if (parsedEval.verdict === 'accept') {
                        const digestPrompt = prompts.DIGEST_PROMPT_TEMPLATE(idea, digest, note)
                        const digestResponse = await handleLLMPrompt(llm, digestPrompt, "digest", digest)
                        digestResult = digestResponse.digest
                    }

                    return res.json({
                        evaluation: parsedEval,
                        digest: digestResult
                    })
                } catch (error) {
                    console.error("Error during evaluate_and_digest:", error)
                    return res.status(500).json({ error: "Internal server error" })
                }
            case "prompt":
                if (!prompt) {
                    return res.status(400).json({ error: "'prompt' is required for prompt action" })
                }
                finalPrompt = prompts.PROMPTING_PROMPT_TEMPLATE(idea, digest, prompt)
                break
            default:
                return res.status(400).json({ error: "Invalid action. Use 'hint', 'evaluation', 'digest', 'evaluate_and_digest', or 'prompt'" })
        }

        try {
            const result = await handleLLMPrompt(llm, finalPrompt, action.toLowerCase(), digest)
            res.json(result)
        } catch (error) {
            console.error("Error during processing /chat endpoint:", error)
            res.status(500).json({ error: "Internal server error" })
        }
    })

    try {
        app.listen(port, '0.0.0.0', () => {
            console.log(`Agent server listening on port ${port} on all interfaces`)
        })
    } catch (error) {
        console.error("Failed to start server:", error)
        throw error
    }
}

async function main() {
    console.log("Starting Agent...")

    try {
        if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY || !process.env.OPENAI_API_KEY) {
            throw new Error("Required environment variables are missing. Please check CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY, and OPENAI_API_KEY")
        }

        const { llm, config } = await initializeAgent()
        console.log("Agent initialized successfully")

        await runServerMode(llm, config)
    } catch (error) {
        console.error("Fatal error:", error)
        process.exit(1)
    }
}

main().catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
})
