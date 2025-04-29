import React, { useState, useEffect } from "react"
import { X, Save, User } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

interface UserProfile {
  full_name: string
  role: string
  preferred_language: string
  company_name: string
  communication_style: string
  expertise: string
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    role: "",
    preferred_language: "Deutsch",
    company_name: "",
    communication_style: "Standard",
    expertise: ""
  })

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile()
    }
  }, [isOpen, userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      console.log("Fetching profile for userId:", userId)

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, role, preferred_language, company_name, communication_style, expertise"
        )
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
      } else if (data) {
        console.log("Retrieved profile data:", data)
        setProfile({
          full_name: data.full_name || "",
          role: data.role || "",
          preferred_language: data.preferred_language || "Deutsch",
          company_name: data.company_name || "",
          communication_style: data.communication_style || "Standard",
          expertise: data.expertise || ""
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveUserProfile = async () => {
    try {
      setLoading(true)
      console.log("Saving profile for userId:", userId)
      console.log("Profile data to save:", profile)

      // Prüfen, ob Profil bereits existiert
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 ist "nicht gefunden"
        console.error("Error checking for existing profile:", checkError)
        alert(
          "Fehler beim Speichern der Einstellungen. Bitte versuche es erneut."
        )
        return
      }

      let error

      if (existingProfile) {
        // Profil existiert - UPDATE
        console.log("Updating existing profile")
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: profile.full_name,
            role: profile.role,
            preferred_language: profile.preferred_language,
            company_name: profile.company_name,
            communication_style: profile.communication_style,
            expertise: profile.expertise,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId)

        error = updateError
      } else {
        // Profil existiert nicht - INSERT
        console.log("Creating new profile")
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          full_name: profile.full_name,
          role: profile.role,
          preferred_language: profile.preferred_language,
          company_name: profile.company_name,
          communication_style: profile.communication_style,
          expertise: profile.expertise,
          updated_at: new Date().toISOString()
        })

        error = insertError
      }

      if (error) {
        console.error("Error saving user profile:", error)
        alert(
          "Fehler beim Speichern der Einstellungen. Bitte versuche es erneut."
        )
      } else {
        console.log("Profile saved successfully")
        onClose()
      }
    } catch (error) {
      console.error("Error saving user profile:", error)
      alert(
        "Fehler beim Speichern der Einstellungen. Bitte versuche es erneut."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Persönliche Einstellungen
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#cccccc] transition-all hover:bg-[#333333] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-4 text-[#cccccc]">
            Passe deine persönlichen Einstellungen an, damit die KI besser auf
            deine Bedürfnisse eingehen kann.
          </p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Name
              </label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none"
                placeholder="Dein vollständiger Name"
              />
            </div>

            {/* Rolle */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Rolle
              </label>
              <input
                type="text"
                name="role"
                value={profile.role}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none"
                placeholder="z.B. Softwareentwickler, Projektmanager"
              />
            </div>

            {/* Sprache */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Bevorzugte Sprache
              </label>
              <select
                name="preferred_language"
                value={profile.preferred_language}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Deutsch">Deutsch</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* Unternehmen */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Unternehmen
              </label>
              <input
                type="text"
                name="company_name"
                value={profile.company_name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none"
                placeholder="Name deines Unternehmens"
              />
            </div>

            {/* Kommunikationsstil */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Kommunikationsstil
              </label>
              <select
                name="communication_style"
                value={profile.communication_style}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Standard">Standard</option>
                <option value="Formell">Formell</option>
                <option value="Informell">Informell</option>
                <option value="Prägnant">Prägnant</option>
                <option value="Ausführlich">Ausführlich</option>
              </select>
            </div>

            {/* Expertise / Fachwissen */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#cccccc]">
                Expertise / Fachwissen
              </label>
              <textarea
                name="expertise"
                value={profile.expertise}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg border border-[#333333] bg-[#2d2d2d] px-3 py-2 text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none"
                placeholder="Deine Fachgebiete und Kenntnisse"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#333333] px-4 py-2 text-sm text-[#cccccc] transition-all hover:border-[#444444] hover:text-white"
          >
            Abbrechen
          </button>
          <button
            onClick={saveUserProfile}
            disabled={loading}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/50 disabled:text-white/70"
          >
            {loading ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Speichern...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
