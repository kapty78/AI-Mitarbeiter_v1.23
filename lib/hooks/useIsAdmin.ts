import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useUser } from "@/lib/hooks/useUser" // Annahme: Du hast einen Hook, der den aktuellen Benutzer liefert

export function useIsAdmin(companyId: string | null): {
  isAdmin: boolean
  isLoading: boolean
} {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClientComponentClient()
  const { user } = useUser() // Den aktuellen Supabase-Benutzer holen

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user || !companyId) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("company_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("company_id", companyId)
          .maybeSingle() // Es sollte nur einen Eintrag geben oder keinen

        if (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        } else {
          setIsAdmin(!!data) // Wenn Daten existieren (data ist nicht null), ist der User Admin
        }
      } catch (err) {
        console.error("Unexpected error in useIsAdmin:", err)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, companyId, supabase])

  return { isAdmin, isLoading }
}
