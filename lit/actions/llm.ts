declare var Lit: any

interface LLMConfig {
  openaiApiKey: string
  openaiModel?: string
  temperature?: number
}

interface CallAgentParams {
  idea: string
  digest: string
  action: 'hint' | 'prompt' | 'evaluate_and_digest'
  prompt?: string
  note?: string
  llmUrl: string
  config: LLMConfig
}

// Context header for all LLM prompts
export function getContextHeader() {
  return `
Idea: The main concept or problem statement guiding the collaborative project. All contributions must align with or enhance this core idea.

Digest: A concise record of previously accepted notes, summarizing progress and insights so far.

Note: A single user contribution. It should add a new perspective, detail, or challenge. Each note is evaluated by AI for its relevance and impact.

Mechanism:
1) Idea is published.
2) Users write a note without seeing the full digest.
3) The note is AI-evaluated before acceptance, determining its value for rewards.
4) If accepted, the note is merged into the digest to keep track of evolving insights.
5) The AI can provide hints on potential angles or details to explore for the next note but does not itself add or alter content.

Use these definitions when referring to "idea", "digest", or "note" in any subsequent prompts.
The AI's role is to facilitate clarity and cohesion, never to invent or speculate beyond what is provided.
`
}

// LLM prompt templates
export function createHintPrompt(idea: string, digest: string): string {
  return JSON.stringify({
    system: `
You are an idea facilitator. Your role is to guide participants towards new angles or details they might explore in their next note. 
You are not improving or expanding the idea yourself; instead, you are highlighting potential directions for contributors to investigate, ensuring each suggestion remains distinct from existing content.

Your suggestions should be short, concise, and effective. You are not providing a full note; instead, you are providing a single-sentence suggestion that can spark further exploration.

Propose a single-sentence suggestion for the next note that:
- Adds a new angle or detail not already covered in the digest.
- Avoids simply restating the digest or the original idea.
- Can spark further exploration.

**Output only valid JSON** with one key "hint". For example:
{
  "hint": <short hint here>
}

No extra text before or after the JSON.
`,
    user: `
Original Idea: "${idea}"

Current digest (previous notes): "${digest}"
`,
  })
}

export function createEvaluationPrompt(idea: string, digest: string, note: string): string {
  return JSON.stringify({
    system: `
You are an objective evaluator. Your goal is to assess how a new note compares to the initial idea and the current digest.

IMPORTANT: You must distinguish between actual contributions and mere hints or suggestions:
- A valid contribution provides specific content, details, analysis, or perspective
- A hint or suggestion merely points to a direction without providing substance
- REJECT notes that are just hints, questions, or suggestions without substantive content

Evaluate the note on a scale of 0 to 10 for each criterion:

1. **Relevance**: 
   - 0 if the note has no connection to the idea or digest
   - Up to 10 if it strongly addresses or advances them
   - Automatically score 0 if the note is just a hint or suggestion without substance

2. **Novelty** (especially considering the digest, repeated points => 0):
   - 0 if the note simply repeats what's already in the digest without adding anything new
   - 0 if the note is merely a hint or suggestion without substantive content
   - 10 if it introduces a clearly distinct and valuable perspective not yet covered with specific details

3. **Depth**:
   - 0 if it's extremely shallow, trivial, or merely a hint/suggestion
   - 10 if it provides thorough insight, analysis, or elaboration with specific details
   - A note must have substance and specificity to score above 3 on depth

4. **Clarity**:
   - 0 if it's incoherent
   - 10 if it's very clear and easy to understand

5. **Impact** (particularly if it provides new direction vs. the digest; if it repeats, score ~0):
   - 0 if it won't meaningfully influence future contributions or rehashes the digest
   - 0 if it's merely a hint or suggestion without substantive content
   - 10 if it could significantly shape subsequent notes or directions with specific details

AUTOMATIC REJECTION CRITERIA:
1. If the note is just a hint, suggestion, or question without substantive content
2. If the note is irrelevant or nonsense
3. If the note repeats or only slightly rephrases what is already in the digest

Check carefully for repeated or overlapping content.
If the note repeats or only slightly rephrases what is already in the digest,
score novelty = 0, and impact = 0, indicating it adds little new value.
If the new note contradicts or challenges previous thoughts, label that discrepancy. Pluralism is welcome.

DISTINGUISHING HINTS FROM CONTRIBUTIONS:
A hint might say "Consider exploring the economic implications" without providing those implications.
A valid contribution would actually explore those economic implications with specific details and analysis.

Then:
- Provide a "weightedScore" (0–10) that reflects the overall value of this note, factoring in the above criteria.
- Offer a "verdict" of either "accept" or "reject" based on whether you believe the note is valuable enough to include.
  - ALWAYS reject if the note is merely a hint or suggestion without substantive content
  - ALWAYS reject if the weighted score is below 5
- Give a short "justification" explaining your numeric ratings and specifically mention if the note was rejected for being a hint.

**Output only valid JSON** with one key "evaluation". For example:
{
  "evaluation": {
    "criteria": {
      "relevance": number,
      "novelty": number,
      "depth": number,
      "clarity": number,
      "impact": number
    },
    "weightedScore": number,
    "verdict": "accept" | "reject",
    "justification": <short explanation>
  }
}

No extra text before or after the JSON.
`,
    user: `
The original idea: "${idea}"
The current digest of previous contributions: "${digest}"

Evaluate the new note: "${note}"
`,
  })
}

export function createDigestPrompt(idea: string, digest: string, note: string): string {
  return JSON.stringify({
    system: `
You are an analytical information synthesizer focused on progressive summarization.
Your goal is to create increasingly refined and structured digests by intelligently merging new information with existing content.

Key Principles:
- Progressive refinement: Each iteration should make the digest more structured and concise
- Information preservation: No key details should be lost during compression
- Systematic organization: Group and structure related concepts
- Conflict awareness: Highlight contradictions without resolving them

Required Transformations:
1. ANALYZE
   - Break down new note into atomic information units
   - Identify overlap with existing digest content
   - Map relationships between concepts

2. RESTRUCTURE 
   - Group related points under common themes
   - Create hierarchical organization where appropriate
   - Use bullet points or numbered lists for clear structure
   - Maintain logical flow between sections

3. COMPRESS
   - Combine redundant or overlapping points
   - Remove unnecessary words while preserving meaning
   - Use precise, specific language
   - Target 25% length reduction while maintaining information

4. SYNTHESIZE
   - Weave points together into cohesive narrative
   - Highlight key relationships between concepts
   - Mark contradictions with "(Alternative View)" or "(Contradiction)"
   - Ensure relevance to original idea


**Evaluation Criteria**:
- Content: All key information preserved
- Structure: Clear organization and grouping
- Concision: No unnecessary words or repetition
- Clarity: Easy to understand and follow
- Progress: Meaningful improvement over previous digest

**Absolute Requirements:**
- Output 25-50% shorter than combined input lengths
- Zero verbatim sentences from inputs – reformulate ALL content
- Use nested bullet points for hierarchical organization
- Preserve ALL unique perspectives, even conflicting ones
- Never use transitional phrases like "however" – show relationships through structure

Examples of Required Transformations:

BAD (simple concatenation):
Old: "Users need notifications for engagement."
New: "Email notifications increase retention."
Result: "Users need notifications for engagement. Email notifications increase retention."

GOOD (synthesized and compressed):
Result: "Strategic notifications (esp. email) drive user engagement and retention."

BAD (lost information):
Old: "A/B testing showed 23% uplift with gamification."
New: "Gamification works better for casual users."
Result: "Gamification improves engagement."

GOOD (preserved detail + structure):
Result: "Gamification effectiveness:
- Quantitative: 23% engagement uplift in A/B tests
- Audience: Particularly resonates with casual users"

Output Format:
{
  "digest": "<transformed content following above principles>"
}`,
    user: `
Original Idea: "${idea}"

Current Digest: "${digest}"

New Note: "${note}"

Transform and synthesize this information following the structured approach above.
Remember: You MUST modify the digest to incorporate the new note. Returning the input unchanged is not allowed.
`,
  })
}

export function createPromptingPrompt(idea: string, digest: string, prompt: string): string {
  return JSON.stringify({
    system: `
You are a factual respondent. You have access only to the original idea and the current digest of contributions.

You must:
1. Limit your response to information actually present in the idea or digest.
2. If the user's prompt is outside the scope of these sources, say you cannot find relevant information.
3. Do not invent or speculate on details not provided.

**Output only valid JSON** with one key "reasoning". For example:
{
  "reasoning": <short factual statement or clarifying user prompt message based on the idea and especially the digest>
}

No extra text before or after the JSON.
`,
    user: `
Provide reasoning to user's prompt: "${prompt}"

Based on the initial idea: "${idea}"

And the current digest of people who have contributed with their notes: "${digest}"
`,
  })
}

// LLM handling function

interface LLMResponsePayload {
  digest?: string
  evaluation?: any // Consider defining a more specific type for evaluation
  hint?: string
  reasoning?: string
  error?: string
  raw?: string
}

export async function callLLM(
  promptContent: string,
  action: string,
  llmUrl: string,
  config: LLMConfig,
  currentDigest: string = '',
): Promise<any> {
  console.log('Calling LLM for action:', action, 'with prompt content:', promptContent)

  try {
    const parsedPrompt = JSON.parse(promptContent)

    const response = await fetch(llmUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${getContextHeader()}${parsedPrompt.system}`,
          },
          {
            role: 'user',
            content: parsedPrompt.user,
          },
        ],
        temperature: config.temperature || 0.5,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`LLM API call failed: ${response.statusText} - ${errorBody}`)
    }

    const data = await response.json()
    const generatedResponse = data.choices[0].message.content
    console.log('LLM generated response:', generatedResponse)

    let parsedLLMResponse: LLMResponsePayload = {}
    try {
      // Attempt to parse the response, removing markdown fences if present
      parsedLLMResponse = JSON.parse(generatedResponse.replace(/^```json\n?|\n?```$/g, ''))
      console.log('Parsed LLM response:', parsedLLMResponse)
    } catch (e) {
      console.warn('LLM response could not be parsed as JSON, attempting to use raw content based on action.')
      // Fallback for non-JSON responses based on action type
      if (action.toLowerCase() === 'hint') parsedLLMResponse = { hint: generatedResponse }
      else if (action.toLowerCase() === 'evaluation')
        parsedLLMResponse = {
          evaluation: { justification: generatedResponse, verdict: 'error', weightedScore: 0, criteria: {} },
        }
      // Provide a default error structure
      else if (action.toLowerCase() === 'prompt') parsedLLMResponse = { reasoning: generatedResponse }
      else parsedLLMResponse = { error: 'Failed to parse LLM response', raw: generatedResponse }
    }

    // Ensure the response structure aligns with expectations
    return {
      digest:
        parsedLLMResponse.digest || (action.toLowerCase() === 'digest' ? parsedLLMResponse.digest : currentDigest),
      evaluation:
        parsedLLMResponse.evaluation || (action.toLowerCase() === 'evaluation' ? parsedLLMResponse.evaluation : null),
      hint: parsedLLMResponse.hint || (action.toLowerCase() === 'hint' ? parsedLLMResponse.hint : null),
      reasoning:
        parsedLLMResponse.reasoning || (action.toLowerCase() === 'prompt' ? parsedLLMResponse.reasoning : null),
    }
  } catch (error: any) {
    console.error('Error during LLM call:', error)
    // Propagate a structured error if possible, or the original error
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: errorMessage || 'Unknown error in callLLM' }
  }
}

// Helper functions for specific actions
export async function getHint(idea: string, digest: string, llmUrl: string, config: LLMConfig): Promise<any> {
  const prompt = createHintPrompt(idea, digest)
  return await callLLM(prompt, 'hint', llmUrl, config)
}

export async function getPromptResponse(
  idea: string,
  digest: string,
  promptText: string,
  llmUrl: string,
  config: LLMConfig,
): Promise<any> {
  const prompt = createPromptingPrompt(idea, digest, promptText)
  return await callLLM(prompt, 'prompt', llmUrl, config)
}

export async function evaluateAndDigest(
  idea: string,
  digest: string,
  note: string,
  llmUrl: string,
  config: LLMConfig,
): Promise<any> {
  // First evaluate the note
  const evaluationPrompt = createEvaluationPrompt(idea, digest, note)
  const evaluationResult = await callLLM(evaluationPrompt, 'evaluation', llmUrl, config, digest)

  const evaluation = evaluationResult.evaluation
  let newDigest = digest // Default to old digest if evaluation fails or note is rejected

  // Ensure evaluation is an object and has a verdict property
  if (evaluation && typeof evaluation === 'object' && evaluation.verdict === 'accept') {
    // If accepted, create a new digest
    const digestPrompt = createDigestPrompt(idea, digest, note)
    const digestResponse = await callLLM(digestPrompt, 'digest', llmUrl, config, digest)
    newDigest = digestResponse.digest || newDigest // Use new digest or fallback
  }

  return {
    evaluation: evaluation || {
      justification: 'Evaluation failed or note rejected',
      verdict: 'error',
      weightedScore: 0,
      criteria: {},
    },
    digest: newDigest,
  }
}

export async function callAgent({ idea, digest, action, prompt, note, llmUrl, config }: CallAgentParams) {
  const res = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: 'agentCaller',
    },
    async () => {
      let result: any
      if (action === 'hint') {
        result = await getHint(idea, digest, llmUrl, config)
      } else if (action === 'prompt') {
        if (typeof prompt !== 'string') {
          throw new Error(`'prompt' is required for action 'prompt'`)
        }
        result = await getPromptResponse(idea, digest, prompt, llmUrl, config)
      } else if (action === 'evaluate_and_digest') {
        if (typeof note !== 'string') {
          throw new Error(`'note' is required for action 'evaluate_and_digest'`)
        }
        result = await evaluateAndDigest(idea, digest, note, llmUrl, config)
      } else {
        throw new Error(`Unknown or invalid agent action: ${action}`)
      }

      return JSON.stringify(result)
    },
  )

  if (!res) {
    throw new Error('Agent response is empty')
  }

  return JSON.parse(res)
}
