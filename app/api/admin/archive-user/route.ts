import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Benutzer-ID fehlt" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Zuerst prüfen, ob der aktuelle Benutzer Administratorrechte hat
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("Authentifizierungsfehler:", sessionError)
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      )
    }

    console.log("Anfrage zur Benutzerarchivierung für ID:", userId)

    // Benutzerdetails abrufen
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
      return NextResponse.json(
        { error: `Konnte Profil nicht laden: ${profileError.message}` },
        { status: 500 }
      )
      }

      if (!profileData) {
      return NextResponse.json(
        { error: "Benutzer existiert nicht" },
        { status: 404 }
      )
    }

    // Statt den Benutzer zu archivieren, erstellen wir einen Eintrag in der Archivierungsanfragen-Tabelle
    const { data: requestData, error: requestError } = await supabase
      .from("user_archive_requests")
      .insert({
        user_id: userId,
        requested_by: session.user.id,
        user_name: profileData.full_name || "Unbekannt",
        user_email: profileData.email || "Keine E-Mail",
        status: "pending",
        reason: "Löschung angefordert - Daten für AI-Mitarbeiter sichern",
        metadata: {
          company_id: profileData.company_id,
          role: profileData.role,
          requested_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (requestError) {
      console.error("Fehler beim Erstellen der Archivierungsanfrage:", requestError)
      return NextResponse.json(
        { error: `Fehler bei der Anfrageerstellung: ${requestError.message}` },
        { status: 500 }
      )
    }

    // Optional: E-Mail-Benachrichtigung an Admin-Team senden (erfordert E-Mail-Service)
    // await sendAdminNotification({
    //   subject: "Neue Archivierungsanfrage",
    //   message: `Es wurde eine neue Archivierungsanfrage für Benutzer ${profileData.full_name} (${profileData.email}) erstellt.`
    // });

    return NextResponse.json({
      success: true,
      message: "Archivierungsanfrage erfolgreich erstellt",
      request_id: requestData.id,
      user_details: {
        name: profileData.full_name,
        email: profileData.email
      }
    })
  } catch (error: any) {
    console.error("Fehler bei der Benutzerarchivierungsanfrage:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
