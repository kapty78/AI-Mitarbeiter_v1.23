"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User, UserPlus, X } from "lucide-react"

interface ResponsiblePerson {
  user_id: string
  email: string
  full_name: string
  role: string
}

interface AvailableUser {
  user_id: string
  email: string
  full_name: string
}

interface ProjectResponsibleManagerProps {
  projectId: string
}

export function ProjectResponsibleManager({
  projectId
}: ProjectResponsibleManagerProps) {
  const [responsiblePersons, setResponsiblePersons] = useState<
    ResponsiblePerson[]
  >([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false)
  // State für Kontext-Menü
  const [contextMenuPersonId, setContextMenuPersonId] = useState<string | null>(
    null
  )

  const supabase = createClientComponentClient()

  // Click-Handler für Avatar
  const handleAvatarClick = (personId: string) => {
    setContextMenuPersonId(prevId => (prevId === personId ? null : personId)) // Toggle-Menü
    setError(null) // Fehler löschen beim Öffnen/Schließen des Menüs
  }

  useEffect(() => {
    if (projectId) {
      fetchResponsiblePersons()
    }
  }, [projectId])

  const fetchResponsiblePersons = async () => {
    try {
      setLoading(true)

      // Projekt mit zuständigen Personen abrufen
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          responsible_persons:project_responsibilities_with_users(
            user_id,
            role,
            full_name,
            email
          )
        `
        )
        .eq("id", projectId)
        .single()

      if (error) throw error

      if (data && data.responsible_persons) {
        // Formatieren der Verantwortlichen
        const formattedPersons = data.responsible_persons.map(
          (person: any) => ({
            user_id: person.user_id,
            email: person.email || "",
            full_name: person.full_name || person.email || "Unbekannt",
            role: person.role || "responsible"
          })
        )

        setResponsiblePersons(formattedPersons)
      } else {
        setResponsiblePersons([])
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Fehler beim Abrufen der zuständigen Personen:", err)
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      console.log("Abrufen verfügbarer Benutzer für Projekt:", projectId)

      // Verwende die RPC-Funktion direkt
      const { data, error } = await supabase.rpc(
        "get_project_assignable_users",
        { p_project_id: projectId }
      )

      console.log("Verfügbare Benutzer Daten:", data)
      console.log("Verfügbare Benutzer Fehler:", error)

      if (error) {
        console.warn(
          "RPC-Funktionsaufruf fehlgeschlagen, wechsle zu manuellem Abruf:",
          error
        )
        await fetchAvailableUsersManually()
      } else if (data) {
        setAvailableUsers(Array.isArray(data) ? data : [])
      } else {
        setAvailableUsers([])
      }
    } catch (err: any) {
      console.error("Fehler beim Abrufen verfügbarer Benutzer:", err)
      setError(err.message)

      // Versuche Fallback-Methode bei Fehler
      await fetchAvailableUsersManually()
    }
  }

  // Manuelle Fallback-Methode zum Abrufen verfügbarer Benutzer
  const fetchAvailableUsersManually = async () => {
    try {
      // Zuerst Projektdaten abrufen
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("workspace_id, user_id")
        .eq("id", projectId)
        .single()

      if (projectError) throw projectError

      // Bereits zugewiesene Benutzer abrufen
      const { data: responsiblePersons, error: respError } = await supabase
        .from("project_responsibilities")
        .select("user_id")
        .eq("project_id", projectId)

      if (respError) throw respError

      // IDs der bereits zugewiesenen Benutzer
      const assignedUserIds = responsiblePersons?.map(r => r.user_id) || []

      let availableUsersList: AvailableUser[] = []

      // Wenn Workspace-ID vorhanden, alle Workspace-Mitglieder abrufen
      if (projectData.workspace_id) {
        // 1. Hole zuerst nur die Workspace-Mitglieder
        const { data: workspaceMembersData, error: membersError } =
          await supabase
            .from("workspace_members")
            .select("user_id")
            .eq("workspace_id", projectData.workspace_id)

        if (membersError) throw membersError

        if (workspaceMembersData && workspaceMembersData.length > 0) {
          // Filtern der Workspace-Mitglieder, die noch nicht zugewiesen sind
          const filteredMemberIds = workspaceMembersData
            .map(member => member.user_id)
            .filter(userId => !assignedUserIds.includes(userId))

          if (filteredMemberIds.length > 0) {
            // 2. Hole separate Profildaten für diese Benutzer
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", filteredMemberIds)

            if (profilesError) throw profilesError

            if (profilesData && profilesData.length > 0) {
              // Formatieren für die Anzeige
              availableUsersList = profilesData.map(profile => ({
                user_id: profile.id,
                full_name: profile.full_name || "User",
                email: profile.email || ""
              }))
            }
          }
        }
      } else {
        // Für persönliche Projekte nur den Besitzer anzeigen, falls nicht bereits zugewiesen
        if (!assignedUserIds.includes(projectData.user_id)) {
          // Profildaten abrufen
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", projectData.user_id)
            .single()

          if (profileError) throw profileError

          if (profileData) {
            availableUsersList = [
              {
                user_id: projectData.user_id,
                full_name: profileData.full_name || "Projektbesitzer",
                email: profileData.email || ""
              }
            ]
          }
        }
      }

      setAvailableUsers(availableUsersList)
    } catch (err: any) {
      console.error("Fehler beim manuellen Abrufen verfügbarer Benutzer:", err)
      setError(err.message)
      setAvailableUsers([])
    }
  }

  const handleAddResponsible = async (userId: string) => {
    try {
      // Prüfen, ob Verantwortlichkeit bereits existiert
      const { data: existing, error: checkError } = await supabase
        .from("project_responsibilities")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)

      if (checkError) throw checkError

      // Wenn Eintrag bereits existiert, kein Duplikat erstellen
      if (existing && existing.length > 0) {
        console.log(
          "Benutzer hat bereits eine Verantwortlichkeit für dieses Projekt"
        )
        return
      }

      const { error } = await supabase.from("project_responsibilities").insert({
        project_id: projectId,
        user_id: userId,
        role: "responsible"
      })

      if (error) throw error

      // Listen aktualisieren
      await fetchResponsiblePersons()
      setAvailableUsers(availableUsers.filter(user => user.user_id !== userId))
      setShowAddPersonDialog(false)
    } catch (err: any) {
      console.error("Fehler beim Zuweisen der verantwortlichen Person:", err)
      setError(err.message)
    }
  }

  const handleRemoveResponsible = async (userIdToRemove: string) => {
    try {
      const { error } = await supabase
        .from("project_responsibilities")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userIdToRemove)

      if (error) throw error

      console.log("Person erfolgreich entfernt, aktualisiere Liste...")
      // Liste aktualisieren
      await fetchResponsiblePersons()
      console.log("Liste der Verantwortlichen aktualisiert.")
    } catch (err: any) {
      console.error("Fehler bei handleRemoveResponsible:", err)
      setError(`Fehler beim Entfernen der Person: ${err.message}`)
    }
  }

  if (loading) {
    return <div className="p-2 text-center text-zinc-400">Lade...</div>
  }

  if (error) {
    return <div className="p-2 text-center text-red-400">{error}</div>
  }

  return (
    <div className="relative">
      {/* Avatare und Add-Button */}
      <div className="flex items-center -space-x-2">
        {responsiblePersons.slice(0, 3).map(person => {
          // Initialen aus full_name oder email generieren
          const initials = (person.full_name || person.email || "?")
            .split("@")[0] // Teil vor @ nehmen, falls es eine E-Mail ist
            .split(/[\s\.-]+/) // Durch Leerzeichen, Punkt, Bindestrich trennen
            .map(n => n[0])
            .filter(Boolean) // Leere Strings entfernen
            .slice(0, 2) // Max. 2 Initialen
            .join("")
            .toUpperCase()

          const tooltipText = `${person.full_name} (${person.role})\n${person.email || "N/A"}`

          return (
            <div
              key={`responsible-${projectId}-${person.user_id}`}
              className="group relative"
            >
              {/* Avatar-Button - Klickbar machen */}
              <button
                onClick={() => handleAvatarClick(person.user_id)}
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 transition-colors hover:border-zinc-600"
              >
                <span className="text-xs font-medium text-white">
                  {initials}
                </span>
              </button>

              {/* Hover-Tooltip */}
              <span className="pointer-events-none invisible absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs text-gray-300 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                {person.email || "N/A"}
              </span>

              {/* Kontext-Menü beim Klick */}
              {contextMenuPersonId === person.user_id && (
                <div className="fixed z-50 ml-[-5px] mt-[-120px] w-48 rounded-md border border-[#333333] bg-[#1e1e1e] p-2 shadow-lg">
                  <div className="mb-1 truncate text-sm font-medium text-white">
                    {person.full_name}
                  </div>
                  <div className="mb-2 truncate text-xs text-gray-400">
                    {person.email}
                  </div>
                  <button
                    onClick={() => {
                      handleRemoveResponsible(person.user_id)
                      setContextMenuPersonId(null) // Menü nach Aktion schließen
                    }}
                    className="w-full rounded px-2 py-1 text-left text-xs text-red-400 transition-colors hover:bg-[#2d2d2d]"
                  >
                    Entfernen
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {responsiblePersons.length > 3 && (
          <div className="relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800">
            <span className="text-xs font-medium">
              +{responsiblePersons.length - 3}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            setShowAddPersonDialog(true)
            fetchAvailableUsers()
          }}
          className="relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 hover:bg-zinc-700"
        >
          <UserPlus size={14} />
        </button>
      </div>

      {/* Dialog zum Hinzufügen von Personen */}
      {showAddPersonDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 px-4 pt-16">
          <div className="w-full max-w-sm rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] shadow-xl">
            {/* Dialog-Kopfzeile */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Person hinzufügen
              </h3>
              <button
                onClick={() => setShowAddPersonDialog(false)}
                className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Benutzerliste */}
            <div className="max-h-72 overflow-y-auto p-2">
              {availableUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
                  Keine weiteren Personen verfügbar
                </p>
              ) : (
                <div className="space-y-1">
                  {availableUsers.map(user => (
                    <button
                      key={`available-${projectId}-${user.user_id}`}
                      className="flex w-full items-center space-x-3 rounded-md p-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      onClick={() => {
                        handleAddResponsible(user.user_id)
                      }}
                    >
                      {/* Benutzer-Icon Platzhalter */}
                      <div className="flex size-8 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                        <User
                          size={16}
                          className="text-[var(--text-secondary)]"
                        />
                      </div>
                      {/* Benutzerinfo */}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {user.full_name ||
                            user.email ||
                            "Unbekannter Benutzer"}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {user.email || "Keine E-Mail"}
                        </div>
                      </div>
                      {/* Add-Icon */}
                      <UserPlus
                        size={16}
                        className="text-[var(--text-secondary)]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
