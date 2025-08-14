-- Create a function to automatically create matches when users like the same property
CREATE OR REPLACE FUNCTION create_match_on_like()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id uuid;
  buyer_profile_id uuid;
  existing_match_id uuid;
BEGIN
  -- Only process likes (not dislikes)
  IF NEW.is_liked = false THEN
    RETURN NEW;
  END IF;

  -- Get the property owner's profile ID
  SELECT owner_id INTO property_owner_id
  FROM properties 
  WHERE id = NEW.property_id;

  -- Get the buyer's profile ID (the one who just liked)
  SELECT id INTO buyer_profile_id
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't create match if user likes their own property
  IF property_owner_id = buyer_profile_id THEN
    RETURN NEW;
  END IF;

  -- Check if match already exists
  SELECT id INTO existing_match_id
  FROM matches
  WHERE property_id = NEW.property_id
    AND buyer_id = buyer_profile_id
    AND seller_id = property_owner_id;

  -- Create match if it doesn't exist
  IF existing_match_id IS NULL THEN
    INSERT INTO matches (property_id, buyer_id, seller_id)
    VALUES (NEW.property_id, buyer_profile_id, property_owner_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;