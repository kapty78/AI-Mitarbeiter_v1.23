"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

type RegisterStep = "company" | "admin"

export default function Register() {
  // State für den Registrierungsprozess
  const [step, setStep] = useState<RegisterStep>("company")

  // Firmendaten
  const [companyName, setCompanyName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Admin-Daten
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI-States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Unternehmen registrieren
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validierungen
      if (!companyName.trim()) {
        throw new Error("Bitte geben Sie einen Unternehmensnamen ein")
      }

      if (!accountName.trim()) {
        throw new Error("Bitte geben Sie einen Account-Namen ein")
      }

      // Prüfen ob der Account-Name bereits existiert
      const domain = `${accountName.toLowerCase().replace(/[^a-z0-9]/g, "")}.app.ecomtask.cloud`
      const { data: existingCompany, error: checkError } = await supabase
        .from("companies")
        .select("id")
        .or(`domain.eq.${domain}`)
        .maybeSingle()

      if (checkError) {
        throw new Error(`Fehler bei der Überprüfung: ${checkError.message}`)
      }

      if (existingCompany) {
        throw new Error(
          `Der Account-Name "${accountName}" ist bereits vergeben. Bitte wählen Sie einen anderen Namen.`
        )
      }

      // Unternehmen in der Datenbank erstellen
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: companyName.trim(),
          domain: domain
        })
        .select("id")
        .single()

      if (error) {
        throw new Error(
          `Fehler beim Erstellen des Unternehmens: ${error.message}`
        )
      }

      // Unternehmen erfolgreich erstellt, speichere ID für den nächsten Schritt
      setCompanyId(data.id)

      // Zum Admin-Formular wechseln
      setStep("admin")
      setSuccess("Unternehmen erfolgreich angelegt!")
    } catch (err: any) {
      setError(err.message || "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  // Admin-Account erstellen
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validierungen
      if (!adminName.trim()) {
        throw new Error("Bitte geben Sie einen Namen ein")
      }

      if (!adminEmail.trim()) {
        throw new Error("Bitte geben Sie eine E-Mail-Adresse ein")
      }

      if (adminPassword.length < 8) {
        throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein")
      }

      if (adminPassword !== confirmPassword) {
        throw new Error("Die Passwörter stimmen nicht überein")
      }

      if (!companyId) {
        throw new Error(
          "Unternehmens-ID fehlt. Bitte starten Sie den Prozess erneut."
        )
      }

      // DEBUG: Logge die Daten, die an signUp übergeben werden
      console.log("Register Page - Übergabe an signUp:", {
        email: adminEmail,
        fullName: adminName,
        companyId: companyId
      })

      // 1. Benutzer in Auth erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
            company_id: companyId
          }
        }
      })

      if (authError) {
        throw new Error(
          `Fehler bei der Erstellung des Accounts: ${authError.message}`
        )
      }

      if (!authData.user) {
        throw new Error("Benutzer konnte nicht erstellt werden")
      }

      // 2. Admin-Eintrag erstellen mit unserer API-Route
      try {
        const response = await fetch("/api/register-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: authData.user.id,
            companyId: companyId
          })
        })

        const data = await response.json()

        if (!response.ok) {
          console.error("Admin-Erstellung fehlgeschlagen:", data)
          throw new Error(
            `Fehler bei der Zuweisung der Admin-Rolle: ${data.error || response.statusText}`
          )
        }
      } catch (adminError) {
        console.error("Admin-Erstellung fehlgeschlagen:", adminError)
        throw new Error(
          `Fehler bei der Zuweisung der Admin-Rolle: ${adminError instanceof Error ? adminError.message : String(adminError)}`
        )
      }

      // Erfolgreich registriert!
      setSuccess(
        "Administrator-Konto erfolgreich erstellt! Sie können sich jetzt anmelden."
      )

      // Nach 2 Sekunden zum Login weiterleiten
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1e1e]">
      <div className="w-full max-w-sm bg-[0] px-4 py-8">
        <div className="mb-8 text-center">
          {/* TODO: Insert SVG Logo Component here - Replaced below */}
          {/* <div className="mb-2 text-2xl font-semibold text-white">* Placeholder for Logo *</div> */}
          <div className="mb-4 flex justify-center">
            <Image
              src="/logos/k-logo.svg"
              alt="EcomTask Logo"
              width={216}
              height={54}
              priority
            />
          </div>
          <p className="mb-8 text-center text-sm text-white">
            {step === "company"
              ? "Erstellen Sie ein neues Unternehmen"
              : "Erstellen Sie einen Admin-Account"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-[#444444] p-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-[#444444] p-3 text-center">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {step === "company" ? (
          <form onSubmit={handleRegisterCompany} className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Unternehmensname
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="block w-full rounded-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                placeholder="Muster GmbH"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                account name
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={accountName}
                  onChange={e =>
                    setAccountName(
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#1e1e1e] shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Unternehmen erstellen"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateAdmin} className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Ihr Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="block w-full rounded-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                placeholder="Max Mustermann"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="block w-full rounded-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                placeholder="max.mustermann@firma.de"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Passwort
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="block w-full rounded-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                placeholder="Mindestens 8 Zeichen"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border-0 bg-[#333333] px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-[#555555] sm:text-sm sm:leading-6"
                placeholder="Passwort wiederholen"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#1e1e1e] shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Admin-Account erstellen"}
              </button>
            </div>
          </form>
        )}

        {!success && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              <Link
                href="/login"
                className="font-medium text-white hover:text-gray-300"
              >
                Zurück zum Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
