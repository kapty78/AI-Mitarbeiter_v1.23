import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Hilfsfunktion, um Fehlerobjekte korrekt zu extrahieren
function getErrorMessage(error: any): string {
  if (error === null || error === undefined) return "Unbekannter Fehler"
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (error.message) return error.message
  if (error.error)
    return typeof error.error === "string"
      ? error.error
      : JSON.stringify(error.error)
  if (error.code)
    return `Fehlercode: ${error.code}${error.details ? ` - ${error.details}` : ""}`
  return JSON.stringify(error)
}

export async function GET() {
  try {
    // Überprüfen des Authentifizierungsstatus
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Authentifizierungsstatus abrufen
    const { data: authData, error: authError } = await supabase.auth.getUser()

    const authStatus = {
      isAuthenticated: authData?.user != null,
      user: authData?.user
        ? {
            id: authData.user.id,
            email: authData.user.email,
            role: authData.user.role
          }
        : null,
      authError: authError ? getErrorMessage(authError) : null
    }

    const results = {
      status: "success",
      authStatus,
      tests: [] as Array<{
        name: string
        status: "success" | "error"
        message: string
        data?: any
        error?: any
      }>
    }

    // Test -1: Direkter Verbindungstest ohne Auth-Helpers
    try {
      // Feste Konfiguration aus Tests
      const supabaseUrl = "https://zdqelbwhfkfiuzodosri.supabase.co"
      const supabaseAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcWVsYndoZmtmaXV6b2Rvc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NjMyOTYsImV4cCI6MjA1OTIzOTI5Nn0.95--C-y51vDmzjEh2nugMdpYd3o5BCSHuPZNkf_mHZ0"
      const directSupabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: directTest, error: directError } = await directSupabase
        .from("workspaces")
        .select("count(*)", { count: "exact", head: true })

      if (directError) throw directError

      results.tests.push({
        name: "Direkte Supabase-Verbindung",
        status: "success",
        message: "Direkte Supabase-Verbindung erfolgreich hergestellt"
      })
    } catch (error: any) {
      results.tests.push({
        name: "Direkte Supabase-Verbindung",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 0: Überprüfe Supabase-Verbindung
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from("workspaces")
        .select("count(*)", { count: "exact", head: true })

      if (connectionError) throw connectionError
      results.tests.push({
        name: "Supabase-Verbindung",
        status: "success",
        message: "Supabase-Verbindung erfolgreich hergestellt"
      })
    } catch (error: any) {
      results.tests.push({
        name: "Supabase-Verbindung",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 1: Workspaces-Tabelle
    try {
      const { data: workspaces, error: workspacesError } = await supabase
        .from("workspaces")
        .select("*")
        .limit(5)

      if (workspacesError) throw workspacesError
      results.tests.push({
        name: "Workspaces-Tabelle",
        status: "success",
        message: `Workspaces-Tabelle gefunden mit ${workspaces.length} Einträgen`,
        data: workspaces
      })
    } catch (error: any) {
      results.tests.push({
        name: "Workspaces-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 2: Tasks-Tabelle
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .limit(5)

      if (tasksError) throw tasksError
      results.tests.push({
        name: "Tasks-Tabelle",
        status: "success",
        message: `Tasks-Tabelle gefunden mit ${tasks.length} Einträgen`,
        data: tasks
      })
    } catch (error: any) {
      results.tests.push({
        name: "Tasks-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 3: Chats-Tabelle
    try {
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .limit(5)

      if (chatsError) throw chatsError
      results.tests.push({
        name: "Chats-Tabelle",
        status: "success",
        message: `Chats-Tabelle gefunden mit ${chats.length} Einträgen`,
        data: chats
      })
    } catch (error: any) {
      results.tests.push({
        name: "Chats-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 4: Chat-Messages-Tabelle
    try {
      const { data: chatMessages, error: chatMessagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .limit(5)

      if (chatMessagesError) throw chatMessagesError
      results.tests.push({
        name: "Chat-Messages-Tabelle",
        status: "success",
        message: `Chat-Messages-Tabelle gefunden mit ${chatMessages.length} Einträgen`,
        data: chatMessages
      })
    } catch (error: any) {
      results.tests.push({
        name: "Chat-Messages-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 5: Files-Tabelle
    try {
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("*")
        .limit(5)

      if (filesError) throw filesError
      results.tests.push({
        name: "Files-Tabelle",
        status: "success",
        message: `Files-Tabelle gefunden mit ${files.length} Einträgen`,
        data: files
      })
    } catch (error: any) {
      results.tests.push({
        name: "Files-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 6: User-Preferences-Tabelle
    try {
      const { data: userPrefs, error: userPrefsError } = await supabase
        .from("user_preferences")
        .select("*")
        .limit(5)

      if (userPrefsError) throw userPrefsError
      results.tests.push({
        name: "User-Preferences-Tabelle",
        status: "success",
        message: `User-Preferences-Tabelle gefunden mit ${userPrefs.length} Einträgen`,
        data: userPrefs
      })
    } catch (error: any) {
      results.tests.push({
        name: "User-Preferences-Tabelle",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    // Test 7: Komplexere Abfrage mit Join
    try {
      const { data: chatWithMessages, error: joinQueryError } = await supabase
        .from("chats")
        .select(
          `
          id, 
          name, 
          chat_messages (id, content, role)
        `
        )
        .limit(1)

      if (joinQueryError) throw joinQueryError
      results.tests.push({
        name: "Join-Abfrage",
        status: "success",
        message: `Join-Abfrage zwischen Chats und Chat-Messages erfolgreich`,
        data: chatWithMessages
      })
    } catch (error: any) {
      results.tests.push({
        name: "Join-Abfrage",
        status: "error",
        message: `Fehler: ${getErrorMessage(error)}`,
        error: error
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: getErrorMessage(error),
        error: error
      },
      { status: 500 }
    )
  }
}
