"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
  ChevronLeft,
  Clock,
  Search
} from "lucide-react"

type Task = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
}

type Chat = {
  id: string
  name: string
  created_at: string
}

export default function WorkspaceDetail() {
  const params = useParams()
  const workspaceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Session prüfen
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

        // Workspace-Details laden
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", workspaceId)
          .single()

        if (workspaceError) {
          throw new Error(
            "Workspace nicht gefunden. Fehler: " + workspaceError.message
          )
        }

        setWorkspace(workspaceData)

        // Prüfen, ob der Benutzer Zugriff auf diesen Workspace hat
        // Prüfe, ob der Benutzer ein Mitglied dieses Workspace ist
        const { data: memberData, error: memberError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("user_id", session.user.id)
          .maybeSingle()

        // Wenn der Benutzer kein Mitglied ist und es nicht der Standard-Workspace ist,
        // verweigere den Zugriff
        if ((memberError || !memberData) && !workspace?.is_home) {
          throw new Error("Sie haben keinen Zugriff auf diesen Workspace.")
        }

        // Aufgaben dieses Workspaces laden
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("due_date", { ascending: true })
          .limit(5)

        if (!tasksError) {
          setTasks(tasksData || [])
        } else {
          console.error("Fehler beim Laden der Aufgaben:", tasksError)
        }

        // Chats dieses Workspaces laden
        const { data: chatsData, error: chatsError } = await supabase
          .from("chats")
          .select("id, name, created_at, last_message_timestamp")
          .eq("workspace_id", workspaceId)
          .order("last_message_timestamp", { ascending: false })
          .limit(5)

        if (!chatsError) {
          setChats(chatsData || [])
        } else {
          console.error("Fehler beim Laden der Chats:", chatsError)
        }
      } catch (err: any) {
        console.error("Fehler beim Laden des Workspaces:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workspaceId])

  const handleCreateTask = () => {
    window.location.href = `/workspace/${workspaceId}/tasks/new`
  }

  const handleStartChat = () => {
    window.location.href = `/chat?workspace=${workspaceId}`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()

    // Nach dem Logout zur Login-Seite weiterleiten
    window.location.href = "/login"
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)

      // Search in chat messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, content, chat_id, created_at, chats(name)")
        .eq("workspace_id", workspaceId)
        .ilike("content", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (messagesError) {
        console.error("Fehler bei der Suche:", messagesError)
        return
      }

      setSearchResults(messagesData || [])
    } catch (err) {
      console.error("Fehler bei der Suche:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSearch = () => {
    setSearchOpen(!searchOpen)
    if (!searchOpen) {
      setSearchQuery("")
      setSearchResults([])
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-[var(--primary-color)] border-t-transparent"></div>
          <p>Lade Workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black p-4 text-white">
        <div className="max-w-md rounded-lg border border-red-500/50 bg-red-900/20 p-6 text-center">
          <h2 className="mb-4 text-xl font-bold text-red-400">Fehler</h2>
          <p className="mb-4 text-red-300">{error}</p>
          <button
            onClick={() => (window.location.href = "/workspaces")}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Zurück zu Workspaces
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 border-r border-[var(--border-light)] bg-[var(--bg-sidebar)]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center p-4">
            <span className="font-medium text-[var(--text-primary)]">
              ChatBot UI
            </span>
          </div>

          {/* Navigation */}
          <div className="scrollbar-hide flex-1 overflow-y-auto p-2">
            <div className="mb-6">
              <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                NAVIGATION
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={toggleSearch}
                  className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <Search className="size-4" />
                  <span>Chats durchsuchen</span>
                </button>

                {searchOpen && (
                  <div className="px-3 py-2">
                    <form onSubmit={handleSearch} className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Suche in Nachrichten..."
                          className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          disabled={isSearching}
                        >
                          <Search className="size-3.5 text-[var(--text-tertiary)]" />
                        </button>
                      </div>
                    </form>

                    {isSearching ? (
                      <div className="py-2 text-center">
                        <div className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)]">
                        {searchResults.map(result => (
                          <Link
                            key={result.id}
                            href={`/chat?id=${result.chat_id}`}
                            className="block border-b border-[var(--border-light)] p-2 last:border-0 hover:bg-[var(--bg-hover)]"
                          >
                            <div className="mb-1 text-xs font-medium text-[var(--text-primary)]">
                              {result.chats?.name || "Chat"}
                            </div>
                            <p className="line-clamp-2 text-xs text-[var(--text-tertiary)]">
                              {result.content}
                            </p>
                            <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                              {new Date(result.created_at).toLocaleString()}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : searchQuery && !isSearching ? (
                      <div className="py-2 text-center text-xs text-[var(--text-tertiary)]">
                        Keine Ergebnisse gefunden
                      </div>
                    ) : null}
                  </div>
                )}

                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <BarChart2 className="size-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <MessageCircle className="size-4" />
                  <span>Persönlicher Chat</span>
                </Link>
                <Link
                  href="/tasks?personal=true"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <FileText className="size-4" />
                  <span>Persönliche Aufgaben</span>
                </Link>
                <Link
                  href="/workspaces"
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <Users className="size-4" />
                  <span>Workspaces</span>
                </Link>
              </nav>
            </div>

            {/* Workspace-Navigation */}
            <div className="mb-6">
              <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                WORKSPACE
              </h2>
              <div className="mb-2 px-2 py-1">
                <div className="font-medium text-[var(--accent-primary)]">
                  {workspace?.name}
                </div>
                {workspace?.description && (
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {workspace.description}
                  </div>
                )}
              </div>
              <nav className="space-y-1">
                <Link
                  href={`/workspace/${workspaceId}`}
                  className="flex items-center space-x-2 rounded-md bg-[var(--bg-hover)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <BarChart2 className="size-4" />
                  <span>Übersicht</span>
                </Link>
                <Link
                  href={`/chat?workspace=${workspaceId}`}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <MessageCircle className="size-4" />
                  <span>Workspace-Chat</span>
                </Link>
                <Link
                  href={`/workspace/${workspaceId}/tasks`}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <FileText className="size-4" />
                  <span>Workspace-Aufgaben</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Account */}
          <div className="border-t border-[var(--border-light)] p-4">
            <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              ACCOUNT
            </h2>
            <button
              onClick={handleLogout}
              className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
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
        <header className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/workspaces"
                className="mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <h1 className="text-lg font-medium">{workspace?.name}</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleStartChat}
                className="flex items-center space-x-2 rounded-md bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-selected)]"
              >
                <MessageCircle className="size-3" />
                <span>Chat starten</span>
              </button>

              <button
                onClick={handleCreateTask}
                className="flex items-center space-x-2 rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-primary-hover)]"
              >
                <Plus className="size-3" />
                <span>Aufgabe erstellen</span>
              </button>
            </div>
          </div>
        </header>

        {/* Workspace content */}
        <main className="p-4">
          <div className="mx-auto">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Aufgaben */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Kürzliche Aufgaben</h2>
                  <Link
                    href={`/workspace/${workspaceId}/tasks`}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Alle anzeigen
                  </Link>
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--border-light)]">
                  {tasks.length > 0 ? (
                    <div className="divide-y divide-[var(--border-light)]">
                      {tasks.map(task => (
                        <Link
                          key={task.id}
                          href={`/workspace/${workspaceId}/tasks/${task.id}`}
                          className="block bg-[var(--bg-tertiary)] transition hover:bg-[var(--bg-hover)]"
                        >
                          <div className="p-4">
                            <div className="mb-1 flex items-start justify-between">
                              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                                {task.title}
                              </h3>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                  task.priority === "high"
                                    ? "bg-red-900/30 text-red-300"
                                    : task.priority === "medium"
                                      ? "bg-yellow-900/30 text-yellow-300"
                                      : "bg-gray-700/50 text-gray-300"
                                }`}
                              >
                                {task.priority.charAt(0).toUpperCase() +
                                  task.priority.slice(1)}
                              </span>
                            </div>
                            <p className="mb-2 text-xs text-[var(--text-tertiary)]">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`inline-flex items-center rounded-sm px-1.5 py-0.5 ${
                                  task.status === "completed"
                                    ? "bg-green-900/30 text-green-300"
                                    : task.status === "in_progress"
                                      ? "bg-blue-900/30 text-blue-300"
                                      : "bg-gray-700/50 text-gray-300"
                                }`}
                              >
                                {task.status === "in_progress"
                                  ? "In Bearbeitung"
                                  : task.status === "completed"
                                    ? "Abgeschlossen"
                                    : "Offen"}
                              </span>

                              {task.due_date && (
                                <span className="flex items-center text-[var(--text-tertiary)]">
                                  <Clock className="mr-1 size-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                        Noch keine Aufgaben in diesem Workspace
                      </p>
                      <button
                        onClick={handleCreateTask}
                        className="inline-flex items-center space-x-2 rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-primary-hover)]"
                      >
                        <Plus className="size-3" />
                        <span>Erste Aufgabe erstellen</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chats */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Kürzliche Chats</h2>
                  <Link
                    href={`/chat?workspace=${workspaceId}`}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Alle anzeigen
                  </Link>
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--border-light)]">
                  {chats.length > 0 ? (
                    <div className="divide-y divide-[var(--border-light)]">
                      {chats.map(chat => (
                        <Link
                          key={chat.id}
                          href={`/chat?id=${chat.id}`}
                          className="block bg-[var(--bg-tertiary)] transition hover:bg-[var(--bg-hover)]"
                        >
                          <div className="p-4">
                            <div className="mb-1 flex items-start justify-between">
                              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                                {chat.name}
                              </h3>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="inline-flex items-center text-[var(--text-tertiary)]">
                                <MessageCircle className="mr-1 size-3" />
                                <span>Chat</span>
                              </span>
                              <span className="text-[var(--text-tertiary)]">
                                {new Date(chat.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                        Noch keine Chats in diesem Workspace
                      </p>
                      <button
                        onClick={handleStartChat}
                        className="inline-flex items-center space-x-2 rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-primary-hover)]"
                      >
                        <MessageCircle className="size-3" />
                        <span>Chat starten</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
