import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Authentication is now handled entirely in server components
  return NextResponse.next({
    request,
  })
}
