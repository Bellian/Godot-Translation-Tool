import { NextResponse } from 'next/server'

type Incoming = {
    key: string
    exportedKey?: string
    translations: { languageCode: string; text: string }[]
    availableLanguages: { id: number; code: string }[]
}

const AI_HOST = process.env.AI_HOST || ''
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL_ID = process.env.AI_MODEL_ID || ''

async function callDeepInfra(prompt: string) {
    if (!AI_MODEL_ID || !AI_API_KEY || !AI_HOST) throw new Error('Missing AI_HOST, AI_API_KEY or AI_MODEL_ID env vars')

    // call DeepInfra OpenAI-compatible endpoint
    const res = await fetch(AI_HOST, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
            model: AI_MODEL_ID,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 1200,
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`DeepInfra error: ${res.status} ${text}`)
    }

    const data = await res.json()
    // openai-compatible response shape: data.choices[0].message.content
    return data?.choices?.[0]?.message?.content
}

function buildPrompt(input: Incoming) {
    const available = input.availableLanguages.map((l) => l.code).join(', ')
    const toTranslate = input.translations.filter((t) => !t.text).map((t) => t.languageCode)
    const existing = input.translations
        .map((t) => ({ code: t.languageCode, text: t.text }))
    const context = {
        key: input.key,
        exportedKey: input.exportedKey,
        existingTranslations: existing,
        availableLanguages: input.availableLanguages.map((l) => l.code),
    }

    return `You are a translation assistant.
Provided with the following JSON input for context: ${JSON.stringify(context)}

Return a JSON object (no extra text) with a single key "translations" mapping language codes to translated text, but only for languages that are missing (empty or blank) in the provided existingTranslations.
Texts may contain BBCode or placeholders like \`{damage}\`. Preserve the BBCode and placeholders as good as possible.
Use concise, natural translations.
Example: {"translations": {"es": "[color=green]hola[/color]", "fr": "[color=green]bonjour[/color]"}}.

Languages available: ${available}
Languages to translate: ${toTranslate}`
}

export async function POST(req: Request) {
    try {
        const body: Incoming = await req.json()

        const prompt = buildPrompt(body)
        const content = await callDeepInfra(prompt)

        console.log('Model output:', content)

        // try to parse JSON from the model output
        let parsed: null | { translations: Record<string, string>[] } = null
        try {
            // sometimes model may include markdown or text; attempt to extract JSON substring
            const m = content?.match(/\{[\s\S]*\}/)
            const jsonText = m ? m[0] : content
            parsed = JSON.parse(jsonText)
        } catch {
            return NextResponse.json({ error: 'Failed to parse model output', raw: content }, { status: 500 })
        }

        // expected shape { translations: { code: text } }
        return NextResponse.json({ translations: parsed?.translations ?? {} })
    } catch (err) {
        return NextResponse.json({ error: (err as Error)?.message ?? String(err) }, { status: 500 })
    }
}
