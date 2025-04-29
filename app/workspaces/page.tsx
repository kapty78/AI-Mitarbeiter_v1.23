"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  MessageCircle,
  User,
  Users,
  Settings,
  LogOut,
  Plus,
  BarChart2,
  FileText,
  ChevronLeft
} from "lucide-react"

type Workspace = {
  id: string
  name: string
  description: string
  isHome?: boolean
  isTeam?: boolean
}

export default function Workspaces() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Prüfe Session
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError)
          throw new Error("Session error: " + sessionError.message)
        if (!session) {
          setError("Keine Anmeldesitzung gefunden. Bitte melde dich an.")
          return
        }

        setUser(session.user)

        // DEBUG: Tabellenstruktur anzeigen
        console.log("Hole Tabellenstruktur der workspaces-Tabelle...")
        const { data: structureData, error: structureError } = await supabase
          .from("workspaces")
          .select("*")
          .limit(1)

        console.log("STRUKTUR-DATEN:", structureData)
        console.log("STRUKTUR-FEHLER:", structureError)

        if (structureData && structureData.length > 0) {
          console.log("SPALTEN in workspaces:", Object.keys(structureData[0]))
        }

        // Workspaces laden
        // 1. Persönlicher Workspace
        console.log(
          "Versuche, Workspace zu laden für Benutzer:",
          session.user.id
        )
        const { data: homeWorkspace, error: homeError } = await supabase
          .from("workspaces")
          .select("*")
          .limit(1)
          .single()

        console.log("Ergebnis der Workspace-Abfrage:", homeWorkspace, homeError)

        if (homeError && homeError.code !== "PGRST116") {
          // PGRST116 = No rows found
          console.error("Fehler beim Laden des Home-Workspace:", homeError)
        }

        // 2. Team-Workspaces (Workspaces, in denen der Benutzer Mitglied ist)
        const { data: teamWorkspaces, error: teamsError } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", session.user.id)

        console.log("Team Workspaces Daten:", teamWorkspaces)
        console.log("Team Workspaces Fehler:", teamsError)

        // Anstatt auf workspaces:workspaces(*) zu joinen, holen wir die Workspaces separat
        let teamWorkspacesList = []
        if (teamWorkspaces && !teamsError) {
          for (const entry of teamWorkspaces) {
            // Für jeden Workspace, an dem der Benutzer beteiligt ist, holen wir die Details
            const { data: wsData, error: wsError } = await supabase
              .from("workspaces")
              .select("*")
              .eq("id", entry.workspace_id)
              .single()

            if (!wsError && wsData) {
              teamWorkspacesList.push({
                id: wsData.id,
                name: wsData.name || "Unbenannt",
                description: wsData.description || "Team-Workspace",
                isHome: false,
                isTeam: true
              })
            }
          }
        }

        // Alle Workspaces zusammenführen
        const allWorkspaces: Workspace[] = []

        // Persönlichen Workspace hinzufügen, falls vorhanden
        if (homeWorkspace) {
          allWorkspaces.push({
            id: homeWorkspace.id,
            name: homeWorkspace.name,
            description: homeWorkspace.description || "Persönlicher Workspace",
            isHome: true,
            isTeam: false
          })
        }

        // Team-Workspaces hinzufügen
        if (teamWorkspacesList.length > 0) {
          teamWorkspacesList.forEach((entry: any) => {
            allWorkspaces.push(entry)
          })
        }

        setWorkspaces(allWorkspaces)
      } catch (err: any) {
        console.error("Fehler beim Laden der Workspaces:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Neuen Workspace erstellen
  const createWorkspace = async () => {
    const workspaceName = prompt("Name für den neuen Workspace:")
    if (!workspaceName || !workspaceName.trim()) return

    try {
      // Debuginfo
      console.log(
        "Versuche, Workspace zu erstellen mit Namen:",
        workspaceName.trim()
      )

      // Prüfe die verfügbaren Spalten
      const { data: columnsInfo, error: columnsError } = await supabase.rpc(
        "get_table_definition",
        { table_name: "workspaces" }
      )

      console.log("Spalteninformationen:", columnsInfo)
      console.log("Spalteninformationen Fehler:", columnsError)

      // Versuche die Insertion mit minimalen Daten
      const { data, error } = await supabase
        .from("workspaces")
        .insert([
          {
            name: workspaceName.trim(),
            description: "Neuer Workspace",
            is_home: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      console.log("Workspace-Erstellung Ergebnis:", data)
      console.log("Workspace-Erstellung Fehler:", error)

      if (error) throw error

      if (data && data[0]) {
        // Mich selbst als Mitglied des Workspaces hinzufügen
        await supabase.from("workspace_members").insert([
          {
            workspace_id: data[0].id,
            user_id: user.id,
            role: "owner",
            created_at: new Date().toISOString()
          }
        ])

        // Workspace-Liste aktualisieren
        setWorkspaces([
          ...workspaces,
          {
            id: data[0].id,
            name: data[0].name,
            description: data[0].description || "",
            isHome: false,
            isTeam: false
          }
        ])

        // Zum neuen Workspace navigieren
        window.location.href = `/workspace/${data[0].id}`
      }
    } catch (err) {
      console.error("Fehler beim Erstellen des Workspace:", err)
      alert("Fehler beim Erstellen des Workspace")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()

    // Nach dem Logout zur Login-Seite weiterleiten
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e] p-4">
        <div className="max-w-md rounded-lg border border-[#333333] bg-[#2d2d2d] p-6 text-center">
          <h2 className="mb-4 text-xl font-bold text-white">Fehler</h2>
          <p className="mb-4 text-[#cccccc]">{error}</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="rounded-lg bg-[#4c4cff] px-4 py-2 text-white transition-colors hover:bg-[#3a3aff]"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 border-r border-[#333333] bg-[#1e1e1e]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center p-4">
            <span className="font-medium text-white">ChatBot UI</span>
          </div>

          {/* Navigation */}
          <div className="scrollbar-hide flex-1 overflow-y-auto p-2">
            <div className="mb-6">
              <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[#999999]">
                NAVIGATION
              </h2>
              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[#cccccc] transition-colors hover:bg-[#2d2d2d]"
                >
                  <BarChart2 className="size-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[#cccccc] transition-colors hover:bg-[#2d2d2d]"
                >
                  <MessageCircle className="size-4" />
                  <span>Persönlicher Chat</span>
                </Link>
                <Link
                  href="/tasks?personal=true"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[#cccccc] transition-colors hover:bg-[#2d2d2d]"
                >
                  <FileText className="size-4" />
                  <span>Persönliche Aufgaben</span>
                </Link>
                <Link
                  href="/workspaces"
                  className="flex items-center space-x-2 rounded-md bg-[#2d2d2d] px-3 py-2 text-sm text-white"
                >
                  <Users className="size-4" />
                  <span>Workspaces</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Account */}
          <div className="border-t border-[#333333] p-4">
            <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[#999999]">
              ACCOUNT
            </h2>
            <button
              onClick={handleLogout}
              className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm text-[#cccccc] transition-colors hover:bg-[#2d2d2d]"
            >
              <LogOut className="size-4" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Page header */}
        <header className="border-b border-[#333333] bg-[#1e1e1e] p-4">
          <div className="mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Workspaces</h1>

            <button
              onClick={createWorkspace}
              className="flex items-center space-x-2 rounded-lg bg-[#4c4cff] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#3a3aff]"
            >
              <Plus className="size-4" />
              <span>Neuer Workspace</span>
            </button>
          </div>
        </header>

        {/* Workspace grid */}
        <main className="p-4">
          <div className="mx-auto">
            {workspaces.length === 0 ? (
              <div className="rounded-lg border border-[#333333] bg-[#2d2d2d] p-8 text-center">
                <p className="mb-4 text-[#cccccc]">Keine Workspaces gefunden</p>
                <button
                  onClick={createWorkspace}
                  className="inline-flex items-center space-x-2 rounded-lg bg-[#4c4cff] px-4 py-2 text-white transition-colors hover:bg-[#3a3aff]"
                >
                  <Plus className="size-4" />
                  <span>Erstellen Sie Ihren ersten Workspace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workspaces.map(workspace => (
                  <Link
                    key={workspace.id}
                    href={`/workspace/${workspace.id}`}
                    className="rounded-lg border border-[#333333] bg-[#2d2d2d] p-5 transition-colors hover:bg-[#3a3a3a]"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-base font-medium text-white">
                        {workspace.name}
                      </h3>
                      {workspace.isHome && (
                        <span className="inline-flex items-center rounded-full bg-[#4c4cff] px-2 py-0.5 text-xs text-white">
                          <User className="mr-1 size-3" />
                          Persönlich
                        </span>
                      )}
                      {workspace.isTeam && (
                        <span className="inline-flex items-center rounded-full bg-[#3a3a3a] px-2 py-0.5 text-xs text-white">
                          <Users className="mr-1 size-3" />
                          Team
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-[#cccccc]">
                      {workspace.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#999999]">
                      <div className="flex items-center">
                        <MessageCircle className="mr-1 size-3" />
                        <span>Chats</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-1 size-3" />
                        <span>Aufgaben</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
