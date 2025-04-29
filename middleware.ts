import { NextResponse, type NextRequest } from "next/server"

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(request: NextRequest) {
  // Completely disabled for debugging purposes
  console.log("Middleware: Request path:", request.nextUrl.pathname)
  
  // Return "OK" for all requests
  return NextResponse.next()
}
