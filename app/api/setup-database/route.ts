import { NextResponse } from "next/server"
import { setupTasksTable } from "@/app/tasks/createDbSchema"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  // Sicherheit: Überprüfe, ob der Benutzer eingeloggt und berechtigt ist
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    )
  }

  try {
    const result = await setupTasksTable()

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        success: true
      })
    } else {
      return NextResponse.json(
        {
          error: "Fehler beim Einrichten der Datenbank",
          details: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Fehler beim Setup der Datenbank:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler", details: error },
      { status: 500 }
    )
  }
}

// Optional: POST-Endpunkt für andere Datenbank-Setup-Operationen
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    )
  }

  try {
    // Hier könnte man weitere Setup-Operationen durchführen
    // z.B. basierend auf dem Request-Body
    const body = await request.json()

    if (body.action === "setupTasks") {
      const result = await setupTasksTable()
      return NextResponse.json({
        success: result.success,
        message: result.message
      })
    }

    return NextResponse.json(
      {
        message: "Keine gültige Aktion angegeben",
        success: false
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("Fehler beim POST-Request:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler", details: error },
      { status: 500 }
    )
  }
}
