import { NextResponse } from "next/server"

const SERP_API_KEY =
  "f2b547257cc9ef9a22a5eab986c20edb6da44a15a142039d9648f6fa679d83a8"

export async function GET(request: Request) {
  console.log("API route called: /api/search")

  // Get the search query from the URL
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  console.log("Search query:", query)

  if (!query) {
    console.log("Error: No query parameter")
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    )
  }

  try {
    console.log("Calling SerpAPI with query:", query)

    // Build SerpAPI URL with additional parameters
    const serpApiUrl = new URL("https://serpapi.com/search.json")
    serpApiUrl.searchParams.append("q", query)
    serpApiUrl.searchParams.append("api_key", SERP_API_KEY)
    serpApiUrl.searchParams.append("hl", "de") // German language
    serpApiUrl.searchParams.append("gl", "de") // German locale
    serpApiUrl.searchParams.append("num", "10") // Number of results

    console.log("Using SerpAPI URL:", serpApiUrl.toString())

    // Make the request to SerpAPI from server-side
    const response = await fetch(serpApiUrl.toString())

    console.log("SerpAPI response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error from SerpAPI: ${response.status} - ${errorText}`)
      throw new Error(
        `SerpAPI request failed with status ${response.status}: ${errorText}`
      )
    }

    const data = await response.json()

    // Check if we have organic_results
    if (!data.organic_results || data.organic_results.length === 0) {
      console.log("No organic results found in SerpAPI response")
      console.log(
        "Response data:",
        JSON.stringify(data).substring(0, 200) + "..."
      )
    } else {
      console.log(
        "Got SerpAPI data, organic results count:",
        data.organic_results.length
      )
    }

    // Return the data to the client
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching search results:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch search results",
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}
