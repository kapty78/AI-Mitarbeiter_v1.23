import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { prompt, userId } = await req.json()

    if (!prompt || !userId) {
      return NextResponse.json(
        {
          error: "Prompt and userId are required"
        },
        { status: 400 }
      )
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Verify authentication
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        {
          error: "Authentication error: " + sessionError.message
        },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        {
          error: "Not authenticated"
        },
        { status: 401 }
      )
    }

    // Verify that the authenticated user matches the requested userId
    if (session.user.id !== userId) {
      return NextResponse.json(
        {
          error: "Unauthorized: User ID mismatch"
        },
        { status: 403 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing")
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured"
        },
        { status: 500 }
      )
    }

    // Prepare the system message for improving prompts
    const systemMessage = `Du bist ein Prompt-Engineering-Experte mit umfassender Erfahrung in der Optimierung von System-Prompts für KI-Assistenten.

Deine Aufgabe ist es, System-Prompts zu verbessern, indem du folgende Elemente eines perfekten Prompts einbaust:

1. KLARHEIT UND PRÄZISION: Entferne Mehrdeutigkeiten und formuliere klare, spezifische Anweisungen.
2. ROLLENANGABE: Füge eine klare Rolle für den KI-Assistenten hinzu (z.B. "Du bist ein Experte für...").
3. KONTEXT: Stelle sicher, dass ausreichend Hintergrundinformationen vorhanden sind.
4. FORMATIERUNG: Definiere bei Bedarf ein klares Format für die Antwort.
5. BEGRENZUNGEN: Füge Beschränkungen wie Umfang, Tonfall oder Komplexität hinzu.
6. PROZESSSTRUKTUR: Unterteile komplexe Aufgaben in klare Schritte.
7. BEISPIELE: Füge Beispiele ein, wenn diese im ursprünglichen Prompt fehlen und sie hilfreich wären.
8. ZIELGRUPPENORIENTIERUNG: Definiere, für wen die Antwort bestimmt ist.
9. ERFOLGSKRITERIEN: Gib an, was eine gute Antwort ausmacht.

Restrukturiere den Prompt, sodass er ein klares Ziel hat und nicht widersprüchlich oder mehrdeutig ist. Erweitere knappe Prompts und straffe überladene. Behalte den Grundinhalt und die Absicht des ursprünglichen Prompts bei.

Antworte NUR mit dem verbesserten Prompt, ohne Erklärungen, Kommentare oder Einleitungen.`

    try {
      // Start with gpt-4o as the preferred model
      let modelToUse = "gpt-4o"
      let response

      try {
        console.log(`Attempting to use ${modelToUse} for prompt improvement`)
        response = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5 // Lower temperature for more predictable results
        })
      } catch (primaryModelError: any) {
        // Fallback to gpt-3.5-turbo if gpt-4o fails
        console.warn(
          `${modelToUse} error, falling back to gpt-3.5-turbo:`,
          primaryModelError.message
        )
        modelToUse = "gpt-3.5-turbo"

        console.log(`Attempting to use ${modelToUse} for prompt improvement`)
        response = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5
        })

        // If gpt-3.5-turbo also fails, the error will be caught by the outer catch block
      }

      // Extract the improved prompt
      const improvedPrompt =
        response.choices[0]?.message?.content?.trim() || prompt

      // Return the improved prompt with the model used
      return NextResponse.json({
        improvedPrompt,
        modelUsed: modelToUse
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return NextResponse.json(
        {
          error: `OpenAI API error: ${openaiError.message || "Unknown error"}`,
          details: openaiError
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in improve-prompt API:", error)
    return NextResponse.json(
      {
        error: "An error occurred processing your request",
        details: error.message
      },
      { status: 500 }
    )
  }
}
