import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import OpenAI from "openai"

// OpenAI Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    // Request-Body parsen
    const data = await req.json()
    const { input } = data

    console.log(`🔄 Embeddings API aufgerufen`)
    console.log(`📥 Input-Länge: ${input?.length || 0} Zeichen`)

    if (!input) {
      console.error("❌ Kein Input-Text angegeben")
      return NextResponse.json(
        { error: "Input text is required" },
        { status: 400 }
      )
    }

    // Log first part of input for debugging (truncate to avoid huge logs)
    const truncatedInput =
      input.length > 300 ? `${input.substring(0, 300)}...` : input
    console.log(`📄 Input-Vorschau: ${truncatedInput}`)

    // Supabase Client erstellen
    const supabase = createRouteHandlerClient({ cookies })

    // Authentifizierung überprüfen
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("❌ Nicht authentifiziert")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`👤 Nutzer: ${session.user.email}`)
    console.log(`🔍 Generiere Embedding mit Modell: text-embedding-3-small`)

    // OpenAI Embedding erstellen
    const start = Date.now()
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: input
    })
    const duration = Date.now() - start

    const embedding = embeddingResponse.data[0].embedding

    console.log(`✅ Embedding erfolgreich generiert in ${duration}ms`)
    console.log(`📊 Dimensionen: ${embedding.length}`)
    console.log(
      `🔍 Embedding-Vorschau (erste 5 Werte): [${embedding.slice(0, 5).join(", ")}]`
    )

    // Embedding zurückgeben
    return NextResponse.json({
      embedding: embedding,
      model: "text-embedding-3-small"
    })
  } catch (error: any) {
    console.error("❌ Error in embeddings API:", error)
    return NextResponse.json(
      {
        error: "An error occurred processing your request",
        details: error.message
      },
      { status: 500 }
    )
  }
}
