"use server"

import { createClient } from "@/lib/supabase/server"
import { parseICalFeed } from "@/lib/ical-parser"
import { revalidatePath } from "next/cache"

export async function syncPropertyCalendar(propertyId: string) {
  const supabase = await createClient()

  try {
    console.log("[v0] Starting calendar sync for property:", propertyId)

    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(
        "id, company_id, client_id, calendar_url, calendar_source_type, airbnb_ical_url, airbnb_listing_id, name, calendar_sync_enabled, check_in_time, check_out_time",
      )
      .eq("id", propertyId)
      .single()

    if (propError || !property) {
      throw new Error("Property not found")
    }

    if (!property.calendar_sync_enabled) {
      throw new Error("Calendar sync is disabled for this property. Enable it in property settings.")
    }

    const calendarUrl = property.calendar_url || property.airbnb_ical_url
    if (!calendarUrl) {
      throw new Error(
        "No calendar URL configured. Please add your calendar export URL from your platform or PMS settings.",
      )
    }

    console.log("[v0] Fetching calendar from:", calendarUrl, "Source:", property.calendar_source_type || "airbnb")

    // Parse iCal feed
    const events = await parseICalFeed(calendarUrl)
    console.log("[v0] Found", events.length, "events in calendar")

    let jobsCreated = 0
    let jobsUpdated = 0

    // Process each event
    for (const event of events) {
      // Skip cancelled events
      if (event.status === "CANCELLED") continue

      // For a booking showing "Dec 11-12" on Airbnb:
      // - DTSTART = Dec 11 (check-in day)
      // - DTEND = Dec 13 (checkout day, exclusive end in iCal format)
      // - Last night of stay = Dec 12 (DTEND - 1 day)
      // - Cleaning scheduled = Dec 13 (same as DTEND)
      const checkInDate = new Date(event.startDate)
      const checkOutDate = new Date(event.endDate) // This is already the checkout day
      const lastNight = new Date(checkOutDate)
      lastNight.setDate(lastNight.getDate() - 1) // Last night is day before checkout
      const scheduledDate = new Date(checkOutDate) // Clean on checkout day

      console.log("[v0] Processing reservation:", {
        checkIn: checkInDate.toISOString().split("T")[0],
        lastNight: lastNight.toISOString().split("T")[0],
        checkOut: checkOutDate.toISOString().split("T")[0],
        scheduled: scheduledDate.toISOString().split("T")[0],
        platform: event.bookingPlatform || "unknown",
      })

      const { data: existingJob } = await supabase
        .from("jobs")
        .select("id, status")
        .eq("airbnb_reservation_id", event.uid)
        .maybeSingle()

      if (existingJob) {
        // Update existing job if not completed
        if (existingJob.status !== "completed" && existingJob.status !== "verified") {
          await supabase
            .from("jobs")
            .update({
              check_in_date: checkInDate.toISOString().split("T")[0],
              check_out_date: checkOutDate.toISOString().split("T")[0],
              scheduled_date: scheduledDate.toISOString().split("T")[0],
              guest_name: event.guestName || null,
              booking_platform: event.bookingPlatform || null,
              special_instructions: event.summary || event.description,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingJob.id)

          jobsUpdated++
        }
      } else {
        const { error: jobError } = await supabase.from("jobs").insert({
          company_id: property.company_id,
          property_id: property.id,
          client_id: property.client_id, // Can be null
          job_type: "turnover",
          status: "pending",
          booking_date: new Date().toISOString().split("T")[0], // Today (when sync happened)
          check_in_date: checkInDate.toISOString().split("T")[0],
          check_out_date: checkOutDate.toISOString().split("T")[0],
          scheduled_date: scheduledDate.toISOString().split("T")[0],
          guest_name: event.guestName || null,
          booking_platform: event.bookingPlatform || null,
          special_instructions: `${event.bookingPlatform ? `${event.bookingPlatform.toUpperCase()} ` : ""}Reservation${event.guestName ? ` - ${event.guestName}` : ""}\nCheck-in: ${checkInDate.toLocaleDateString()}\nCheck-out: ${checkOutDate.toLocaleDateString()}`,
          source: property.calendar_source_type === "airbnb" ? "airbnb_sync" : "calendar_sync",
          airbnb_reservation_id: event.uid,
        })

        if (!jobError) {
          jobsCreated++
        } else {
          console.error("[v0] Error creating job:", jobError.message)
        }
      }
    }

    await supabase
      .from("properties")
      .update({
        calendar_last_synced: new Date().toISOString(),
        calendar_sync_error: null,
      })
      .eq("id", propertyId)

    // Log sync
    await supabase.from("calendar_sync_logs").insert({
      company_id: property.company_id,
      property_id: propertyId,
      sync_type: "manual",
      status: "success",
      events_found: events.length,
      jobs_created: jobsCreated,
      jobs_updated: jobsUpdated,
    })

    console.log("[v0] Calendar sync complete:", { jobsCreated, jobsUpdated })

    revalidatePath("/dashboard/calendar")
    revalidatePath("/dashboard/properties")
    revalidatePath(`/dashboard/properties/${propertyId}`)

    return {
      success: true,
      eventsFound: events.length,
      jobsCreated,
      jobsUpdated,
    }
  } catch (error: any) {
    console.error("[v0] Calendar sync error:", error)

    // Update property with error
    await supabase
      .from("properties")
      .update({
        calendar_sync_error: error.message,
      })
      .eq("id", propertyId)

    // Log failed sync
    const { data: property } = await supabase.from("properties").select("company_id").eq("id", propertyId).single()

    if (property) {
      await supabase.from("calendar_sync_logs").insert({
        company_id: property.company_id,
        property_id: propertyId,
        sync_type: "manual",
        status: "failed",
        error_message: error.message,
      })
    }

    return { success: false, error: error.message }
  }
}

export async function syncAllCompanyCalendars() {
  const supabase = await createClient()

  try {
    // Get user's company
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: userData } = await supabase.from("users").select("company_id").eq("id", user.id).single()

    if (!userData?.company_id) throw new Error("No company found")

    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .eq("company_id", userData.company_id)
      .eq("calendar_sync_enabled", true)
      .or("calendar_url.not.is.null,airbnb_ical_url.not.is.null")

    if (!properties || properties.length === 0) {
      return { success: true, message: "No properties with calendar sync enabled" }
    }

    // Sync each property
    const results = []
    for (const property of properties) {
      const result = await syncPropertyCalendar(property.id)
      results.push(result)
    }

    const totalJobsCreated = results.reduce((sum, r) => sum + (r.jobsCreated || 0), 0)
    const totalJobsUpdated = results.reduce((sum, r) => sum + (r.jobsUpdated || 0), 0)

    revalidatePath("/dashboard/calendar")
    revalidatePath("/dashboard/properties")

    return {
      success: true,
      propertiesSynced: properties.length,
      totalJobsCreated,
      totalJobsUpdated,
    }
  } catch (error: any) {
    console.error("[v0] Company calendar sync error:", error)
    return { success: false, error: error.message }
  }
}
