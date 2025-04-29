import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { model, messages } = body

    if (!model || !messages) {
      return NextResponse.json(
        { error: "Modell und Nachrichten sind erforderlich" },
        { status: 400 }
      )
    }

    // OpenAI API-Key aus Umgebungsvariablen lesen
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API-Key ist nicht konfiguriert" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey
    })

    // Format der Nachrichten für OpenAI API anpassen
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    // OpenAI API aufrufen
    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      max_tokens: 1024
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("OpenAI API error:", error)

    return NextResponse.json(
      {
        error: "Fehler bei der Kommunikation mit OpenAI",
        details: error.message
      },
      { status: 500 }
    )
  }
}
