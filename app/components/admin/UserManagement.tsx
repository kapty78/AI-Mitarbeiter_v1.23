"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User } from "@supabase/auth-helpers-nextjs"
import {
  Edit,
  Trash2,
  Search,
  Loader2,
  Calendar,
  User as UserIcon,
  Clock
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"

// Profil-Typ definieren
interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  company_id?: string
  role?: string
  updated_at?: string
  archived_at?: string
  pending_archive?: boolean
}

interface UserManagementProps {
  companyId: string | null // ID der Firma des Admins
}

export function UserManagement({ companyId }: UserManagementProps) {
  const supabase = createClientComponentClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [archivedUsers, setArchivedUsers] = useState<Profile[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zustand für Archivieren-Dialog
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [userToArchive, setUserToArchive] = useState<Profile | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  // Zustand für Bearbeiten-Dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null)
  const [editedName, setEditedName] = useState("")
  const [editedRole, setEditedRole] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Aktuellen Benutzer holen
  useEffect(() => {
    async function getUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  const fetchUsers = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false)
      setError("Firmen-ID fehlt.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Aktive Benutzer laden
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          `
          id, 
          full_name, 
          email, 
          avatar_url, 
          role, 
          company_id, 
          updated_at,
          pending_archive
        `
        )
        .eq("company_id", companyId)
        .order("full_name", { ascending: true })

      if (fetchError) throw fetchError

      // Archivierte Benutzer laden
      const { data: archivedData, error: archivedError } = await supabase
        .from("archived_profiles")
        .select(
          `
          id, 
          full_name, 
          email, 
          avatar_url, 
          role, 
          company_id, 
          updated_at,
          archived_at
        `
        )
        .eq("company_id", companyId)
        .order("full_name", { ascending: true })

      if (archivedError) throw archivedError

      // Administratorzugriff nicht erforderlich - zeige direkt die Profile an
      // Admin-Auth-API wird nicht mehr verwendet

      console.log(
        `Geladene Benutzer für Firma ${companyId}:`,
        data?.length || 0
      )
      console.log(
        `Geladene archivierte Benutzer für Firma ${companyId}:`,
        archivedData?.length || 0
      )

      setUsers(data || [])
      setArchivedUsers(archivedData || [])
    } catch (err: any) {
      console.error("Error fetching company users:", err)
      setError(`Fehler beim Laden der Benutzer: ${err.message}`)
      setUsers([])
      setArchivedUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [companyId, supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filterung nach Suchbegriff
  const displayUsers = users
  const filteredUsers = searchQuery
    ? displayUsers.filter(
        u =>
          (u.full_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.role || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayUsers

  // Bearbeiten-Dialog öffnen
  const handleEditClick = (user: Profile) => {
    setUserToEdit(user)
    setEditedName(user.full_name || "")
    setEditedRole(user.role || "")
    setShowEditDialog(true)
  }

  // Bearbeiten bestätigen
  const confirmEdit = async () => {
    if (!userToEdit) return

    setIsEditing(true)
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: editedName,
          role: editedRole
        })
        .eq("id", userToEdit.id)

      if (updateError) throw updateError

      // Neu laden oder optimistisches Update
      await fetchUsers()
    } catch (err: any) {
      console.error("Fehler beim Bearbeiten des Benutzers:", err)
      setError(`Bearbeitungsfehler: ${err.message}`)
    } finally {
      setIsEditing(false)
      setShowEditDialog(false)
      setUserToEdit(null)
    }
  }

  // Archivieren-Dialog öffnen
  const handleArchiveClick = (user: Profile) => {
    setUserToArchive(user)
    setShowArchiveDialog(true)
  }

  // Archivieren bestätigen
  const confirmArchive = async () => {
    if (!userToArchive) return

    setIsArchiving(true)
    setError(null)
    try {
      // API-Endpunkt aufrufen, der den vollständigen Archivierungsprozess startet
      const response = await fetch("/api/admin/archive-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userToArchive.id
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("Archivierungsfehler (HTTP):", responseData)
        throw new Error(responseData.error || "Fehler bei der Archivierung")
      }

      console.log("Archivierungsanfrage-Details:", responseData)

      // Erfolgsmeldung anzeigen
      const userName = userToArchive.full_name || userToArchive.email || "Benutzer"

      // Optimistisches Update - Den Benutzer in der Liste behalten, aber Status ändern
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userToArchive.id
            ? { ...u, pending_archive: true }
            : u
        )
      )

      // Zeige Erfolgsmeldung
      const successMessage = `Archivierungsanfrage für ${userName} wurde erfolgreich erstellt.\n\nDas Admin-Team wurde benachrichtigt und wird die AI-Mitarbeiter-Daten vorbereiten.`

      alert(successMessage) // Hier könnte eine schönere UI-Meldung verwendet werden

      // Daten aktualisieren
      fetchUsers()
    } catch (err: any) {
      console.error("Fehler beim Erstellen der Archivierungsanfrage:", err)
      setError(`Fehler: ${err.message}`)
      // Daten aktualisieren
      fetchUsers()
    } finally {
      setIsArchiving(false)
      setShowArchiveDialog(false)
      setUserToArchive(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-gray-400" />{" "}
        <span className="ml-2 text-gray-400">Benutzer werden geladen...</span>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>
  }

  if (filteredUsers.length === 0 && !searchQuery) {
    return (
      <div className="p-6 text-gray-500">
        Keine Benutzer in dieser Firma gefunden.
      </div>
    )
  }

  if (filteredUsers.length === 0 && searchQuery) {
    return (
      <div className="p-6">
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Benutzer suchen..."
              className="w-full rounded-md border border-[#444444] bg-[#2a2a2a] py-2 pl-10 pr-4 text-white focus:border-[#666666] focus:outline-none"
            />
          </div>
        </div>
        <div className="py-8 text-center text-gray-400">
          Keine Benutzer gefunden für &quot;{searchQuery}&quot;
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Benutzerverwaltung</h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Benutzer suchen..."
              className="w-full rounded-md border border-[#444444] bg-[#2a2a2a] py-2 pl-10 pr-4 text-white focus:border-[#666666] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {showArchived && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <strong>Hinweis:</strong> Du siehst gerade archivierte Benutzer. Diese
          wurden aus dem aktiven System entfernt. Archivierte Benutzer können
          nicht angemeldet werden und haben keinen Zugriff auf ihre Daten.
        </div>
      )}

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {searchQuery
              ? `Keine ${showArchived ? "archivierten " : ""}Benutzer gefunden für &quot;${searchQuery}&quot;`
              : `Keine ${showArchived ? "archivierten " : ""}Benutzer vorhanden.`}
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className={`group relative flex items-center justify-between rounded-lg border ${
                user.pending_archive
                  ? "border-white/30 bg-white/5"
                  : showArchived
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-[#444444] bg-[#2a2a2a]"
              } p-4 transition-colors hover:border-[#555555]`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    showArchived ? "bg-[#3a2a2a] opacity-70" : "bg-[#333]"
                  } text-white`}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "User"}
                      className={`size-full rounded-full object-cover ${showArchived ? "opacity-60" : ""}`}
                    />
                  ) : (
                    <UserIcon className="size-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <span
                      className={`font-medium ${
                        user.pending_archive
                          ? "text-white"
                          : showArchived
                          ? "text-red-300/90" 
                          : "text-white"
                      }`}
                    >
                      {user.full_name || "N/A"}
                    </span>
                    {user.pending_archive && (
                      <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                        Löschvorgang läuft
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.email || "Keine E-Mail"}
                  </div>
                  {showArchived && user.archived_at && (
                    <div className="mt-1 text-xs text-red-300/60">
                      Archiviert am:{" "}
                      {new Date(user.archived_at).toLocaleDateString("de-DE")}
                    </div>
                  )}
                  {user.pending_archive && (
                    <div className="mt-1 text-xs text-white/70">
                      Löschvorgang eingeleitet - Daten werden für AI-Mitarbeiter vorbereitet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    user.pending_archive
                      ? "border-white/20 text-white"
                      : showArchived
                      ? "border-red-500/20 text-red-300/80"
                      : "border-[#444] text-gray-300"
                  }`}
                >
                  {user.role || "Mitglied"}
                </span>

                {user.updated_at && !showArchived && (
                  <div className="hidden items-center text-xs text-gray-400 md:flex">
                    <Calendar className="mr-1 size-3" />
                    {new Date(user.updated_at).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
                    })}
                  </div>
                )}

                {/* Aktionen basierend auf dem Status (archiviert oder aktiv) */}
                {!showArchived ? (
                  // Aktionen für aktive Benutzer
                  <div className="ml-4 flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-[#444] hover:text-white"
                      title="Benutzer bearbeiten"
                      disabled={user.pending_archive}
                    >
                      <Edit className={`size-4 ${user.pending_archive ? "opacity-50" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleArchiveClick(user)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                      title="Archivierungsanfrage erstellen"
                      disabled={user.id === currentUser?.id || user.pending_archive}
                    >
                      <Trash2
                        className={`size-4 ${
                          user.id === currentUser?.id || user.pending_archive
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      />
                    </button>
                    {user.pending_archive && (
                      <span className="ml-2 flex items-center rounded-md bg-white/20 px-2 py-1 text-xs text-white">
                        <Clock className="mr-1 size-3" />
                        Löschung in Bearbeitung
                      </span>
                    )}
                  </div>
                ) : (
                  // Aktionen für archivierte Benutzer
                  <div className="ml-4 flex items-center">
                    <button
                      onClick={() =>
                        alert(
                          "Wiederherstellung archivierter Benutzer ist in dieser Version noch nicht implementiert."
                        )
                      }
                      className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30"
                    >
                      Wiederherstellen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Archivieren-Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent className="border border-[#444] bg-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Benutzer archivieren?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Möchtest du eine Anfrage zur Archivierung des Benutzers{" "}
              <span className="font-medium text-white">
                {userToArchive?.full_name || userToArchive?.email}
              </span>{" "}
              erstellen?
            </AlertDialogDescription>
            <div className="mt-2 rounded-md border border-white/20 bg-white/10 p-3">
              <span className="text-white">
                <strong>Wichtig:</strong> Der Benutzer wird nicht sofort gelöscht.
                Die Trainingsdaten des Benutzers müssen zunächst aufbereitet und für die 
                AI-Mitarbeiter-Erstellung gesichert werden. 
                Das Admin-Team wird benachrichtigt und den Prozess einleiten.
              </span>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-[#444] bg-transparent text-white hover:bg-[#333] hover:text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault()
                confirmArchive()
              }}
              className="bg-white text-[#212121] hover:bg-white/90"
              disabled={isArchiving}
            >
              {isArchiving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Anfrage senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bearbeiten-Dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent className="border border-[#444] bg-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Benutzer bearbeiten
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-300"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                className="w-full rounded-md border border-[#444] bg-[#333] px-3 py-2 text-white focus:border-[#666] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="role"
                className="text-sm font-medium text-gray-300"
              >
                Rolle
              </label>
              <input
                id="role"
                type="text"
                value={editedRole}
                onChange={e => setEditedRole(e.target.value)}
                className="w-full rounded-md border border-[#444] bg-[#333] px-3 py-2 text-white focus:border-[#666] focus:outline-none"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="border border-[#444] bg-transparent text-white hover:bg-[#333] hover:text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault()
                confirmEdit()
              }}
              className="bg-[#444] text-white hover:bg-[#555]"
              disabled={isEditing || !editedName.trim()}
            >
              {isEditing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
