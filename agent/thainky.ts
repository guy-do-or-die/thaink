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
import { HumanMessage } from "@langchain/core/messages"

dotenv.config()

const WALLET_DATA_FILE = "wallet_data.txt"

async function initializeAgent() {
    try {
        const llm = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0
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

        const walletProvider = await CdpWalletProvider.configureWithWallet(config)

        const agent = await AgentKit.from({
            walletProvider,
            actionProviders: [
                wethActionProvider(),
                pythActionProvider(),
                walletActionProvider(),
                erc20ActionProvider(),
                cdpApiActionProvider({
                    apiKeyName: process.env.CDP_API_KEY_NAME,
                    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                }),
                cdpWalletActionProvider({
                    apiKeyName: process.env.CDP_API_KEY_NAME,
                    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                }),
            ],
        })

        const exportedWallet = await walletProvider.exportWallet()
        fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet))

        return { agent, llm, config }
    } catch (error) {
        if (error instanceof Error) {
            console.error("Failed to initialize agent:", error.message)
        }
        throw error
    }
}


async function runServerMode(agent: AgentKit, llm: ChatOpenAI, config: any) {
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
        console.log("Chat endpoint called with message:", req.body.message)
        try {
            const { message } = req.body
            if (!message) {
                console.log("No message provided in request")
                return res.status(400).json({ error: 'Message is required' })
            }

            const stream = await llm.stream([new HumanMessage(message)])
            let response = ''

            for await (const chunk of stream) {
                response += chunk.content
            }

            console.log("Generated response:", response)
            res.json({ response })
        } catch (error) {
            console.error('Error processing chat request:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })

    try {
        app.listen(port, () => {
            console.log(`Agent server listening on port ${port}`)
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

        const { agent, llm, config } = await initializeAgent()
        console.log("Agent initialized successfully")

        await runServerMode(agent, llm, config)
    } catch (error) {
        console.error("Fatal error:", error)
        process.exit(1)
    }
}

main().catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
})