import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();

    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 AI Search started:', { query, userId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile to check location
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, location')
      .eq('user_id', userId)
      .single();

    console.log('👤 User profile:', profile);

    // Use OpenAI to extract search criteria from natural language
    let searchCriteria: any = {};
    
    if (openAIApiKey) {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a real estate search assistant. Extract structured search criteria from user queries. Return ONLY valid JSON with these optional fields:
{
  "bedrooms": number or null,
  "bathrooms": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "propertyType": "residential" | "commercial" | null,
  "listingType": "for-sale" | "for-rent" | null,
  "location": string or null (city, state, or neighborhood),
  "amenities": string[] or null (keywords to search in amenities/description)
}
Do not include explanations, only return the JSON object.`
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.3,
        }),
      });

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      console.log('🤖 AI extracted criteria:', aiContent);
      
      try {
        searchCriteria = JSON.parse(aiContent);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        searchCriteria = {};
      }
    } else {
      // Fallback: simple keyword extraction
      const lowerQuery = query.toLowerCase();
      
      // Extract bedrooms
      const bedroomMatch = lowerQuery.match(/(\d+)\s*(?:bed|bedroom)/);
      if (bedroomMatch) searchCriteria.bedrooms = parseInt(bedroomMatch[1]);
      
      // Extract bathrooms
      const bathroomMatch = lowerQuery.match(/(\d+)\s*(?:bath|bathroom)/);
      if (bathroomMatch) searchCriteria.bathrooms = parseInt(bathroomMatch[1]);
      
      // Extract price
      const priceMatch = lowerQuery.match(/\$?\s*(\d+)k/i);
      if (priceMatch) searchCriteria.maxPrice = parseInt(priceMatch[1]) * 1000;
      
      // Detect listing type
      if (lowerQuery.includes('rent')) searchCriteria.listingType = 'for-rent';
      if (lowerQuery.includes('buy') || lowerQuery.includes('sale')) searchCriteria.listingType = 'for-sale';
      
      // Extract location keywords
      const locationKeywords = ['near', 'in', 'downtown', 'suburb', 'city'];
      for (const keyword of locationKeywords) {
        if (lowerQuery.includes(keyword)) {
          searchCriteria.location = query;
          break;
        }
      }
      
      // Extract amenities
      const amenityKeywords = ['pool', 'gym', 'parking', 'balcony', 'garden', 'garage'];
      const foundAmenities = amenityKeywords.filter(a => lowerQuery.includes(a));
      if (foundAmenities.length > 0) {
        searchCriteria.amenities = foundAmenities;
      }
    }

    console.log('🔍 Final search criteria:', searchCriteria);

    // Build Supabase query with extracted criteria
    let dbQuery = supabase
      .from('properties')
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

    // Apply filters from AI-extracted criteria
    if (searchCriteria.bedrooms) {
      dbQuery = dbQuery.gte('bedrooms', searchCriteria.bedrooms);
    }
    
    if (searchCriteria.bathrooms) {
      dbQuery = dbQuery.gte('bathrooms', searchCriteria.bathrooms);
    }
    
    if (searchCriteria.minPrice) {
      dbQuery = dbQuery.gte('price', searchCriteria.minPrice);
    }
    
    if (searchCriteria.maxPrice) {
      dbQuery = dbQuery.lte('price', searchCriteria.maxPrice);
    }
    
    if (searchCriteria.propertyType) {
      dbQuery = dbQuery.eq('property_type', searchCriteria.propertyType);
    }
    
    if (searchCriteria.listingType) {
      dbQuery = dbQuery.eq('listing_type', searchCriteria.listingType);
    }

    // Exclude user's own properties
    if (profile?.id) {
      dbQuery = dbQuery.neq('owner_id', profile.id);
    }

    dbQuery = dbQuery.order('created_at', { ascending: false }).limit(50);

    const { data: properties, error: dbError } = await dbQuery;

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`✅ Found ${properties?.length || 0} properties`);

    // Filter by location and amenities in-memory (for more flexible matching)
    let filteredProperties = properties || [];

    if (searchCriteria.location) {
      const locationLower = searchCriteria.location.toLowerCase();
      filteredProperties = filteredProperties.filter(p => 
        p.city?.toLowerCase().includes(locationLower) ||
        p.state?.toLowerCase().includes(locationLower) ||
        p.address?.toLowerCase().includes(locationLower) ||
        p.description?.toLowerCase().includes(locationLower)
      );
    }

    if (searchCriteria.amenities && searchCriteria.amenities.length > 0) {
      filteredProperties = filteredProperties.filter(p => {
        const propertyText = (
          (p.amenities || []).join(' ') + ' ' +
          (p.description || '')
        ).toLowerCase();
        
        return searchCriteria.amenities.some((amenity: string) => 
          propertyText.includes(amenity.toLowerCase())
        );
      });
    }

    console.log(`✅ After filtering: ${filteredProperties.length} properties`);

    return new Response(
      JSON.stringify({
        properties: filteredProperties,
        criteria: searchCriteria,
        query: query
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
