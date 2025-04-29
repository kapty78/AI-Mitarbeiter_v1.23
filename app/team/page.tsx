"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { getSavedCompany } from "@/lib/domain-manager"
import Link from "next/link"
import {
  ChevronLeft,
  LogOut,
  Users,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  Shield,
  Star,
  User,
  MoreHorizontal,
  MessageSquare,
  ArrowUpDown,
  UserMinus,
  Settings,
  Briefcase,
  Book,
  Link as LinkIcon,
  PlusCircle,
  X,
  Database,
  CheckSquare,
  Square,
  FileText,
  Award,
  Tag
} from "lucide-react"

type Department = {
  id: string
  name: string
  description?: string
  created_at: string
  knowledge_packages?: string[]
  integrations?: string[]
}

type KnowledgePackage = {
  id: string
  name: string
  description?: string
  created_at: string
}

type IntegrationType = {
  id: string
  name: string
  type: "erp" | "crm" | "email" | "zendesk" | "other"
  config?: Record<string, string>
  status: "active" | "inactive" | "pending"
  created_at: string
}

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "invited" | "inactive"
  avatar_url?: string
  phone?: string
  department_id?: string
  department?: string
  joined_at: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [knowledgePackages, setKnowledgePackages] = useState<
    KnowledgePackage[]
  >([])
  const [integrations, setIntegrations] = useState<IntegrationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false)
  const [showIntegrationForm, setShowIntegrationForm] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [newMemberDepartment, setNewMemberDepartment] = useState("")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("")
  const [newKnowledgeName, setNewKnowledgeName] = useState("")
  const [newKnowledgeDescription, setNewKnowledgeDescription] = useState("")
  const [newIntegrationName, setNewIntegrationName] = useState("")
  const [newIntegrationType, setNewIntegrationType] =
    useState<IntegrationType["type"]>("crm")
  const [activeTab, setActiveTab] = useState<
    "members" | "departments" | "knowledge" | "integrations"
  >("members")
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchTeamMembers = async () => {
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
          return
        }

        setUser(session.user)

        // Check if user is admin - this would come from your user data
        // For demo, we'll just simulate
        setIsAdmin(true) // In real app, determine from user data

        // Create DB schema if needed
        await setupDatabase()

        // Sample departments
        const sampleDepartments: Department[] = [
          {
            id: "d1",
            name: "Management",
            description: "Geschäftsführung und Unternehmensleitung",
            created_at: "2022-01-01T10:00:00Z",
            knowledge_packages: ["k1", "k3"],
            integrations: ["i1", "i2"]
          },
          {
            id: "d2",
            name: "Marketing",
            description: "Marketing und Kommunikation",
            created_at: "2022-01-02T10:00:00Z",
            knowledge_packages: ["k2"],
            integrations: ["i3"]
          },
          {
            id: "d3",
            name: "Vertrieb",
            description: "Vertrieb und Customer Success",
            created_at: "2022-01-03T10:00:00Z",
            knowledge_packages: ["k1"],
            integrations: ["i2"]
          },
          {
            id: "d4",
            name: "Content",
            description: "Content-Erstellung und -Verwaltung",
            created_at: "2022-01-04T10:00:00Z",
            knowledge_packages: ["k2", "k3"],
            integrations: []
          }
        ]

        // Sample knowledge packages
        const sampleKnowledgePackages: KnowledgePackage[] = [
          {
            id: "k1",
            name: "Unternehmensrichtlinien",
            description: "Allgemeine Unternehmensrichtlinien und -prozesse",
            created_at: "2022-01-01T09:00:00Z"
          },
          {
            id: "k2",
            name: "Marketing-Wissen",
            description: "Marketingstrategien und -materialien",
            created_at: "2022-01-01T09:30:00Z"
          },
          {
            id: "k3",
            name: "Produkt-Dokumentation",
            description: "Produktinformationen und technische Dokumentation",
            created_at: "2022-01-01T10:00:00Z"
          }
        ]

        // Sample integrations
        const sampleIntegrations: IntegrationType[] = [
          {
            id: "i1",
            name: "SAP ERP",
            type: "erp",
            status: "active",
            created_at: "2022-01-01T08:00:00Z"
          },
          {
            id: "i2",
            name: "Salesforce",
            type: "crm",
            status: "active",
            created_at: "2022-01-01T08:30:00Z"
          },
          {
            id: "i3",
            name: "Zendesk Support",
            type: "zendesk",
            status: "active",
            created_at: "2022-01-01T09:00:00Z"
          }
        ]

        // Sample team members
        const sampleMembers: TeamMember[] = [
          {
            id: "1",
            name: "Max Mustermann",
            email: "max.mustermann@example.com",
            role: "admin",
            status: "active",
            avatar_url:
              "https://ui-avatars.com/api/?name=Max+Mustermann&background=0D8ABC&color=fff",
            phone: "+49 123 456789",
            department_id: "d1",
            department: "Management",
            joined_at: "2022-01-15T10:00:00Z"
          },
          {
            id: "2",
            name: "Anna Schmidt",
            email: "anna.schmidt@example.com",
            role: "member",
            status: "active",
            avatar_url:
              "https://ui-avatars.com/api/?name=Anna+Schmidt&background=8A2BE2&color=fff",
            department_id: "d2",
            department: "Marketing",
            joined_at: "2022-03-22T14:30:00Z"
          },
          {
            id: "3",
            name: "Thomas Weber",
            email: "thomas.weber@example.com",
            role: "member",
            status: "active",
            avatar_url:
              "https://ui-avatars.com/api/?name=Thomas+Weber&background=FF4500&color=fff",
            phone: "+49 987 654321",
            department_id: "d3",
            department: "Vertrieb",
            joined_at: "2022-05-10T09:15:00Z"
          },
          {
            id: "4",
            name: "Lisa Müller",
            email: "lisa.mueller@example.com",
            role: "editor",
            status: "invited",
            department_id: "d4",
            department: "Content",
            joined_at: "2023-01-05T11:45:00Z"
          }
        ]

        // Apply search filter for team members
        const filteredMembers = searchTerm
          ? sampleMembers.filter(
              member =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (member.department &&
                  member.department
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))
            )
          : sampleMembers

        setTeamMembers(filteredMembers)
        setDepartments(sampleDepartments)
        setKnowledgePackages(sampleKnowledgePackages)
        setIntegrations(sampleIntegrations)
      } catch (err: any) {
        console.error("Team members error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [searchTerm])

  const setupDatabase = async () => {
    try {
      // Check and create team_members table if it doesn't exist
      const createTeamMembersTableSQL = `
        CREATE TABLE IF NOT EXISTS public.team_members (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'member')),
          status TEXT DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'inactive')),
          avatar_url TEXT,
          phone TEXT,
          department_id UUID REFERENCES public.departments(id),
          joined_at TIMESTAMPTZ DEFAULT now(),
          user_id UUID REFERENCES auth.users(id) NOT NULL
        );
      `

      // Check and create departments table if it doesn't exist
      const createDepartmentsTableSQL = `
        CREATE TABLE IF NOT EXISTS public.departments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          company_id TEXT NOT NULL
        );
      `

      // Check and create knowledge_packages table if it doesn't exist
      const createKnowledgePackagesTableSQL = `
        CREATE TABLE IF NOT EXISTS public.knowledge_packages (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          company_id TEXT NOT NULL
        );
      `

      // Check and create department_knowledge table if it doesn't exist
      const createDepartmentKnowledgeTableSQL = `
        CREATE TABLE IF NOT EXISTS public.department_knowledge (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
          knowledge_package_id UUID REFERENCES public.knowledge_packages(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE (department_id, knowledge_package_id)
        );
      `

      // Check and create integrations table if it doesn't exist
      const createIntegrationsTableSQL = `
        CREATE TABLE IF NOT EXISTS public.integrations (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT CHECK (type IN ('erp', 'crm', 'email', 'zendesk', 'other')),
          config JSONB,
          status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at TIMESTAMPTZ DEFAULT now(),
          company_id TEXT NOT NULL
        );
      `

      // Check and create department_integration table if it doesn't exist
      const createDepartmentIntegrationTableSQL = `
        CREATE TABLE IF NOT EXISTS public.department_integration (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
          integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE (department_id, integration_id)
        );
      `

      // Execute SQL queries using the RPC function
      await supabase.rpc("execute_sql", { query: createDepartmentsTableSQL })
      await supabase.rpc("execute_sql", {
        query: createKnowledgePackagesTableSQL
      })
      await supabase.rpc("execute_sql", { query: createIntegrationsTableSQL })
      await supabase.rpc("execute_sql", { query: createTeamMembersTableSQL })
      await supabase.rpc("execute_sql", {
        query: createDepartmentKnowledgeTableSQL
      })
      await supabase.rpc("execute_sql", {
        query: createDepartmentIntegrationTableSQL
      })

      console.log("Database schema setup complete")
    } catch (error) {
      console.error("Error setting up database schema:", error)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMemberEmail.trim()) return

    try {
      setLoading(true)

      // In a real application, this would send an invitation email
      // and create a record in the database

      // For demo purposes, just add to the local state
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newMemberEmail.split("@")[0],
        email: newMemberEmail,
        role: newMemberRole,
        status: "invited",
        joined_at: new Date().toISOString()
      }

      setTeamMembers([newMember, ...teamMembers])
      setNewMemberEmail("")
      setNewMemberRole("member")
      setShowInviteForm(false)
    } catch (err: any) {
      console.error("Invite member error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (!confirm("Möchten Sie dieses Teammitglied wirklich entfernen?")) return

    setTeamMembers(teamMembers.filter(member => member.id !== memberId))
    if (selectedMember?.id === memberId) setSelectedMember(null)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
            <Shield size={10} className="mr-1" />
            Admin
          </span>
        )
      case "editor":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
            <Star size={10} className="mr-1" />
            Editor
          </span>
        )
      case "member":
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
            <User size={10} className="mr-1" />
            Mitglied
          </span>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
            <span className="mr-1 size-1.5 rounded-full bg-green-500"></span>
            Aktiv
          </span>
        )
      case "invited":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
            <span className="mr-1 size-1.5 rounded-full bg-yellow-500"></span>
            Eingeladen
          </span>
        )
      case "inactive":
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
            <span className="mr-1 size-1.5 rounded-full bg-red-500"></span>
            Inaktiv
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newDepartmentName.trim()) return

    try {
      setLoading(true)

      // In a real application, this would add the department to the database
      const newDepartment: Department = {
        id: `d${Date.now()}`,
        name: newDepartmentName,
        description: newDepartmentDescription,
        created_at: new Date().toISOString(),
        knowledge_packages: [],
        integrations: []
      }

      setDepartments([...departments, newDepartment])
      setNewDepartmentName("")
      setNewDepartmentDescription("")
      setShowDepartmentForm(false)
    } catch (err: any) {
      console.error("Create department error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKnowledgePackage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newKnowledgeName.trim()) return

    try {
      setLoading(true)

      // In a real application, this would add the knowledge package to the database
      const newKnowledge: KnowledgePackage = {
        id: `k${Date.now()}`,
        name: newKnowledgeName,
        description: newKnowledgeDescription,
        created_at: new Date().toISOString()
      }

      setKnowledgePackages([...knowledgePackages, newKnowledge])
      setNewKnowledgeName("")
      setNewKnowledgeDescription("")
      setShowKnowledgeForm(false)
    } catch (err: any) {
      console.error("Create knowledge package error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newIntegrationName.trim()) return

    try {
      setLoading(true)

      // In a real application, this would add the integration to the database
      const newIntegration: IntegrationType = {
        id: `i${Date.now()}`,
        name: newIntegrationName,
        type: newIntegrationType,
        status: "pending",
        created_at: new Date().toISOString()
      }

      setIntegrations([...integrations, newIntegration])
      setNewIntegrationName("")
      setNewIntegrationType("crm")
      setShowIntegrationForm(false)
    } catch (err: any) {
      console.error("Create integration error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const assignKnowledgeToDepart = (
    departmentId: string,
    knowledgeId: string
  ) => {
    setDepartments(
      departments.map(dept => {
        if (dept.id === departmentId) {
          const updatedPackages = dept.knowledge_packages || []
          if (!updatedPackages.includes(knowledgeId)) {
            updatedPackages.push(knowledgeId)
          }
          return { ...dept, knowledge_packages: updatedPackages }
        }
        return dept
      })
    )
  }

  const removeKnowledgeFromDepart = (
    departmentId: string,
    knowledgeId: string
  ) => {
    setDepartments(
      departments.map(dept => {
        if (dept.id === departmentId && dept.knowledge_packages) {
          return {
            ...dept,
            knowledge_packages: dept.knowledge_packages.filter(
              id => id !== knowledgeId
            )
          }
        }
        return dept
      })
    )
  }

  const assignIntegrationToDepart = (
    departmentId: string,
    integrationId: string
  ) => {
    setDepartments(
      departments.map(dept => {
        if (dept.id === departmentId) {
          const updatedIntegrations = dept.integrations || []
          if (!updatedIntegrations.includes(integrationId)) {
            updatedIntegrations.push(integrationId)
          }
          return { ...dept, integrations: updatedIntegrations }
        }
        return dept
      })
    )
  }

  const removeIntegrationFromDepart = (
    departmentId: string,
    integrationId: string
  ) => {
    setDepartments(
      departments.map(dept => {
        if (dept.id === departmentId && dept.integrations) {
          return {
            ...dept,
            integrations: dept.integrations.filter(id => id !== integrationId)
          }
        }
        return dept
      })
    )
  }

  const updateMemberDepartment = (memberId: string, departmentId: string) => {
    // Find the department to get its name
    const department = departments.find(d => d.id === departmentId)

    setTeamMembers(
      teamMembers.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            department_id: departmentId,
            department: department ? department.name : ""
          }
        }
        return member
      })
    )

    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({
        ...selectedMember,
        department_id: departmentId,
        department: department ? department.name : ""
      })
    }
  }

  if (loading && teamMembers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-[var(--primary-color)] border-t-transparent"></div>
          <p>Lade Teammitglieder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121212]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="mr-4 text-white/70 transition hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <img
              src="https://framerusercontent.com/images/jep8u4MpurfbwZZlQqg0mq8kA.svg?scale-down-to=512"
              alt="EcomTask"
              className="mr-2 h-8"
            />
            <div className="text-lg font-semibold">Team</div>
            {getSavedCompany() && (
              <div className="ml-2 rounded-md bg-[#333] px-2 py-1 text-xs text-[var(--primary-color)]">
                {getSavedCompany()?.name}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-sm text-white/80 transition hover:text-white"
            >
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = "/login"
              }}
              className="flex items-center rounded-full bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
              title="Abmelden"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="grow bg-black p-4">
        <div className="mx-auto max-w-7xl">
          {/* Page header */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="flex items-center text-2xl font-bold">
                <Users className="mr-2 size-6 text-[var(--primary-color)]" />
                Team & Organisation
              </h1>
              <p className="text-white/60">
                Verwalten Sie Ihr Team, Abteilungen und Berechtigungen
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "members" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Teammitglieder suchen..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="rounded-md border border-white/10 bg-[#1a1a1a] py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    />
                  </div>

                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                  >
                    <UserPlus size={16} className="mr-2" />
                    Mitglied einladen
                  </button>
                </>
              )}

              {activeTab === "departments" && isAdmin && (
                <button
                  onClick={() => setShowDepartmentForm(true)}
                  className="flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Abteilung erstellen
                </button>
              )}

              {activeTab === "knowledge" && isAdmin && (
                <button
                  onClick={() => setShowKnowledgeForm(true)}
                  className="flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Wissenspaket erstellen
                </button>
              )}

              {activeTab === "integrations" && isAdmin && (
                <button
                  onClick={() => setShowIntegrationForm(true)}
                  className="flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Integration hinzufügen
                </button>
              )}
            </div>
          </div>

          {/* Tabs navigation */}
          <div className="mb-6 border-b border-white/10">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("members")}
                className={`px-3 py-2 text-sm font-medium transition ${activeTab === "members" ? "border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]" : "text-white/60 hover:text-white"}`}
              >
                Teammitglieder
              </button>
              <button
                onClick={() => setActiveTab("departments")}
                className={`px-3 py-2 text-sm font-medium transition ${activeTab === "departments" ? "border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]" : "text-white/60 hover:text-white"}`}
              >
                Abteilungen
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab("knowledge")}
                  className={`px-3 py-2 text-sm font-medium transition ${activeTab === "knowledge" ? "border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]" : "text-white/60 hover:text-white"}`}
                >
                  Wissenspakete
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab("integrations")}
                  className={`px-3 py-2 text-sm font-medium transition ${activeTab === "integrations" ? "border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]" : "text-white/60 hover:text-white"}`}
                >
                  Integrationen
                </button>
              )}
            </nav>
          </div>

          {/* Invite form */}
          {showInviteForm && (
            <div className="mb-6 rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
              <h2 className="mb-4 text-lg font-medium">
                Neues Teammitglied einladen
              </h2>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label
                    htmlFor="memberEmail"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    E-Mail-Adresse
                  </label>
                  <input
                    id="memberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="teammitglied@example.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="memberRole"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Rolle
                  </label>
                  <select
                    id="memberRole"
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  >
                    <option value="member">Mitglied</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="memberDepartment"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Abteilung
                  </label>
                  <select
                    id="memberDepartment"
                    value={newMemberDepartment}
                    onChange={e => setNewMemberDepartment(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  >
                    <option value="">Keine Abteilung</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                  >
                    Einladung senden
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Department form */}
          {showDepartmentForm && (
            <div className="mb-6 rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
              <h2 className="mb-4 text-lg font-medium">
                Neue Abteilung erstellen
              </h2>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label
                    htmlFor="departmentName"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Name der Abteilung
                  </label>
                  <input
                    id="departmentName"
                    type="text"
                    value={newDepartmentName}
                    onChange={e => setNewDepartmentName(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="z.B. Marketing"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="departmentDescription"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="departmentDescription"
                    value={newDepartmentDescription}
                    onChange={e => setNewDepartmentDescription(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="Kurze Beschreibung der Abteilung"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDepartmentForm(false)}
                    className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                  >
                    Abteilung erstellen
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Knowledge Package form */}
          {showKnowledgeForm && (
            <div className="mb-6 rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
              <h2 className="mb-4 text-lg font-medium">
                Neues Wissenspaket erstellen
              </h2>
              <form
                onSubmit={handleCreateKnowledgePackage}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="knowledgeName"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Name des Wissenspakets
                  </label>
                  <input
                    id="knowledgeName"
                    type="text"
                    value={newKnowledgeName}
                    onChange={e => setNewKnowledgeName(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="z.B. Produkt-Handbuch"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="knowledgeDescription"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="knowledgeDescription"
                    value={newKnowledgeDescription}
                    onChange={e => setNewKnowledgeDescription(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="Kurze Beschreibung des Wissenspakets"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKnowledgeForm(false)}
                    className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                  >
                    Wissenspaket erstellen
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Integration form */}
          {showIntegrationForm && (
            <div className="mb-6 rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
              <h2 className="mb-4 text-lg font-medium">
                Neue Integration hinzufügen
              </h2>
              <form onSubmit={handleCreateIntegration} className="space-y-4">
                <div>
                  <label
                    htmlFor="integrationName"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Name der Integration
                  </label>
                  <input
                    id="integrationName"
                    type="text"
                    value={newIntegrationName}
                    onChange={e => setNewIntegrationName(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    placeholder="z.B. Salesforce CRM"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="integrationType"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    Typ
                  </label>
                  <select
                    id="integrationType"
                    value={newIntegrationType}
                    onChange={e =>
                      setNewIntegrationType(
                        e.target.value as IntegrationType["type"]
                      )
                    }
                    className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  >
                    <option value="crm">CRM</option>
                    <option value="erp">ERP</option>
                    <option value="email">E-Mail</option>
                    <option value="zendesk">Zendesk</option>
                    <option value="other">Andere</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationForm(false)}
                    className="rounded-md bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                  >
                    Integration hinzufügen
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-500/50 bg-red-900/20 p-4 text-red-400">
              <p className="font-medium">Fehler</p>
              <p>{error}</p>
            </div>
          )}

          {/* Tab content */}
          <div className="grid grid-cols-1 gap-4">
            {/* Members tab */}
            {activeTab === "members" && (
              <>
                {teamMembers.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-8 text-center">
                    <Users className="mx-auto mb-4 size-12 text-white/30" />
                    <h3 className="text-lg font-medium text-white">
                      Keine Teammitglieder gefunden
                    </h3>
                    <p className="mt-1 text-white/60">
                      Laden Sie neue Mitglieder in Ihr Team ein, um loszulegen.
                    </p>
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="mt-4 inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Mitglied einladen
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-[#232323]">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                              <div className="flex items-center">
                                Mitglied
                                <ArrowUpDown size={14} className="ml-1" />
                              </div>
                            </th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                              Rolle
                            </th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                              Abteilung
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                              Beigetreten
                            </th>
                            <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/60">
                              Aktionen
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {teamMembers.map(member => (
                            <tr
                              key={member.id}
                              className="cursor-pointer transition hover:bg-white/5"
                              onClick={() => setSelectedMember(member)}
                            >
                              <td className="whitespace-nowrap p-4">
                                <div className="flex items-center">
                                  <div className="size-10 shrink-0">
                                    {member.avatar_url ? (
                                      <img
                                        className="size-10 rounded-full"
                                        src={member.avatar_url}
                                        alt={member.name}
                                      />
                                    ) : (
                                      <div className="bg-[var(--primary-color)]/20 flex size-10 items-center justify-center rounded-full text-[var(--primary-color)]">
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="font-medium text-white">
                                      {member.name}
                                    </div>
                                    <div className="text-sm text-white/60">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap p-4">
                                {getRoleBadge(member.role)}
                              </td>
                              <td className="whitespace-nowrap p-4">
                                {getStatusBadge(member.status)}
                              </td>
                              <td className="whitespace-nowrap p-4 text-sm text-white/60">
                                {member.department || "-"}
                              </td>
                              <td className="whitespace-nowrap p-4 text-sm text-white/60">
                                {formatDate(member.joined_at)}
                              </td>
                              <td className="whitespace-nowrap p-4 text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      window.location.href = `mailto:${member.email}`
                                    }}
                                    className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                                    title="E-Mail senden"
                                  >
                                    <Mail size={16} />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedMember(member)
                                    }}
                                    className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                                    title="Details anzeigen"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Departments tab */}
            {activeTab === "departments" && (
              <>
                {departments.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-8 text-center">
                    <Briefcase className="mx-auto mb-4 size-12 text-white/30" />
                    <h3 className="text-lg font-medium text-white">
                      Keine Abteilungen gefunden
                    </h3>
                    <p className="mt-1 text-white/60">
                      Erstellen Sie Abteilungen, um Ihr Team zu organisieren.
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setShowDepartmentForm(true)}
                        className="mt-4 inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                      >
                        <PlusCircle size={16} className="mr-2" />
                        Abteilung erstellen
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map(department => (
                      <div
                        key={department.id}
                        className="cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] transition hover:border-white/20"
                        onClick={() => setSelectedDepartment(department)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <Briefcase className="mr-2 size-5 text-[var(--primary-color)]" />
                              <h3 className="text-lg font-medium text-white">
                                {department.name}
                              </h3>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  // Edit department implementation
                                }}
                                className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                              >
                                <Settings size={16} />
                              </button>
                            )}
                          </div>

                          {department.description && (
                            <p className="mt-2 text-sm text-white/60">
                              {department.description}
                            </p>
                          )}

                          <div className="mt-4">
                            <div className="flex items-center text-xs text-white/40">
                              <Users size={12} className="mr-1" />
                              <span>
                                {
                                  teamMembers.filter(
                                    m => m.department_id === department.id
                                  ).length
                                }{" "}
                                Mitglieder
                              </span>
                            </div>
                          </div>

                          {isAdmin && (
                            <>
                              <div className="mt-3 border-t border-white/10 pt-3">
                                <div className="mb-2 text-xs font-medium text-white/60">
                                  Wissenspakete
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {department.knowledge_packages &&
                                    department.knowledge_packages.map(pkgId => {
                                      const pkg = knowledgePackages.find(
                                        k => k.id === pkgId
                                      )
                                      return pkg ? (
                                        <span
                                          key={pkg.id}
                                          className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500"
                                        >
                                          <Book size={10} className="mr-1" />
                                          {pkg.name}
                                        </span>
                                      ) : null
                                    })}
                                  {(!department.knowledge_packages ||
                                    department.knowledge_packages.length ===
                                      0) && (
                                    <span className="text-xs text-white/40">
                                      Keine Wissenspakete zugewiesen
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 border-t border-white/10 pt-3">
                                <div className="mb-2 text-xs font-medium text-white/60">
                                  Integrationen
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {department.integrations &&
                                    department.integrations.map(intId => {
                                      const int = integrations.find(
                                        i => i.id === intId
                                      )
                                      return int ? (
                                        <span
                                          key={int.id}
                                          className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500"
                                        >
                                          <LinkIcon
                                            size={10}
                                            className="mr-1"
                                          />
                                          {int.name}
                                        </span>
                                      ) : null
                                    })}
                                  {(!department.integrations ||
                                    department.integrations.length === 0) && (
                                    <span className="text-xs text-white/40">
                                      Keine Integrationen zugewiesen
                                    </span>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Knowledge packages tab */}
            {activeTab === "knowledge" && (
              <>
                {knowledgePackages.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-8 text-center">
                    <Book className="mx-auto mb-4 size-12 text-white/30" />
                    <h3 className="text-lg font-medium text-white">
                      Keine Wissenspakete gefunden
                    </h3>
                    <p className="mt-1 text-white/60">
                      Erstellen Sie Wissenspakete, um Informationen zu
                      organisieren.
                    </p>
                    <button
                      onClick={() => setShowKnowledgeForm(true)}
                      className="mt-4 inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Wissenspaket erstellen
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {knowledgePackages.map(pkg => (
                      <div
                        key={pkg.id}
                        className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <Book className="mr-2 size-5 text-blue-500" />
                            <h3 className="text-lg font-medium text-white">
                              {pkg.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              // Edit knowledge package implementation
                            }}
                            className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                          >
                            <Settings size={16} />
                          </button>
                        </div>

                        {pkg.description && (
                          <p className="mt-2 text-sm text-white/60">
                            {pkg.description}
                          </p>
                        )}

                        <div className="mt-4 border-t border-white/10 pt-4">
                          <div className="mb-2 text-xs font-medium text-white/60">
                            Zugewiesene Abteilungen
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {departments
                              .filter(d =>
                                d.knowledge_packages?.includes(pkg.id)
                              )
                              .map(dept => (
                                <span
                                  key={dept.id}
                                  className="bg-[var(--primary-color)]/10 inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--primary-color)]"
                                >
                                  <Briefcase size={10} className="mr-1" />
                                  {dept.name}
                                </span>
                              ))}
                            {departments.filter(d =>
                              d.knowledge_packages?.includes(pkg.id)
                            ).length === 0 && (
                              <span className="text-xs text-white/40">
                                Keiner Abteilung zugewiesen
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Integrations tab */}
            {activeTab === "integrations" && (
              <>
                {integrations.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-8 text-center">
                    <LinkIcon className="mx-auto mb-4 size-12 text-white/30" />
                    <h3 className="text-lg font-medium text-white">
                      Keine Integrationen gefunden
                    </h3>
                    <p className="mt-1 text-white/60">
                      Fügen Sie Integrationen hinzu, um externe Systeme zu
                      verbinden.
                    </p>
                    <button
                      onClick={() => setShowIntegrationForm(true)}
                      className="mt-4 inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm text-white transition hover:bg-[var(--secondary-color)]"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Integration hinzufügen
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {integrations.map(integration => (
                      <div
                        key={integration.id}
                        className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            {integration.type === "crm" && (
                              <Database className="mr-2 size-5 text-purple-500" />
                            )}
                            {integration.type === "erp" && (
                              <Database className="mr-2 size-5 text-green-500" />
                            )}
                            {integration.type === "email" && (
                              <Mail className="mr-2 size-5 text-blue-500" />
                            )}
                            {integration.type === "zendesk" && (
                              <MessageSquare className="mr-2 size-5 text-yellow-500" />
                            )}
                            {integration.type === "other" && (
                              <LinkIcon className="mr-2 size-5 text-gray-500" />
                            )}
                            <h3 className="text-lg font-medium text-white">
                              {integration.name}
                            </h3>
                          </div>
                          <div className="flex items-center">
                            {integration.status === "active" && (
                              <span className="mr-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                                Aktiv
                              </span>
                            )}
                            {integration.status === "pending" && (
                              <span className="mr-2 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                                Ausstehend
                              </span>
                            )}
                            {integration.status === "inactive" && (
                              <span className="mr-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                                Inaktiv
                              </span>
                            )}
                            <button
                              onClick={() => {
                                // Configure integration implementation
                              }}
                              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                              <Settings size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-white/60">
                          <span className="capitalize">{integration.type}</span>{" "}
                          Integration
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-4">
                          <div className="mb-2 text-xs font-medium text-white/60">
                            Zugewiesene Abteilungen
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {departments
                              .filter(d =>
                                d.integrations?.includes(integration.id)
                              )
                              .map(dept => (
                                <span
                                  key={dept.id}
                                  className="bg-[var(--primary-color)]/10 inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--primary-color)]"
                                >
                                  <Briefcase size={10} className="mr-1" />
                                  {dept.name}
                                </span>
                              ))}
                            {departments.filter(d =>
                              d.integrations?.includes(integration.id)
                            ).length === 0 && (
                              <span className="text-xs text-white/40">
                                Keiner Abteilung zugewiesen
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#121212] py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              &copy; {new Date().getFullYear()} EcomTask. Alle Rechte
              vorbehalten.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="/terms"
                className="text-sm text-white/60 hover:text-white/80"
              >
                AGB
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/60 hover:text-white/80"
              >
                Datenschutz
              </Link>
              <Link
                href="/imprint"
                className="text-sm text-white/60 hover:text-white/80"
              >
                Impressum
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
