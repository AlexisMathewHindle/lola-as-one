/**
 * Supabase Client for Legacy Website
 *
 * This module provides a Supabase client to fetch events data
 * instead of using Firebase Firestore.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase configuration
// You can set these in environment variables or hardcode them
const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey =
  process.env.VUE_APP_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

// Create Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Event interface matching Supabase schema
 */
export interface SupabaseEvent {
  id: string;
  offering_id: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  location_name: string;
  location_address?: string;
  location_city?: string;
  location_postcode?: string;
  max_capacity: number;
  current_bookings: number;
  price_gbp: number;
  vat_rate: number;
  offering: {
    id: string;
    title: string;
    slug: string;
    description_short?: string;
    description_long?: string;
    featured_image_url?: string;
    secondary_images?: Array<{ url: string; order: number }>;
    status: string;
    metadata?: any;
  };
}

/**
 * Fetch all published events from Supabase
 */
export async function fetchEventsFromSupabase(): Promise<SupabaseEvent[]> {
  try {
    const { data, error } = await supabase
      .from("offering_events")
      .select(
        `
        *,
        offering:offerings!inner(*)
      `
      )
      .eq("offering.status", "published")
      .order("event_date", { ascending: true })
      .order("event_start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events from Supabase:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch events from Supabase:", error);
    return [];
  }
}

/**
 * Fetch events within a date range
 */
export async function fetchEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<SupabaseEvent[]> {
  try {
    const { data, error } = await supabase
      .from("offering_events")
      .select(
        `
        *,
        offering:offerings!inner(*)
      `
      )
      .eq("offering.status", "published")
      .gte("event_date", startDate)
      .lte("event_date", endDate)
      .order("event_date", { ascending: true })
      .order("event_start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events by date range:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch events by date range:", error);
    return [];
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventById(
  eventId: string
): Promise<SupabaseEvent | null> {
  try {
    const { data, error } = await supabase
      .from("offering_events")
      .select(
        `
        *,
        offering:offerings!inner(*)
      `
      )
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event by ID:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch event by ID:", error);
    return null;
  }
}

/**
 * Transform Supabase event to legacy Firebase format
 * This helps maintain compatibility with existing components
 */
export function transformSupabaseEventToLegacy(event: SupabaseEvent): any {
  return {
    event_id: event.id,
    event_title: event.offering.title,
    title: event.offering.title,
    description:
      event.offering.description_long || event.offering.description_short || "",
    date: event.event_date,
    start_time: event.event_start_time,
    end_time: event.event_end_time,
    location: event.location_name,
    address: event.location_address,
    city: event.location_city,
    postcode: event.location_postcode,
    quantity: event.max_capacity,
    price: event.price_gbp,
    image: event.offering.featured_image_url,
    secondary_images: event.offering.secondary_images || [],
    slug: event.offering.slug,
    metadata: event.offering.metadata,
    // Note: Supabase doesn't have recurring events like Firebase
    // Each event is a separate record with a single event_date
    // For calendar display, use date + start_time/end_time directly
  };
}

/**
 * Transform Supabase event to FullCalendar format
 * Supabase events are individual instances, not recurring
 */
export function transformSupabaseEventToFullCalendar(
  event: SupabaseEvent
): any {
  return {
    id: event.id,
    title: event.offering.title,
    start: `${event.event_date}T${event.event_start_time}`,
    end: event.event_end_time
      ? `${event.event_date}T${event.event_end_time}`
      : undefined,
    extendedProps: {
      location: event.location_name,
      price: event.price_gbp,
      capacity: event.max_capacity,
      currentBookings: event.current_bookings,
      description:
        event.offering.description_long || event.offering.description_short,
      slug: event.offering.slug,
    },
  };
}
