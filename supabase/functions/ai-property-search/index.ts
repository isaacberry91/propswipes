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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const userQuery = body.query as string;
    const userId = body.userId as string;
    const currentFilters = body.currentFilters || {};

    console.log('🔍 AI Property Search started:', { query: userQuery, userId, currentFilters });

    if (!userQuery) {
      return new Response(
        JSON.stringify({ error: "Missing query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI with tool calling to extract structured filters
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a real estate property search assistant. Extract property search filters from natural language queries. When the user specifies an exact number (e.g., 'one bedroom', '3 bedrooms'), set both min and max to that number for exact matching. Only use min without max when they say 'at least' or similar phrases."
          },
          {
            role: "user",
            content: userQuery
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_property_filters",
              description: "Extract property search filters from the user's natural language query",
              parameters: {
                type: "object",
                properties: {
                  bedrooms_min: {
                    type: "number",
                    description: "Minimum number of bedrooms (use with bedrooms_max for exact match)"
                  },
                  bedrooms_max: {
                    type: "number",
                    description: "Maximum number of bedrooms (set same as min for exact match)"
                  },
                  bathrooms_min: {
                    type: "number",
                    description: "Minimum number of bathrooms (use with bathrooms_max for exact match)"
                  },
                  bathrooms_max: {
                    type: "number",
                    description: "Maximum number of bathrooms (set same as min for exact match)"
                  },
                  price_min: {
                    type: "number",
                    description: "Minimum price in dollars"
                  },
                  price_max: {
                    type: "number",
                    description: "Maximum price in dollars"
                  },
                  square_feet_min: {
                    type: "number",
                    description: "Minimum square feet"
                  },
                  square_feet_max: {
                    type: "number",
                    description: "Maximum square feet"
                  },
                  property_type: {
                    type: "string",
                    enum: ["residential", "commercial", "land", "condo", "apartment"],
                    description: "Type of property"
                  },
                  listing_type: {
                    type: "string",
                    enum: ["for-sale", "rental"],
                    description: "Listing type - for sale or rental"
                  },
                  amenities: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of desired amenities (e.g., 'hardwood floors', 'swimming pool', 'parking garage')"
                  },
                  location: {
                    type: "string",
                    description: "Location keywords (city, neighborhood, landmark)"
                  },
                  year_built_min: {
                    type: "number",
                    description: "Minimum year built (for new construction or recent builds)"
                  }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_property_filters" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('❌ AI Gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('🤖 AI Response:', JSON.stringify(aiData, null, 2));

    // Extract the filters from the tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Failed to extract filters from query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiFilters = JSON.parse(toolCall.function.arguments);
    console.log('📊 AI extracted filters:', aiFilters);
    console.log('📊 Current UI filters:', currentFilters);

    // Merge AI filters with current UI filters (AI filters take priority where they exist)
    const filters = {
      // Price: Use AI filters if present, otherwise use UI filters
      price_min: aiFilters.price_min ?? (currentFilters.priceRange?.[0] !== 200000 ? currentFilters.priceRange?.[0] : undefined),
      price_max: aiFilters.price_max ?? (currentFilters.priceRange?.[1] !== 2000000 ? currentFilters.priceRange?.[1] : undefined),
      
      // Property/Listing type: AI overrides UI
      property_type: aiFilters.property_type ?? currentFilters.propertyType,
      listing_type: aiFilters.listing_type ?? currentFilters.listingType,
      
      // Bedrooms/Bathrooms: AI overrides UI
      bedrooms_min: aiFilters.bedrooms_min ?? (currentFilters.bedrooms === 'studio' ? 0 : parseInt(currentFilters.bedrooms) || undefined),
      bedrooms_max: aiFilters.bedrooms_max,
      bathrooms_min: aiFilters.bathrooms_min ?? parseFloat(currentFilters.bathrooms) || undefined,
      bathrooms_max: aiFilters.bathrooms_max,
      
      // Square feet: AI overrides UI
      square_feet_min: aiFilters.square_feet_min ?? (currentFilters.sqftRange?.[0] !== 500 ? currentFilters.sqftRange?.[0] : undefined),
      square_feet_max: aiFilters.square_feet_max ?? (currentFilters.sqftRange?.[1] !== 15000 ? currentFilters.sqftRange?.[1] : undefined),
      
      // Year built: AI overrides UI
      year_built_min: aiFilters.year_built_min ?? (currentFilters.yearBuilt?.[0] !== 1950 ? currentFilters.yearBuilt?.[0] : undefined),
      
      // AI-only filters
      amenities: aiFilters.amenities || [],
      location: aiFilters.location
    };

    console.log('📊 Merged filters:', filters);

    // Build database query with merged filters
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
    if (filters.bedrooms_max) query = query.lte("bedrooms", filters.bedrooms_max);
    if (filters.bathrooms_min) query = query.gte("bathrooms", filters.bathrooms_min);
    if (filters.bathrooms_max) query = query.lte("bathrooms", filters.bathrooms_max);
    if (filters.year_built_min) query = query.gte("year_built", filters.year_built_min);

    query = query.order('created_at', { ascending: false }).limit(50);

    const { data: properties, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found ${properties?.length || 0} properties from database`);

    // Filter by location and amenities in-memory for more flexible matching
    let filteredProperties = properties || [];

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filteredProperties = filteredProperties.filter(p => 
        p.city?.toLowerCase().includes(locationLower) ||
        p.state?.toLowerCase().includes(locationLower) ||
        p.address?.toLowerCase().includes(locationLower) ||
        p.description?.toLowerCase().includes(locationLower)
      );
      console.log(`📍 After location filter: ${filteredProperties.length} properties`);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filteredProperties = filteredProperties.filter(p => {
        const propertyText = (
          (p.amenities || []).join(' ') + ' ' +
          (p.description || '')
        ).toLowerCase();
        
        return filters.amenities.some((amenity: string) => 
          propertyText.includes(amenity.toLowerCase())
        );
      });
      console.log(`🏠 After amenities filter: ${filteredProperties.length} properties`);
    }

    console.log(`✅ Final result: ${filteredProperties.length} properties`);

    return new Response(
      JSON.stringify({ 
        properties: filteredProperties,
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
