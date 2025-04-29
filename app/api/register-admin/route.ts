import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js" // Import for admin client

// Ensure these environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  // Daten aus dem Request extrahieren
  const { userId, companyId } = await request.json()

  if (!userId || !companyId) {
    return NextResponse.json(
      { error: "User ID und Company ID sind erforderlich" },
      { status: 400 }
    )
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Supabase URL or Service Role Key is missing in environment variables."
    )
    return NextResponse.json(
      { error: "Serverkonfigurationsfehler." },
      { status: 500 }
    )
  }

  // Client for user context (e.g., calling RPC)
  const supabaseUserClient = createRouteHandlerClient({ cookies })

  // Admin Client for bypassing RLS (for creating workspace/member)
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false } // No need to persist session for admin client
  })

  try {
    // 1. Create company admin relationship (using user context or specific RPC)
    // Assuming 'create_company_admin' RPC correctly handles permissions
    const { error: rpcError } = await supabaseUserClient.rpc(
      "create_company_admin",
      {
        p_user_id: userId,
        p_company_id: companyId
      }
    )

    if (rpcError) {
      console.error("Error creating company admin via RPC:", rpcError)
      return NextResponse.json(
        { error: `Fehler bei der Admin-Zuweisung: ${rpcError.message}` },
        { status: 500 }
      )
    }

    // 2. Create personal workspace for the user (using Admin Client)
    try {
      let companyName = "Benutzer" // Default name
      try {
        // Fetch company name using Admin Client for reliability
        const { data: companyData, error: companyError } = await supabaseAdmin
          .from("companies")
          .select("name")
          .eq("id", companyId)
          .single()

        if (companyError) {
          console.warn(
            "Could not fetch company name for workspace:",
            companyError.message
          )
        } else if (companyData) {
          companyName = companyData.name
        }
      } catch (fetchErr) {
        console.warn("Exception fetching company name:", fetchErr)
      }

      // Insert workspace using Admin Client
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from("workspaces")
        .insert({
          name: `${companyName} Persönlich`, // Adjusted name
          description: `Persönlicher Arbeitsbereich für ${companyName}`,
          user_id: userId,
          is_home: true // Mark as home workspace
        })
        .select("id") // Only select the ID
        .single() // Expecting a single row back

      if (workspaceError) {
        console.error(
          "Error creating personal workspace with admin client:",
          workspaceError
        )
        // Log error but continue as admin role assignment was successful
      } else if (workspace) {
        console.log("Personal workspace created successfully:", workspace.id)
        // 3. Add user as owner member of their home workspace (using Admin Client)
        const { error: memberError } = await supabaseAdmin
          .from("workspace_members")
          .insert({
            workspace_id: workspace.id, // Use the ID returned from workspace insert
            user_id: userId,
            role: "owner" // User is owner of their home workspace
          })

        if (memberError) {
          console.error(
            "Error adding user to workspace members with admin client:",
            memberError
          )
          // Log error but continue
        }
      }
    } catch (wsError) {
      console.error("Error during workspace creation process:", wsError)
      // Log error but continue as admin role assignment was successful
    }

    // If we reached here, admin role assignment was successful
    return NextResponse.json({ success: true })
  } catch (err) {
    // Catch potential errors from the RPC call or unexpected issues
    console.error("Unexpected error in register-admin route:", err)
    const message =
      err instanceof Error
        ? err.message
        : "Ein unerwarteter Fehler ist aufgetreten"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
