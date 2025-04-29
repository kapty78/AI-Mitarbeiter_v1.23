"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getSavedCompany } from "@/lib/domain-manager"
import { UserManagement } from "@/app/components/admin/UserManagement"
import { ChevronLeft, Settings, Users } from "lucide-react"
import Image from "next/image"

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "settings">("users")
  const [companyName, setCompanyName] = useState<string>("")

  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)

        // Session prüfen
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError) throw new Error(sessionError.message)
        if (!session) {
          router.replace("/login")
          return
        }

        setUser(session.user)

        // Benutzerprofil mit company_id laden
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          throw new Error(`Profilfehler: ${profileError.message}`)
        }

        setUserProfile(profileData)

        // Get company name
        const company = getSavedCompany()
        if (company) {
          setCompanyName(company.name || "")
        }

        // Prüfen, ob der Benutzer Admin ist
        const { data: adminData, error: adminError } = await supabase
          .from("company_admins")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("company_id", company?.id)
          .maybeSingle()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("Admin-Prüfungsfehler:", adminError)
        }

        // Wenn adminData existiert, ist der Benutzer ein Admin
        const userIsAdmin = !!adminData
        setIsAdmin(userIsAdmin)

        // Wenn kein Admin, zurück zum Dashboard
        if (!userIsAdmin) {
          router.replace("/dashboard")
          return
        }
      } catch (err: any) {
        console.error("Fehler:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="text-white">Lade Admin-Bereich...</div>
      </div>
    )
  }

  if (error || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1e1e] p-4">
        <div className="mb-4 text-red-400">
          {error || "Keine Administratorberechtigungen"}
        </div>
        <Link
          href="/dashboard"
          className="flex items-center rounded-md bg-[#333] px-4 py-2 text-white hover:bg-[#444]"
        >
          <ChevronLeft className="mr-2" size={16} />
          Zurück zum Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <header className="border-b border-[#333] bg-[#212121] py-4">
        <div className="flex items-center justify-between px-6">
          <Link
            href={`/dashboard${workspaceId ? `?workspace=${workspaceId}` : ""}`}
            className="flex items-center text-gray-300 hover:text-white"
            title="Zurück zum Dashboard"
          >
            <ChevronLeft size={20} />
          </Link>
          
          <span className="text-xl font-semibold tracking-tight">
            Admin-Bereich
          </span>
          
          <span className="rounded-md bg-[#333] px-3 py-1.5 text-sm text-gray-300">
            {companyName || "Firma"}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl flex-1 p-6">
        {/* Tabs */}
        <div className="mb-6 flex border-b border-[#333]">
          <button
            className={`mr-4 border-b-2 px-4 py-2 ${
              activeTab === "users"
                ? "border-white text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <div className="flex items-center">
              <Users className="mr-2" size={16} />
              Benutzerverwaltung
            </div>
          </button>
          <button
            className={`mr-4 border-b-2 px-4 py-2 ${
              activeTab === "settings"
                ? "border-white text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <div className="flex items-center">
              <Settings className="mr-2" size={16} />
              Systemeinstellungen
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg border border-[#333] bg-[#252525]">
          {activeTab === "users" && (
            <UserManagement companyId={userProfile?.company_id || null} />
          )}

          {activeTab === "settings" && (
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Systemeinstellungen
              </h2>
              <p className="text-gray-400">
                Diese Funktion wird in Kürze verfügbar sein.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
