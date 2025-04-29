import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// CORS-Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

// OPTIONS handler für CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { model, messages, system } = body

    if (!model || !messages) {
      return NextResponse.json(
        { error: "Modell und Nachrichten sind erforderlich" },
        { status: 400 }
      )
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API-Key ist nicht konfiguriert" },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey
    })

    // Modell-ID korrigieren
    const modelId =
      model === "claude-3-sonnet-20240229" ? "claude-3-sonnet-20240229" : model

    // Einfache Antwort ohne Streaming
    const response = await anthropic.messages.create({
      model: modelId,
      system: system,
      messages: messages,
      max_tokens: 1024
    })

    return NextResponse.json({ content: response.content[0].text })
  } catch (error: any) {
    console.error("Claude API error:", error)
    return NextResponse.json(
      {
        error: "Fehler bei der Kommunikation mit Claude",
        details: error.message
      },
      { status: 500 }
    )
  }
}
