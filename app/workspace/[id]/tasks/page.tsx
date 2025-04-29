"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  CheckCircle,
  Circle,
  Plus,
  Calendar,
  Clock,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Tag,
  Edit,
  Trash2,
  Save,
  AlertCircle,
  ChevronLeft,
  FileText,
  Repeat as RepeatIcon,
  Sparkles,
  Loader
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

type RecurrenceType =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "seasonal"
  | "yearly"

type Task = {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  due_date?: string
  created_at: string
  updated_at: string
  tags?: string[]
  user_id: string
  workspace_id: string
  system_prompt?: string
  ai_model?: string
  recurrence_type?: RecurrenceType
  recurrence_interval?: number
  recurrence_time?: string
  recurrence_weekday?: number
  recurrence_monthday?: number
  season_start?: string
  season_end?: string
  next_due_date?: string
}

export default function WorkspaceTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [filter, setFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [recurrenceFilter, setRecurrenceFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showPriorityFilter, setShowPriorityFilter] = useState(false)
  const [showRecurrenceFilter, setShowRecurrenceFilter] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskSystemPrompt, setNewTaskSystemPrompt] = useState("")
  const [newTaskAiModel, setNewTaskAiModel] = useState("gpt-4o")
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] =
    useState<RecurrenceType>("once")
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] = useState(1)
  const [newTaskRecurrenceTime, setNewTaskRecurrenceTime] = useState("12:00")
  const [newTaskRecurrenceWeekday, setNewTaskRecurrenceWeekday] =
    useState<number>(1)
  const [newTaskRecurrenceMonthday, setNewTaskRecurrenceMonthday] =
    useState<number>(1)
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const workspaceId = params.id

  const statusFilterRef = useRef<HTMLDivElement>(null)
  const priorityFilterRef = useRef<HTMLDivElement>(null)
  const recurrenceFilterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchWorkspaceTasks = async () => {
      try {
        setLoading(true)

        // Check session
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError)
          throw new Error("Session error: " + sessionError.message)
        if (!session) {
          setError("Keine Anmeldesitzung gefunden. Bitte melde dich an.")
          setLoading(false)
          return
        }

        setUser(session.user)

        // Fetch workspace info
        if (workspaceId) {
          const { data: workspaceData, error: workspaceError } = await supabase
            .from("workspaces")
            .select("*")
            .eq("id", workspaceId)
            .single()

          if (workspaceError) {
            throw new Error("Workspace not found: " + workspaceError.message)
          }

          setWorkspace(workspaceData)
        } else {
          throw new Error("Workspace ID is required")
        }

        // Fetch tasks for this workspace
        try {
          let query = supabase
            .from("tasks")
            .select("*")
            .eq("workspace_id", workspaceId)

          // Apply status filter
          if (filter !== "all") {
            query = query.eq("status", filter)
          }

          // Apply priority filter
          if (priorityFilter !== "all") {
            query = query.eq("priority", priorityFilter)
          }

          // Apply recurrence filter
          if (recurrenceFilter !== "all" && recurrenceFilter) {
            query = query.eq("recurrence_type", recurrenceFilter)
          }

          // Apply search
          if (searchTerm) {
            query = query.or(
              `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,system_prompt.ilike.%${searchTerm}%`
            )
          }

          // Sort by created_at
          query = query.order("created_at", { ascending: false })

          const { data, error: tasksError } = await query

          if (tasksError) {
            console.error(
              "Fehler beim Abfragen der Workspace-Tasks:",
              tasksError
            )
            throw new Error(
              "Fehler beim Laden der Workspace-Aufgaben: " + tasksError.message
            )
          }

          setTasks(data || [])
        } catch (fetchError) {
          console.error("Fehler beim Abrufen der Workspace-Tasks:", fetchError)
          setError(
            "Fehler beim Laden der Workspace-Aufgaben. Bitte versuchen Sie es später erneut."
          )
        }
      } catch (err: any) {
        console.error("Workspace Tasks error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (workspaceId) {
      fetchWorkspaceTasks()
    }
  }, [workspaceId, filter, priorityFilter, recurrenceFilter, searchTerm])

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target as Node)
      ) {
        setShowStatusFilter(false)
      }
      if (
        priorityFilterRef.current &&
        !priorityFilterRef.current.contains(event.target as Node)
      ) {
        setShowPriorityFilter(false)
      }
      if (
        recurrenceFilterRef.current &&
        !recurrenceFilterRef.current.contains(event.target as Node)
      ) {
        setShowRecurrenceFilter(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTaskTitle.trim()) return

    try {
      setLoading(true)

      const newTask: Partial<Task> = {
        title: newTaskTitle,
        description: newTaskDescription,
        system_prompt: newTaskSystemPrompt,
        ai_model: newTaskAiModel,
        status: "todo",
        priority: newTaskPriority,
        user_id: user.id,
        workspace_id: workspaceId,
        recurrence_type: newTaskRecurrenceType,
        recurrence_interval: newTaskRecurrenceInterval
      }

      if (newTaskRecurrenceType !== "once") {
        newTask.recurrence_time = newTaskRecurrenceTime

        if (newTaskRecurrenceType === "weekly") {
          newTask.recurrence_weekday = newTaskRecurrenceWeekday
        } else if (newTaskRecurrenceType === "monthly") {
          newTask.recurrence_monthday = newTaskRecurrenceMonthday
        }
      }

      if (newTaskDueDate) {
        newTask.due_date = new Date(newTaskDueDate).toISOString()
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select()

      if (error) throw error

      // Refresh tasks
      const { data: updatedTasks, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setTasks(updatedTasks || [])

      // Clear form
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskSystemPrompt("")
      setNewTaskPriority("medium")
      setNewTaskDueDate("")
      setShowNewTaskForm(false)
    } catch (err: any) {
      console.error("Error creating task:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask || !editedTask) return

    try {
      setLoading(true)

      const updatedTask = {
        ...editedTask,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("tasks")
        .update(updatedTask)
        .eq("id", selectedTask.id)

      if (error) throw error

      // Refresh tasks
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setTasks(data || [])
      setSelectedTask(null)
      setEditedTask({})
      setIsEditMode(false)
    } catch (err: any) {
      console.error("Error updating task:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: "todo" | "in_progress" | "done"
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId)

      if (error) throw error

      // Update tasks locally
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )
    } catch (err: any) {
      console.error("Error updating task status:", err)
      setError(err.message)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      // Remove task from state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    } catch (err: any) {
      console.error("Error deleting task:", err)
      setError(err.message)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-white/70 border-white/30"
      case "medium":
        return "text-white/70 border-white/30"
      case "low":
        return "text-white/70 border-white/30"
      default:
        return "text-white/70 border-white/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="size-4 text-[var(--status-success)]" />
      case "in_progress":
        return <Circle className="size-4 fill-white/20 text-white/60" />
      case "todo":
      default:
        return <Circle className="size-4 text-white/60" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const handleImprovePrompt = async () => {
    if (!newTaskSystemPrompt.trim()) return

    try {
      setIsImprovingPrompt(true)

      // Make API call to your reasoning model to improve the prompt
      const response = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: newTaskSystemPrompt,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage =
          errorData?.error || "Fehler beim Verbessern des Prompts"
        console.error("API Error:", errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setNewTaskSystemPrompt(data.improvedPrompt)
    } catch (error: any) {
      console.error("Error improving prompt:", error)
    } finally {
      setIsImprovingPrompt(false)
    }
  }

  const handleImproveEditPrompt = async () => {
    if (!editedTask.system_prompt?.trim()) return

    try {
      setIsImprovingPrompt(true)

      // Make API call to your reasoning model to improve the prompt
      const response = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: editedTask.system_prompt,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage =
          errorData?.error || "Fehler beim Verbessern des Prompts"
        console.error("API Error:", errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setEditedTask({ ...editedTask, system_prompt: data.improvedPrompt })
    } catch (error: any) {
      console.error("Error improving prompt:", error)
    } finally {
      setIsImprovingPrompt(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-md rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-6 text-center">
          <h2 className="mb-4 text-xl font-medium text-[var(--text-primary)]">
            Fehler
          </h2>
          <p className="mb-4 text-[var(--text-secondary)]">{error}</p>
          <div className="flex items-center justify-center text-[var(--text-secondary)]">
            <AlertCircle className="mr-2 size-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="mr-4 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <div className="text-sm font-medium">
              Workspace Aufgaben - {workspace?.name || ""}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Persönliche Aufgaben
            </Link>
          </div>
        </div>
      </header>

      <main className="grow bg-[var(--bg-primary)] p-4">
        <div className="mx-auto max-w-5xl">
          {/* Page header */}
          <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-lg font-medium">Workspace Aufgaben</h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Hier sehen Sie alle gemeinsamen Aufgaben in diesem Workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewTaskForm(true)}
              className="inline-flex items-center rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-primary-hover)] focus:outline-none"
            >
              <Plus className="mr-1 size-3" />
              Neue Workspace-Aufgabe
            </button>
          </div>

          {/* Filters and search */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] grow sm:grow-0">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Aufgaben suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
              />
            </div>

            <div className="relative" ref={statusFilterRef}>
              <button
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter)
                  setShowPriorityFilter(false)
                  setShowRecurrenceFilter(false)
                }}
                className="flex items-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus:outline-none"
              >
                <Filter size={12} className="mr-1.5" />
                {filter === "all"
                  ? "Alle Aufgaben"
                  : filter === "todo"
                    ? "Offene Aufgaben"
                    : filter === "in_progress"
                      ? "In Bearbeitung"
                      : "Erledigte Aufgaben"}
              </button>
              {showStatusFilter && (
                <div className="absolute right-0 z-20 mt-1">
                  <div className="overflow-hidden rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] shadow-md">
                    <button
                      onClick={() => {
                        setFilter("all")
                        setShowStatusFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Alle Aufgaben
                    </button>
                    <button
                      onClick={() => {
                        setFilter("todo")
                        setShowStatusFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Offene Aufgaben
                    </button>
                    <button
                      onClick={() => {
                        setFilter("in_progress")
                        setShowStatusFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      In Bearbeitung
                    </button>
                    <button
                      onClick={() => {
                        setFilter("done")
                        setShowStatusFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Erledigte Aufgaben
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={priorityFilterRef}>
              <button
                onClick={() => {
                  setShowPriorityFilter(!showPriorityFilter)
                  setShowStatusFilter(false)
                  setShowRecurrenceFilter(false)
                }}
                className="flex items-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus:outline-none"
              >
                <Filter size={12} className="mr-1.5" />
                {priorityFilter === "all"
                  ? "Alle Prioritäten"
                  : priorityFilter === "high"
                    ? "Hohe Priorität"
                    : priorityFilter === "medium"
                      ? "Mittlere Priorität"
                      : "Niedrige Priorität"}
              </button>
              {showPriorityFilter && (
                <div className="absolute right-0 z-20 mt-1">
                  <div className="overflow-hidden rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] shadow-md">
                    <button
                      onClick={() => {
                        setPriorityFilter("all")
                        setShowPriorityFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Alle Prioritäten
                    </button>
                    <button
                      onClick={() => {
                        setPriorityFilter("high")
                        setShowPriorityFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-[var(--bg-hover)]"
                    >
                      Hohe Priorität
                    </button>
                    <button
                      onClick={() => {
                        setPriorityFilter("medium")
                        setShowPriorityFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-yellow-500 hover:bg-[var(--bg-hover)]"
                    >
                      Mittlere Priorität
                    </button>
                    <button
                      onClick={() => {
                        setPriorityFilter("low")
                        setShowPriorityFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-green-500 hover:bg-[var(--bg-hover)]"
                    >
                      Niedrige Priorität
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={recurrenceFilterRef}>
              <button
                onClick={() => {
                  setShowRecurrenceFilter(!showRecurrenceFilter)
                  setShowStatusFilter(false)
                  setShowPriorityFilter(false)
                }}
                className="flex items-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus:outline-none"
              >
                <RepeatIcon size={12} className="mr-1.5" />
                {recurrenceFilter === "all"
                  ? "Alle Aufgabentypen"
                  : recurrenceFilter === "once"
                    ? "Einmalige Aufgaben"
                    : recurrenceFilter === "daily"
                      ? "Tägliche Aufgaben"
                      : recurrenceFilter === "weekly"
                        ? "Wöchentliche Aufgaben"
                        : recurrenceFilter === "monthly"
                          ? "Monatliche Aufgaben"
                          : recurrenceFilter === "seasonal"
                            ? "Saisonale Aufgaben"
                            : "Jährliche Aufgaben"}
              </button>
              {showRecurrenceFilter && (
                <div className="absolute right-0 z-20 mt-1">
                  <div className="overflow-hidden rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] shadow-md">
                    <button
                      onClick={() => {
                        setRecurrenceFilter("all")
                        setShowRecurrenceFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Alle Aufgabentypen
                    </button>
                    <button
                      onClick={() => {
                        setRecurrenceFilter("once")
                        setShowRecurrenceFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Einmalige Aufgaben
                    </button>
                    <button
                      onClick={() => {
                        setRecurrenceFilter("daily")
                        setShowRecurrenceFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Tägliche Aufgaben
                    </button>
                    <button
                      onClick={() => {
                        setRecurrenceFilter("weekly")
                        setShowRecurrenceFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Wöchentliche Aufgaben
                    </button>
                    <button
                      onClick={() => {
                        setRecurrenceFilter("monthly")
                        setShowRecurrenceFilter(false)
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Monatliche Aufgaben
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="ml-auto">
              <Link
                href="/tasks"
                className="flex items-center rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus:outline-none"
              >
                <FileText size={12} className="mr-1.5" />
                Zu meinen persönlichen Aufgaben
              </Link>
            </div>
          </div>

          {/* Tasks list */}
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] p-8 text-center">
              <p className="mb-3 text-sm text-[var(--text-secondary)]">
                Keine Workspace-Aufgaben vorhanden
              </p>
              <button
                type="button"
                onClick={() => setShowNewTaskForm(true)}
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-primary-hover)] focus:outline-none"
              >
                <Plus className="mr-1.5 size-3" />
                Erste Workspace-Aufgabe erstellen
              </button>
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border-light)]">
              <table className="min-w-full divide-y divide-[var(--border-light)]">
                <thead className="bg-[var(--bg-tertiary)]">
                  <tr>
                    <th
                      scope="col"
                      className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase text-[var(--text-tertiary)]"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="p-3 text-left text-xs font-medium uppercase text-[var(--text-tertiary)]"
                    >
                      Aufgabe
                    </th>
                    <th
                      scope="col"
                      className="p-3 text-left text-xs font-medium uppercase text-[var(--text-tertiary)]"
                    >
                      Priorität
                    </th>
                    <th
                      scope="col"
                      className="p-3 text-left text-xs font-medium uppercase text-[var(--text-tertiary)]"
                    >
                      Fälligkeitsdatum
                    </th>
                    <th scope="col" className="relative py-3 pl-3 pr-4">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)] bg-[var(--bg-primary)]">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm">
                        <button
                          onClick={() => {
                            const newStatus =
                              task.status === "todo"
                                ? "in_progress"
                                : task.status === "in_progress"
                                  ? "done"
                                  : "todo"
                            handleUpdateTaskStatus(task.id, newStatus)
                          }}
                          className="focus:outline-none"
                        >
                          {getStatusIcon(task.status)}
                        </button>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="font-medium text-[var(--text-primary)]">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="mt-1 max-w-lg overflow-hidden text-ellipsis text-xs text-[var(--text-secondary)]">
                            {task.description.length > 100
                              ? `${task.description.substring(0, 100)}...`
                              : task.description}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority === "high"
                            ? "Hoch"
                            : task.priority === "medium"
                              ? "Mittel"
                              : "Niedrig"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 text-xs text-[var(--text-secondary)]">
                        {task.due_date ? (
                          <div className="flex items-center">
                            <Calendar className="mr-1 size-3 text-[var(--text-tertiary)]" />
                            {formatDate(task.due_date)}
                          </div>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">
                            Nicht gesetzt
                          </span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-xs font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setSelectedTask(task)
                              setEditedTask({
                                title: task.title,
                                description: task.description,
                                priority: task.priority,
                                due_date: task.due_date,
                                system_prompt: task.system_prompt,
                                ai_model: task.ai_model
                              })
                              setIsEditMode(true)
                            }}
                            className="p-1 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?"
                                )
                              ) {
                                handleDeleteTask(task.id)
                              }
                            }}
                            className="p-1 text-[var(--text-secondary)] transition hover:text-[var(--text-tertiary)]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New task form modal */}
      {showNewTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)]">
            <div className="p-5">
              <h2 className="mb-4 text-base font-medium text-[var(--text-primary)]">
                Neue Workspace-Aufgabe erstellen
              </h2>

              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="task-title"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Titel
                    </label>
                    <input
                      type="text"
                      id="task-title"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-description"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Beschreibung
                    </label>
                    <textarea
                      id="task-description"
                      value={newTaskDescription}
                      onChange={e => setNewTaskDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-system-prompt"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      System Prompt
                    </label>
                    <div className="relative">
                      <textarea
                        id="task-system-prompt"
                        value={newTaskSystemPrompt}
                        onChange={e => setNewTaskSystemPrompt(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleImprovePrompt}
                        disabled={
                          isImprovingPrompt || !newTaskSystemPrompt.trim()
                        }
                        className="absolute right-2 top-2 rounded-md bg-[var(--bg-hover)] p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                        title="AI-Unterstützung für Prompt"
                      >
                        {isImprovingPrompt ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="task-priority"
                        className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                      >
                        Priorität
                      </label>
                      <select
                        id="task-priority"
                        value={newTaskPriority}
                        onChange={e =>
                          setNewTaskPriority(e.target.value as any)
                        }
                        className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--border-medium)] focus:outline-none"
                      >
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="task-due-date"
                        className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                      >
                        Fälligkeitsdatum
                      </label>
                      <input
                        type="date"
                        id="task-due-date"
                        value={newTaskDueDate}
                        onChange={e => setNewTaskDueDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskForm(false)}
                    className="rounded-md border border-[var(--border-light)] bg-transparent px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-primary-hover)]"
                  >
                    Aufgabe erstellen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit task modal */}
      {isEditMode && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)]">
            <div className="p-5">
              <h2 className="mb-4 text-base font-medium text-[var(--text-primary)]">
                Workspace-Aufgabe bearbeiten
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-task-title"
                    className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Titel
                  </label>
                  <input
                    type="text"
                    id="edit-task-title"
                    value={editedTask.title || ""}
                    onChange={e =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    required
                    className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-task-description"
                    className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="edit-task-description"
                    value={editedTask.description || ""}
                    onChange={e =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-task-system-prompt"
                    className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    System Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      id="edit-task-system-prompt"
                      value={editedTask.system_prompt || ""}
                      onChange={e =>
                        setEditedTask({
                          ...editedTask,
                          system_prompt: e.target.value
                        })
                      }
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleImproveEditPrompt}
                      disabled={
                        isImprovingPrompt || !editedTask.system_prompt?.trim()
                      }
                      className="absolute right-2 top-2 rounded-md bg-[var(--bg-hover)] p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                      title="AI-Unterstützung für Prompt"
                    >
                      {isImprovingPrompt ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-task-priority"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Priorität
                    </label>
                    <select
                      id="edit-task-priority"
                      value={editedTask.priority || "medium"}
                      onChange={e =>
                        setEditedTask({
                          ...editedTask,
                          priority: e.target.value as any
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--border-medium)] focus:outline-none"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-task-due-date"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Fälligkeitsdatum
                    </label>
                    <input
                      type="date"
                      id="edit-task-due-date"
                      value={
                        editedTask.due_date
                          ? new Date(editedTask.due_date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={e =>
                        setEditedTask({
                          ...editedTask,
                          due_date: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--border-medium)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null)
                    setEditedTask({})
                    setIsEditMode(false)
                  }}
                  className="rounded-md border border-[var(--border-light)] bg-transparent px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs text-white hover:bg-[var(--accent-primary-hover)]"
                >
                  Aktualisieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
