export interface AirbnbListingData {
  name: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  bedrooms: number
  bathrooms: number
  propertyType: string
  images: string[]
  amenities: string[]
  latitude?: number
  longitude?: number
  icalUrl?: string
}

export async function scrapeAirbnbListing(listingUrl: string): Promise<AirbnbListingData> {
  console.log("[v0] Scraping Airbnb listing:", listingUrl)

  try {
    const listingIdMatch = listingUrl.match(/\/rooms\/(\d+)/)
    const listingId = listingIdMatch ? listingIdMatch[1] : null

    // Fetch the HTML page with headers to mimic a browser
    const response = await fetch(listingUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch listing: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log("[v0] Fetched HTML, length:", html.length)

    // Airbnb embeds data in <script> tags with application/json type
    // Look for the data-state or __NEXT_DATA__ script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)
    const dataStateMatch = html.match(
      /<script data-hypernova-key="spaspabundlejs" type="application\/json"><!--([^<]+)--><\/script>/,
    )

    let listingData: any = null

    if (nextDataMatch) {
      console.log("[v0] Found __NEXT_DATA__ script tag")
      const jsonData = JSON.parse(nextDataMatch[1])
      listingData = jsonData?.props?.pageProps?.listingData || jsonData?.props?.pageProps
      console.log("[v0] Parsed NEXT_DATA, keys:", Object.keys(listingData || {}))
    } else if (dataStateMatch) {
      console.log("[v0] Found data-state script tag")
      const jsonData = JSON.parse(dataStateMatch[1])
      listingData = jsonData?.bootstrapData?.reduxData?.listingInfo?.listing
      console.log("[v0] Parsed data-state, keys:", Object.keys(listingData || {}))
    }

    // If we couldn't find the JSON data, try parsing meta tags
    if (!listingData) {
      console.log("[v0] No JSON data found, parsing meta tags")
      listingData = parseMetaTags(html)
    }

    // Extract the data we need
    const result: AirbnbListingData = {
      name: extractName(listingData, html),
      description: extractDescription(listingData, html),
      address: extractAddress(listingData),
      city: extractCity(listingData, html),
      state: extractState(listingData, html),
      zipCode: extractZipCode(listingData),
      bedrooms: extractBedrooms(listingData, html),
      bathrooms: extractBathrooms(listingData, html),
      propertyType: extractPropertyType(listingData, html),
      images: extractImages(listingData, html),
      amenities: extractAmenities(listingData, html),
      latitude: extractLatitude(listingData),
      longitude: extractLongitude(listingData),
      icalUrl: undefined,
    }

    console.log("[v0] Extracted data:", result)
    return result
  } catch (error) {
    console.error("[v0] Scraping error:", error)
    throw new Error(`Failed to scrape Airbnb listing: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function parseMetaTags(html: string): any {
  const metaData: any = {}

  // Extract Open Graph meta tags
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
  const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1]
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]

  if (ogTitle) metaData.name = ogTitle
  if (ogDescription) metaData.description = ogDescription
  if (ogImage) metaData.images = [ogImage]

  return metaData
}

function extractName(data: any, html: string): string {
  return (
    data?.name ||
    data?.title ||
    data?.listing?.name ||
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ||
    "Airbnb Property"
  )
}

function extractDescription(data: any, html: string): string {
  return (
    data?.description ||
    data?.summary ||
    data?.listing?.description ||
    html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ||
    ""
  )
}

function extractAddress(data: any): string {
  if (data?.address) {
    if (typeof data.address === "string") return data.address
    return [data.address.street, data.address.city, data.address.state, data.address.zipcode].filter(Boolean).join(", ")
  }
  return data?.listing?.publicAddress?.address || data?.location?.address || ""
}

function extractCity(data: any, html: string): string {
  return (
    data?.city ||
    data?.address?.city ||
    data?.listing?.city ||
    data?.location?.city ||
    html.match(/"city":"([^"]+)"/)?.[1] ||
    ""
  )
}

function extractState(data: any, html: string): string {
  return (
    data?.state ||
    data?.address?.state ||
    data?.listing?.state ||
    data?.location?.state ||
    html.match(/"state":"([^"]+)"/)?.[1] ||
    ""
  )
}

function extractZipCode(data: any): string {
  return data?.zipcode || data?.address?.zipcode || data?.listing?.zipcode || ""
}

function extractBedrooms(data: any, html: string): number {
  const bedrooms =
    data?.bedrooms || data?.listing?.bedrooms || Number.parseInt(html.match(/(\d+)\s*bedroom/i)?.[1] || "0")
  return bedrooms || 1
}

function extractBathrooms(data: any, html: string): number {
  const bathrooms =
    data?.bathrooms || data?.listing?.bathrooms || Number.parseInt(html.match(/(\d+)\s*bathroom/i)?.[1] || "0")
  return bathrooms || 1
}

function extractPropertyType(data: any, html: string): string {
  return (
    data?.propertyType ||
    data?.roomType ||
    data?.listing?.roomType ||
    html.match(/"roomType":"([^"]+)"/)?.[1] ||
    "Entire home"
  )
}

function extractImages(data: any, html: string): string[] {
  // Try to extract from data object
  if (data?.images && Array.isArray(data.images)) {
    return data.images.map((img: any) => (typeof img === "string" ? img : img.url || img.src)).filter(Boolean)
  }

  if (data?.photos && Array.isArray(data.photos)) {
    return data.photos.map((photo: any) => photo.picture || photo.xlPicture || photo.largePicture).filter(Boolean)
  }

  // Try to extract photo data from pdpPhotos
  if (data?.pdpPhotos && Array.isArray(data.pdpPhotos)) {
    return data.pdpPhotos.map((photo: any) => photo.picture).filter(Boolean)
  }

  // Try to extract from sectionedPhoto data
  if (data?.sectionedPhoto?.allPhotos && Array.isArray(data.sectionedPhoto.allPhotos)) {
    return data.sectionedPhoto.allPhotos.map((photo: any) => photo.baseUrl || photo.picture).filter(Boolean)
  }

  // Try to extract from HTML
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  if (ogImage) return [ogImage]

  // Find all high-quality image URLs in the HTML (look for Airbnb CDN images)
  const imageMatches = html.matchAll(/https:\/\/[a-z0-9\-.]+airbnbcdn\.com\/[^"'\s]+\.(jpg|jpeg|webp)/gi)
  const images = Array.from(new Set(Array.from(imageMatches).map((match) => match[0])))

  return images.length > 0 ? images.slice(0, 15) : []
}

function extractAmenities(data: any, html: string): string[] {
  if (data?.amenities && Array.isArray(data.amenities)) {
    return data.amenities
      .map((amenity: any) => (typeof amenity === "string" ? amenity : amenity.name || amenity.title))
      .filter(Boolean)
  }

  if (data?.listing?.amenities) {
    return data.listing.amenities
  }

  // Try to extract common amenities from HTML
  const commonAmenities = ["WiFi", "Kitchen", "Parking", "Air conditioning", "Heating", "TV", "Washer", "Dryer"]
  return commonAmenities.filter((amenity) => html.toLowerCase().includes(amenity.toLowerCase()))
}

function extractLatitude(data: any): number | undefined {
  return data?.lat || data?.latitude || data?.location?.lat || undefined
}

function extractLongitude(data: any): number | undefined {
  return data?.lng || data?.longitude || data?.location?.lng || undefined
}
