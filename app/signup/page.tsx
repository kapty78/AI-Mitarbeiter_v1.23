"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validierungen
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      setLoading(false)
      return
    }

    try {
      // 1. Benutzer erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (authError) throw authError
      if (!authData.user)
        throw new Error("Benutzer konnte nicht erstellt werden.")

      const userId = authData.user.id

      // 2. Persönlichen Workspace erstellen
      console.log("Creating personal workspace for user:", userId)
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          user_id: userId,
          name: "Persönlicher Bereich",
          is_home: true
        })
        .select()
        .single()

      if (workspaceError) {
        console.error("Error creating personal workspace:", workspaceError)
        throw workspaceError
      }
      if (!workspaceData)
        throw new Error("Persönlicher Workspace konnte nicht erstellt werden.")

      const workspaceId = workspaceData.id
      console.log("Personal workspace created with ID:", workspaceId)

      // 3. Benutzer als Owner zum persönlichen Workspace hinzufügen
      console.log(`Adding user ${userId} as owner to workspace ${workspaceId}`)
      const { error: membershipError } = await supabase
        .from("workspace_members")
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          role: "owner"
        })

      if (membershipError) {
        console.error("Error creating workspace membership:", membershipError)
        throw membershipError
      }
      console.log("Workspace membership created successfully.")

      // 4. Unternehmen erstellen (falls Firmenname angegeben wurde)
      if (companyName) {
        console.log("Creating company (optional):", companyName)
        const domain =
          companyName.toLowerCase().replace(/[^a-z0-9]/g, "") +
          ".app.ecomtask.cloud"
        const { error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyName,
            domain: domain,
            created_by: userId
          })
        if (companyError) {
          console.error(
            "Fehler beim Erstellen des Unternehmens (optional):",
            companyError
          )
        } else {
          console.log("Company created successfully (optional).")
        }
      }

      setSuccess(
        "Registrierung erfolgreich! Persönlicher Workspace erstellt. Bitte E-Mail bestätigen."
      )
      // Optional: Nach erfolgreicher Registrierung zur Login-Seite weiterleiten
      // setTimeout(() => router.push("/login"), 3000)
    } catch (err: any) {
      let message = "Ein unbekannter Fehler ist aufgetreten."
      if (err.message) {
        message = `Fehler bei der Registrierung: ${err.message}`
      } else if (typeof err === "string") {
        message = err
      }
      console.error("Fehler im Signup-Prozess:", err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Left Sidebar - ChatGPT style */}
      <div className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-black">
        <div className="flex h-20 items-center justify-center border-b border-white/10 px-4">
          <Link href="/" className="text-2xl font-bold text-white">
            <img
              src="https://framerusercontent.com/images/jep8u4MpurfbwZZlQqg0mq8kA.svg?scale-down-to=512"
              alt="EcomTask"
              className="h-12"
            />
          </Link>
        </div>

        <div className="flex-1 p-4">
          <nav className="space-y-4">
            <Link
              href="#strategie"
              className="block rounded px-3 py-2 text-white/70 transition hover:text-white"
            >
              Strategie & Architektur
            </Link>
            <Link
              href="#ai-mitarbeiter"
              className="block rounded px-3 py-2 text-white/70 transition hover:text-white"
            >
              AI-Mitarbeiter
            </Link>
            <Link
              href="#start"
              className="block rounded px-3 py-2 text-white/70 transition hover:text-white"
            >
              Jetzt Starten
            </Link>
            <Link
              href="#projekte"
              className="block rounded px-3 py-2 text-white/70 transition hover:text-white"
            >
              Projekte
            </Link>
            <Link
              href="#hub"
              className="block rounded px-3 py-2 text-white/70 transition hover:text-white"
            >
              AI-Hub
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/login"
            className="block w-full rounded bg-[var(--primary-color)] py-2 text-center text-white transition hover:bg-[var(--secondary-color)]"
          >
            Anmelden
          </Link>
        </div>
      </div>

      {/* Main Content - Registration Form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Neues Konto erstellen
            </h1>
            <p className="text-white/60">
              Erstellen Sie ein Konto, um EcomTask zu nutzen
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[var(--primary-color)]/10 border-[var(--primary-color)]/50 mb-6 rounded-md border p-3 text-[var(--primary-color)]">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="name@unternehmen.de"
                required
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Unternehmen (optional)
              </label>
              <input
                id="company"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="Ihr Unternehmen"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#202123] px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--primary-color)] py-3 font-medium text-white transition-colors hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <svg
                    className="-ml-1 mr-2 size-4 animate-spin text-white"
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
                  Registrierung läuft...
                </span>
              ) : (
                "Registrieren"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60">
              Bereits ein Konto?{" "}
              <Link
                href="/login"
                className="text-[var(--primary-color)] hover:underline"
              >
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
