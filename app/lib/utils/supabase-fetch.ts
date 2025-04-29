import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MessageSquare, FileText, FolderOpen, Layers } from "lucide-react"
import { Database } from "@/supabase/types"

/**
 * Führt einen authentifizierten Fetch-Aufruf an die Supabase REST-API durch
 * @param endpoint Der Endpunkt nach /rest/v1/, z.B. 'user_activities'
 * @param options Zusätzliche Fetch-Optionen (queryParams, method, etc.)
 * @returns Das Ergebnis der Fetch-Operation
 */
export async function fetchFromSupabase(
  endpoint: string,
  options: {
    queryParams?: Record<string, string>
    method?: "GET" | "POST" | "PUT" | "DELETE"
    body?: any
  } = {}
) {
  const supabase = createClientComponentClient()
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Keine aktive Sitzung gefunden")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Query-Parameter zusammenbauen
  const queryString = options.queryParams
    ? "?" + new URLSearchParams(options.queryParams).toString()
    : ""

  // Anfrage ausführen
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${endpoint}${queryString}`,
    {
      method: options.method || "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase API Fehler (${response.status}): ${errorText}`)
  }

  return response.json()
}

/**
 * Holt Benutzeraktivitäten für einen bestimmten Benutzer
 * @param userId Die Benutzer-ID
 * @param workspaceId Optional: Die Workspace-ID, um Ergebnisse zu filtern
 * @param limit Optional: Maximale Anzahl zurückgegebener Aktivitäten
 * @returns Eine Liste von Benutzeraktivitäten aus verschiedenen Quellen
 */
export const fetchUserActivities = async (userId: string, workspaceId?: string, limit: number = 10) => {
  const supabase = createClientComponentClient<Database>()
  const activities: any[] = []

  try {
    // Neueste Chatnachrichten abrufen
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, content, role, created_at, chat_id, chats:chats(name, title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (messagesError) {
      console.error("Fehler beim Abrufen der Chatnachrichten:", messagesError)
    } else if (messages && messages.length > 0) {
      messages.forEach(msg => {
        if (msg.role === "user") {
          const chatInfo = msg.chats as unknown as { name: string; title: string } | null
          activities.push({
            id: msg.id,
            type: "message",
            name: chatInfo?.title || chatInfo?.name || "Chat",
            content: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
            date: msg.created_at,
            iconType: "message-square"
          })
        }
      })
    }

    // Neueste Aufgaben abrufen
    let tasksQuery = supabase
      .from("tasks")
      .select("id, title, created_at, status, priority, project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (workspaceId) {
      tasksQuery = tasksQuery.eq("workspace_id", workspaceId)
    }
    
    const { data: tasks, error: tasksError } = await tasksQuery

    if (tasksError) {
      console.error("Fehler beim Abrufen der Aufgaben:", tasksError)
    } else if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        activities.push({
          id: task.id,
          type: "task",
          name: task.title,
          status: task.status,
          priority: task.priority,
          date: task.created_at,
          iconType: "folder-open",
          projectId: task.project_id
        })
      })
    }
    
    // Dokumente abrufen
    let documentsQuery = supabase
      .from("documents")
      .select("id, title, file_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
    
    if (workspaceId) {
      documentsQuery = documentsQuery.eq("workspace_id", workspaceId)
    }
    
    const { data: documents, error: documentsError } = await documentsQuery

    if (documentsError) {
      console.error("Fehler beim Abrufen der Dokumente:", documentsError)
    } else if (documents && documents.length > 0) {
      documents.forEach(doc => {
        activities.push({
          id: doc.id,
          type: "document",
          name: doc.title || doc.file_name,
          date: doc.created_at,
          iconType: "file-text"
        })
      })
    }
    
    // Projekte abrufen
    let projectsQuery = supabase
      .from("projects")
      .select("id, name, created_at, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
    
    if (workspaceId) {
      projectsQuery = projectsQuery.eq("workspace_id", workspaceId)
    }
    
    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) {
      console.error("Fehler beim Abrufen der Projekte:", projectsError)
    } else if (projects && projects.length > 0) {
      projects.forEach(project => {
        activities.push({
          id: project.id,
          type: "project",
          name: project.name,
          status: project.status,
          date: project.created_at,
          iconType: "layers"
        })
      })
    }
    
    // Aktivitäten nach Datum sortieren und auf limit begrenzen
    activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    return activities.slice(0, limit)
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzeraktivitäten:", error)
    return []
  }
}
