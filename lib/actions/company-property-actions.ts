"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { revalidatePath } from "next/cache"
import { scrapeAirbnbListing } from "@/lib/airbnb-scraper"
import { parseIcal } from "@/lib/ical-parser"

function detectUrlType(url: string): {
  type: "airbnb" | "ical" | "hostaway" | "guesty" | "hospitable" | "vrbo" | "booking"
  icalUrl?: string
  listingId?: string
} {
  const urlLower = url.toLowerCase()

  // Check for iCal URLs first (these are calendar feeds)
  if (url.includes(".ics") || url.includes("/ical/")) {
    // Hostaway
    if (urlLower.includes("hostaway.com")) {
      return { type: "hostaway", icalUrl: url }
    }
    // Guesty
    if (urlLower.includes("guesty.com")) {
      return { type: "guesty", icalUrl: url }
    }
    // Hospitable
    if (urlLower.includes("hospitable.com")) {
      return { type: "hospitable", icalUrl: url }
    }
    // Airbnb iCal
    if (urlLower.includes("airbnb.com")) {
      const listingIdMatch = url.match(/\/ical\/(\d+)\.ics/)
      return { type: "airbnb", icalUrl: url, listingId: listingIdMatch?.[1] }
    }
    // Generic iCal
    return { type: "ical", icalUrl: url }
  }

  // Check for listing page URLs
  if (urlLower.includes("airbnb.com/rooms/")) {
    const listingIdMatch = url.match(/\/rooms\/(\d+)/)
    return { type: "airbnb", listingId: listingIdMatch?.[1] }
  }

  if (urlLower.includes("vrbo.com")) {
    return { type: "vrbo" }
  }

  if (urlLower.includes("booking.com")) {
    return { type: "booking" }
  }

  return { type: "ical", icalUrl: url } // Default to treating as iCal URL
}

async function importFromIcalUrl(icalUrl: string, platformType: string) {
  console.log(`[v0] Fetching iCal from ${platformType}:`, icalUrl)

  // Fetch the iCal feed
  const response = await fetch(icalUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch iCal feed: ${response.status} ${response.statusText}`)
  }

  const icalData = await response.text()
  console.log("[v0] iCal data fetched, length:", icalData.length)

  // Parse the iCal to extract property info
  const events = parseIcal(icalData)

  if (events.length === 0) {
    throw new Error("No events found in calendar feed. Please ensure the calendar has at least one booking.")
  }

  let propertyName = "Imported Property"
  const calNameMatch = icalData.match(/X-WR-CALNAME:(.+)/)
  if (calNameMatch) {
    propertyName = calNameMatch[1].trim()
  } else {
    // Fallback: use first event summary but clean it up
    const firstEvent = events[0]
    if (firstEvent.summary) {
      // Remove common reservation prefixes like "Reserved - ", "Booked", "Airbnb", etc.
      propertyName = firstEvent.summary
        .replace(/^(Reserved|Booked|Airbnb|VRBO|Booking\.com)\s*[-–]\s*/i, "")
        .replace(/\s*$$.*?$$\s*$/, "") // Remove trailing parentheses content
        .trim()
    }
  }

  let address = ""
  let city = ""
  let state = ""
  let zip = ""

  // Check for calendar description which may contain address
  const calDescMatch = icalData.match(/X-WR-CALDESC:(.+)/)
  if (calDescMatch) {
    address = calDescMatch[1].trim()
  }

  // Also check first event location
  const firstEvent = events.find((e) => e.location)
  if (firstEvent?.location && !address) {
    address = firstEvent.location
  }

  // Parse location if it exists (format varies by platform)
  if (address) {
    const locationParts = address.split(",").map((p) => p.trim())
    if (locationParts.length >= 2) {
      city = locationParts[locationParts.length - 2] || ""
      const stateZip = locationParts[locationParts.length - 1] || ""
      const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})/)
      if (stateZipMatch) {
        state = stateZipMatch[1]
        zip = stateZipMatch[2]
      } else {
        state = stateZip
      }
    }
  }

  if (!address || address === "") {
    address = `${propertyName} - Address available in PMS`
    city = "Update in Property Settings"
    state = "XX"
  }

  return {
    name: propertyName,
    address: address,
    city: city,
    state: state,
    zip: zip,
    bedrooms: 1, // Default, can be updated later
    bathrooms: 1, // Default, can be updated later
    propertyType: platformType,
    icalUrl: icalUrl,
    eventsCount: events.length,
  }
}

function extractAirbnbListingId(url: string): string | null {
  try {
    const patterns = [/airbnb\.com\/rooms\/(\d+)/, /airbnb\.com\/.*\/(\d+)/]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  } catch {
    return null
  }
}

type NewClientData = {
  name: string
  email: string
  phone?: string
}

async function handleClientCreation(
  supabase: any,
  companyId: string,
  clientMode: "existing" | "new" | "none",
  existingClientId?: string,
  newClient?: NewClientData,
  inviteClient?: boolean,
) {
  if (clientMode === "none") {
    return null
  }

  if (clientMode === "existing") {
    if (!existingClientId) {
      throw new Error("No client ID provided")
    }

    // Verify relationship exists
    const { data: relationship } = await supabase
      .from("company_client_relationships")
      .select("id")
      .eq("company_id", companyId)
      .eq("client_id", existingClientId)
      .single()

    if (!relationship) {
      throw new Error("Client not found in your company")
    }

    return existingClientId
  }

  // Create new client
  if (!newClient) {
    throw new Error("No client data provided")
  }

  // Check if client already exists by email
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("email", newClient.email)
    .maybeSingle()

  let clientId = existingClient?.id

  if (!clientId) {
    // Create new client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
      })
      .select("id")
      .single()

    if (clientError) {
      throw new Error(`Failed to create client: ${clientError.message}`)
    }

    clientId = client.id
  }

  // Create company-client relationship
  const { error: relationshipError } = await supabase
    .from("company_client_relationships")
    .insert({
      company_id: companyId,
      client_id: clientId,
      relationship_status: "active",
    })
    .select()
    .single()

  if (relationshipError && !relationshipError.message.includes("unique")) {
    throw new Error(`Failed to link client: ${relationshipError.message}`)
  }

  // Send invitation if requested
  if (inviteClient && newClient.email) {
    const inviteCode = Math.random().toString(36).substring(2, 14).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    await supabase.from("client_invitations").insert({
      company_id: companyId,
      email: newClient.email,
      client_id: clientId,
      invite_code: inviteCode,
      expires_at: expiresAt.toISOString(),
    })

    // TODO: Send email with invitation link
    console.log(`[v0] Invitation created for ${newClient.email}: ${inviteCode}`)
  }

  return clientId
}

export async function importAirbnbPropertyForCompany(params: {
  airbnbUrl: string
  clientMode: "existing" | "new" | "none"
  existingClientId?: string
  newClient?: NewClientData
  inviteClient?: boolean
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get user's company
    const { data: userData } = await supabase.from("users").select("company_id").eq("id", user.id).single()

    if (!userData?.company_id) {
      return { success: false, error: "No company associated with your account" }
    }

    const urlInfo = detectUrlType(params.airbnbUrl)
    console.log("[v0] Detected URL type:", urlInfo)

    let propertyData: any
    const calendarSourceType = urlInfo.type
    const calendarUrl = urlInfo.icalUrl

    if (urlInfo.type === "airbnb" && urlInfo.listingId) {
      // Traditional Airbnb listing URL - scrape it
      const listingId = urlInfo.listingId

      // Check if property already exists
      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .eq("airbnb_listing_id", listingId)
        .eq("company_id", userData.company_id)
        .maybeSingle()

      if (existing) {
        return { success: false, error: "This property has already been imported" }
      }

      const clientId = await handleClientCreation(
        supabase,
        userData.company_id,
        params.clientMode,
        params.existingClientId,
        params.newClient,
        params.inviteClient,
      )

      // Scrape Airbnb data
      console.log("[v0] Scraping Airbnb listing:", params.airbnbUrl)
      const airbnbData = await scrapeAirbnbListing(params.airbnbUrl)
      console.log("[v0] Scraped data:", airbnbData)

      propertyData = {
        company_id: userData.company_id,
        client_id: clientId,
        name: airbnbData.name,
        address: airbnbData.address,
        city: airbnbData.city,
        state: airbnbData.state,
        zip: airbnbData.zipCode,
        bedrooms: airbnbData.bedrooms,
        bathrooms: airbnbData.bathrooms,
        property_type: airbnbData.propertyType || "airbnb",
        airbnb_listing_url: params.airbnbUrl,
        airbnb_listing_id: listingId,
        airbnb_ical_url: `https://www.airbnb.com/calendar/ical/${listingId}.ics`,
        calendar_source_type: "airbnb",
        calendar_url: `https://www.airbnb.com/calendar/ical/${listingId}.ics`,
        airbnb_data: { ...airbnbData, scrapedAt: new Date().toISOString() },
        photos: airbnbData.images || [],
        sync_enabled: true,
        last_synced_at: new Date().toISOString(),
      }
    } else if (urlInfo.icalUrl) {
      // iCal URL from any platform (Hostaway, Guesty, Airbnb iCal, etc.)
      const clientId = await handleClientCreation(
        supabase,
        userData.company_id,
        params.clientMode,
        params.existingClientId,
        params.newClient,
        params.inviteClient,
      )

      console.log("[v0] Importing from iCal URL:", urlInfo.icalUrl)
      const icalData = await importFromIcalUrl(urlInfo.icalUrl, urlInfo.type)

      console.log("[v0] Extracted property data:", {
        name: icalData.name,
        address: icalData.address,
        city: icalData.city,
        state: icalData.state,
        eventsCount: icalData.eventsCount,
      })

      propertyData = {
        company_id: userData.company_id,
        client_id: clientId,
        name: icalData.name,
        address: icalData.address,
        city: icalData.city,
        state: icalData.state,
        zip: icalData.zip,
        bedrooms: icalData.bedrooms,
        bathrooms: icalData.bathrooms,
        property_type: icalData.propertyType,
        calendar_source_type: urlInfo.type,
        calendar_url: urlInfo.icalUrl,
        airbnb_ical_url: urlInfo.type === "airbnb" ? urlInfo.icalUrl : null,
        sync_enabled: true,
        last_synced_at: new Date().toISOString(),
      }
    } else {
      return {
        success: false,
        error:
          "Unsupported URL format. Please provide an Airbnb listing URL, Hostaway iCal URL, or other supported calendar feed.",
      }
    }

    console.log("[v0] Inserting property with data:", propertyData)

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert(propertyData)
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Property creation error:", propertyError)
      return { success: false, error: `Failed to create property: ${propertyError.message}` }
    }

    console.log("[v0] Property created successfully:", property.id)

    if (calendarUrl && property.id) {
      console.log("[v0] Auto-syncing calendar for new property:", property.id)
      try {
        // Import the sync action
        const { syncPropertyCalendar } = await import("./calendar-sync-actions")
        const syncResult = await syncPropertyCalendar(property.id)

        if (syncResult.success) {
          console.log(
            `[v0] Auto-sync successful: ${syncResult.createdCount} jobs created, ${syncResult.updatedCount} updated`,
          )
        } else {
          console.warn("[v0] Auto-sync failed:", syncResult.error)
        }
      } catch (syncError) {
        console.error("[v0] Auto-sync error:", syncError)
        // Don't fail the property creation if sync fails
      }
    }

    revalidatePath("/dashboard/properties")
    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/calendar")
    return { success: true, property }
  } catch (error) {
    console.error("[v0] Import error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function createManualPropertyForCompany(params: {
  name: string
  address: string
  city: string
  state: string
  zip: string
  property_type: string
  bedrooms?: number
  bathrooms?: number
  access_code?: string
  special_instructions?: string
  clientMode: "existing" | "new" | "none"
  existingClientId?: string
  newClient?: NewClientData
  inviteClient?: boolean
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get user's company
    const { data: userData } = await supabase.from("users").select("company_id").eq("id", user.id).single()

    if (!userData?.company_id) {
      return { success: false, error: "No company associated with your account" }
    }

    const clientId = await handleClientCreation(
      supabase,
      userData.company_id,
      params.clientMode,
      params.existingClientId,
      params.newClient,
      params.inviteClient,
    )

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        company_id: userData.company_id,
        client_id: clientId,
        name: params.name,
        address: params.address,
        city: params.city,
        state: params.state,
        zip: params.zip,
        property_type: params.property_type,
        bedrooms: params.bedrooms,
        bathrooms: params.bathrooms,
        access_code: params.access_code,
        special_instructions: params.special_instructions,
      })
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Property creation error:", propertyError)
      return { success: false, error: `Failed to create property: ${propertyError.message}` }
    }

    revalidatePath("/dashboard/properties")
    return { success: true, property }
  } catch (error) {
    console.error("[v0] Creation error:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" }
  }
}

export async function updateCompanyProperty(
  propertyId: string,
  data: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    gate_code?: string
    building_code?: string
    access_code?: string
    supply_closet_code?: string
    fob_required?: boolean
    wifi_name?: string
    wifi_password?: string
    parking_info?: string
    additional_access_instructions?: string
    special_instructions?: string
    airbnb_ical_url?: string
  },
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get user's company
    const { data: userData } = await supabase.from("users").select("company_id").eq("id", user.id).single()

    if (!userData?.company_id) {
      return { success: false, error: "No company associated with your account" }
    }

    // Update property (RLS will ensure they can only update their own company's properties)
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        gate_code: data.gate_code,
        building_code: data.building_code,
        access_code: data.access_code,
        supply_closet_code: data.supply_closet_code,
        fob_required: data.fob_required,
        wifi_name: data.wifi_name,
        wifi_password: data.wifi_password,
        parking_info: data.parking_info,
        additional_access_instructions: data.additional_access_instructions,
        special_instructions: data.special_instructions,
        airbnb_ical_url: data.airbnb_ical_url,
      })
      .eq("id", propertyId)
      .eq("company_id", userData.company_id)

    if (updateError) {
      console.error("[v0] Property update error:", updateError)
      return { success: false, error: `Failed to update property: ${updateError.message}` }
    }

    revalidatePath(`/dashboard/properties/${propertyId}`)
    revalidatePath("/dashboard/properties")
    return { success: true }
  } catch (error) {
    console.error("[v0] Update error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteCompanyProperty(propertyId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get user's company
    const { data: userData } = await supabase.from("users").select("company_id, role").eq("id", user.id).single()

    if (!userData?.company_id) {
      return { success: false, error: "No company associated with your account" }
    }

    // Check user has permission (admin or manager)
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "You do not have permission to remove properties" }
    }

    // Verify property belongs to this company before removing
    const { data: property } = await supabase
      .from("properties")
      .select("id, company_id")
      .eq("id", propertyId)
      .eq("company_id", userData.company_id)
      .single()

    if (!property) {
      return { success: false, error: "Property not found or does not belong to your company" }
    }

    // Use service role client to bypass RLS for the update
    // This is necessary because the RLS policy doesn't allow setting company_id to null
    const serviceClient = createServiceRoleClient()

    // Delete pending jobs (not completed ones - those are kept for history)
    const { error: jobsError } = await serviceClient
      .from("jobs")
      .delete()
      .eq("property_id", propertyId)
      .eq("company_id", userData.company_id)
      .in("status", ["pending", "assigned", "in_progress"])

    if (jobsError) {
      console.error("[v0] Jobs deletion error:", jobsError)
      return { success: false, error: `Failed to delete pending jobs: ${jobsError.message}` }
    }

    // Remove company association by setting company_id to null
    // This keeps the property in the system so the client can reassign it
    const { error: updateError } = await serviceClient
      .from("properties")
      .update({
        company_id: null,
        sync_enabled: false, // Disable auto-sync when removing company
      })
      .eq("id", propertyId)

    if (updateError) {
      console.error("[v0] Property removal error:", updateError)
      return { success: false, error: `Failed to remove property: ${updateError.message}` }
    }

    console.log(
      "[v0] Property removed from company (not deleted), pending jobs removed, completed jobs preserved:",
      propertyId,
    )

    revalidatePath("/dashboard/properties")
    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/calendar")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Remove error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
