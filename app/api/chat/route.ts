import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Modelzuordnungen
const MODEL_MAPPINGS: Record<string, string> = {
  Basic: "gpt-4o-2024-11-20",
  Fast: "gpt-4o-mini-2024-07-18",
  Reason: "o3-mini-2025-01-31",
  "Reason+": "gpt-4.5-preview-2025-02-27",
  // Add direct mappings for the values from the dropdown
  "gpt-4o": "gpt-4o-2024-11-20",
  "gpt-4o-mini": "gpt-4o-mini-2024-07-18",
  "o3-mini": "o3-mini-2025-01-31",
  "gpt-4.5-preview": "gpt-4.5-preview-2025-02-27"
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const queryParams = url.searchParams;
  const queryModel = queryParams.get('model');

  const body = await req.json();
  const messages = body.messages || []
  const model = body.model || "gpt-4o" // Default auf Basic
  const stream = body.streaming === true // Lese streaming-Parameter aus Body
  const isTitleGeneration = body.usedForTitleGeneration === true // Prüfen, ob es sich um Titelgenerierung handelt

  // Log to help with debugging
  console.log(`API received request with model: "${model}" (type: ${typeof model})`);
  console.log(`User profile data: ${JSON.stringify(body.profile)}`);
  console.log(`Streaming enabled: ${stream}`);
  if (isTitleGeneration) {
    console.log(`Request for title generation detected`);
  }

  // Prioritize the model from query params, then body, then default to "Basic" (not "Reason")
  const selectedModelKey = queryModel || model || "Basic";
  console.log(`Selected model key before mapping: "${selectedModelKey}"`);
  
  // If the key exactly matches a model mapping key, use it directly
  const modelToUse = MODEL_MAPPINGS[selectedModelKey] || MODEL_MAPPINGS["Basic"]; 
  
  console.log(`Using model: "${modelToUse}" (mapped from "${selectedModelKey}")`);

  try {
    // Bei Titelgenerierungsanfragen überspringen wir die Authentifizierungsprüfung
    if (!isTitleGeneration) {
      // Create a Supabase client for auth check (außer bei Titelgenerierung)
      const supabase = createRouteHandlerClient({ cookies })

      // Verify authentication
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
    }

    if (stream) {
      console.log("Streaming path selected based on request body.");
      // For streaming responses
      const streamResponse = await openai.chat.completions.create({
        model: modelToUse,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        stream: true
      });

      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();

            // Process each chunk from the stream
            for await (const chunk of streamResponse) {
              // Send the chunk data to the client
              if (chunk.choices[0]?.delta?.content) {
                // Send raw text content without JSON wrapping
                controller.enqueue(encoder.encode(chunk.choices[0].delta.content));
              }

              // Check if we have a tool_call delta
              if (chunk.choices[0]?.delta?.tool_calls) {
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'tool_call',
                  tool_call: chunk.choices[0].delta.tool_calls
                }) + '\n'));
              }

              // Handle the end of the stream
              if (chunk.choices[0]?.finish_reason) {
                controller.enqueue(encoder.encode(`\n[DONE:${chunk.choices[0].finish_reason}]`));
              }
            }
            controller.close();
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Apply-Reveal-Effect': 'true' // Add a header to indicate effect should be applied
          },
        }
      );
    } else {
      console.log("Non-streaming path selected.");
      // For non-streaming responses

      // Create a modified messages array with user profile context
      let messagesWithUserContext = [...messages]

      // If we have user profile data, insert it at the beginning as a system message
        if (body.profile) {
        try {
          // Create a user context section
          let userContextPrompt = `--- Benutzerkontext ---\n`

            if (body.profile.full_name) {
              userContextPrompt += `Name: ${body.profile.full_name}\n`
          }

            if (body.profile.role) {
              userContextPrompt += `Rolle: ${body.profile.role}\n`
          }

            if (body.profile.company_name) {
              userContextPrompt += `Unternehmen: ${body.profile.company_name}\n`
          }

            if (body.profile.preferred_language) {
              userContextPrompt += `Bevorzugte Sprache: ${body.profile.preferred_language}\n`
          }

            if (body.profile.communication_style) {
              userContextPrompt += `Kommunikationsstil: ${body.profile.communication_style}\n`
          }

            if (body.profile.expertise) {
              userContextPrompt += `Expertise/Fachwissen: ${body.profile.expertise}\n`
          }

          userContextPrompt += `--- Ende Benutzerkontext ---\n\n`

          // Find the first system message or add a new one at the beginning
          const firstSystemIndex = messagesWithUserContext.findIndex(
            m => m.role === "system"
          )

          if (firstSystemIndex >= 0) {
            // Prepend the user context to the first system message
            const systemMessage = messagesWithUserContext[firstSystemIndex]
            messagesWithUserContext[firstSystemIndex] = {
              ...systemMessage,
              content: userContextPrompt + systemMessage.content
            }
          } else {
            // Add a new system message at the beginning
            messagesWithUserContext.unshift({
              role: "system",
              content:
                userContextPrompt +
                "Du bist ein digitaler AI-Mitarbeiter von EcomTask. Du unterstützt den User professionell und freundlich bei der Arbeit an individuellen Aufgaben und Projekten.",
              id: "system-message-with-user-context",
              timestamp: new Date()
            })
          }
        } catch (profileError) {
          console.error("Error processing user profile:", profileError)
          // Continue without user profile if there's an error
        }
      }

      console.log(
        "Prepared messages for API (non-streaming):",
        messagesWithUserContext.map(m => ({
          role: m.role,
          contentPreview: m.content.substring(0, 50) + "..."
        }))
      )

      // Call the OpenAI API
        console.log("Preparing API call with model (non-streaming):", modelToUse)

      // Erstelle Basis-Parameter und füge temperature nur hinzu wenn unterstützt
      let apiParams: any = {
          model: modelToUse,
        messages: messagesWithUserContext.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      }

      // Bei Titelgenerierung lower temperature für prägnantere Titel
      if (isTitleGeneration) {
        apiParams.temperature = 0.2;
      }
      // Füge temperature nur hinzu, wenn das Modell nicht o3-mini-2025-01-31 ist und keine Titelgenerierung
      else if (modelToUse !== "o3-mini-2025-01-31") {
        apiParams.temperature = 0.7
      }

      // Logging for non-streaming params (streaming will always be false here)
      console.log("API params (non-streaming):", {
        model: apiParams.model,
          hasTemperature: apiParams.hasOwnProperty("temperature"),
          streaming: false // Explicitly false for this path
      })

      const response = await openai.chat.completions.create(apiParams)

      // Extract the response content
      const content = response.choices[0]?.message?.content || ""

      // Log complete response details to help with debugging
      console.log(`Received non-streaming response from OpenAI API for model ${modelToUse}, content length: ${content.length}`);

      // Return the response - don't wrap in a JSON object with a "content" property
      // since the frontend will expect just the raw content
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error: any) {
    console.error("Error in chat API:", error)
    console.error("Error details:", error.message)
    if (error.response) {
      console.error("OpenAI API error response:", error.response.data)
    }

    return NextResponse.json(
      {
        error: "An error occurred processing your request",
        details: error.message
      },
      { status: 500 }
    )
  }
}
