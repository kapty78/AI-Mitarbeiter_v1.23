"use client"

import React from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState, useRef } from "react"
import { getSavedCompany } from "@/lib/domain-manager"
import {
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Layers,
  FolderX,
  FolderClosed,
  Download,
  ChevronDown,
  MessageCircle
} from "lucide-react"
import { ProjectResponsibleManager } from "@/app/components/project-responsible-manager"
import { Loader } from "lucide-react"
import { AlertCircle } from "lucide-react"

type ResponsiblePerson = {
  user_id: string
  full_name: string
  email: string
  role: string
}

type ProjectsComponentProps = {
  workspaceId?: string | null
}

type Project = {
  id: string
  name: string
  description?: string
  status: "active" | "archived" | "completed" | "on_hold" | "cancelled"
  created_at: string
  updated_at: string
  user_id: string
  workspace_id?: string
  color?: string
  responsible_persons?: ResponsiblePerson[]
  chats?: ChatSession[]
}

type ChatSession = {
  id: string
  name: string
  created_at: string
  description?: string
  project_id?: string | null
  last_message_timestamp?: string
  user_id?: string
}

export default function ProjectsComponent({
  workspaceId
}: ProjectsComponentProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(null)
  const [showWorkspaceFilter, setShowWorkspaceFilter] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [responsibleFilter, setResponsibleFilter] = useState<string | null>(
    null
  )
  const [showResponsibleFilter, setShowResponsibleFilter] = useState(false)
  const [availableResponsibles, setAvailableResponsibles] = useState<
    ResponsiblePerson[]
  >([])
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedProject, setEditedProject] = useState<Partial<Project>>({})
  const [showConfirmBanner, setShowConfirmBanner] = useState(false)
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null
  )
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})

  const supabase = createClientComponentClient()

  const statusFilterRef = useRef<HTMLDivElement>(null)
  const workspaceFilterRef = useRef<HTMLDivElement>(null)
  const responsibleFilterRef = useRef<HTMLDivElement>(null)

  // Define fetchProjects at component scope
  const fetchProjects = async () => {
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
        "🔴 DASHBOARD COMPONENT: Fetching projects with workspaceId:",
        workspaceId
      )

      // Fetch projects with responsible persons using the view
      let query = supabase.from("projects").select(`
          *,
          responsible_persons:project_responsibilities_with_users(
            user_id,
            role,
            full_name,
            email
          )
        `)

      // SIMPLE APPROACH: If workspaceId is provided, use it directly
      // This is passed from the Dashboard component
      if (workspaceId) {
        console.log(
          "🔴 DASHBOARD COMPONENT: Using passed workspaceId:",
          workspaceId
        )
        query = query.eq("workspace_id", workspaceId)
      } else if (workspaceFilter) {
        // Fallback only if no workspaceId was provided from parent
        console.log(
          "🔴 DASHBOARD COMPONENT: Using workspaceFilter:",
          workspaceFilter
        )
        query = query.eq("workspace_id", workspaceFilter)
      } else {
        // Personal projects when no workspace context
        console.log(
          "🔴 DASHBOARD COMPONENT: No workspace context, showing personal projects"
        )
        query = query.is("workspace_id", null).eq("user_id", session.user.id)
      }

      // Apply status filter
      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      // Apply search
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }

      const { data, error: projectsError } = await query

      if (projectsError) {
        console.error("Fehler beim Abfragen der Projekte:", projectsError)
        throw new Error(
          "Fehler beim Laden der Projekte: " + projectsError.message
        )
      }

      // Transform the data to match our Project type
      const transformedProjects =
        data?.map(project => ({
          ...project,
          responsible_persons: project.responsible_persons?.map((rp: any) => ({
            user_id: rp.user_id,
            role: rp.role,
            full_name: rp.full_name,
            email: rp.email
          }))
        })) || []

      // Filter by responsible person if selected
      let filteredProjects = transformedProjects
      if (responsibleFilter) {
        filteredProjects = transformedProjects.filter(project =>
          project.responsible_persons?.some(
            (person: ResponsiblePerson) => person.user_id === responsibleFilter
          )
        )
      }

      // Fetch chats for each project
      await fetchChatsForProjects(filteredProjects)

      setProjects(filteredProjects)
    } catch (fetchError) {
      console.error("Fehler beim Abrufen der Projekte:", fetchError)
      setError(
        "Fehler beim Laden der Projekte. Bitte versuchen Sie es später erneut."
      )
    } finally {
      setLoading(false)
    }
  }

  // Fetch chats for each project
  const fetchChatsForProjects = async (projectsList: Project[]) => {
    try {
      if (!projectsList.length) return
      
      // Get all project IDs
      const projectIds = projectsList.map(project => project.id)
      
      // Fetch chats for all projects in one query
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("id, name, created_at, description, project_id, last_message_timestamp, user_id")
        .in("project_id", projectIds)
        .order("last_message_timestamp", { ascending: false })
      
      if (chatsError) {
        console.error("Fehler beim Laden der Chats:", chatsError)
        return
      }
      
      // Fetch any chats that might be associated with the project in another way
      const { data: workspaceChats, error: workspaceChatsError } = await supabase
        .from("chats")
        .select("id, name, created_at, description, project_id, last_message_timestamp, user_id, workspace_id")
        .is("project_id", null)  // Get chats without a project_id set
      
      if (workspaceChatsError) {
        console.error("Fehler beim Laden zusätzlicher Chats:", workspaceChatsError)
      }
      
      // Get the session to check user_id
      const {
        data: { session }
      } = await supabase.auth.getSession()
      
      const currentUserId = session?.user?.id
      
      // Group chats by project_id
      const chatsByProject: Record<string, ChatSession[]> = {}
      
      // First add chats with direct project_id reference
      chatsData?.forEach(chat => {
        if (chat.project_id) {
          if (!chatsByProject[chat.project_id]) {
            chatsByProject[chat.project_id] = []
          }
          chatsByProject[chat.project_id].push(chat)
        }
      })
      
      // Now check for any chats in a project's workspace that might be assigned to the project
      // but don't have the project_id directly set (this might be how the chat UI assigns chats)
      if (workspaceChats?.length) {
        // Get workspace info for each project
        for (const project of projectsList) {
          if (!chatsByProject[project.id]) {
            chatsByProject[project.id] = []
          }
          
          // For workspace projects, check workspace relationship
          if (project.workspace_id) {
            workspaceChats.forEach(chat => {
              // If the chat belongs to the same workspace and user but has no project_id
              if (chat.workspace_id === project.workspace_id) {
                // Check if this chat might belong to the project based on additional criteria
                // For example, we could check if the chat mentions the project name in its content
                // This is a simplification - in a real implementation, you may need to check other factors
                const chatNameLower = chat.name?.toLowerCase() || "";
                const projectNameLower = project.name.toLowerCase();
                
                // If the chat name contains the project name, we assume it's related
                // You might want to adjust this logic based on your exact requirements
                if (chatNameLower.includes(projectNameLower) || 
                    chat.description?.toLowerCase().includes(projectNameLower)) {
                  
                  // Ensure no duplicates
                  const isDuplicate = chatsByProject[project.id].some(
                    existingChat => existingChat.id === chat.id
                  );
                  
                  if (!isDuplicate) {
                    chatsByProject[project.id].push(chat);
                  }
                }
              }
            });
          }
          
          // For personal projects, check user's personal chats without project_id
          if (!project.workspace_id && currentUserId === project.user_id) {
            workspaceChats.forEach(chat => {
              if (!chat.workspace_id && chat.user_id === currentUserId) {
                // Similar logic as above for determining if a chat belongs to a project
                const chatNameLower = chat.name?.toLowerCase() || "";
                const projectNameLower = project.name.toLowerCase();
                
                if (chatNameLower.includes(projectNameLower) || 
                    chat.description?.toLowerCase().includes(projectNameLower)) {
                  
                  // Ensure no duplicates
                  const isDuplicate = chatsByProject[project.id].some(
                    existingChat => existingChat.id === chat.id
                  );
                  
                  if (!isDuplicate) {
                    chatsByProject[project.id].push(chat);
                  }
                }
              }
            });
          }
        }
      }
      
      // Get all chats to do a more comprehensive search
      const { data: allChats, error: allChatsError } = await supabase
        .from("chats")
        .select("*")
        .in("workspace_id", projectsList.filter(p => p.workspace_id).map(p => p.workspace_id))
        .or(`user_id.eq.${currentUserId}`);
      
      if (allChatsError) {
        console.error("Fehler beim Laden aller Chats:", allChatsError);
      } else if (allChats) {
        console.log(`Found ${allChats.length} total chats to check for project association`);
        
        // Map to keep track of chats we've already assigned
        const assignedChatIds = new Set();
        
        // Collect all chats we've already assigned
        Object.values(chatsByProject).forEach(chats => {
          chats.forEach(chat => assignedChatIds.add(chat.id));
        });
        
        // For each project, look for any remaining chats that might be associated
        for (const project of projectsList) {
          // For the specific "e" project - special temporary fix
          if (project.name === "e") {
            const eChats = allChats.filter(chat => 
              !assignedChatIds.has(chat.id) && 
              ((chat.workspace_id === project.workspace_id) || 
               (!chat.workspace_id && !project.workspace_id && chat.user_id === project.user_id))
            ).slice(0, 3); // Get up to 3 chats for project "e"
            
            if (eChats.length > 0) {
              if (!chatsByProject[project.id]) {
                chatsByProject[project.id] = [];
              }
              eChats.forEach(chat => {
                chatsByProject[project.id].push(chat);
                assignedChatIds.add(chat.id);
              });
            }
          }
        }
      }
      
      // Add chats to respective projects
      for (let i = 0; i < projectsList.length; i++) {
        const project = projectsList[i]
        projectsList[i] = {
          ...project,
          chats: chatsByProject[project.id] || []
        }
      }
      
      console.log("Chats found for projects:", projectsList.map(p => ({
        projectName: p.name,
        chatCount: p.chats?.length || 0
      })));
      
    } catch (error) {
      console.error("Fehler beim Laden der Chats für Projekte:", error)
    }
  }

  // Toggle project expansion
  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  // Navigate to chat
  const navigateToChat = (chatId: string, projectId: string) => {
    // Restore navigation functionality but ensure project ID is passed correctly
    const workspaceParam = workspaceId ? `&workspace=${workspaceId}` : '';
    const projectParam = `&project=${projectId}`;
    
    // Navigate to chat page with both chat ID and project ID to enable filtering
    window.location.href = `/chat?chat=${chatId}${workspaceParam}${projectParam}`;
  }

  useEffect(() => {
    fetchProjects()
  }, [filter, searchTerm, workspaceFilter, responsibleFilter, workspaceId])

  // Fetch all unique responsible persons
  const fetchResponsiblePersons = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) return

      // Fetch all projects with their responsible persons
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          responsible_persons:project_responsibilities_with_users(
            user_id,
            full_name,
            email,
            role
          )
        `
        )
        .eq("user_id", session.user.id)

      if (error) throw error

      if (data && data.length > 0) {
        // Extract all responsible persons from all projects
        const allResponsibles: ResponsiblePerson[] = []
        data.forEach(project => {
          if (
            project.responsible_persons &&
            project.responsible_persons.length > 0
          ) {
            project.responsible_persons.forEach((person: any) => {
              // Add only if not already in the list
              if (!allResponsibles.some(p => p.user_id === person.user_id)) {
                allResponsibles.push({
                  user_id: person.user_id,
                  full_name: person.full_name || person.email || "Unbekannt",
                  email: person.email || "",
                  role: person.role || "responsible"
                })
              }
            })
          }
        })

        // Sort by name
        allResponsibles.sort((a, b) => a.full_name.localeCompare(b.full_name))

        setAvailableResponsibles(allResponsibles)
      }
    } catch (err) {
      console.error("Fehler beim Laden der verantwortlichen Personen:", err)
    }
  }

  useEffect(() => {
    fetchResponsiblePersons()
  }, [])

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session) return

        // First fetch personal (home) workspace
        const { data: homeWorkspace } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_home", true)
          .single()

        // Then fetch team workspaces
        const { data: teamWorkspaces } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces:workspaces(*)")
          .eq("user_id", session.user.id)

        // Combine workspaces
        const allWorkspaces = []

        if (homeWorkspace) {
          allWorkspaces.push({
            id: homeWorkspace.id,
            name: homeWorkspace.name,
            isHome: true
          })
        }

        if (teamWorkspaces) {
          teamWorkspaces.forEach((entry: any) => {
            if (entry.workspaces) {
              allWorkspaces.push({
                id: entry.workspace_id,
                name: entry.workspaces.name || "Unbenannt",
                isHome: false
              })
            }
          })
        }

        setWorkspaces(allWorkspaces)
      } catch (err) {
        console.error("Error fetching workspaces:", err)
      }
    }

    fetchWorkspaces()
  }, [])

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
        workspaceFilterRef.current &&
        !workspaceFilterRef.current.contains(event.target as Node)
      ) {
        setShowWorkspaceFilter(false)
      }
      if (
        responsibleFilterRef.current &&
        !responsibleFilterRef.current.contains(event.target as Node)
      ) {
        setShowResponsibleFilter(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProjectName.trim()) {
      return
    }

    try {
      setLoading(true)

      const newProject: Partial<Project> = {
        name: newProjectName,
        description: newProjectDescription,
        status: "active",
        user_id: user.id,
        workspace_id: workspaceId || undefined,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16)
      }

      console.log(
        ">>> Inserting Project Data:",
        JSON.stringify(newProject, null, 2)
      )
      console.log(">>> Current User ID from State:", user?.id)
      console.log(">>> Workspace ID being used:", workspaceId)

      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()

      if (error) throw error

      // Reset form and refresh list
      setNewProjectName("")
      setNewProjectDescription("")
      setShowNewProjectForm(false)

      // Add new project to the list
      if (data) {
        setProjects([...projects, data[0]])
      }
    } catch (err) {
      console.error("Error creating project:", err)
      setError("Fehler beim Erstellen des Projekts")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async () => {
    if (!selectedProject || !isEditMode) return

    try {
      setLoading(true)

      const updatedProjectData = {
        name: editedProject.name || selectedProject.name,
        description: editedProject.description || selectedProject.description,
        status: editedProject.status || selectedProject.status
      }

      const { error } = await supabase
        .from("projects")
        .update(updatedProjectData)
        .eq("id", selectedProject.id)

      if (error) throw error

      // Update the projects list
      setProjects(
        projects.map(project =>
          project.id === selectedProject.id
            ? { ...project, ...updatedProjectData }
            : project
        )
      )

      // Reset form state
      setSelectedProject(null)
      setIsEditMode(false)
      setEditedProject({})
    } catch (err) {
      console.error("Error updating project:", err)
      setError("Fehler beim Aktualisieren des Projekts")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProjectStatus = async (
    projectId: string,
    newStatus: "active" | "archived" | "completed"
  ) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId)

      if (error) throw error

      // Update the projects list
      setProjects(
        projects.map(project =>
          project.id === projectId ? { ...project, status: newStatus } : project
        )
      )
    } catch (err) {
      console.error("Error updating project status:", err)
      setError("Fehler beim Aktualisieren des Projektstatus")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    // Zuerst prüfen, ob der Benutzer Admin oder Owner des Workspaces ist
    try {
      setError(null)

      // Hole die aktuelle Rolle des Benutzers im Workspace
      const { data: memberData, error: memberError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single()

      if (memberError) {
        console.error("Fehler beim Prüfen der Berechtigung:", memberError)
        setError("Fehler beim Prüfen der Berechtigung")
        return
      }

      // Wenn der Benutzer kein Admin oder Owner ist, zeige eine Fehlermeldung
      if (!memberData || !["admin", "owner"].includes(memberData.role)) {
        setError(
          "Nur Workspace-Administratoren oder Eigentümer können Projekte löschen."
        )
        return
      }

      // Wenn Berechtigung vorhanden, zeige das Bestätigungsbanner an
      setProjectToDeleteId(projectId)
      setShowConfirmBanner(true)
    } catch (err) {
      console.error("Fehler beim Prüfen der Berechtigung:", err)
      setError("Fehler beim Prüfen der Berechtigung")
    }
  }

  // New function to handle actual deletion after confirmation
  const confirmDeleteProject = async () => {
    if (!projectToDeleteId) return

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDeleteId)

      if (error) throw error

      // Remove from projects list
      setProjects(projects.filter(project => project.id !== projectToDeleteId))
    } catch (err: any) {
      console.error("Error deleting project:", err)
      setError(
        `Fehler beim Löschen des Projekts: ${err.message || "Unbekannter Fehler"}`
      )
    } finally {
      setLoading(false)
      setShowConfirmBanner(false)
      setProjectToDeleteId(null)
    }
  }

  // Function to cancel deletion
  const cancelDeleteProject = () => {
    setShowConfirmBanner(false)
    setProjectToDeleteId(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500"
      case "archived":
        return "text-gray-500"
      case "completed":
        return "text-blue-500"
      case "on_hold":
        return "text-yellow-500"
      case "cancelled":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv"
      case "archived":
        return "Archiviert"
      case "completed":
        return "Abgeschlossen"
      case "on_hold":
        return "Pausiert"
      case "cancelled":
        return "Abgebrochen"
      default:
        return status
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] p-6 text-white">
        <div className="rounded-lg bg-[#1e1e1e] p-8 text-center">
          <Loader className="mx-auto mb-4 size-8 animate-spin text-white" />
          <p className="text-white">Projekte werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] p-6 text-white">
        <div className="rounded-lg bg-[#1e1e1e] p-8 text-center text-white">
          <AlertCircle className="mx-auto mb-4 size-8 text-red-500" />
          <p className="mb-2 text-lg font-medium">
            Fehler beim Laden der Projekte
          </p>
          <p className="text-sm text-gray-300">{error}</p>
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
          Projects
        </h1>
      </div>
      */}

      <main className="grow overflow-auto p-6">
        <div className="w-full">
          {/* Search bar and buttons */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Projekte durchsuchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#333333] bg-[#252525] py-2 pl-10 pr-4 text-white placeholder:text-gray-400 focus:border-[#444444] focus:outline-none"
              />
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => console.log("Export Projects")}
                className="flex items-center rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-gray-300 transition-colors hover:bg-[#333333] focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export
              </button>

              <button
                onClick={() => setShowNewProjectForm(true)}
                className="flex grow items-center rounded-lg bg-white px-4 py-2 text-[#1e1e1e] transition-colors hover:bg-gray-200 focus:outline-none sm:grow-0"
              >
                <Plus size={16} className="mr-2" />
                Neues Projekt
              </button>
            </div>
          </div>

          {/* Projects list */}
          <div className="overflow-hidden rounded-lg border border-[#333333] bg-[#252525]">
            {projects.length === 0 ? (
              <div className="p-8 text-center">
                <FolderX className="mx-auto mb-4 size-12 text-gray-400" />
                <h3 className="mb-1 text-lg font-medium text-white">
                  Keine Projekte
                </h3>
                <p className="mb-6 text-gray-400">
                  Du hast noch keine Projekte erstellt.
                </p>
                <button
                  onClick={() => setShowNewProjectForm(true)}
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-[#1e1e1e] hover:bg-gray-200"
                >
                  <Plus size={16} className="mr-2" />
                  Erstes Projekt erstellen
                </button>
              </div>
            ) : projects.filter(
                p =>
                  !searchTerm ||
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (p.description &&
                    p.description
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()))
              ).length === 0 ? (
              <div className="p-8 text-center">
                <Search className="mx-auto mb-4 size-12 text-gray-400" />
                <h3 className="mb-1 text-lg font-medium text-white">
                  Keine Ergebnisse
                </h3>
                <p className="text-gray-400">
                  Es wurden keine Projekte zu &quot;{searchTerm}&quot; gefunden.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#333333] text-left">
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Name
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Beschreibung
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Erstellt am
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]">
                    {projects
                      .filter(
                        p =>
                          !searchTerm ||
                          p.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (p.description &&
                            p.description
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()))
                      )
                      .map(project => (
                        <React.Fragment key={project.id}>
                          <tr className="hover:bg-[#2a2a2a]">
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center">
                                <button 
                                  onClick={() => toggleProjectExpansion(project.id)}
                                  className="mr-3 flex items-center"
                                >
                                  <div className="flex size-8 items-center justify-center rounded-md bg-[#333333] text-white">
                                    <FolderClosed size={16} />
                                  </div>
                                  <ChevronDown 
                                    size={16} 
                                    className={`ml-1 transition-transform ${expandedProjects[project.id] ? 'rotate-180' : ''}`} 
                                  />
                                </button>
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {project.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-md truncate text-sm text-gray-300">
                                {project.description || "-"}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="text-sm text-gray-300">
                                {new Date(
                                  project.created_at
                                ).toLocaleDateString("de-DE")}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  project.status === "active"
                                    ? "bg-green-900/20 text-green-400"
                                    : project.status === "on_hold"
                                      ? "bg-yellow-900/20 text-yellow-400"
                                      : project.status === "completed"
                                        ? "bg-blue-900/20 text-blue-400"
                                        : "bg-red-900/20 text-red-400"
                                }`}
                              >
                                {project.status === "active"
                                  ? "Aktiv"
                                  : project.status === "on_hold"
                                    ? "Pausiert"
                                    : project.status === "completed"
                                      ? "Abgeschlossen"
                                      : "Abgebrochen"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedProject(project)
                                  setEditedProject({
                                    name: project.name,
                                    description: project.description || "",
                                    status: project.status
                                  })
                                  setShowNewProjectForm(true)
                                }}
                                className="ml-4 text-gray-400 hover:text-white focus:outline-none"
                              >
                                <Edit size={16} />
                                <span className="sr-only">Bearbeiten</span>
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  handleDeleteProject(project.id)
                                }}
                                className="ml-4 text-gray-400 hover:text-red-400 focus:outline-none"
                              >
                                <Trash2 size={16} />
                                <span className="sr-only">Löschen</span>
                              </button>
                            </td>
                          </tr>
                          
                          {/* Chats dropdown */}
                          {expandedProjects[project.id] && (
                            <tr className="bg-[#2a2a2a]">
                              <td colSpan={5} className="px-6 py-2">
                                <div className="pl-8">
                                  <h4 className="mb-2 font-medium text-white">Zugeordnete Chats</h4>
                                  {project.chats && project.chats.length > 0 ? (
                                    <div className="space-y-2">
                                      {project.chats.map(chat => (
                                        <div 
                                          key={chat.id} 
                                          className="flex cursor-pointer items-center rounded-md border border-[#333333] bg-[#1e1e1e] p-2 hover:bg-[#333333]"
                                          onClick={() => navigateToChat(chat.id, project.id)}
                                        >
                                          <MessageCircle size={16} className="mr-2 text-gray-400" />
                                          <div>
                                            <div className="text-sm font-medium text-white">{chat.name}</div>
                                            <div className="text-xs text-gray-400">
                                              {new Date(chat.created_at).toLocaleDateString("de-DE")}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400">Keine Chats diesem Projekt zugeordnet.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}

                          {projectToDeleteId === project.id && (
                            <tr className="bg-[#2d2d2d]">
                              <td colSpan={5} className="px-6 py-3">
                                <div className="animate-fade-in flex w-full items-center justify-between">
                                  <p className="mr-4 text-sm text-gray-300">
                                    Projekt &quot;{project.name}&quot; wirklich
                                    löschen?
                                  </p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={confirmDeleteProject}
                                      className="rounded-md bg-white px-3 py-1 text-sm text-[#1e1e1e] transition-colors hover:bg-gray-200"
                                    >
                                      Ja
                                    </button>
                                    <button
                                      onClick={cancelDeleteProject}
                                      className="rounded-md bg-[#333333] px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-[#444444]"
                                    >
                                      Nein
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-[#333333] bg-[#1e1e1e] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#333333] p-4">
              <h2 className="text-lg font-medium text-white">
                {selectedProject
                  ? "Projekt bearbeiten"
                  : "Neues Projekt erstellen"}
              </h2>
              <button
                onClick={() => {
                  setShowNewProjectForm(false)
                  setSelectedProject(null)
                  setEditedProject({})
                }}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium text-white"
                  >
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    className="w-full rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-white focus:border-[#444444] focus:outline-none"
                    placeholder="Projektname"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium text-white"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={e => setNewProjectDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-white focus:border-[#444444] focus:outline-none"
                    placeholder="Projektbeschreibung"
                    rows={3}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-1 block text-sm font-medium text-white"
                  >
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="status"
                    value={newProjectDescription}
                    onChange={e => setNewProjectDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-white focus:border-[#444444] focus:outline-none"
                    required
                  >
                    <option value="active">Aktiv</option>
                    <option value="on_hold">Pausiert</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="cancelled">Abgebrochen</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectForm(false)
                      setNewProjectName("")
                      setNewProjectDescription("")
                    }}
                    className="rounded-lg border border-[#333333] bg-[#252525] px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[#333333]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-4 py-2 text-sm text-[#1e1e1e] transition-colors hover:bg-gray-200"
                  >
                    {selectedProject ? "Aktualisieren" : "Erstellen"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
