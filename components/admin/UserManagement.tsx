"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"

interface UserManagementProps {
  companyId: string | null
}

export function UserManagement({ companyId }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchUsers() {
      if (!companyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("company_id", companyId)

        if (error) throw error

        setUsers(data || [])
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Benutzer")
        console.error("Fehler beim Laden der Benutzer:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [companyId, supabase])

  if (loading) {
    return <div className="flex justify-center p-8">Lade Benutzer...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Fehler: {error}</div>
  }

  if (!companyId) {
    return <div className="p-4">Bitte wählen Sie zuerst eine Firma aus.</div>
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Benutzerverwaltung</h1>

      {users.length === 0 ? (
        <p>Keine Benutzer gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">E-Mail</th>
                <th className="p-2 text-left">Rolle</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-gray-700">
                  <td className="p-2">{user.full_name || "N/A"}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role || "Benutzer"}</td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        user.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : user.status === "invited"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {user.status === "active"
                        ? "Aktiv"
                        : user.status === "invited"
                          ? "Eingeladen"
                          : "Inaktiv"}
                    </span>
                  </td>
                  <td className="p-2">
                    <button className="mr-2 text-blue-400 hover:text-blue-300">
                      Bearbeiten
                    </button>
                    <button className="text-red-400 hover:text-red-300">
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
