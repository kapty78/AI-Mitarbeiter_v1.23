"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import {
  getSavedDomain,
  saveDomain,
  normalizeDomain,
  formatEmailWithDomain,
  saveCompany,
  CompanyInfo
} from "@/lib/domain-manager"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function Login() {
  const [domain, setDomain] = useState("")
  const [step, setStep] = useState<"domain" | "login">("domain")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  const supabase = createClientComponentClient()
  const router = useRouter()

  // Domain aus localStorage laden, wenn vorhanden
  useEffect(() => {
    const savedDomain = getSavedDomain()
    if (savedDomain) {
      setDomain(savedDomain)
    }
    // Finish initial loading check
    const timer = setTimeout(() => setIsPageLoading(false), 300) // Short delay for effect
    return () => clearTimeout(timer) // Cleanup timer
  }, [])

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!domain) {
      setError("Bitte gib einen Account-Namen ein")
      setLoading(false)
      return
    }

    try {
      // Account-Name in Domain-Format umwandeln
      const accountName = domain.replace(".app.ecomtask.cloud", "").trim()
      const fullDomain = `${accountName}.app.ecomtask.cloud`

      console.log(
        "Login: Prüfe Account:",
        accountName,
        "mit Domain:",
        fullDomain
      )

      // Domain gegen die companies-Tabelle validieren
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id, name, domain")
        .or(`domain.eq.${fullDomain},domain.eq.${accountName}`)
        .maybeSingle()

      console.log("Login: Supabase Ergebnis:", companyData, companyError)

      if (companyError) {
        throw new Error(
          `Fehler bei der Accountprüfung: ${companyError.message}`
        )
      }

      if (!companyData) {
        setError(
          `Der Account "${accountName}" wurde nicht gefunden. Bitte prüfe deine Eingabe oder kontaktiere den Administrator.`
        )
        setLoading(false)
        return
      }

      console.log(
        "Login: Unternehmen gefunden:",
        companyData.name,
        companyData.id
      )

      // Unternehmensdaten speichern
      const companyInfo: CompanyInfo = {
        id: companyData.id,
        name: companyData.name,
        domain: companyData.domain
      }

      setCompany(companyInfo)
      saveCompany(companyInfo)

      // Domain speichern
      saveDomain(companyData.domain)

      // Domain-State aktualisieren und zum Login wechseln
      setDomain(companyData.domain)
      setStep("login")
    } catch (err: any) {
      console.error("Domain validation error:", err)
      setError(err.message || "Fehler bei der Accountprüfung")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Login: Versuche Anmeldung mit Email:", email)

      // Anmeldung mit Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formatEmailWithDomain(email, domain),
        password
      })

      if (error) {
        setError(`Login fehlgeschlagen: ${error.message}`)
      } else if (data.user) {
        setSuccess("Login successful")

        // Save domain and company info for next time if available
        if (company) {
          saveCompany(company)
        }
        if (domain) {
          saveDomain(domain)
        }

        // Session verfügbar machen
        console.log(
          "Login: Session:",
          data.session ? "Vorhanden" : "Nicht vorhanden"
        )
        console.log("Login: Session-Ablaufzeit:", data.session?.expires_at)

        // Nochmalige Prüfung der Session (optional, für Debugging)
        const {
          data: { session }
        } = await supabase.auth.getSession()
        console.log(
          "Login: Nachträglicher Session-Check:",
          session ? "Session aktiv" : "Kein Session"
        )

        if (!session) {
          throw new Error("Keine gültige Session gefunden nach Login")
        }

        // Prüfen, ob es eine Firmenzuordnung gibt
        // REMOVED re-declarations below to fix scope issue
        // let company: any = null
        // let domain: string | null = null

        // Laden des Benutzerdetails
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (userData?.company_id) {
          // Wenn der Benutzer eine Firma hat, diese laden
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("*")
            .eq("id", userData.company_id)
            .single()

          if (!companyError && companyData) {
            // Wenn der Benutzer eine Firma hat, diese laden
            console.log("Login: Firma gefunden:", companyData.name)
            saveCompany(companyData)
            if (companyData.domain) {
              saveDomain(companyData.domain)
            }
          }
        } else {
          // Alternative: Prüfen, ob der Benutzer ein Admin einer Firma ist
          const { data: adminData, error: adminError } = await supabase
            .from("company_admins")
            .select("*, companies(*)")
            .eq("user_id", session.user.id)
            .maybeSingle()

          if (!adminError && adminData?.companies) {
            // Wenn der Benutzer ein Admin einer Firma ist, diese laden
            console.log("Login: Firma gefunden:", adminData.companies.name)
            saveCompany(adminData.companies)
            if (adminData.companies.domain) {
              saveDomain(adminData.companies.domain)
            }
          }
        }

        // Workspaces des Benutzers laden
        console.log("Login: Lade Workspaces für User:", session.user.id)
        const { data: workspaces, error: workspacesError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", session.user.id)

        if (workspacesError) {
          console.error(
            "Login: Fehler beim Laden der Workspaces:",
            workspacesError
          )
        }

        console.log(
          "Login:",
          workspaces?.length
            ? `${workspaces.length} Workspaces gefunden`
            : "Keine Workspaces gefunden"
        )

        // Wenn keine Workspaces gefunden wurden, erstellen wir einen Standard-Workspace
        if (!workspaces || workspaces.length === 0) {
          console.log("Login: Erstelle Standard-Workspace für User")

          try {
            // Direkter API-Call für workspaces-Tabelle
            const workspaceResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/workspaces`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                  apikey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                  Prefer: "return=representation"
                },
                body: JSON.stringify({
                  name: "Persönlich",
                  description: "Persönlicher Standard-Workspace",
                  user_id: session.user.id,
                  is_home: true
                })
              }
            )

            if (workspaceResponse.ok) {
              const newWorkspace = await workspaceResponse.json()
              if (
                newWorkspace &&
                newWorkspace.length > 0 &&
                newWorkspace[0].id
              ) {
                console.log(
                  "Login: Persönlicher Standard-Workspace erstellt:",
                  newWorkspace[0].id
                )
                router.push(`/dashboard?workspace=${newWorkspace[0].id}`)
                return
              } else {
                console.error(
                  "Login: Fehlerhafte Antwort beim Erstellen des Workspaces:",
                  newWorkspace
                )
                setError("Fehler beim Verarbeiten der Workspace-Erstellung.")
                router.push("/dashboard")
                return
              }
            } else {
              const errorText = await workspaceResponse.text()
              console.error(
                "Login: Fehler beim Erstellen des Standard-Workspaces (API-Fehler):",
                workspaceResponse.status,
                errorText
              )
              setError(
                `Fehler ${workspaceResponse.status} beim Erstellen des Workspaces.`
              )
              router.push("/dashboard")
              return
            }
          } catch (err) {
            console.error(
              "Login: Kritischer Fehler beim Erstellen des Standard-Workspaces (Catch-Block):",
              err
            )
            setError(
              "Ein kritischer Fehler ist beim Erstellen des Workspaces aufgetreten."
            )
            router.push("/dashboard")
            return
          }
        }

        // Zum ersten Workspace des Benutzers leiten oder zum Dashboard
        if (workspaces && workspaces.length > 0) {
          const homeWorkspace = workspaces.find(w => w.is_home) || workspaces[0]
          router.push(`/dashboard?workspace=${homeWorkspace.id}`)
        } else {
          // Fallback - sollte nicht mehr erreicht werden
          router.push("/dashboard")
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDomain = () => {
    setStep("domain")
    setError(null)
  }

  const loadDemoCompany = async () => {
    try {
      setLoading(true)

      // Demo-Unternehmen aus der Datenbank laden
      const { data: demoCompany, error: demoError } = await supabase
        .from("companies")
        .select("*")
        .eq("is_demo", true)
        .maybeSingle()

      if (demoError || !demoCompany) {
        throw new Error("Demo-Unternehmen konnte nicht geladen werden")
      }

      // Demo-Unternehmen speichern
      const companyInfo: CompanyInfo = {
        id: demoCompany.id,
        name: demoCompany.name,
        domain: demoCompany.domain
      }

      setCompany(companyInfo)
      saveCompany(companyInfo)
      saveDomain(demoCompany.domain)

      // Demo-Benutzer aus der Datenbank laden
      const { data: demoUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", "demo@ecomtask.cloud")
        .maybeSingle()

      if (userError || !demoUser) {
        throw new Error("Demo-Benutzer konnte nicht geladen werden")
      }

      // Demo-Login durchführen
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@ecomtask.cloud",
        password: "demo1234"
      })

      if (error) throw error

      // Zum Dashboard weiterleiten
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Demo login error:", err)
      setError(
        "Demo-Login fehlgeschlagen: " + (err.message || "Unbekannter Fehler")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1e1e] p-4 text-white">
      {/* TODO: Insert SVG Logo Component here - Replaced below */}
      {/* <div className="mb-10 text-2xl font-medium">* Placeholder for Logo *</div> */}
      <div className="mb-4">
        <Image
          src="/logos/k-logo.svg"
          alt="EcomTask Logo"
          width={216}
          height={54}
          priority
        />
      </div>
      <p className="mb-8 text-center text-sm text-white">
        {step === "domain"
          ? "Sign in ecomtask cloud"
          : "Melden Sie sich bei Ihrem Account an"}
      </p>
      {step === "domain" ? (
        <div className="flex w-full max-w-sm flex-col items-center">
          <form onSubmit={handleDomainSubmit} className="w-full space-y-5">
            <div>
              <label
                htmlFor="accountName"
                className="mb-1 block text-xs font-medium text-gray-400"
              >
                account name
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  id="accountName"
                  name="accountName"
                  type="text"
                  value={domain.replace(".app.ecomtask.cloud", "")}
                  onChange={e =>
                    setDomain(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")
                    )
                  }
                  className="block w-full rounded-l-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                  required
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-[#444444] bg-[#444444] px-3 text-sm text-gray-400">
                  .app.ecomtask.cloud
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-white px-4 py-3 font-semibold text-[#1e1e1e] transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e] disabled:opacity-50"
            >
              {loading ? "Prüfe..." : "Weiter"}
            </button>
            {error && (
              <p className="mt-2 text-center text-sm text-red-400">{error}</p>
            )}
            <button
              type="button"
              onClick={loadDemoCompany}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e] disabled:opacity-50"
            >
              Demo-Account verwenden
            </button>
          </form>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-400">Neues Unternehmen? </span>
            <Link
              href="/register"
              className="text-sm text-white hover:underline"
            >
              Registrieren
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center">
          <h1 className="mb-6 text-center text-3xl font-semibold text-white">
            Willkommen zurück
          </h1>
          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder=" "
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="peer block w-full rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white focus:border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#555555]"
              />
              <label
                htmlFor="email"
                className="absolute start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 px-2 text-sm text-gray-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-white rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
              >
                E-Mail-Adresse
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder=" "
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="peer block w-full rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white focus:border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#555555]"
              />
              <label
                htmlFor="password"
                className="absolute start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 px-2 text-sm text-gray-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-white rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
              >
                Passwort
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-white px-4 py-3 font-semibold text-[#1e1e1e] transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e] disabled:opacity-50"
            >
              {loading ? "Anmelden..." : "Weiter"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-400">
              Du hast noch kein Konto?{" "}
            </span>
            <Link
              href="/register"
              className="text-sm text-white hover:underline"
            >
              Registrieren
            </Link>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#444444]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1e1e1e] px-2 text-gray-400">ODER</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e]">
              <svg className="mr-2 size-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Mit Google fortsetzen
            </button>
            <button className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e]">
              <svg className="mr-2 size-5" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z"></path>
                <path fill="#00a4ef" d="M1 11h9v9H1z"></path>
                <path fill="#7fba00" d="M11 1h9v9h-9z"></path>
                <path fill="#ffb900" d="M11 11h9v9h-9z"></path>
              </svg>
              Mit Microsoft-Konto fortsetzen
            </button>
            <button className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e]">
              <svg
                className="mr-2 size-5"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8.282.07C6.317.01 4.732.864 3.53 2.487c-1.256 1.69-.99 4.34.62 6.128.956 1.07 2.133 1.754 3.415 1.773 1.273.02 2.63-.83 3.638-1.844.994-1.004 1.38-2.586 1.404-2.613a.28.28 0 0 0-.26-.358c-.12 0-.22.08-.24.107-.03.039-1.04 1.253-2.52 1.225-1.47-.028-2.54-1.06-3.49-2.148-.95-.1.09-2.15-.118-2.85-.934-.695-2.388-.935-3.276-.97C2.18.31 3.825.014 5.33.014c.13 0 .25-.002.373-.003.175 0 .34-.004.502-.004.35 0 .74.01 1.12.032.46.027.867.06 1.19.082.27.02.48.032.61.038.14.008.29.012.45.012.16.002.33.002.51.002zm-.56 5.954c.02-.01.17-.11.41-.28.26-.18.55-.37.87-.55.7-.39 1.34-.65 1.9-.78.56-.13 1.06-.16 1.49-.16.12 0 .24-.002.37-.002.08 0 .16-.002.25-.002.1 0 .19.002.29.002.1 0 .19.002.27.004.07.002.13.004.18.004.05.002.09.004.11.004.03 0 .05.002.06.002.03.002.06.002.09.002.01 0 .02-.002.03-.002.03 0 .05.002.07.002.09.002.16.004.2.004.04 0 .07.002.08.002.01 0 .02 0 .03.002.01 0 .02 0 .03.002l.02.002c.01 0 .02 0 .03.002.02 0 .03.002.04.002.02 0 .03.002.03.002.01 0 .01.002.01.002.01 0 .01.002.01.002.01.002.01.002v-.002a.41.41 0 0 0-.37-.425c-.09-.014-.2-.025-.34-.036-.14-.01-.3-.018-.48-.022-.19-.002-.38-.004-.58-.004-.1-.002-.2-.002-.3-.002-.1 0-.2-.002-.3-.002-.1 0-.2-.002-.3-.002-.1 0-.2-.002-.29-.002-.08 0-.15-.002-.22-.002-.12 0-.23.002-.34.002-.5 0-1.06.04-1.66.19-.6.15-1.3.44-2.05.86-.3.18-.59.37-.87.56-.28.19-.55.4-.79.61-.25.21-.48.43-.69.66-.21.23-.4.46-.57.7-.17.24-.32.48-.45.72-.13.24-.24.49-.33.74-.09.25-.17.5-.23.75-.06.25-.1.5-.13.75-.03.25-.04.5-.04.75 0 .25.01.5.04.75.03.25.07.5.13.75.06.25.14.5.23.75.09.25.19.49.33.74.13.24.28.48.45.72.17.24.36.47.57.7.21.23.44.45.69.66.24.21.51.42.79.61.28.19.57.38.87.56.75.42 1.45.71 2.05.86.6.15 1.16.19 1.66.19.11 0 .22.002.34.002.07 0 .14.002.22.002.1 0 .2.002.29.002.1 0 .2.002.3.002.1 0 .2.002.3.002.1 0 .2.002.3.002.2 0 .39-.002.58-.004.18-.004.34-.012.48-.022.14-.01.25-.022.34-.036a.41.41 0 0 0 .37-.425v-.002l-.01-.002-.01-.002-.01-.002-.01-.002-.03-.002-.03-.002c-.01 0-.02-.002-.04-.002-.01 0-.02-.002-.03-.002-.01 0-.02-.002-.03-.002h-.03c-.01 0-.02 0-.03-.002l-.08-.002c-.04-.002-.11-.004-.2-.004-.02 0-.04-.002-.07-.002-.01 0-.03-.002-.06-.002-.02 0-.04-.002-.07-.002-.08-.002-.17-.004-.27-.004-.1-.002-.19-.002-.29-.002-.09 0-.17-.002-.25-.002-.13 0-.25-.002-.37-.002-.43 0-.93.03-1.49.16-.56.13-1.2.39-1.9.78-.32.18-.61.37-.87.55-.24.17-.4.27-.41.28a.3.3 0 0 0 0 .43zm1.75 1.13c.68.81 1.68 1.27 2.71 1.27.92 0 1.74-.35 2.45-1.02.8-.72 1.18-1.77.88-2.94-.57-2.26-2.77-3.77-4.75-3.77-2.02 0-4.07 1.53-4.74 3.77-.3 1.17.08 2.22.87 2.94.71.67 1.53 1.02 2.45 1.02.1 0 .19-.01.28-.02z"></path>
              </svg>
              Mit Apple fortsetzen
            </button>
            <button className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-4 py-3 text-white transition-colors hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e1e1e]">
              <svg
                className="mr-2 size-5"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6 13h-1v-1h1zm-3 0h-1v-1h1zm-3 0H4v-1h1zm3-2h-1v-1h1zm-3 0H4v-1h1zm6-1h-1V8h1zm-3 0h-1V8h1zm-3 0H4V8h1z" />
              </svg>
              Weiter mit Smartphone
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            <Link href="/terms" className="hover:underline">
              Nutzungsbedingungen
            </Link>
            <span className="mx-2">|</span>
            <Link href="/privacy" className="hover:underline">
              Datenschutzrichtlinie
            </Link>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}
          {success && (
            <p className="mt-4 text-center text-sm text-green-400">{success}</p>
          )}

          <button
            onClick={handleBackToDomain}
            className="mt-4 text-sm text-gray-400 hover:text-white hover:underline"
          >
            Zurück zur Account-Auswahl
          </button>
        </div>
      )}
    </div>
  )
}
