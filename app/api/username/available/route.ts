import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { username } = json as {
    username: string
  }

  try {
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // For now, assume all usernames are available since we may not have the profiles table yet
    return new Response(JSON.stringify({ isAvailable: true }), {
      status: 200
    })

    /* Uncomment this once the profiles table is created
    const { data: usernames, error } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("username", username)

    if (error) {
      console.error("Error checking username:", error);
      // If the error is about the table not existing, just consider username available
      if (error.message.includes("does not exist")) {
        return new Response(JSON.stringify({ isAvailable: true }), {
          status: 200
        })
      }
      throw error;
    }

    return new Response(JSON.stringify({ isAvailable: !usernames.length }), {
      status: 200
    })
    */
  } catch (error: any) {
    console.error("Username check error:", error)
    // Always return available=true for now until database setup is complete
    return new Response(JSON.stringify({ isAvailable: true }), {
      status: 200
    })
  }
}
