"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@supabase/supabase-js"

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setCurrentUser(data.user)
          console.log("Current user:", data.user)
        }
      } catch (error) {
        console.error("Error checking current user:", error)
      }
    }

    checkCurrentUser()
  }, [])

  // Simple demo with just the current user
  if (loading) {
    return <div className="p-4">Loading user information...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">EcomTask AI Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="text-lg font-semibold">Current User</h2>
              {currentUser ? (
                <div className="mt-2">
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                  <p>
                    <strong>ID:</strong> {currentUser.id}
                  </p>
                  <p>
                    <strong>Role:</strong>{" "}
                    {currentUser.app_metadata?.role ||
                      currentUser.user_metadata?.role ||
                      "user"}
                  </p>
                </div>
              ) : (
                <p>No user logged in</p>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h2 className="text-lg font-semibold">System Status</h2>
              <p className="mt-2">The system is running normally.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
