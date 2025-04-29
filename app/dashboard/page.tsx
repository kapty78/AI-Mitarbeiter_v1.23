"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { getSavedDomain, getSavedCompany } from "@/lib/domain-manager"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { fetchUserActivities } from "../lib/utils/supabase-fetch"
import { WorkspaceMemberManager } from "@/app/components/workspace-member-manager"
import {
  MessageCircle,
  User,
  Users,
  Settings,
  Clock,
  LogOut,
  Plus,
  BarChart2,
  Database,
  ArrowRightCircle,
  FileText,
  BookOpen,
  HelpCircle,
  Activity,
  Calendar,
  Award,
  Menu,
  Send,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw,
  Edit,
  Paperclip,
  Image as LucideImage,
  Search,
  MoreVertical,
  Trash,
  Layers,
  MoreHorizontal,
  PlusCircle,
  MessageSquare,
  FolderOpen,
  X,
  Bell,
  Star,
  Sparkles,
  UserPlus,
  Home,
  Zap,
  Check,
  ChevronUp
} from "lucide-react"
import dynamic from "next/dynamic"
import { UserManagement } from "@/app/components/admin/UserManagement"
import { Database as SupabaseDatabase } from "@/supabase/types"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { KnowledgeBaseSelector } from "@/components/knowledge/KnowledgeBaseSelector"
import KnowledgeComponentDashboard from "@/components/knowledge/KnowledgeComponentDashboard"

// Dynamically import the LiveDataComponent
const LiveDataComponent = dynamic(() => import("@/app/livedata/page"), {
  loading: () => (
    <div className="flex size-full items-center justify-center p-6">
      <div className="animate-pulse">Live Daten werden geladen...</div>
    </div>
  ),
  ssr: false
})

type DashboardStat = {
  label: string
  value: string | number
  change?: string
  increased?: boolean
}

type RecentActivity = {
  id: string
  type: string
  name: string
  date: string
  icon: React.ReactNode
  iconType?: string | null
  status?: string | null
  priority?: string | null
  content?: string
  chatId?: string
}

type Workspace = {
  id: string
  name: string
  description: string | null
  isHome?: boolean
  isTeam?: boolean
}

// Add type for Profile (adjust based on your actual columns)
type Profile = {
  id: string // Usually matches auth.users.id
  company_id?: string
  full_name?: string
  email?: string // You might fetch email from auth.users instead
}

// Add type for Message
type Message = {
  role: string;
  content: string;
  id?: string; // ID-Feld hinzugefügt
  // Weitere Felder je nach Bedarf
}

// --- Add localStorage functions for workspace ID ---
const saveSelectedWorkspaceId = (id: string) => {
  try {
    localStorage.setItem("selectedWorkspaceId", id)
  } catch (error) {
    console.error("Error saving workspace ID to localStorage:", error)
  }
}

const getSavedWorkspaceId = (): string | null => {
  try {
    return localStorage.getItem("selectedWorkspaceId")
  } catch (error) {
    console.error("Error reading workspace ID from localStorage:", error)
    return null
  }
}

const clearSavedWorkspaceId = () => {
  try {
    localStorage.removeItem("selectedWorkspaceId")
  } catch (error) {
    console.error("Error removing workspace ID from localStorage:", error)
  }
}
// --- End localStorage functions ---

// Lazy-Load der Komponenten
const ProjectsComponent = dynamic(
  () => import("@/app/components/projects/projects-component"),
  {
    loading: () => (
      <div className="flex size-full items-center justify-center p-6">
    <div className="animate-pulse">Projekte werden geladen...</div>
  </div>
    )
  }
)

const TasksComponent = dynamic(
  () => import("@/app/components/tasks/tasks-component"),
  {
    loading: () => (
      <div className="flex size-full items-center justify-center p-6">
    <div className="animate-pulse">Tasks werden geladen...</div>
  </div>
    )
  }
)

// Hinzufügen der Hilfsfunktion irgendwo im Gültigkeitsbereich der Dashboard-Komponente, z.B. direkt nach den Imports
function formatKnowledgeResultsForAI(results: any[]): string {
  if (!results || results.length === 0) return ""
  return results
    .slice(0, 3) // Top 3
    .map(
      (item, index) =>
        `Quelle ${index + 1} (${item.source_name || "Unbekannt"}):\n${item.content}`
    )
    .join("\n\n---\n\n")
}

// Dashboard Komponente Erweiterung mit Wissensstatistik
const KnowledgeStatistics = ({ userId, workspaceId }: { userId: string, workspaceId?: string }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalItems: 0,
    docTypes: {
      document: 0,
      webpage: 0,
      chat: 0,
      custom: 0
    },
    newItemsLastWeek: 0,
    mostSearchedTopics: []
  })
  const supabase = createClientComponentClient<SupabaseDatabase>()

  useEffect(() => {
    const fetchKnowledgeStats = async () => {
      try {
        setLoading(true)
        
        // 1. Gesamtzahl der Wissenseinträge
        const { count: totalItems, error: countError } = await supabase
          .from("knowledge_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
        
        if (countError) throw countError
        
        // 2. Anzahl nach Typen - Manuelles Aggregieren statt GROUP BY
        const { data: typeData, error: typeError } = await supabase
          .from("knowledge_items")
          .select("source_type")
          .eq("user_id", userId)
          
        if (typeError) throw typeError
        
        const docTypes = {
          document: 0,
          webpage: 0, 
          chat: 0,
          custom: 0
        }
        
        // Typdaten manuell gruppieren und zählen
        if (typeData) {
          typeData.forEach((item: { source_type: string }) => {
            const type = item.source_type
            if (type in docTypes) {
              docTypes[type as keyof typeof docTypes] += 1
            } else {
              docTypes.custom += 1
            }
          })
        }
        
        // 3. Neue Einträge in der letzten Woche
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        
        const { count: newItems, error: newItemsError } = await supabase
          .from("knowledge_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gt("created_at", lastWeek.toISOString())
          
        if (newItemsError) throw newItemsError
        
        setStats({
          totalItems: totalItems || 0,
          docTypes,
          newItemsLastWeek: newItems || 0,
          mostSearchedTopics: []
        })
        
      } catch (err) {
        console.error("Fehler beim Laden der Wissensstatistik:", err)
        setError("Fehler beim Laden der Wissensstatistik")
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchKnowledgeStats()
    }
  }, [userId, workspaceId, supabase])
  
  if (loading) {
    return (
      <div className="flex min-h-[200px] animate-pulse flex-col rounded-lg border border-gray-800 bg-[#1A1C1E] p-6">
        <div className="mb-4 h-6 w-1/3 rounded bg-gray-700"></div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-gray-700"></div>
          <div className="h-4 w-1/2 rounded bg-gray-700"></div>
          <div className="h-4 w-2/3 rounded bg-gray-700"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col rounded-lg border border-gray-800 bg-[#1A1C1E] p-6">
        <h2 className="mb-2 text-xl font-semibold text-white">Wissensstatistik</h2>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col rounded-lg border border-gray-800 bg-[#1A1C1E] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Wissensstatistik</h2>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-800 p-4">
          <h3 className="text-sm text-gray-400">Gesamte Einträge</h3>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.totalItems}</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-4">
          <h3 className="text-sm text-gray-400">Neue Einträge (7 Tage)</h3>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.newItemsLastWeek}</p>
        </div>
      </div>
      
      <h3 className="mb-2 font-medium text-white">Verteilung nach Quellen</h3>
      <div className="space-y-2">
        {Object.entries(stats.docTypes).map(([type, count]) => (
          <div key={type} className="flex items-center">
            <div className="w-32 text-gray-400">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div className="h-2 grow overflow-hidden rounded-full bg-gray-700">
              <div 
                className={`h-full ${
                  type === 'document' ? 'bg-blue-500' : 
                  type === 'webpage' ? 'bg-green-500' :
                  type === 'chat' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${stats.totalItems > 0 ? (count / stats.totalItems) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="w-12 text-right text-sm text-gray-400">{count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const urlWorkspaceId = searchParams.get("workspace")
  
  // Validate URL ID
  const validatedUrlWorkspaceId =
    urlWorkspaceId && urlWorkspaceId !== "null" ? urlWorkspaceId : null
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<DashboardStat[]>([
    { label: "Nachrichten", value: 0, change: "+0%", increased: true },
    { label: "Aufgaben", value: 0, change: "+0%", increased: true },
    { label: "Wissenseinträge", value: 0, change: "+0%", increased: true },
    { label: "Projekte", value: "0%", change: "+0%", increased: true }
  ])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  )
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("")
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [showWorkspacesDropdown, setShowWorkspacesDropdown] = useState(false)
  
  // State für das Einladungs-Dropdown
  const [showInviteDropdown, setShowInviteDropdown] = useState(false)
  const [invitableUsers, setInvitableUsers] = useState<Profile[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  
  // Ref für das Invite Dropdown
  const inviteDropdownRef = useRef<HTMLDivElement>(null)
  
  // Timer für Scroll-Drosselung
  const scrollTimerRef = useRef<number | null>(null)
  // Höherer Schwellenwert für bessere Kontrolle
  const scrollThreshold = 50
  
  // Scroll-Akkumulator für präziseres Scrolling
  const scrollAccumulator = useRef(0)
  // Letzte Scrollrichtung
  const lastScrollDirection = useRef<'up' | 'down' | null>(null)
  
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameWorkspaceId, setRenameWorkspaceId] = useState<string | null>(
    null
  )
  
  const [userProfile, setUserProfile] = useState<any>(null) // Profil mit company_id
  
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // Finde den aktuell ausgewählten Workspace im Array
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId)
  
  const [activeView, setActiveView] = useState<
    "dashboard" | "tasks" | "projects" | "knowledge" | "livedata"
  >("dashboard")
  
  // Knowledge base state - Hinzufügung für Wissensdatenbank-Zugriffsprüfung
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null)
  
  // Nötige Änderungen für das Popup-Verhalten
  const workspacesPopupRef = useRef<HTMLDivElement>(null)
  const [selectedListIndex, setSelectedListIndex] = useState<number>(0);
  
  useEffect(() => {
    // Scrolling des Body-Elements sperren/entsperren je nach Popup-Status
    if (showWorkspacesDropdown) {
      // Speichere die aktuelle Scroll-Position
      const scrollY = window.scrollY;
      
      // Verhindere Scrollen des Hintergrunds
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Scrolling wieder erlauben und zur ursprünglichen Position zurückkehren
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Scroll zur ursprünglichen Position zurückkehren
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    
    return () => {
      // Clean-up, falls die Komponente unmounted wird
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [showWorkspacesDropdown]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log("Dashboard: Starte Datenabruf...")
        
        // Check session
        console.log("Dashboard: Prüfe Session...")
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        console.log(
          "Dashboard: Session-Ergebnis:",
          session ? "Session vorhanden" : "Keine Session",
          sessionError ? `Fehler: ${sessionError.message}` : "Kein Fehler"
        )

        if (sessionError)
          throw new Error("Session error: " + sessionError.message)
        if (!session) {
          console.log(
            "Dashboard: Keine Session gefunden - bleibe auf der Seite zum Debuggen"
          )
          setError("Keine Anmeldesitzung gefunden. Bitte melde dich an.")
          return
        }
        
        setUser(session.user)
        console.log("Dashboard: Benutzer gesetzt:", session.user.email)
        
        // Benutzerprofil mit company_id laden
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*") // Alle Profilfelder inkl. company_id
            .eq("id", session.user.id)
            .single()
            
          if (profileError) {
            console.error(
              "Fehler beim Laden des Benutzerprofils:",
              profileError
            )
          } else if (profileData) {
            console.log(
              "Benutzerprofil geladen:",
              profileData.id,
              "Company ID:",
              profileData.company_id
            )
            setUserProfile(profileData)
          }
        } catch (profileErr) {
          console.error(
            "Unerwarteter Fehler beim Laden des Profils:",
            profileErr
          )
        }
        
        // Prüfen ob der Benutzer ein Admin ist
        const company = getSavedCompany()
        if (company) {
          try {
            // Option 1: Versuchen über RLS
            const { data: adminCheck, error: adminCheckError } = await supabase
              .from("company_admins")
              .select("*")
              .eq("company_id", company.id)
              .eq("user_id", session.user.id)
              .maybeSingle()
              
            if (!adminCheckError) {
              setIsAdmin(!!adminCheck)
            } else {
              console.warn(
                "Fehler bei Admin-Check via RLS, versuche alternative Methode:",
                adminCheckError
              )
              
              // Option 2: Direkter API-Aufruf mit service key
              try {
                // Wir prüfen in den Metadaten des Users, ob er ein Admin ist
                const { data: userData, error: userError } =
                  await supabase.auth.getUser()
                if (userData?.user?.user_metadata?.role === "admin") {
                  console.log("Admin-Status über Benutzer-Metadaten gefunden")
                  setIsAdmin(true)
                } else {
                  console.log("Kein Admin-Status in Benutzer-Metadaten")
                  setIsAdmin(false)
                }
              } catch (e) {
                console.error("Fehler bei alternativer Admin-Prüfung:", e)
                setIsAdmin(false)
              }
            }
          } catch (e) {
            console.error("Fehler bei Admin-Prüfung:", e)
            setIsAdmin(false)
          }
        }
        
        // Load all workspaces for the user
        try {
          // First fetch personal (home) workspace
          console.log("DEBUG: Versuche Workspace-Struktur zu bestimmen...")
          const { data: wsStructure, error: wsStructureError } = await supabase
            .from("workspaces")
            .select("*")
            .limit(1)

          console.log(
            "Workspace-Struktur:",
            wsStructure ? Object.keys(wsStructure[0] || {}) : "Keine Daten",
            wsStructureError
          )

          // Versuche, Home-Workspace zu laden (ohne user_id)
          const { data: homeWorkspace, error: homeError } = await supabase
            .from("workspaces")
            .select("*")
            .eq("is_home", true)
            .limit(1)
            .maybeSingle()
          
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
              name: homeWorkspace.name || "Persönlich",
              description: homeWorkspace.description,
              isHome: true
            })
          }
          
          // Add team workspaces
          if (teamWorkspaces) {
            teamWorkspaces.forEach(entry => {
              // Explicitly check if entry.workspaces exists and is an object
              if (
                entry.workspaces &&
                typeof entry.workspaces === "object" &&
                !Array.isArray(entry.workspaces)
              ) {
                // Cast to Workspace type to resolve linter error
                const wsData = entry.workspaces as Workspace
                allWorkspaces.push({
                  id: entry.workspace_id,
                  name: wsData.name ?? "Unnamed Workspace", // Use nullish coalescing
                  description: wsData.description ?? "", // Use nullish coalescing
                  isHome: false
                })
              }
            })
          }
          
          setWorkspaces(allWorkspaces)
          
          // --- Determine Initial Workspace ID --- 
          let initialWorkspaceId: string | null = null
          const savedWorkspaceId = getSavedWorkspaceId()
          
          if (validatedUrlWorkspaceId) {
            // 1. Priority: URL Parameter
            initialWorkspaceId = validatedUrlWorkspaceId
            console.log("Workspace ID from URL:", initialWorkspaceId)
          } else if (
            savedWorkspaceId &&
            allWorkspaces.some(ws => ws.id === savedWorkspaceId)
          ) {
            // 2. Priority: localStorage (if valid)
            initialWorkspaceId = savedWorkspaceId
            console.log("Workspace ID from localStorage:", initialWorkspaceId)
            // Update URL to reflect the loaded workspace without causing a full reload
            router.replace(`/dashboard?workspace=${initialWorkspaceId}`, {
              scroll: false
            })
          } else if (allWorkspaces.length > 0) {
            // 3. Priority: Default (Home or first)
            const homeWs = allWorkspaces.find(ws => ws.isHome)
            initialWorkspaceId = homeWs ? homeWs.id : allWorkspaces[0].id
            console.log("Workspace ID from default logic:", initialWorkspaceId)
            // Update URL
            router.replace(`/dashboard?workspace=${initialWorkspaceId}`, {
              scroll: false
            })
          } else {
            console.log("Keine Workspaces gefunden, Workspace ID bleibt null.")
          }
          // --- End Determine Initial Workspace ID ---

          if (initialWorkspaceId) {
            setSelectedWorkspaceId(initialWorkspaceId)
            saveSelectedWorkspaceId(initialWorkspaceId) 
            console.log("Selected Workspace ID set to:", initialWorkspaceId)

              // Load the actual workspace data based on the determined ID
              try {
                const { data: wsData, error: wsError } = await supabase
                  .from("workspaces")
                  .select("*")
                  .eq("id", initialWorkspaceId)
                  .single()
                
                if (wsError) {
                  console.error("Fehler beim Laden des Workspace:", wsError)
                  setWorkspace(null) 
                } else if (wsData) {
                  setWorkspace(wsData)
                }
              } catch (err) {
                console.error("Fehler beim Laden des Workspace:", err)
                setWorkspace(null)
              }
          } else {
            setSelectedWorkspaceId(null)
            setWorkspace(null)
            setError("Kein gültiger Workspace konnte geladen werden.")
          }

          // Load activities based on the selected workspace (moved stats fetching)
          if (initialWorkspaceId && session) {
             const activities = await fetchUserActivities(session.user.id, initialWorkspaceId, 5) // Limit auf 5 geändert
             setRecentActivities(activities) 
          }
        } catch (wsError) {
          console.error("Fehler beim Laden der Workspaces:", wsError)
        }

        // ---- STATISTIKEN UND AKTIVITÄTEN ABFRAGEN WURDE VERSCHOBEN ----

      } catch (err: any) {
        console.error("Dashboard error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
        console.log("Dashboard: Initialer Ladevorgang abgeschlossen")
      }
    }
    
    fetchData()
  }, [supabase, router, validatedUrlWorkspaceId]) // Abhängigkeiten für initiales Laden

  // *** NEUER useEffect Hook NUR für Statistiken ***
  useEffect(() => {
    const fetchStats = async () => {
      // Stelle sicher, dass User und Workspace ID vorhanden sind
      if (!user || !selectedWorkspaceId) {
        console.log("Überspringe Statistikabruf: User oder Workspace ID fehlt.")
        // Optional: Reset stats to default/zero state if needed
        // setStats([...initial default stats object...]); 
        return;
      }
      
      console.log(`Starte Statistikabruf für Workspace: ${selectedWorkspaceId}`)
      
      try {
        // Zeiträume für Statistikauswertung
        const now = new Date()
        const currentPeriodStart = new Date(now)
        currentPeriodStart.setDate(now.getDate() - 7)
        const currentPeriodStartStr = currentPeriodStart.toISOString()
        const previousPeriodStart = new Date(currentPeriodStart)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
        const previousPeriodStartStr = previousPeriodStart.toISOString()
        
        // Temporäre Statistik-Variable
        let newStats = [
          { label: "Nachrichten", value: 0, change: "+0%", increased: true },
          { label: "Aufgaben", value: 0, change: "+0%", increased: true },
          { label: "Wissenseinträge", value: 0, change: "+0%", increased: true },
          { label: "Projekte", value: 0, change: "+0%", increased: true }
        ];
        
        // 1. Nachrichtenstatistik
        try {
          const { data: currentMessages, error: currentMsgError } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact" })
            .eq("user_id", user.id)
            .gte("created_at", currentPeriodStartStr)
          
          const { data: previousMessages, error: previousMsgError } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact" })
            .eq("user_id", user.id)
            .gte("created_at", previousPeriodStartStr)
            .lt("created_at", currentPeriodStartStr)
          
          if (!currentMsgError && !previousMsgError) {
            const currentCount = currentMessages?.length || 0
            const previousCount = previousMessages?.length || 0
            let percentChange = 0
            if (previousCount > 0) {
              percentChange = Math.round(((currentCount - previousCount) / previousCount) * 100)
            } else if (currentCount > 0) {
              percentChange = 100
            }
            newStats = newStats.map(stat => stat.label === "Nachrichten" ? { ...stat, value: currentCount, change: `${percentChange >= 0 ? "+" : ""}${percentChange}%`, increased: percentChange >= 0 } : stat)
          } else {
             console.error("Fehler Nachrichtenstatistik:", currentMsgError || previousMsgError)
          }
        } catch (e) { console.error("Fehler Nachrichtenstatistik Catch:", e) }

        // 2. Aufgabenstatistik
        try {
          const { data: tasksData, error: tasksCountError } = await supabase
            .from("tasks")
            .select("id, status", { count: "exact" })
            .eq("workspace_id", selectedWorkspaceId)
            
          if (!tasksCountError && tasksData) {
            const totalTasks = tasksData.length
            const { data: previousTasksData, error: prevTasksError } = await supabase
              .from("tasks")
              .select("id", { count: "exact" })
              .eq("workspace_id", selectedWorkspaceId)
              .gte("created_at", previousPeriodStartStr)
              .lt("created_at", currentPeriodStartStr)
              
            let percentChangeTask = 0
            const previousTasksCount = previousTasksData?.length || 0
            if (previousTasksCount > 0) {
              percentChangeTask = Math.round(((totalTasks - previousTasksCount) / previousTasksCount) * 100)
            } else if (totalTasks > 0) {
              percentChangeTask = 100
            }
            newStats = newStats.map(stat => stat.label === "Aufgaben" ? { ...stat, value: totalTasks, change: `${percentChangeTask >= 0 ? "+" : ""}${percentChangeTask}%`, increased: percentChangeTask >= 0 } : stat)
          } else {
            console.error("Fehler Aufgabenstatistik:", tasksCountError)
          }
        } catch (e) { console.error("Fehler Aufgabenstatistik Catch:", e) }

        // 3. Wissenseinträge Statistik (jetzt Message Embeddings)
        try {
           // Zähle Message Embeddings, RLS sollte User-Filterung übernehmen
           const { count: embeddingsCount, error: embeddingsError } = await supabase
             .from("message_embeddings")
             .select("id", { count: "exact", head: true })
             // Kein expliziter user_id Filter hier, Annahme: RLS greift
            
           if (!embeddingsError && embeddingsCount !== null) {
             // Vergleich mit vorheriger Periode vorerst vereinfacht
             newStats = newStats.map(stat => stat.label === "Wissenseinträge" ? { ...stat, value: embeddingsCount, change: "+0%", increased: true } : stat)
           } else {
            console.error("Fehler Message Embeddings Statistik:", embeddingsError)
            // Setze auf 0 bei Fehler
             newStats = newStats.map(stat => stat.label === "Wissenseinträge" ? { ...stat, value: 0, change: "+0%", increased: false } : stat)
           }
        } catch (e) { console.error("Fehler Message Embeddings Statistik Catch:", e) }
        
        // 4. Projektestatistik
        try {
          const { data: projectsData, error: projectsError } = await supabase
            .from("projects")
            .select("id, status")
            .eq("workspace_id", selectedWorkspaceId)
          
          if (!projectsError && projectsData) {
            const totalProjects = projectsData.length
            const { data: previousProjectsData, error: prevProjectsError } = await supabase
              .from("projects")
              .select("id", { count: "exact" })
              .eq("workspace_id", selectedWorkspaceId)
              .gte("created_at", previousPeriodStartStr)
              .lt("created_at", currentPeriodStartStr)
              
            let percentChangeProjects = 0
            const previousProjectsCount = previousProjectsData?.length || 0
            if (previousProjectsCount > 0) {
              percentChangeProjects = Math.round(((totalProjects - previousProjectsCount) / previousProjectsCount) * 100)
            } else if (totalProjects > 0) {
              percentChangeProjects = 100
            }
            newStats = newStats.map(stat => stat.label === "Projekte" ? { ...stat, value: totalProjects, change: `${percentChangeProjects >= 0 ? "+" : ""}${percentChangeProjects}%`, increased: percentChangeProjects >= 0 } : stat)
          } else {
            console.error("Fehler Projektestatistik:", projectsError)
          }
        } catch (e) { console.error("Fehler Projektestatistik Catch:", e) }
        
        // Finales Setzen des Statistik-States
        setStats(newStats)
        console.log("Statistiken erfolgreich aktualisiert.", newStats) 
        
      } catch (statsError) {
        console.error("Fehler beim Laden der Statistiken im separaten Hook:", statsError)
        // Optional: Set error state for stats
      }
    }

    fetchStats() 
  }, [selectedWorkspaceId, user, supabase]) // Abhängigkeiten NUR für Statistiken
  
  // Create a new workspace
  const createWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true)
      
      const { data, error } = await supabase
        .from("workspaces")
        .insert({
          name: newWorkspaceName,
          description: newWorkspaceDescription,
          user_id: user.id,
          is_home: false
        })
        .select()
      
      if (error) {
        console.error("Error creating workspace:", error)
        setError(`Fehler beim Erstellen des Workspaces: ${error.message}`)
        return
      }
      
      // Füge den Benutzer als Mitglied des Workspaces hinzu
      if (data && data[0]) {
        const { error: memberError } = await supabase
          .from("workspace_members")
          .insert({
            workspace_id: data[0].id,
            user_id: user.id,
            role: "owner"
          })
        
        if (memberError) {
          console.error("Error adding user to workspace members:", memberError)
          setError(
            `Fehler beim Hinzufügen zur Mitgliederliste: ${memberError.message}`
          )
          return
        }
        
        // Logge die Aktivität
        try {
          const { error: activityError } = await supabase
            .from("user_activities")
            .insert({
              user_id: user.id,
              activity_type: "workspace_created",
              details: { 
                workspace_id: data[0].id,
                workspace_name: newWorkspaceName
              }
            })
          
          if (activityError) {
            console.error(
              "Fehler beim Loggen der Workspace-Erstellung:",
              activityError
            )
            // Optional: Fehler dem Benutzer anzeigen, aber nicht den Prozess blockieren
          }
        } catch (logError) {
          console.error("Unerwarteter Fehler beim Loggen:", logError)
        }
      }
      
      // Lade die Daten neu, um die Workspace-Liste zu aktualisieren
      await fetchData()
      
      // Close modal and reset form
      setShowWorkspaceModal(false)
      setNewWorkspaceName("")
      setNewWorkspaceDescription("")
        
        // Switch to the new workspace
        setSelectedWorkspaceId(data[0].id)
      const currentPath = window.location.pathname
      const newUrl = data[0].id
        ? `${currentPath}?workspace=${data[0].id}`
        : currentPath
      window.location.href = newUrl
    } catch (err) {
      console.error("Error in createWorkspace:", err)
      setError("Es ist ein Fehler beim Erstellen des Workspaces aufgetreten.")
    } finally {
      setIsCreatingWorkspace(false)
    }
  }
  
  // Funktion zum Neuladen der Daten
  const fetchData = async () => {
    try {
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspace_members")
        .select(
          `
          workspace_id,
          workspaces (
            id,
            name,
            description,
            is_home
          )
        `
        )
        .eq("user_id", user.id)
      
      if (workspaceError) {
        console.error("Error fetching workspace data:", workspaceError)
        return
      }
      
      if (workspaceData) {
        // Transformiere die Daten in das Workspace-Format und entferne Duplikate
        const workspaceMap = new Map() // Verwenden Sie eine Map zur Deduplizierung
        
        workspaceData.forEach((entry: any) => {
          if (entry.workspaces && entry.workspace_id) {
            workspaceMap.set(entry.workspace_id, {
              id: entry.workspace_id,
              name: entry.workspaces.name,
              description: entry.workspaces.description || "",
              isHome: entry.workspaces.is_home || false
            })
          }
        })
        
        // Map in ein Array umwandeln
        const transformedWorkspaces: Workspace[] = Array.from(
          workspaceMap.values()
        )
        
        setWorkspaces(transformedWorkspaces)
      }
    } catch (err) {
      console.error("Error in fetchData:", err)
    }
  }
  
  // Funktion zum Wechseln des Workspaces
  const handleWorkspaceSwitch = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId)
    const currentPath = window.location.pathname
    const newUrl = workspaceId
      ? `${currentPath}?workspace=${workspaceId}`
      : currentPath
    window.location.href = newUrl
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("selectedDomain")
    localStorage.removeItem("selectedCompany")
    clearSavedWorkspaceId()
    router.push("/login")
  }
  
  // Toggle Workspaces dropdown
  const toggleWorkspacesDropdown = () => {
    if (!showWorkspacesDropdown) {
      // Wenn wir das Popup öffnen, setze den Index auf den aktuellen Workspace
      const currentIndex = workspaces.findIndex(w => w.id === selectedWorkspaceId);
      setSelectedListIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      // Wenn wir das Popup schließen, den Fokus entfernen
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    }
    setShowWorkspacesDropdown(prev => !prev)
  }
  
  // Keyboard Navigation für Workspace-Selector
  const handleWorkspaceKeyDown = (e: React.KeyboardEvent) => {
    if (!showWorkspacesDropdown) return;

    const uniqueWorkspaces = Array.from(
      new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
    );

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedListIndex(prev => 
          prev > 0 ? prev - 1 : uniqueWorkspaces.length - 1
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedListIndex(prev => 
          prev < uniqueWorkspaces.length - 1 ? prev + 1 : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (uniqueWorkspaces[selectedListIndex]) {
          handleWorkspaceSwitch(uniqueWorkspaces[selectedListIndex].id);
          setShowWorkspacesDropdown(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowWorkspacesDropdown(false);
        break;
    }
  };

  // Render workspace dropdown items
  const renderWorkspaceItems = () => {
    if (!showWorkspacesDropdown) return null;
    
    const uniqueWorkspaces = Array.from(
      new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
    );
    
    if (uniqueWorkspaces.length === 0) {
      return (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70"
          onClick={() => setShowWorkspacesDropdown(false)}
        >
          <div 
            className="text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Keine Workspaces gefunden
          </div>
        </div>
      );
    }
    
    // Stelle sicher, dass selectedListIndex innerhalb der gültigen Grenzen ist
    const safeSelectedIndex = Math.max(0, Math.min(selectedListIndex, uniqueWorkspaces.length - 1));
    
    // Für den Kreislauf-Effekt: Nur ein Element vor und nach dem ausgewählten anzeigen
    const prevIndex = (safeSelectedIndex - 1 + uniqueWorkspaces.length) % uniqueWorkspaces.length;
    const nextIndex = (safeSelectedIndex + 1) % uniqueWorkspaces.length;
    
    // Wir zeigen maximal 3 Workspaces gleichzeitig: vorherigen, aktuellen und nächsten
    const visibleItems = [
      {
        workspace: uniqueWorkspaces[prevIndex],
        position: -60, // 60px nach oben
        opacity: 0.4,
        scale: 0.9,
        blur: 'blur-[1px]',
        index: prevIndex
      },
      {
        workspace: uniqueWorkspaces[safeSelectedIndex],
        position: 0, // Zentriert
        opacity: 1,
        scale: 1,
        blur: '',
        index: safeSelectedIndex
      },
      {
        workspace: uniqueWorkspaces[nextIndex],
        position: 60, // 60px nach unten
        opacity: 0.4,
        scale: 0.9,
        blur: 'blur-[1px]',
        index: nextIndex
      }
    ];

    return (
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70"
        onClick={() => setShowWorkspacesDropdown(false)}
        onKeyDown={handleWorkspaceKeyDown}
        tabIndex={0}
        ref={workspacesPopupRef}
        style={{ outline: 'none' }}
      >
        <div 
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => {
            e.preventDefault();
            
            // Aktuelle Scrollrichtung bestimmen
            const currentDirection = e.deltaY > 0 ? 'down' : 'up';
            
            // Bei Richtungswechsel den Akkumulator zurücksetzen
            if (lastScrollDirection.current !== null && 
                lastScrollDirection.current !== currentDirection) {
              scrollAccumulator.current = 0;
            }
            
            // Aktuelle Richtung speichern
            lastScrollDirection.current = currentDirection;
            
            // Scroll-Wert akkumulieren
            scrollAccumulator.current += e.deltaY;
            
            // Nur reagieren, wenn kein Timer aktiv ist und Schwellenwert überschritten
            if (scrollTimerRef.current === null) {
              if (Math.abs(scrollAccumulator.current) > scrollThreshold) {
                const uniqueWorkspaces = Array.from(
                  new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
                );
                
                // Richtung anhand des akkumulierten Werts bestimmen
                if (scrollAccumulator.current > 0) {
                  // Nach unten scrollen
                  setSelectedListIndex(prev => 
                    prev < uniqueWorkspaces.length - 1 ? prev + 1 : 0
                  );
                } else {
                  // Nach oben scrollen
                  setSelectedListIndex(prev => 
                    prev > 0 ? prev - 1 : uniqueWorkspaces.length - 1
                  );
                }
                
                // Akkumulator und Richtung zurücksetzen nach Aktion
                scrollAccumulator.current = 0;
                
                // Timer setzen für kontrolliertes Scrollen
                scrollTimerRef.current = window.setTimeout(() => {
                  scrollTimerRef.current = null;
                }, 400);
              }
            }
          }}
        >
          {/* Pfeil-oben Indikator */}
          <div className="absolute inset-x-0 -top-12 flex justify-center text-white">
            <ChevronUp 
              size={32} 
              className="animate-pulse cursor-pointer hover:text-white/70"
              onClick={(e) => {
                e.stopPropagation();
                const uniqueWorkspaces = Array.from(
                  new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
                );
                setSelectedListIndex(prev => 
                  prev > 0 ? prev - 1 : uniqueWorkspaces.length - 1
                );
              }}
            />
          </div>
          
          {/* Zentrierter Container für die Elemente */}
          <div className="flex h-[300px] items-center justify-center">
            {/* Fixe Höhe für die sichtbaren Elemente */}
            <div className="relative h-[260px] w-[380px] overflow-visible">
              {/* Aktive Auswahl-Indikator wurde entfernt */}
              
              {visibleItems.map((item) => (
                <div
                  key={`workspace-${item.workspace.id}`}
                  className={`absolute inset-x-0 transform-gpu transition-all duration-300 ease-out ${item.blur}`}
                  style={{ 
                    transform: `translateY(${item.position + 130}px) scale(${item.scale})`,
                    opacity: item.opacity,
                    zIndex: item.position === 0 ? 30 : 20
                  }}
                >
                  <button
                    className={`mx-auto flex w-[320px] items-center justify-center rounded-full px-6 py-4 text-center text-xl font-medium transition-colors ${
                      item.position === 0
                        ? 'bg-white text-[#1e1e1e]'
                        : 'text-white hover:bg-white/10'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Verhindere Bubble-Up des Klick-Events
                      if (item.position === 0) {
                        handleWorkspaceSwitch(item.workspace.id);
                        setShowWorkspacesDropdown(false);
                      } else {
                        setSelectedListIndex(item.index);
                      }
                    }}
                  >
                    {item.workspace.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pfeil-unten Indikator */}
          <div className="absolute inset-x-0 -bottom-20 flex justify-center text-white">
            <ChevronDown 
              size={32} 
              className="animate-pulse cursor-pointer hover:text-white/70"
              onClick={(e) => {
                e.stopPropagation();
                const uniqueWorkspaces = Array.from(
                  new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
                );
                setSelectedListIndex(prev => 
                  prev < uniqueWorkspaces.length - 1 ? prev + 1 : 0
                );
              }}
            />
          </div>
        </div>
        
        {/* Escape-Hinweis */}
        <div 
          className="absolute inset-x-0 bottom-12 text-center text-sm text-white/60"
          onClick={(e) => e.stopPropagation()}
        >
          ESC zum Schließen
        </div>
      </div>
    );
  };
  
  // Funktion zum Laden der einladbaren Benutzer
  const loadInvitableUsers = async () => {
    if (!selectedWorkspaceId || !user) return

    setInviteLoading(true)
    setInviteError(null)
    setInvitableUsers([])

    try {
      // 1. Profil des aktuellen Benutzers holen, um company_id zu bekommen
      const { data: currentUserProfile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (profileError || !currentUserProfile?.company_id) {
        throw new Error("Firmenzugehörigkeit konnte nicht ermittelt werden.")
      }
      const companyId = currentUserProfile.company_id

      // 2. Alle Benutzer der gleichen Firma holen
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from("profiles")
        .select("id, full_name") // Nur benötigte Felder holen
        .eq("company_id", companyId)

      if (companyUsersError) {
        throw new Error("Fehler beim Laden der Firmenbenutzer.")
      }

      // 3. Mitglieder des aktuellen Workspaces holen
      const { data: workspaceMembers, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", selectedWorkspaceId)

      if (membersError) {
        throw new Error("Fehler beim Laden der Workspace-Mitglieder.")
      }
      const memberIds = new Set(workspaceMembers?.map(m => m.user_id) || [])

      // 4. Filtern: Nur Firmenbenutzer, die nicht der aktuelle User sind UND nicht schon Mitglied sind
      const eligibleUsers =
        companyUsers?.filter(u => u.id !== user.id && !memberIds.has(u.id)) ||
        []

      setInvitableUsers(eligibleUsers)
    } catch (err: any) {
      console.error("Error loading invitable users:", err)
      setInviteError(
        err.message || "Benutzerliste konnte nicht geladen werden."
      )
    } finally {
      setInviteLoading(false)
    }
  }
  
  // Funktion zum Einladen eines Benutzers (ruft RPC auf)
  const handleInviteUser = async (inviteeUserId: string) => {
    if (!selectedWorkspaceId) return
     
    setInviteLoading(true) // Optional: Loading state während des Einladens
    setInviteError(null)
     
     try {
      const { error } = await supabase.rpc("add_workspace_member", {
         invitee_user_id: inviteeUserId,
         target_workspace_id: selectedWorkspaceId
      })
       
       if (error) {
        throw error
       }
       
       // Erfolg! Dropdown schließen und ggf. Benutzerliste neu laden oder UI aktualisieren
      setShowInviteDropdown(false)
      alert("Benutzer erfolgreich eingeladen!") // Einfache Bestätigung
       // Optional: loadInvitableUsers(); // Liste neu laden, um eingeladenen User zu entfernen
     } catch (err: any) {
      console.error("Error inviting user:", err)
      setInviteError(`Einladung fehlgeschlagen: ${err.message}`)
       // Fehler im Dropdown anzeigen lassen, damit User es erneut versuchen kann
     } finally {
      setInviteLoading(false)
     }
  }
  
  // Add click outside handler für Workspace-Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inviteDropdownRef.current &&
        !inviteDropdownRef.current.contains(event.target as Node)
      ) {
        setShowInviteDropdown(false)
      }
      
      // Workspace-Dropdown nur schließen, wenn außerhalb geklickt wird und nicht auf den Trigger
      if (
        workspacesPopupRef.current &&
        !workspacesPopupRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.workspace-dropdown-trigger')
      ) {
        setShowWorkspacesDropdown(false)
      }
    }
    
    // Keyboard-Event für Pfeiltasten
    function handleKeyDown(event: KeyboardEvent) {
      if (showWorkspacesDropdown) {
        const uniqueWorkspaces = Array.from(
          new Map(workspaces.map(workspace => [workspace.id, workspace])).values()
        );
        
        if (event.key === 'ArrowUp') {
          setSelectedListIndex(prev => 
            prev > 0 ? prev - 1 : uniqueWorkspaces.length - 1
          );
        } else if (event.key === 'ArrowDown') {
          setSelectedListIndex(prev => 
            prev < uniqueWorkspaces.length - 1 ? prev + 1 : 0  
          );
        } else if (event.key === 'Enter' && uniqueWorkspaces[selectedListIndex]) {
          handleWorkspaceSwitch(uniqueWorkspaces[selectedListIndex].id);
          setShowWorkspacesDropdown(false);
        } else if (event.key === 'Escape') {
          setShowWorkspacesDropdown(false);
        }
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showWorkspacesDropdown, selectedListIndex, workspaces, selectedWorkspaceId])
  
  // --- Update any function that CHANGES the selected workspace --- 
  // Example: If you have a dropdown or button to switch workspaces
  const handleWorkspaceChange = (newWorkspaceId: string) => {
    if (newWorkspaceId !== selectedWorkspaceId) {
      setSelectedWorkspaceId(newWorkspaceId)
      saveSelectedWorkspaceId(newWorkspaceId)
       // Update the URL bar
      router.push(`/dashboard?workspace=${newWorkspaceId}`)
       // Optionally reload stats/activities here or let useEffect handle it if deps change
      setWorkspace(workspaces.find(w => w.id === newWorkspaceId))
       // Reload activities etc. - Ensure ONLY user ID is passed
      fetchUserActivities(user.id).then(setRecentActivities)
    }
  }
  
  // Function to handle workspace rename
  const handleRenameWorkspace = async () => {
    if (!renameWorkspaceId || !newWorkspaceName.trim()) return
    
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: newWorkspaceName.trim() })
        .eq("id", renameWorkspaceId)
      
      if (error) throw error
      
      // Update the workspace list
      setWorkspaces(prev => 
        prev.map(ws => 
          ws.id === renameWorkspaceId 
            ? { ...ws, name: newWorkspaceName.trim() } 
            : ws
        )
      )
      
      // Update the current workspace if it's the one being renamed
      if (workspace && workspace.id === renameWorkspaceId) {
        setWorkspace({ ...workspace, name: newWorkspaceName.trim() })
      }
      
      // Close modal and reset state
      setShowRenameModal(false)
      setRenameWorkspaceId(null)
      setNewWorkspaceName("")
    } catch (err: any) {
      console.error("Error renaming workspace:", err)
      alert(`Fehler beim Umbenennen: ${err.message}`)
    }
  }
  
  // Navigation Handler
  const handleNavigation = (
    view: "dashboard" | "tasks" | "projects" | "knowledge" | "livedata"
  ) => {
    setActiveView(view)
  }

  // Haupt-Funktion zum Senden einer Nachricht an die API
  const sendMessageToAPI = async (
    messages: Message[],
    model: string,
    chatId: string
  ) => {
    console.log(`🔄 sendMessageToAPI aufgerufen mit Chat-ID: ${chatId}`)

    const userId = user?.id
    if (!userId) {
      console.error("❌ User ID fehlt beim Senden an API.")
      throw new Error("User ID ist erforderlich")
    }

    // Benutzerprofil holen (existing)
    // ...

    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")

    // --- Variablen für zusätzlichen Kontext --- (Stelle sicher, dass knowledgeResults hier ist)
    let similarMessages: any[] = []
    let knowledgeResults: any[] = []

    if (lastUserMessage) {
      const currentMessageId = lastUserMessage.id || null
      const userQuery = lastUserMessage.content

      // --- Suche nach ähnlichen vergangenen Nachrichten (AUSKOMMENTIERT/PLATZHALTER) ---
      try {
        console.log(
          ` Suche nach User-weiten Kontext (ÜBERSPRUNGEN): ${userQuery.substring(0, 50)}...`
        )
        // similarMessages = await findSimilarMessagesOptimized(userId, userQuery, currentMessageId) || []; // TEMPORÄR AUSKOMMENTIERT
        console.log(`✅ Suche nach ähnlichen Nachrichten übersprungen.`)
      } catch (error) {
        console.error(
          "❌ Fehler bei der (auskommentierten) Suche nach ähnlichen Nachrichten:",
          error
        )
      }
      // --- Ende Ähnlichkeitssuche ---

      // --- Wissensdatenbank-Suche (NEU) ---
      try {
        console.log("🧠 Performing knowledge base search...")
        // Hole Auth-Token für den API-Aufruf
        const { data: authData } = await supabase.auth.getSession()
        const authToken = authData?.session?.access_token

        const knowledgeResponse = await fetch("/api/knowledge/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: userQuery,
            knowledge_base_id: selectedKnowledgeBaseId, // Übergebe die ausgewählte KB-ID
            auth_token: authToken // Auth-Token für Berechtigungsprüfung
          })
        })
        if (knowledgeResponse.ok) {
          const knowledgeData = await knowledgeResponse.json()
          knowledgeResults = knowledgeData.results || []
          console.log(`🧠 Found ${knowledgeResults.length} knowledge items.`)
        } else {
          console.error(
            "⚠️ Knowledge base search failed:",
            knowledgeResponse.statusText
          )
        }
      } catch (knowledgeError) {
        console.error(
          "❌ Error during knowledge base search fetch:",
          knowledgeError
        )
      }
      // --- Ende Wissensdatenbank-Suche ---

      // Build the context for the API call
      const apiMessages = []

      // 1. Systemnachricht (ggf. angepasst)
      // ... (existing system message logic) ...

      // 2. Task-Prompt (existing)
      // ...

      // 3. Profil-Info (existing)
      // ...

      // 4. Add Knowledge Base Results (NEU)
      if (knowledgeResults.length > 0) {
        const knowledgeContext = formatKnowledgeResultsForAI(knowledgeResults)
        apiMessages.push({
          role: "system",
          content: `--- Informationen aus der Wissensdatenbank ---
${knowledgeContext}
--- Ende Wissensdatenbank ---`
        })
        console.log("🧠 Wissensdatenbank-Kontext zum Prompt hinzugefügt")
      }

      // 5. Aktuelle Konversation (existing)
      // ...

      // 6. Ähnliche vergangene Gespräche (AUSKOMMENTIERT/PLATZHALTER)
      // if (similarMessages.length > 0) {
      //   const formattedSimilar = formatSimilarMessagesForAI(similarMessages); // Benötigt ggf. auch formatSimilarMessagesForAI
      //   apiMessages.push({
      //     role: 'system',
      //     content: `--- Ähnliche vergangene Gespräche zur aktuellen Frage ---
      // ${formattedSimilar}
      // --- Ende ähnliche Gespräche ---`
      //   });
      //   console.log('📎 Ähnliche Nachrichten zum Prompt hinzugefügt');
      // }
      // --- Ende ähnliche Gespräche ---

      // 7. Letzte User-Nachricht (existing)
      // ...

      // LOGGING: Den finalen apiMessages Array inspizieren
      console.log(
        "Final apiMessages array before API call:",
        JSON.stringify(apiMessages, null, 2)
      )

      // API-Aufruf (existing)
      // ...
    } else {
      // Proceed without context searches (existing)
      // ...
    }
  } // End of sendMessageToAPI
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e] text-white">
        Lade Dashboard...
      </div>
    )
  }
  
  if (error) {
    // Simple error display, could be enhanced
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1e1e] p-4 text-red-400">
        <p>Fehler: {error}</p>
          <button
           onClick={() => router.push("/login")}
           className="mt-4 rounded-md bg-white px-4 py-2 font-semibold text-[#1e1e1e] transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e]"
          >
           Zum Login
          </button>
      </div>
    )
  }
  
  // Main Dashboard Layout
  return (
    <div className="flex h-screen overflow-hidden bg-[#1e1e1e] text-white">
      {/* Sidebar - Fixed height with independent scrolling */}
      <aside className="flex h-full w-64 flex-col justify-between overflow-y-auto border-r border-[#444444] bg-[#212121] p-6">
        <div className="flex-1 overflow-y-auto">
          <div className="mb-8">
            <Image 
              src="/logos/k-logo.svg"
              alt="EcomTask Logo" 
              width={150}
              height={38}
              style={{ height: "auto" }}
              priority
            />
          </div>
          
          {/* Workspace Selector/Creator */}
           <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Workspaces
            </h3>
             {workspace && (
               <div className="mb-1 flex w-full items-center rounded-md bg-[#3a3a3a] px-3 py-2 text-left text-sm text-white">
                 <div className="mr-2 flex-1 truncate">
                  {workspace.name} {workspace.is_home ? "(Persönlich)" : ""}
                 </div>
                 <button 
                   onClick={() => {
                    setRenameWorkspaceId(workspace.id)
                    setNewWorkspaceName(workspace.name)
                    setShowRenameModal(true)
                   }}
                   className="rounded-md p-1 transition-colors hover:bg-[#4a4a4a]"
                   title="Workspace umbenennen"
                 >
                   <Edit size={14} />
                 </button>
               </div>
             )}
             <button
               onClick={() => setShowWorkspaceModal(true)}
               className="mt-2 flex w-full items-center justify-center rounded-md border border-[#444444] bg-[#2d2d2d] px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
             >
               <Plus size={16} className="mr-2" /> Neuer Workspace
             </button>
          </div>
            
          {/* Navigation */}
          <nav className="space-y-2">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Navigation
            </h3>
                <button
              onClick={() => handleNavigation("dashboard")}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                activeView === "dashboard"
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <BarChart2 size={16} className="mr-3" /> Übersicht
                </button>
                <Link
              href={`/chat${selectedWorkspaceId ? `?workspace=${selectedWorkspaceId}` : ""}`}
              className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                >
              <MessageCircle size={16} className="mr-3" /> Chat
                </Link>
            {/* Tasks Button */}
                <button
              onClick={() => handleNavigation("tasks")}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                activeView === "tasks"
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileText size={16} className="mr-3" /> Tasks
                </button>
                
            {/* Projects Button */}
                <button
              onClick={() => handleNavigation("projects")}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                activeView === "projects"
                  ? "bg-white/10 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Layers size={16} className="mr-3" /> Projekte
                </button>
            
            {/* Workspaces Navigation */}
            <div className="mt-4">
              <button
                onClick={toggleWorkspacesDropdown}
                className="workspace-dropdown-trigger flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-0"
              >
                <div className="flex items-center">
                  <Layers className="mr-2 size-5" /> Workspaces
                </div>
                <ChevronRight size={16} />
              </button>
              {renderWorkspaceItems()}
            </div>
            
            {/* Add other navigation items here, styled similarly */}
            {isAdmin && (
              <>
                <button
                  onClick={() => handleNavigation("livedata")}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                    activeView === "livedata"
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileText size={16} className="mr-3" /> Live Daten
                </button>
                <button
                  onClick={() => handleNavigation("knowledge")}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                    activeView === "knowledge"
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Database size={16} className="mr-3" /> Wissensdatenbank
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer - Fixed at bottom */}
        <div className="mt-auto pt-4">
          <nav className="mb-4 space-y-1">
            <Link
              href="#"
              className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Activity size={16} className="mr-3" /> Aktivität
            </Link>
             {isAdmin && (
               <Link 
                href={`/admin${selectedWorkspaceId ? `?workspace=${selectedWorkspaceId}` : ""}`}
                 className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
               >
                 <Settings size={16} className="mr-3" /> Admin
               </Link>
             )}
          </nav>
          <div className="border-t border-[#444444] pt-4">
            <div className="mb-3 flex items-center">
              <User size={20} className="mr-2 text-gray-400" />
              <span className="truncate text-sm">
                {user?.email ?? "Benutzer"}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} className="mr-2" /> Abmelden
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Independent scrolling */}
      <main className="flex-1 overflow-y-auto bg-[#1e1e1e]">
        <div className="mx-auto h-full max-w-7xl p-8">
          {/* Header mit Workspace-Namen und Einladungs-Button */}
          <div className="mb-6 flex items-start justify-between px-6">
            <div>
              <h1 className="mb-1 bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {activeView === "dashboard" && "Willkommen zurück!"}
                {activeView === "tasks" && "Aufgaben / KI-Profile"}
                {activeView === "projects" && "Projektübersicht"}
                {activeView === "knowledge" && "Wissensdatenbank"}
                {activeView === "livedata" &&
                  "Live-Daten für Ihre KI-Assistenz"}
              </h1>
              <p className="text-sm text-gray-400">
                {activeView === "dashboard" &&
                  `Hier ist deine Übersicht für ${selectedWorkspace?.name || "deinen Workspace"}.`}
                {activeView === "tasks" &&
                  "Verwalte deine Aufgaben und KI-Profile."}
                {activeView === "projects" &&
                  "Organisiere und verfolge deine Projekte."}
                {activeView === "knowledge" &&
                  "Erstelle und verwalte Wissensdatenbanken für intelligentere AI-Interaktionen."}
                {activeView === "livedata" &&
                  "Verbinden Sie Ihre internen Systeme und befähigen Sie Ihre KI mit Echtzeitdaten."}
              </p>
            </div>
            
            {/* Button-Container oben rechts */}
            <div className="flex items-center space-x-2">
              {/* Workspace Member Manager - Behalten */}
              {selectedWorkspaceId && (
                <WorkspaceMemberManager workspaceId={selectedWorkspaceId} />
              )}
            </div>
          </div>
          
          {/* Render the active view */}
          {activeView === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[#444444] bg-[#252525] p-5"
                  >
                    <p className="mb-1 text-sm text-gray-400">{stat.label}</p>
                    <p className="mb-2 text-2xl font-semibold">{stat.value}</p>
                    {/* Stat Change */}
                    {stat.change && (
                      <p className="mt-1 text-xs text-gray-400">
                        {stat.change} vs. letzte Periode
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Recent Activity & Other Sections */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <div className="rounded-lg border border-[#444444] bg-[#252525] p-6 lg:col-span-2">
                  <h2 className="mb-4 text-xl font-semibold">
                    Letzte Aktivitäten
                  </h2>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => {
                        // Icon basierend auf iconType bestimmen
                        let ActivityIcon
                        switch (activity.iconType) {
                          case 'message-square':
                            ActivityIcon = MessageSquare
                            break
                          case 'folder-open':
                            ActivityIcon = FolderOpen
                            break
                          case 'file-text':
                            ActivityIcon = FileText
                            break
                          case 'layers':
                            ActivityIcon = Layers
                            break
                          default:
                            ActivityIcon = MessageSquare // Fallback Icon
                        }
                        
                        // Ziel-URL basierend auf Typ bestimmen
                        let href = "#"; // Default fallback
                        if (activity.type === 'message' && activity.chatId) {
                          href = `/chat/${activity.chatId}?workspace=${selectedWorkspaceId}`;
                        } else if (activity.type === 'task') {
                          // Link zur Task-Ansicht, Task-ID könnte später zum Fokussieren verwendet werden
                          href = `/tasks?workspace=${selectedWorkspaceId}&taskId=${activity.id}`;
                        } else if (activity.type === 'project') {
                          // Link zur Projekt-Ansicht
                          href = `/projects?workspace=${selectedWorkspaceId}&projectId=${activity.id}`;
                        } else if (activity.type === 'document') {
                          // Link zur Wissensdatenbank-Ansicht
                          href = `/knowledge?workspace=${selectedWorkspaceId}&documentId=${activity.id}`;
                        }

                        return (
                          // Link entfernt, div als Hauptcontainer mit group für Hover-Effekte
                          <div 
                            key={activity.id} 
                            className="group relative -m-3 rounded-md p-3 transition-colors hover:bg-white/10"
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon Farben nicht ändern */}
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-700 transition-colors">
                                <ActivityIcon className="size-4 text-gray-300 transition-colors" />
                              </div>
                              <div className="grow">
                                <div className="flex items-center">
                                  {/* Textfarbe nicht ändern */}
                                  <span className="font-medium text-white transition-colors">{activity.name}</span>
                                  {/* Status and Priority badges */}
                                  {activity.status && (
                                    /* Badge Farben nicht ändern */
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                      activity.status === 'completed' || activity.status === 'done' || activity.status === 'erledigt' 
                                        ? 'bg-green-800 text-green-200' 
                                        : activity.status === 'in_progress' || activity.status === 'in-progress' || activity.status === 'in progress'
                                        ? 'bg-gray-700 text-gray-300' 
                                        : activity.status === 'active' 
                                        ? 'bg-gray-700 text-gray-300' 
                                        : 'bg-gray-700 text-gray-300'
                                    } transition-colors`}>
                                      {activity.status}
                                    </span>
                                  )}
                                  {activity.priority && (
                                    /* Badge Farben nicht ändern */
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                      activity.priority === 'high' ? 'bg-red-800 text-red-200' :
                                      activity.priority === 'medium' ? 'bg-gray-700 text-gray-300' : // Geändert von gelb zu grau
                                      'bg-gray-700 text-gray-300'
                                    } transition-colors`}>
                                      {activity.priority}
                                    </span>
                                  )}
                                </div>
                                {activity.content && (
                                  /* Textfarbe nicht ändern */
                                  <p className="mt-1 text-sm text-gray-400 transition-colors">{activity.content}</p>
                                )}
                                {/* Textfarbe nicht ändern */}
                                <p className="mt-1 text-xs text-gray-500 transition-colors">
                                  {/* Date formatting */} 
                                  {activity.date ? 
                                    (() => {
                                      try {
                                        const date = new Date(activity.date);
                                        if (isNaN(date.getTime())) {
                                          return "Ungültiges Datum";
                                        }
                                        return formatDistanceToNow(date, { addSuffix: true, locale: de });
                                      } catch (error) {
                                        console.error("Fehler bei der Datumsformatierung:", error, activity.date);
                                        return "Ungültiges Datum";
                                      }
                                    })() 
                                    : "Kein Datum"}
                                </p>
                              </div>
                              {/* MoreVertical Button wieder hinzugefügt, sichtbar bei Hover */}
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                                <button className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white">
                                  <MoreVertical className="size-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        Keine Aktivitäten gefunden.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Links / Info */}
                <div className="rounded-lg border border-[#444444] bg-[#252525] p-6">
                  <h2 className="mb-4 text-xl font-semibold">Schnellzugriff</h2>
                  <div className="space-y-3">
                    <Link
                      href="#"
                      className="flex items-center rounded-md border border-[#444444] bg-[#2d2d2d] p-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <BookOpen size={16} className="mr-3" /> Dokumentation
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center rounded-md border border-[#444444] bg-[#2d2d2d] p-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <HelpCircle size={16} className="mr-3" /> Support
                      kontaktieren
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center rounded-md border border-[#444444] bg-[#2d2d2d] p-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <Calendar size={16} className="mr-3" /> Neuerungen
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center rounded-md border border-[#444444] bg-[#2d2d2d] p-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <Award size={16} className="mr-3" /> Upgrade Plan
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Admin-Benutzerverwaltung entfernt - jetzt auf eigener Admin-Seite */}
            </>
          )}

          {/* Tasks Component */}
          {activeView === "tasks" && (
            <TasksComponent workspaceId={selectedWorkspaceId} />
          )}

          {/* Projects Component */}
          {activeView === "projects" && (
            <ProjectsComponent workspaceId={selectedWorkspaceId} />
          )}

          {/* Knowledge Component */}
          {activeView === "knowledge" && (
            <KnowledgeComponentDashboard 
              selectedWorkspaceId={selectedWorkspaceId}
            />
          )}

          {/* Live Data Component */}
          {activeView === "livedata" && <LiveDataComponent />}
        </div>
      </main>

      {/* Workspace Creation Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Neuen Workspace erstellen
            </h2>
            
            <div className="mb-4">
              <label
                htmlFor="workspaceName"
                className="mb-2 block text-sm font-medium text-[#cccccc]"
              >
                Name
              </label>
              <input
                id="workspaceName"
                type="text"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444]"
                placeholder="Workspace-Name eingeben"
              />
            </div>
            
            <div className="mb-6">
              <label
                htmlFor="workspaceDescription"
                className="mb-2 block text-sm font-medium text-[#cccccc]"
              >
                Beschreibung (optional)
              </label>
              <textarea
                id="workspaceDescription"
                value={newWorkspaceDescription}
                onChange={e => setNewWorkspaceDescription(e.target.value)}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444]"
                placeholder="Kurze Beschreibung des Workspaces"
                rows={3}
              />
                  </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowWorkspaceModal(false)
                  setNewWorkspaceName("")
                  setNewWorkspaceDescription("")
                }}
                className="rounded-lg border border-[#333333] px-4 py-2 text-sm text-[#cccccc] transition-all hover:border-[#444444] hover:text-white"
                disabled={isCreatingWorkspace}
              >
                Abbrechen
              </button>
              <button
                onClick={createWorkspace}
                disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
                className={`rounded-lg px-4 py-2 text-sm ${
                  newWorkspaceName.trim() && !isCreatingWorkspace
                    ? "bg-white text-[#1e1e1e] hover:bg-gray-200"
                    : "cursor-not-allowed bg-gray-600 text-white/70"
                }`}
              >
                {isCreatingWorkspace ? "Wird erstellt..." : "Erstellen"}
              </button>
            </div>
          </div>
      </div>
      )}

      {/* Rename Workspace Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-[#444444] bg-[#2a2a2a] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workspace umbenennen</h3>
              <button 
                onClick={() => {
                  setShowRenameModal(false)
                  setRenameWorkspaceId(null)
                  setNewWorkspaceName("")
                }}
                className="rounded-md p-1 hover:bg-[#3a3a3a]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm text-gray-400">
                Name des Workspace
              </label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                className="w-full rounded-md border border-[#444444] bg-[#333333] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#444444]"
                placeholder="Name eingeben..."
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setRenameWorkspaceId(null)
                  setNewWorkspaceName("")
                }}
                className="rounded-md border border-[#444444] px-4 py-2 text-gray-300 hover:bg-[#3a3a3a]"
              >
                Abbrechen
              </button>
              <button
                onClick={handleRenameWorkspace}
                disabled={!newWorkspaceName.trim()}
                className="flex items-center rounded-md bg-[#333333] px-4 py-2 text-white hover:bg-[#444444] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={16} className="mr-1" /> Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
