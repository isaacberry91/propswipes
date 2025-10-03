import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ------------------ HELPERS ------------------
function parsePrice(value: string): number | null {
  value = value.toLowerCase().replace(/[, ]/g, "");
  if (value.endsWith("k")) return parseFloat(value) * 1000;
  if (value.endsWith("m") || value.endsWith("mill")) return parseFloat(value) * 1000000;
  if (!isNaN(Number(value))) return Number(value);
  return null;
}

function acresToSqFt(acres: number): number {
  return acres * 43560;
}

// ------------------ PARSER ------------------
function parseQuery(userQuery: string) {
  const filters: Record<string, any> = {};
  const text = userQuery.toLowerCase();

  // Property type / listing type
  if (text.includes("land")) filters.property_type = "land";
  if (text.includes("residential")) filters.property_type = "residential";
  if (text.includes("commercial")) filters.property_type = "commercial";
  if (text.includes("condo")) filters.property_type = "condo";
  if (text.includes("apartment")) filters.property_type = "apartment";
  if (text.includes("house") || text.includes("home")) filters.property_type = "residential";

  if (text.includes("rental")) filters.listing_type = "rental";
  if (text.includes("for sale")) filters.listing_type = "for-sale";

  // Bedrooms & Bathrooms
  let match = text.match(/at least\s+(\d+)\s*bedrooms?/);
  if (match) filters.bedrooms_min = parseInt(match[1]);
  match = text.match(/(\d+)\s*bedrooms?/);
  if (match) filters.bedrooms_min = parseInt(match[1]);

  match = text.match(/at least\s+(\d+)\s*bathrooms?/);
  if (match) filters.bathrooms_min = parseInt(match[1]);
  match = text.match(/(\d+)\s*bathrooms?/);
  if (match) filters.bathrooms_min = parseInt(match[1]);

  // Price
  match = text.match(/over\s+\$?(\d+(?:\.\d+)?\s*(k|m|mill)?)/);
  if (match) filters.price_min = parsePrice(match[1]);

  match = text.match(/less than\s+\$?(\d+(?:\.\d+)?\s*(k|m|mill)?)/);
  if (match) filters.price_max = parsePrice(match[1]);

  match = text.match(/between\s+\$?(\d+(?:\.\d+)?\s*(k|m|mill)?)\s+(?:and|to)\s+\$?(\d+(?:\.\d+)?\s*(k|m|mill)?)/);
  if (match) {
    filters.price_min = parsePrice(match[1]);
    filters.price_max = parsePrice(match[3]);
  }

  // Square feet
  match = text.match(/(\d+(?:,\d+)?)\s*(square feet|sqft)/);
  if (match) filters.square_feet_min = parseInt(match[1].replace(/,/g, ""));

  // Acres → sq ft
  match = text.match(/over\s+(\d+(?:\.\d+)?)\s*acres?/);
  if (match) filters.square_feet_min = acresToSqFt(parseFloat(match[1]));

  match = text.match(/less than\s+(\d+(?:\.\d+)?)\s*acres?/);
  if (match) filters.square_feet_max = acresToSqFt(parseFloat(match[1]));

  match = text.match(/between\s+(\d+(?:\.\d+)?)\s+(?:and|to)\s+(\d+(?:\.\d+)?)\s*acres?/);
  if (match) {
    filters.square_feet_min = acresToSqFt(parseFloat(match[1]));
    filters.square_feet_max = acresToSqFt(parseFloat(match[2]));
  }

  // Amenities (simple keyword matcher)
  const amenityMap = [
    "hardwood floors",
    "high ceilings",
    "walk-in closets",
    "master suite",
    "granite countertops",
    "stainless steel appliances",
    "parking garage",
    "in-unit laundry",
    "fireplace",
    "crown molding",
    "swimming pool",
    "fitness center",
    "renovated",
    "new paint"
  ];
  filters.amenities = amenityMap.filter(a => text.includes(a));

  // Year built (for "last X years")
  match = text.match(/last\s+(\d+)\s+years?/);
  if (match) {
    const years = parseInt(match[1]);
    const currentYear = new Date().getFullYear();
    filters.year_built_min = currentYear - years;
  }

  return filters;
}

// ------------------ FUNCTION HANDLER ------------------
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const userQuery = body.query as string;
    const userId = body.userId as string;

    console.log('🔍 AI Search started:', { query: userQuery, userId });

    if (!userQuery) {
      return new Response(
        JSON.stringify({ error: "Missing query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filters = parseQuery(userQuery);
    console.log('📊 Extracted filters:', filters);

    let query = supabase
      .from("properties")
      .select(`
        id,
        owner_id,
        title,
        price,
        property_type,
        listing_type,
        bedrooms,
        bathrooms,
        square_feet,
        address,
        unit_number,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        images,
        videos,
        amenities,
        description,
        created_at,
        updated_at,
        owner:profiles!owner_id(id, display_name, avatar_url, user_type, phone)
      `)
      .eq('status', 'approved')
      .is('deleted_at', null);

    // Exclude user's own properties if userId provided
    if (userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (userProfile) {
        query = query.neq('owner_id', userProfile.id);
        console.log('🚫 Excluding properties from user:', userProfile.id);
      }
    }

    // Apply filters
    if (filters.property_type) query = query.eq("property_type", filters.property_type);
    if (filters.listing_type) query = query.eq("listing_type", filters.listing_type);

    if (filters.price_min) query = query.gte("price", filters.price_min);
    if (filters.price_max) query = query.lte("price", filters.price_max);

    if (filters.square_feet_min) query = query.gte("square_feet", filters.square_feet_min);
    if (filters.square_feet_max) query = query.lte("square_feet", filters.square_feet_max);

    if (filters.bedrooms_min) query = query.gte("bedrooms", filters.bedrooms_min);
    if (filters.bathrooms_min) query = query.gte("bathrooms", filters.bathrooms_min);

    if (filters.year_built_min) query = query.gte("year_built", filters.year_built_min);

    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains("amenities", filters.amenities);
    }

    query = query.order('created_at', { ascending: false }).limit(50);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found ${data?.length || 0} properties matching criteria`);

    return new Response(
      JSON.stringify({ 
        properties: data ?? [],
        criteria: filters,
        query: userQuery
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('❌ Error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
