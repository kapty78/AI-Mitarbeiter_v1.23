"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState, useRef } from "react"
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  FileText,
  CheckCircle,
  Calendar,
  Download,
  MoreVertical,
  Check,
  AlertTriangle,
  User,
  Layers,
  ChevronDown,
  Clock,
  CircleDot,
  Flag,
  ClipboardList,
  Sparkles,
  Loader
} from "lucide-react"

type RecurrenceType =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "seasonal"
  | "yearly"

type TasksComponentProps = {
  workspaceId?: string | null
}

type Task = {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  due_date?: string
  created_at: string
  updated_at: string
  tags?: string[]
  user_id: string
  system_prompt?: string
  ai_model?: string
  knowledge_base_ids?: string[]
  recurrence_type?: RecurrenceType
  recurrence_interval?: number
  recurrence_time?: string
  recurrence_weekday?: number
  recurrence_monthday?: number
  season_start?: string
  season_end?: string
  next_due_date?: string
  workspace_id?: string
  project_id?: string | null
  assignee_id?: string | null
}

export default function TasksComponent({ workspaceId }: TasksComponentProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDueDate, setTaskDueDate] = useState<string | null>(null)
  const [taskProject, setTaskProject] = useState<any>(null)
  const [taskAssignee, setTaskAssignee] = useState<any>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [newTaskSystemPrompt, setNewTaskSystemPrompt] = useState("")
  const [newTaskModel, setNewTaskModel] = useState("gpt-4o")
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false)
  const [showConfirmBanner, setShowConfirmBanner] = useState(false)
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null)
  const [taskKnowledgeBaseId, setTaskKnowledgeBaseId] = useState<string[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])

  const supabase = createClientComponentClient()

  // Define fetchTasks at component scope
  const fetchTasks = async () => {
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

      console.log(
        "🔴 DASHBOARD COMPONENT: Fetching tasks with workspaceId:",
        workspaceId
      )

      // Build query
      let query = supabase.from("tasks").select("*")

      // SIMPLE APPROACH: If workspaceId is provided by Dashboard parent, use it directly
      if (workspaceId) {
        console.log(
          "🔴 DASHBOARD COMPONENT: Using passed workspaceId:",
          workspaceId
        )
        query = query.eq("workspace_id", workspaceId)
      } else {
        // Personal tasks when no workspace context
        console.log(
          "🔴 DASHBOARD COMPONENT: No workspace context, showing personal tasks"
        )
        query = query.is("workspace_id", null).eq("user_id", session.user.id)
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      // Apply search
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }

      const { data, error: tasksError } = await query

      if (tasksError) {
        console.error("Fehler beim Abfragen der Tasks:", tasksError)
        throw new Error("Fehler beim Laden der Tasks: " + tasksError.message)
      }

      setTasks(data || [])
    } catch (fetchError) {
      console.error("Fehler beim Abrufen der Tasks:", fetchError)
      setError(
        "Fehler beim Laden der Tasks. Bitte versuchen Sie es später erneut."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, searchTerm, workspaceId])

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      if (!showNewTaskModal || !user) return;
      
      try {
        // 1. Fetch all knowledge bases
        const { data: allKBs, error: kbError } = await supabase
          .from("knowledge_bases")
          .select("*")
          .order("name", { ascending: true });

        if (kbError) throw kbError;
        if (!allKBs || allKBs.length === 0) {
          setKnowledgeBases([]);
          return;
        }

        // 2. Fetch the user's group memberships
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from("knowledge_group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (groupMembersError) throw groupMembersError;

        const userGroupIds = groupMembers?.map(member => member.group_id) || [];
        
        if (userGroupIds.length === 0) {
          setKnowledgeBases(allKBs.map(kb => ({ ...kb, hasAccess: false })));
          return;
        }

        // 3. Fetch which knowledge bases are linked to the user's groups
        const { data: accessibleKBsLinks, error: accessibleError } = await supabase
          .from("knowledge_base_groups")
          .select("knowledge_base_id")
          .in("group_id", userGroupIds);

        if (accessibleError) throw accessibleError;

        const accessibleKbIds = new Set(accessibleKBsLinks?.map(link => link.knowledge_base_id) || []);

        // 4. Combine the data: Mark each KB with access status
        const kbsWithAccess = allKBs.map(kb => ({
          ...kb,
          hasAccess: accessibleKbIds.has(kb.id)
        }));

        setKnowledgeBases(kbsWithAccess);
      } catch (err) {
        console.error("Error fetching knowledge bases:", err);
        setKnowledgeBases([]);
      }
    };

    fetchKnowledgeBases();
  }, [showNewTaskModal, user, supabase]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTaskTitle.trim()) {
      return
    }

    try {
      setLoading(true)

      const newTask: Partial<Task> = {
        title: newTaskTitle,
        description: newTaskDescription,
        status: "todo",
        due_date: newTaskDueDate || undefined,
        user_id: user.id,
        workspace_id: workspaceId || undefined
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select()

      if (error) throw error

      // Reset form and refresh list
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskPriority("medium")
      setNewTaskDueDate("")
      setShowNewTaskForm(false)

      // Add new task to the list
      if (data) {
        setTasks([...tasks, data[0]])
      }
    } catch (err) {
      console.error("Error creating task:", err)
      setError("Fehler beim Erstellen des Tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask || !isEditMode) return

    try {
      setLoading(true)

      const updatedTaskData = {
        title: editedTask.title || selectedTask.title,
        description: editedTask.description || selectedTask.description,
        status: editedTask.status || selectedTask.status,
        due_date: editedTask.due_date || selectedTask.due_date
      }

      const { error } = await supabase
        .from("tasks")
        .update(updatedTaskData)
        .eq("id", selectedTask.id)

      if (error) throw error

      // Update the tasks list
      setTasks(
        tasks.map(task =>
          task.id === selectedTask.id ? { ...task, ...updatedTaskData } : task
        )
      )

      // Reset form state
      setSelectedTask(null)
      setIsEditMode(false)
      setEditedTask({})
    } catch (err) {
      console.error("Error updating task:", err)
      setError("Fehler beim Aktualisieren des Tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: "todo" | "in_progress" | "done"
  ) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId)

      if (error) throw error

      // Update the tasks list
      setTasks(
        tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )
    } catch (err) {
      console.error("Error updating task status:", err)
      setError("Fehler beim Aktualisieren des Task-Status")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setTaskToDeleteId(taskId)
    setShowConfirmBanner(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDeleteId) return

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDeleteId)

      if (error) throw error

      // Remove from tasks list
      setTasks(tasks.filter(task => task.id !== taskToDeleteId))
    } catch (err: any) {
      console.error("Error deleting task:", err)
      setError(
        `Fehler beim Löschen des Tasks: ${err.message || "Unbekannter Fehler"}`
      )
    } finally {
      setLoading(false)
      setShowConfirmBanner(false)
      setTaskToDeleteId(null)
    }
  }

  const cancelDeleteTask = () => {
    setShowConfirmBanner(false)
    setTaskToDeleteId(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return (
          <div className="size-4 rounded-full border border-neutral-400"></div>
        )
      case "in_progress":
        return (
          <div className="size-4 rounded-full border border-blue-500 bg-blue-500/30"></div>
        )
      case "done":
        return <CheckCircle className="size-4 text-green-500" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  // Utility function to export tasks
  const handleExportTasks = () => {
    // Placeholder for export functionality
    console.log("Exporting tasks...")
  }

  // Handle edit task
  const handleEditTask = (task: any) => {
    setSelectedTask(task)
    setTaskTitle(task.title)
    setTaskDescription(task.description || "")
    setTaskDueDate(task.due_date || null)
    setTaskProject(
      task.project_id ? projects.find(p => p.id === task.project_id) : null
    )
    setTaskAssignee(
      task.assignee_id ? users.find(u => u.id === task.assignee_id) : null
    )
    setNewTaskSystemPrompt(task.system_prompt || "")
    setNewTaskModel(task.ai_model || "gpt-4o")
    setTaskKnowledgeBaseId(task.knowledge_base_ids || [])
    setShowNewTaskModal(true)
  }

  // Placeholder for improve prompt functionality
  const handleImprovePrompt = async () => {
    if (!newTaskSystemPrompt.trim()) return // Check if prompt is not empty

    try {
      setIsImprovingPrompt(true)
      setError(null) // Clear previous errors

      // Make API call to your reasoning model to improve the prompt
      const response = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: newTaskSystemPrompt,
          userId: user?.id // Ensure user ID is passed (handle if user is null)
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

      // Update the state with the improved prompt
      setNewTaskSystemPrompt(data.improvedPrompt)

      // Optional: Show success notification (instead of alert)
      // You might want to add a more sophisticated notification system
      console.log("Prompt improved successfully!")
    } catch (error: any) {
      console.error("Error improving prompt:", error)
      setError(
        `Fehler beim Verbessern des Prompts: ${error.message || "Unbekannter Fehler"}`
      )
      // Keep modal open on error to show the error message
    } finally {
      setIsImprovingPrompt(false)
    }
  }

  // Reset the task form - Extended to include new fields
  const resetTaskForm = () => {
    setTaskTitle("")
    setTaskDescription("")
    setTaskDueDate(null)
    setTaskProject(null)
    setTaskAssignee(null)
    setNewTaskSystemPrompt("")
    setNewTaskModel("gpt-4o")
    setSelectedTask(null)
    setTaskKnowledgeBaseId([])
  }

  // Handle form submission for task creation/update - Extended to include new fields
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) {
      setError("Task title cannot be empty.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const taskData: Partial<Task> = {
        title: taskTitle,
        description: taskDescription,
        due_date: taskDueDate || undefined,
        system_prompt: newTaskSystemPrompt || undefined,
        ai_model: newTaskModel || undefined,
        workspace_id: taskProject?.workspace_id || workspaceId || undefined,
        project_id: taskProject?.id || undefined,
        user_id: user.id,
        knowledge_base_ids: taskKnowledgeBaseId.length > 0 ? taskKnowledgeBaseId : undefined
      }

      if (selectedTask) {
        // Update existing task
        const { data, error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", selectedTask.id)
          .select()

        if (error) throw error

        // Update task in local state
        if (data) {
          setTasks(
            tasks.map(t =>
              t.id === selectedTask.id ? { ...t, ...data[0] } : t
            )
          )
        }
      } else {
        // Create new task
        const { data, error } = await supabase
          .from("tasks")
          .insert({ ...taskData, status: "todo" })
          .select()

        if (error) throw error

        // Add new task to local state
        if (data) {
          setTasks([...tasks, data[0]])
        }
      }

      resetTaskForm()
      setShowNewTaskModal(false)
    } catch (err: any) {
      console.error("Error creating/updating task:", err)
      setError(`Fehler: ${err.message || "Unbekannter Fehler"}`)
    } finally {
      setLoading(false)
    }
  }

  // Filter and group tasks
  const filteredTasks = tasks.filter(task => {
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description &&
          task.description.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] p-6 text-white">
        <p>Lade Tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e] p-6 text-white">
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/20 p-4">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-white">
      {/* Header - REMOVED */}
      {/* 
      <div className="border-b border-[#333333] py-6 px-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-400 mb-4">
          Tasks
        </h1>
      </div>
      */}

      <main className="relative grow overflow-auto p-6">
        {/* Filters and buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Project Filter */}
          {/* Assignee Filter */}
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Aufgaben durchsuchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#333333] bg-[#252525] py-2 pl-10 pr-4 text-white placeholder:text-gray-400 focus:border-[#444444] focus:outline-none"
            />
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <button
              onClick={handleExportTasks}
              className="flex items-center rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-gray-300 transition-colors hover:bg-[#333333] focus:outline-none"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex grow items-center rounded-lg bg-white px-4 py-2 text-[#1e1e1e] transition-colors hover:bg-gray-200 focus:outline-none md:grow-0"
            >
              <Plus size={16} className="mr-2" />
              Neue Aufgabe
            </button>
          </div>
        </div>

        {/* Tasks Container */}
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-[#333333] bg-[#252525] p-8 text-center">
              <ClipboardList className="mx-auto mb-4 size-12 text-gray-400" />
              <h3 className="mb-1 text-lg font-medium text-white">
                Keine Aufgaben
              </h3>
              <p className="mb-6 text-gray-400">
                {searchTerm
                  ? `Es wurden keine Aufgaben zu "${searchTerm}" gefunden.`
                  : "Es sind keine Aufgaben vorhanden, die den Filterkriterien entsprechen."}
              </p>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-[#1e1e1e] hover:bg-gray-200"
              >
                <Plus size={16} className="mr-2" />
                Neue Aufgabe erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#333333] overflow-hidden rounded-lg border border-[#333333] bg-[#252525]">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="flex flex-col px-6 py-4 hover:bg-[#2a2a2a]"
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="flex-1 cursor-pointer">
                      <h4 className="mb-1 flex items-center font-medium text-white">
                        {task.status === "todo" && (
                          <CircleDot className="mr-2 size-4 shrink-0 text-pink-400" />
                        )}
                        {task.status === "in_progress" && (
                          <Clock className="mr-2 size-4 shrink-0 text-pink-400" />
                        )}
                        {task.status === "done" && (
                          <CheckCircle className="mr-2 size-4 shrink-0 text-pink-400" />
                        )}
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-gray-400">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                        {task.project_id && (
                          <div className="flex items-center">
                            <Layers className="mr-1.5 size-3.5" />
                            {projects.find(p => p.id === task.project_id)
                              ?.name || "Unknown Project"}
                          </div>
                        )}

                        <div className="flex items-center">
                          <Calendar className="mr-1.5 size-3.5" />
                          Erstellt: {formatDate(task.created_at)}
                        </div>

                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="mr-1.5 size-3.5" />
                            {new Date(task.due_date).toLocaleDateString(
                              "de-DE"
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center space-x-3">
                      {task.assignee_id && (
                        <div className="ml-4">
                          {(() => {
                            const assignee = users.find(
                              u => u.id === task.assignee_id
                            )
                            return (
                              <div
                                className="tooltip flex size-8 items-center justify-center rounded-full bg-[#333333] text-white"
                                data-tip={assignee?.name || "Unknown User"}
                              >
                                {assignee?.avatar_url ? (
                                  <img
                                    src={assignee.avatar_url}
                                    alt={assignee.name || "avatar"}
                                    className="size-full rounded-full object-cover"
                                  />
                                ) : assignee?.name ? (
                                  <span className="text-xs font-medium">
                                    {assignee.name
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </span>
                                ) : (
                                  <User className="size-4" />
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      <button
                        onClick={e => {
                          handleEditTask(task)
                        }}
                        className="p-1 text-gray-400 hover:text-white focus:outline-none"
                        title="Bearbeiten"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 focus:outline-none"
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {taskToDeleteId === task.id && (
                    <div className="animate-fade-in mt-3 flex w-full items-center justify-between rounded-md border border-[#444444] bg-[#2d2d2d] p-3">
                      <p className="mr-4 text-sm text-gray-300">
                        Wirklich löschen?
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={confirmDeleteTask}
                          className="rounded-md bg-white px-3 py-1 text-sm text-[#1e1e1e] transition-colors hover:bg-gray-200"
                        >
                          Ja
                        </button>
                        <button
                          onClick={cancelDeleteTask}
                          className="rounded-md bg-[#333333] px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-[#444444]"
                        >
                          Nein
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New/Edit Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              {selectedTask ? "Aufgabe bearbeiten" : "Neuen Task erstellen"}
            </h2>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label
                  htmlFor="taskName"
                  className="mb-1 block text-sm font-medium text-[#cccccc]"
                >
                  Task-Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="taskName"
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444]"
                  placeholder="Task-Name eingeben"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="taskDescription"
                  className="mb-1 block text-sm font-medium text-[#cccccc]"
                >
                  Beschreibung
                </label>
                <textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444]"
                  placeholder="Task beschreiben..."
                  rows={3}
                />
              </div>

              <div>
                <label
                  htmlFor="taskSystemPrompt"
                  className="mb-1 block text-sm font-medium text-[#cccccc]"
                >
                  System-Prompt
                </label>
                <div className="relative">
                  <textarea
                    id="taskSystemPrompt"
                    value={newTaskSystemPrompt}
                    onChange={e => setNewTaskSystemPrompt(e.target.value)}
                    className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 pr-10 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444]"
                    placeholder="Strukturiere deinen Prompt! Z.B.: ZIEL: [Dein Ziel...] FORMAT: [Gewünschtes Format...] WARNUNGEN: [Was vermeiden?...] KONTEXT: [Hintergrundinfos...]"
                    rows={4}
                  />
                  <button
                    type="button"
                    onClick={handleImprovePrompt}
                    disabled={isImprovingPrompt || !newTaskSystemPrompt.trim()}
                    className="absolute right-2 top-2 rounded-md bg-[#333333] p-1.5 text-white/80 transition-colors hover:bg-[#444444] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    title="AI-Unterstützung für Prompt"
                  >
                    {isImprovingPrompt ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="taskModel"
                  className="mb-1 block text-sm font-medium text-[#cccccc]"
                >
                  KI-Modell
                </label>
                <select
                  id="taskModel"
                  value={newTaskModel}
                  onChange={e => setNewTaskModel(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#333333] bg-[#2d2d2d] bg-no-repeat px-3 py-2 pr-8 text-white focus:outline-none focus:ring-1 focus:ring-[#444444]"
                  style={{
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="%23cccccc" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>')`,
                    backgroundPosition: `right 0.75rem center`,
                    backgroundSize: `1em auto`
                  }}
                >
                  <option value="gpt-4o">Basic</option>
                  <option value="gpt-4o-mini">Fast</option>
                  <option value="o3-mini">Reason</option>
                  <option value="gpt-4.5-preview">Reason+</option>
                </select>
              </div>

              {/* Knowledge Base Selector */}
              <div>
                <label
                  htmlFor="taskKnowledgeBase"
                  className="mb-1 block text-sm font-medium text-[#cccccc]"
                >
                  Wissensdatenbanken
                </label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-[#333333] bg-[#2d2d2d] p-2">
                  {knowledgeBases
                    .filter(kb => kb.hasAccess)
                    .map(kb => (
                      <div key={kb.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`kb-${kb.id}`}
                          checked={taskKnowledgeBaseId.includes(kb.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaskKnowledgeBaseId([...taskKnowledgeBaseId, kb.id])
                            } else {
                              setTaskKnowledgeBaseId(
                                taskKnowledgeBaseId.filter(id => id !== kb.id)
                              )
                            }
                          }}
                          className="mr-2 size-4 rounded border-[#444444] bg-[#222222]"
                        />
                        <label htmlFor={`kb-${kb.id}`} className="text-sm text-white">
                          {kb.name}
                        </label>
                      </div>
                    ))}
                  {knowledgeBases.filter(kb => kb.hasAccess).length === 0 && (
                    <p className="p-2 text-sm text-gray-400">Keine Wissensdatenbanken verfügbar</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTaskModal(false)
                    resetTaskForm()
                  }}
                  className="rounded-lg border border-[#444444] bg-[#252525] px-4 py-2 text-sm text-[#cccccc] transition-all hover:border-[#555555] hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!taskTitle.trim() || loading}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    taskTitle.trim() && !loading
                      ? "bg-white text-[#1e1e1e] hover:bg-gray-200"
                      : "cursor-not-allowed bg-gray-500 text-gray-300"
                  }`}
                >
                  {loading
                    ? "Speichern..."
                    : selectedTask
                      ? "Aktualisieren"
                      : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
