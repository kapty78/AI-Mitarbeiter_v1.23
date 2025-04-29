"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(
          "Eine E-Mail mit einem Link zum Zurücksetzen des Passworts wurde versendet."
        )
      }
    } catch (err: any) {
      setError(err.message || "Ein unbekannter Fehler ist aufgetreten.")
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
            href="/signup"
            className="block w-full rounded border border-white/20 py-2 text-center text-white/80 transition hover:bg-white/10"
          >
            Neues Konto erstellen
          </Link>
        </div>
      </div>

      {/* Main Content - Password Reset Form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Passwort zurücksetzen
            </h1>
            <p className="text-white/60">
              Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
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

          <form onSubmit={handleResetPassword} className="space-y-6">
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
                  Wird gesendet...
                </span>
              ) : (
                "Link senden"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-[var(--primary-color)] hover:underline"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
