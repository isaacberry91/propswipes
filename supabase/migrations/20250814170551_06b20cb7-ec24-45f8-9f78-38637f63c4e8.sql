-- Create trigger to automatically create matches when a property is liked
CREATE TRIGGER create_match_on_property_like
  AFTER INSERT ON property_swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_like();