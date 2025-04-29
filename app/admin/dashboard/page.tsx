"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { getSavedCompany } from "@/lib/domain-manager"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    userCount: 0,
    workspaceCount: 0,
    messageCount: 0
  })
  const [userEmail, setUserEmail] = useState<string>("")

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Session prüfen
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session) {
          setError(
            "Bitte melden Sie sich an, um auf den Admin-Bereich zuzugreifen."
          )
          return
        }

        setUserEmail(session.user.email || "")

        // Prüfen, ob der Benutzer Admin ist
        let isAdmin = false

        // Option 1: Prüfen über Benutzermetadaten
        const { data: userData } = await supabase.auth.getUser()
        if (
          userData?.user?.user_metadata?.role === "admin" ||
          userData?.user?.user_metadata?.is_admin === true
        ) {
          isAdmin = true
        } else {
          // Option 2: Prüfen über company_admins Tabelle
          try {
            // Company aus getSavedCompany
            const savedCompanyData = getSavedCompany()
            let companyId = null

            if (savedCompanyData) {
              companyId = savedCompanyData.id

              if (companyId) {
                const { data: adminCheck, error: adminCheckError } =
                  await supabase
                    .from("company_admins")
                    .select("*")
                    .eq("company_id", companyId)
                    .eq("user_id", session.user.id)
                    .maybeSingle()

                if (!adminCheckError && adminCheck) {
                  isAdmin = true
                }
              }
            }
          } catch (e) {
            console.error("Fehler beim Prüfen des Admin-Status:", e)
          }
        }

        if (!isAdmin) {
          setError(
            "Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen."
          )
          return
        }

        setUser(session.user)

        // Unternehmensdaten laden
        const savedCompany = getSavedCompany()

        if (!savedCompany) {
          throw new Error("Unternehmensinformationen nicht gefunden")
        }

        setCompany(savedCompany)

        // Statistiken laden
        await loadStats(savedCompany.id)
      } catch (err: any) {
        console.error("Admin-Dashboard Fehler:", err)
        setError(err.message || "Ein Fehler ist aufgetreten")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadStats = async (companyId: string) => {
    try {
      // Anzahl der Benutzer im Unternehmen zählen
      const { count: userCount, error: userError } = await supabase
        .from("company_members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)

      // Anzahl der Workspaces zählen
      const { count: workspaceCount, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)

      // Anzahl der Nachrichten zählen
      const { count: messageCount, error: messageError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)

      setStats({
        userCount: userCount || 0,
        workspaceCount: workspaceCount || 0,
        messageCount: messageCount || 0
      })
    } catch (err) {
      console.error("Fehler beim Laden der Statistiken:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto size-12 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-3 text-xl font-medium text-gray-500">
            Lade Admin-Dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="flex justify-center space-x-4">
            <a
              href="/login"
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Zum Login
            </a>
            <a
              href="/"
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Zur Startseite
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            {company && (
              <span className="ml-4 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {company.name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && <span className="text-sm text-gray-500">{userEmail}</span>}
            <a
              href="/"
              className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Zurück zur App
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistik-Karten */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0 rounded-md bg-blue-500 p-3">
                  <svg
                    className="size-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Benutzer
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {stats.userCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a
                  href="/admin/users"
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  Benutzer verwalten &rarr;
                </a>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0 rounded-md bg-green-500 p-3">
                  <svg
                    className="size-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Workspaces
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {stats.workspaceCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a
                  href="/admin/workspaces"
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  Workspaces verwalten &rarr;
                </a>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0 rounded-md bg-purple-500 p-3">
                  <svg
                    className="size-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Nachrichten
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {stats.messageCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a
                  href="/admin/analytics"
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  Analysen anzeigen &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-700">
                Administrative Funktionen
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              <a href="/admin/users" className="block p-6 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-blue-100 p-2">
                    <svg
                      className="size-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Benutzerverwaltung
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Hinzufügen, Bearbeiten und Verwalten von Benutzern im
                      System.
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/admin/workspaces"
                className="block p-6 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-green-100 p-2">
                    <svg
                      className="size-5 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Workspace-Verwaltung
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Verwalten von Workspaces und deren Berechtigungen.
                    </p>
                  </div>
                </div>
              </a>

              <a href="/admin/knowledge" className="block p-6 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-yellow-100 p-2">
                    <svg
                      className="size-5 text-yellow-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Wissensdatenbank
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Verwaltung der Wissenspakete und Zugriffe.
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-700">
                Firmeneinstellungen
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              <a href="/admin/company" className="block p-6 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-indigo-100 p-2">
                    <svg
                      className="size-5 text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Unternehmensprofil
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Bearbeiten der Unternehmensinformationen und
                      Einstellungen.
                    </p>
                  </div>
                </div>
              </a>

              <a href="/admin/billing" className="block p-6 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-red-100 p-2">
                    <svg
                      className="size-5 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Abrechnung & Lizenz
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Verwaltung des Abonnements und der Lizenzoptionen.
                    </p>
                  </div>
                </div>
              </a>

              <a href="/admin/settings" className="block p-6 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="shrink-0 rounded-md bg-gray-100 p-2">
                    <svg
                      className="size-5 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Systemeinstellungen
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Konfiguration der Systemparameter und Funktionen.
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
