// iCal parser for Airbnb calendar sync

export interface ICalEvent {
  uid: string
  summary: string
  description: string
  location?: string // Add location field
  startDate: Date
  endDate: Date
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED"
  guestName?: string
  bookingPlatform?: string
}

export async function parseICalFeed(icalUrl: string): Promise<ICalEvent[]> {
  try {
    console.log("[v0] Fetching iCal feed from:", icalUrl)

    const response = await fetch(icalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/calendar,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] iCal fetch failed:", response.status, errorBody)
      throw new Error(`Failed to fetch iCal feed: ${response.status} ${response.statusText}`)
    }

    const icalData = await response.text()
    console.log("[v0] iCal data fetched, length:", icalData.length)

    return parseICalData(icalData)
  } catch (error) {
    console.error("[v0] Error fetching iCal feed:", error)
    throw error
  }
}

function parseICalData(icalData: string): ICalEvent[] {
  const events: ICalEvent[] = []
  const lines = icalData.split(/\r?\n/)

  let currentEvent: Partial<ICalEvent> | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    // Handle line continuations (lines starting with space/tab)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      i++
      line += lines[i].trim()
    }

    if (line === "BEGIN:VEVENT") {
      currentEvent = {}
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentEvent.uid && currentEvent.startDate && currentEvent.endDate) {
        if (currentEvent.summary) {
          // Try to extract guest name from summary (often in format "Reserved - John Doe")
          const guestMatch = currentEvent.summary.match(/(?:Reserved|Booked)\s*[-–]\s*(.+?)(?:\s*\(|$)/i)
          if (guestMatch) {
            currentEvent.guestName = guestMatch[1].trim()
          }

          currentEvent.bookingPlatform = detectBookingPlatform(
            currentEvent.summary,
            currentEvent.description || "",
            currentEvent.uid || "",
          )
        }
        events.push(currentEvent as ICalEvent)
      }
      currentEvent = null
    } else if (currentEvent) {
      const colonIndex = line.indexOf(":")
      if (colonIndex === -1) continue

      const field = line.substring(0, colonIndex)
      const value = line.substring(colonIndex + 1)

      if (field.startsWith("UID")) {
        currentEvent.uid = value
      } else if (field.startsWith("SUMMARY")) {
        currentEvent.summary = value
      } else if (field.startsWith("DESCRIPTION")) {
        currentEvent.description = value
      } else if (field.startsWith("LOCATION")) {
        currentEvent.location = value
      } else if (field.startsWith("DTSTART")) {
        currentEvent.startDate = parseICalDate(value)
      } else if (field.startsWith("DTEND")) {
        currentEvent.endDate = parseICalDate(value)
      } else if (field.startsWith("STATUS")) {
        currentEvent.status = value as ICalEvent["status"]
      }
    }
  }

  console.log("[v0] Parsed", events.length, "events from iCal feed")
  return events
}

function parseICalDate(dateString: string): Date {
  // iCal dates can be in formats: 20250115, 20250115T143000, 20250115T143000Z
  const cleaned = dateString.replace(/[-:]/g, "")

  if (cleaned.length === 8) {
    // YYYYMMDD
    const year = Number.parseInt(cleaned.substring(0, 4))
    const month = Number.parseInt(cleaned.substring(4, 6)) - 1
    const day = Number.parseInt(cleaned.substring(6, 8))
    return new Date(year, month, day)
  } else if (cleaned.includes("T")) {
    // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    const [datePart, timePart] = cleaned.split("T")
    const year = Number.parseInt(datePart.substring(0, 4))
    const month = Number.parseInt(datePart.substring(4, 6)) - 1
    const day = Number.parseInt(datePart.substring(6, 8))
    const hour = Number.parseInt(timePart.substring(0, 2))
    const minute = Number.parseInt(timePart.substring(2, 4))
    const second = Number.parseInt(timePart.substring(4, 6))

    if (cleaned.endsWith("Z")) {
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    } else {
      return new Date(year, month, day, hour, minute, second)
    }
  }

  return new Date(dateString)
}

function detectBookingPlatform(summary: string, description: string, uid: string): string {
  const text = `${summary} ${description} ${uid}`.toLowerCase()

  // Direct platform identifiers
  if (text.includes("airbnb") || uid.includes("airbnb")) return "airbnb"
  if (text.includes("vrbo") || text.includes("homeaway") || uid.includes("vrbo")) return "vrbo"
  if (text.includes("booking.com") || text.includes("booking com") || uid.includes("booking")) return "booking_com"
  if (text.includes("expedia") || uid.includes("expedia")) return "expedia"
  if (text.includes("tripadvisor") || uid.includes("tripadvisor")) return "tripadvisor"

  // PMS-specific patterns
  if (text.includes("hostaway") || uid.includes("hostaway")) return "hostaway"
  if (text.includes("guesty") || uid.includes("guesty")) return "guesty"
  if (text.includes("hospitable") || uid.includes("hospitable")) return "hospitable"

  // If we can't detect, return unknown
  return "unknown"
}

export function parseIcal(icalData: string): ICalEvent[] {
  return parseICalData(icalData)
}
