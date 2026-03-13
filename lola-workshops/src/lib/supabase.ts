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
  category_id?: string;
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
  category?: {
    id: string;
    name: string;
    slug: string;
    color_hex?: string;
    icon?: string;
    parent_id?: string;
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
        offering:offerings!inner(*),
        category:event_categories(
          id,
          name,
          slug,
          color_hex,
          icon,
          parent_id
        )
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
        offering:offerings!inner(*),
        category:event_categories(
          id,
          name,
          slug,
          color_hex,
          icon,
          parent_id
        )
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
        offering:offerings!inner(*),
        category:event_categories(
          id,
          name,
          slug,
          color_hex,
          icon,
          parent_id
        )
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
    // Category information from event_categories table
    category: event.category?.slug || event.offering.metadata?.category || "single",
    category_name: event.category?.name,
    category_color: event.category?.color_hex,
    category_icon: event.category?.icon,
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
      category: event.category?.slug,
      categoryName: event.category?.name,
      categoryColor: event.category?.color_hex,
      categoryIcon: event.category?.icon,
    },
  };
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Customer interface matching Supabase schema
 */
export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  stripe_customer_id?: string;
  marketing_opt_in?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(
  email: string
): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      // Not found is not an error - return null
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching customer by email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch customer by email:", error);
    return null;
  }
}

/**
 * Create or update customer in Supabase
 * Uses upsert to handle both new and existing customers
 */
export async function createOrUpdateCustomer(
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  marketingOptIn?: boolean
): Promise<{ data: Customer | null; error: any }> {
  try {
    // Check if customer exists first
    const existingCustomer = await getCustomerByEmail(email);

    if (existingCustomer) {
      // Update existing customer
      const { data, error } = await supabase
        .from("customers")
        .update({
          first_name: firstName || existingCustomer.first_name,
          last_name: lastName || existingCustomer.last_name,
          phone: phone || existingCustomer.phone,
          marketing_opt_in: marketingOptIn !== undefined ? marketingOptIn : existingCustomer.marketing_opt_in,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (error) {
        console.error("Error updating customer:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } else {
      // Create new customer (without id - it will be set by auth.users reference)
      // For now, we'll insert without the id and let Supabase handle it
      // Note: This requires the customer to be authenticated or we need to handle guest customers differently
      const { data, error } = await supabase
        .from("customers")
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          marketing_opt_in: marketingOptIn || false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating customer:", error);
        return { data: null, error };
      }

      return { data, error: null };
    }
  } catch (error) {
    console.error("Failed to create or update customer:", error);
    return { data: null, error };
  }
}

// ============================================================================
// BOOKING MANAGEMENT
// ============================================================================

/**
 * Booking interface matching Supabase schema
 */
export interface Booking {
  id?: string;
  offering_event_id: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  number_of_attendees: number;
  attendee_details?: any;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price_gbp?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a booking in Supabase
 * Note: In production, this should be done via Stripe webhook
 * This is for direct booking creation (e.g., admin bookings)
 */
export async function createBooking(
  bookingData: Partial<Booking>
): Promise<{ data: Booking | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        offering_event_id: bookingData.offering_event_id,
        customer_email: bookingData.customer_email,
        customer_name: bookingData.customer_name,
        number_of_attendees: bookingData.number_of_attendees || 1,
        attendee_details: bookingData.attendee_details,
        status: bookingData.status || 'confirmed',
        total_price_gbp: bookingData.total_price_gbp,
        notes: bookingData.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Failed to create booking:", error);
    return { data: null, error };
  }
}

/**
 * Fetch bookings by customer email
 */
export async function getBookingsByEmail(
  email: string
): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }
}

// ============================================================================
// CAPACITY MANAGEMENT
// ============================================================================

/**
 * Decrement event capacity using Supabase RPC function
 * This updates the event_capacity table or offering_events.current_bookings
 */
export async function decrementEventCapacity(
  offeringEventId: string,
  attendees: number
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.rpc('decrement_event_capacity', {
      p_offering_event_id: offeringEventId,
      p_attendees: attendees,
    });

    if (error) {
      console.error("Error decrementing event capacity:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to decrement event capacity:", error);
    return { success: false, error };
  }
}

/**
 * Fetch events with capacity information
 * Includes event_capacity table data if available
 */
export async function fetchEventsWithCapacity(): Promise<SupabaseEvent[]> {
  try {
    const { data, error } = await supabase
      .from("offering_events")
      .select(
        `
        *,
        offering:offerings!inner(*),
        capacity:event_capacity(*),
        category:event_categories(
          id,
          name,
          slug,
          color_hex,
          icon,
          parent_id
        )
      `
      )
      .eq("offering.status", "published")
      .order("event_date", { ascending: true })
      .order("event_start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events with capacity:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch events with capacity:", error);
    return [];
  }
}

/**
 * Get available spaces for an event
 * Returns the number of spaces still available
 */
export async function getAvailableSpaces(
  offeringEventId: string
): Promise<number> {
  try {
    // First try to get from event_capacity table
    const { data: capacityData, error: capacityError } = await supabase
      .from("event_capacity")
      .select("spaces_available")
      .eq("offering_event_id", offeringEventId)
      .single();

    if (!capacityError && capacityData) {
      return capacityData.spaces_available;
    }

    // Fallback to offering_events table
    const { data: eventData, error: eventError } = await supabase
      .from("offering_events")
      .select("max_capacity, current_bookings")
      .eq("id", offeringEventId)
      .single();

    if (eventError) {
      console.error("Error fetching event capacity:", eventError);
      return 0;
    }

    return eventData.max_capacity - eventData.current_bookings;
  } catch (error) {
    console.error("Failed to get available spaces:", error);
    return 0;
  }
}

// ============================================================================
// COUPON MANAGEMENT
// ============================================================================

/**
 * Coupon interface matching Supabase schema
 * Note: You may need to create this table in Supabase
 */
export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  expiration?: string;
  created_at?: string;
}

/**
 * Validate a coupon code
 * Returns the coupon if valid, null if invalid or expired
 */
export async function validateCoupon(
  code: string
): Promise<{ data: Coupon | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error) {
      // Not found is not an error - return null
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      console.error("Error validating coupon:", error);
      return { data: null, error };
    }

    // Check if expired
    if (data.expiration && new Date(data.expiration) < new Date()) {
      return { data: null, error: { message: "Coupon has expired" } };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Failed to validate coupon:", error);
    return { data: null, error };
  }
}

/**
 * Apply coupon discount to a price
 */
export function applyCouponDiscount(
  price: number,
  coupon: Coupon
): number {
  if (coupon.discount_type === 'percentage') {
    return price - (price * coupon.discount_value / 100);
  } else {
    return Math.max(0, price - coupon.discount_value);
  }
}

// ============================================================================
// THEME/TERM BOOKING HELPERS
// ============================================================================

/**
 * Fetch events by offering ID (for term/theme bookings)
 * This helps when booking multiple events under the same offering
 */
export async function fetchEventsByOfferingId(
  offeringId: string
): Promise<SupabaseEvent[]> {
  try {
    const { data, error } = await supabase
      .from("offering_events")
      .select(
        `
        *,
        offering:offerings!inner(*),
        capacity:event_capacity(*),
        category:event_categories(
          id,
          name,
          slug,
          color_hex,
          icon,
          parent_id
        )
      `
      )
      .eq("offering_id", offeringId)
      .eq("offering.status", "published")
      .order("event_date", { ascending: true })
      .order("event_start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events by offering ID:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch events by offering ID:", error);
    return [];
  }
}

/**
 * Fetch offerings (themes/terms) with their events
 * Useful for displaying term bookings
 */
export async function fetchOfferingsWithEvents(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("offerings")
      .select(
        `
        *,
        events:offering_events(
          *,
          capacity:event_capacity(*),
          category:event_categories(
            id,
            name,
            slug,
            color_hex,
            icon,
            parent_id
          )
        )
      `
      )
      .eq("status", "published")
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching offerings with events:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch offerings with events:", error);
    return [];
  }
}

/**
 * Create bulk bookings for term/theme bookings
 * Books multiple events at once (e.g., all events in a term)
 */
export async function createBulkBookings(
  eventIds: string[],
  customerEmail: string,
  customerName: string,
  attendees: number,
  totalPrice: number
): Promise<{ success: boolean; bookingIds: string[]; error: any }> {
  try {
    const bookings = eventIds.map(eventId => ({
      offering_event_id: eventId,
      customer_email: customerEmail,
      customer_name: customerName,
      number_of_attendees: attendees,
      status: 'confirmed' as const,
      total_price_gbp: totalPrice / eventIds.length, // Split price evenly
    }));

    const { data, error } = await supabase
      .from("bookings")
      .insert(bookings)
      .select();

    if (error) {
      console.error("Error creating bulk bookings:", error);
      return { success: false, bookingIds: [], error };
    }

    // Decrement capacity for all events
    for (const eventId of eventIds) {
      await decrementEventCapacity(eventId, attendees);
    }

    return {
      success: true,
      bookingIds: data.map(b => b.id),
      error: null
    };
  } catch (error) {
    console.error("Failed to create bulk bookings:", error);
    return { success: false, bookingIds: [], error };
  }
}
