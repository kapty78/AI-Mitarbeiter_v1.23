/**
 * Utility for making SerpAPI calls via our server proxy
 */

export interface SerpApiSearchResult {
  position: number
  title: string
  link: string
  snippet: string
  source?: string
}

export async function performSerpApiSearch(
  query: string
): Promise<SerpApiSearchResult[]> {
  try {
    console.log("Starting search for:", query)

    // Use our API route with the correct base URL
    // In development, this will be something like http://localhost:3000
    // In production, this would be your domain
    const baseUrl = window.location.origin
    const url = `${baseUrl}/api/search?q=${encodeURIComponent(query)}`

    console.log("Fetching from URL:", url)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(
        `Search request failed with status ${response.status}: ${errorText}`
      )
    }

    const data = await response.json()
    console.log("Received data from API:", data)

    // Extract organic results from the response
    const organicResults = data.organic_results || []
    console.log("Found organic results:", organicResults.length)

    // Transform into our format
    return organicResults.map((result: any, index: number) => ({
      position: index + 1,
      title: result.title || "",
      link: result.link || "",
      snippet: result.snippet || "",
      source: "Web Search"
    }))
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

// Format search results into a readable text format
export function formatSearchResults(results: SerpApiSearchResult[]): string {
  if (results.length === 0) {
    return "Keine Suchergebnisse gefunden."
  }

  return results
    .map(
      result =>
        `[${result.position}] ${result.title}\n${result.link}\n${result.snippet}\n`
    )
    .join("\n")
}

// Format search results for AI consumption
export function formatSearchResultsForAI(
  results: SerpApiSearchResult[]
): string {
  if (results.length === 0) {
    return "No search results found."
  }

  return results
    .map(
      result =>
        `Source ${result.position}: ${result.title}\nURL: ${result.link}\nSummary: ${result.snippet}`
    )
    .join("\n\n")
}
