"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { scrapeAirbnbListing } from "@/lib/airbnb-scraper"

// Helper function to extract Airbnb listing ID from URL
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

export async function importAirbnbProperty(airbnbUrl: string) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get client ID for portal user
    const { data: portalUser } = await supabase
      .from("client_portal_users")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single()

    if (!portalUser) {
      return { success: false, error: "Client profile not found" }
    }

    // Extract listing ID
    const listingId = extractAirbnbListingId(airbnbUrl)
    if (!listingId) {
      return { success: false, error: "Invalid Airbnb URL. Please use the full listing URL." }
    }

    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("airbnb_listing_id", listingId)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "This property has already been imported" }
    }

    console.log("[v0] Starting Airbnb import for:", airbnbUrl)

    const airbnbData = await scrapeAirbnbListing(airbnbUrl)
    console.log("[v0] Scraped data:", airbnbData)

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        company_id: null,
        client_id: portalUser.client_id,
        name: airbnbData.name,
        address: airbnbData.address,
        city: airbnbData.city,
        state: airbnbData.state,
        zip: airbnbData.zipCode,
        bedrooms: airbnbData.bedrooms,
        bathrooms: airbnbData.bathrooms,
        property_type: airbnbData.propertyType || "airbnb",
        airbnb_listing_url: airbnbUrl,
        airbnb_listing_id: listingId,
        airbnb_ical_url: `https://www.airbnb.com/calendar/ical/${listingId}.ics`,
        airbnb_data: {
          ...airbnbData,
          scrapedAt: new Date().toISOString(),
        },
        photos: airbnbData.images || [],
        sync_enabled: true,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Property creation error:", propertyError)
      return { success: false, error: `Failed to create property: ${propertyError.message}` }
    }

    console.log("[v0] Property created successfully:", property.id)
    revalidatePath("/client-portal/properties")
    revalidatePath("/client-portal")
    return { success: true, property }
  } catch (error) {
    console.error("[v0] Import error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function createManualProperty(data: {
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
}) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get client ID for portal user
    const { data: portalUser } = await supabase
      .from("client_portal_users")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single()

    if (!portalUser) {
      return { success: false, error: "Client profile not found" }
    }

    console.log("[v0] Creating manual property for client:", portalUser.client_id)

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        company_id: null,
        client_id: portalUser.client_id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        access_code: data.access_code,
        special_instructions: data.special_instructions,
      })
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Property creation error:", propertyError)
      return { success: false, error: `Failed to create property: ${propertyError.message}` }
    }

    console.log("[v0] Manual property created successfully:", property.id)
    revalidatePath("/client-portal/properties")
    revalidatePath("/client-portal")
    return { success: true, property }
  } catch (error) {
    console.error("[v0] Creation error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updatePropertyDetails(
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
  },
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get client ID for portal user
    const { data: portalUser } = await supabase
      .from("client_portal_users")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single()

    if (!portalUser) {
      return { success: false, error: "Client profile not found" }
    }

    // Update property (RLS will ensure they can only update their own properties)
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
      })
      .eq("id", propertyId)
      .eq("client_id", portalUser.client_id)

    if (updateError) {
      console.error("[v0] Property update error:", updateError)
      return { success: false, error: `Failed to update property: ${updateError.message}` }
    }

    revalidatePath(`/client-portal/properties/${propertyId}`)
    revalidatePath("/client-portal/properties")
    revalidatePath("/client-portal")
    return { success: true }
  } catch (error) {
    console.error("[v0] Update error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteProperty(propertyId: string) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get client ID for portal user
    const { data: portalUser } = await supabase
      .from("client_portal_users")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single()

    if (!portalUser) {
      return { success: false, error: "Client profile not found" }
    }

    const { error: jobsError } = await supabase
      .from("jobs")
      .delete()
      .eq("property_id", propertyId)
      .eq("client_id", portalUser.client_id)
      .in("status", ["pending", "assigned", "in_progress"])

    if (jobsError) {
      console.error("[v0] Jobs deletion error:", jobsError)
      return { success: false, error: `Failed to delete pending jobs: ${jobsError.message}` }
    }

    // This preserves job history for both company and client
    const { error: updateJobsError } = await supabase
      .from("jobs")
      .update({ property_id: null })
      .eq("property_id", propertyId)
      .eq("client_id", portalUser.client_id)
      .in("status", ["completed", "verified"])

    if (updateJobsError) {
      console.error("[v0] Jobs update error:", updateJobsError)
      return { success: false, error: `Failed to preserve completed jobs: ${updateJobsError.message}` }
    }

    // Delete property (RLS will ensure they can only delete their own properties)
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId)
      .eq("client_id", portalUser.client_id)

    if (deleteError) {
      console.error("[v0] Property deletion error:", deleteError)
      return { success: false, error: `Failed to delete property: ${deleteError.message}` }
    }

    console.log("[v0] Property deleted, pending jobs removed, completed jobs preserved:", propertyId)

    revalidatePath("/client-portal/properties")
    revalidatePath("/client-portal")
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
