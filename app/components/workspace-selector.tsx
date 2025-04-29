"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User, Users, Plus } from "lucide-react"
import Link from "next/link"

interface Workspace {
  id: string
  name: string
  description: string
  isHome: boolean
  isTeam: boolean
}

interface WorkspaceSelectorProps {
  currentWorkspaceId?: string | null
  onWorkspaceChange?: (workspaceId: string) => void
  showNewButton?: boolean
  currentPath?: string
}

export function WorkspaceSelector({
  currentWorkspaceId,
  onWorkspaceChange,
  showNewButton = true,
  currentPath = "/dashboard"
}: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)

        // Get the current user
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

        // First fetch personal (home) workspace
        const { data: homeWorkspace, error: homeError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_home", true)
          .single()

        if (homeError && homeError.code !== "PGRST116") {
          // PGRST116 = No rows found
          console.error("Fehler beim Laden des Home-Workspace:", homeError)
        }

        // Then fetch team workspaces (non-home workspaces the user has access to)
        const { data: teamWorkspaces, error: teamsError } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces:workspaces(*)")
          .eq("user_id", session.user.id)

        if (teamsError) {
          console.error("Fehler beim Laden der Team-Workspaces:", teamsError)
        }

        // Create a combined list of workspaces
        const allWorkspaces: Workspace[] = []

        // Add home workspace if it exists
        if (homeWorkspace) {
          allWorkspaces.push({
            id: homeWorkspace.id,
            name: homeWorkspace.name,
            description: homeWorkspace.description || "",
            isHome: true,
            isTeam: false
          })
        }

        // Add team workspaces
        if (teamWorkspaces) {
          teamWorkspaces.forEach((entry: any) => {
            if (entry.workspaces) {
              allWorkspaces.push({
                id: entry.workspace_id,
                name: entry.workspaces.name || "Unbenannt",
                description: entry.workspaces.description || "",
                isHome: false,
                isTeam: true
              })
            }
          })
        }

        setWorkspaces(allWorkspaces)
        setLoading(false)
      } catch (err: any) {
        console.error("Fehler beim Laden der Workspaces:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  const createWorkspace = async () => {
    const workspaceName = prompt("Name für den neuen Workspace:")
    if (!workspaceName || !workspaceName.trim()) return

    try {
      // Get the current user
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        setError("Keine Anmeldesitzung gefunden. Bitte melde dich an.")
        return
      }

      const { data, error } = await supabase
        .from("workspaces")
        .insert([
          {
            user_id: session.user.id,
            name: workspaceName.trim(),
            description: "Neuer Workspace",
            is_home: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        // Add myself as a member of this workspace
        await supabase.from("workspace_members").insert([
          {
            workspace_id: data[0].id,
            user_id: session.user.id,
            role: "owner",
            created_at: new Date().toISOString()
          }
        ])

        // Update workspace list
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

        // Switch to the new workspace
        if (onWorkspaceChange) {
          onWorkspaceChange(data[0].id)
        } else {
          window.location.href = `${currentPath}?workspace=${data[0].id}`
        }
      }
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Workspace:", err)
      alert("Fehler beim Erstellen des Workspace: " + err.message)
    }
  }

  const handleWorkspaceClick = (workspaceId: string) => {
    if (onWorkspaceChange) {
      onWorkspaceChange(workspaceId)
    } else {
      window.location.href = `${currentPath}?workspace=${workspaceId}`
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-zinc-400">Lade Workspaces...</div>
    )
  }

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-1 overflow-y-auto">
        {workspaces.length === 0 ? (
          <div className="pl-2 text-sm italic text-zinc-500">
            Keine Workspaces gefunden
          </div>
        ) : (
          workspaces.map(ws => {
            // Extract the current workspace ID from the path if in a workspace route
            const inWorkspacePath =
              window.location.pathname.startsWith("/workspace/")
            const pathWorkspaceId = inWorkspacePath
              ? window.location.pathname.split("/")[2]
              : null

            // Only highlight if we are actually in this workspace (path contains ID or query param matches)
            const isActive =
              ws.id === currentWorkspaceId &&
              (currentPath === "/dashboard" || pathWorkspaceId === ws.id)

            return (
              <button
                key={ws.id}
                onClick={() => handleWorkspaceClick(ws.id)}
                className={`flex w-full items-center justify-between rounded p-2 text-left 
                  ${
                    isActive
                      ? "bg-zinc-800 text-[var(--primary-color)]"
                      : "hover:bg-zinc-800"
                  }`}
              >
                <div className="flex items-center space-x-2">
                  {ws.isHome ? <User size={16} /> : <Users size={16} />}
                  <span>{ws.name}</span>
                </div>
                {ws.isTeam && (
                  <div className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs">
                    Team
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
