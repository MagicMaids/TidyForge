import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { propertyId, icalUrl } = await request.json()

    if (!propertyId || !icalUrl) {
      return NextResponse.json({ error: "Property ID and iCal URL are required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { error } = await supabase
      .from("properties")
      .update({
        airbnb_ical_url: icalUrl,
        calendar_sync_enabled: true,
        calendar_sync_error: null, // Clear any previous errors
      })
      .eq("id", propertyId)

    if (error) {
      console.error("[v0] Error updating iCal URL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
