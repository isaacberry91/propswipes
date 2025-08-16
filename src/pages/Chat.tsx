import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Heart, Home, MapPin, Paperclip, Image, User, Building, Mail, Phone, X, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";


const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && matchId) {
      fetchMatchData();
      fetchMessages();
    }
  }, [user, matchId]);

  useEffect(() => {
    if (!matchId || !user) return;

    let currentUserProfileId: string | null = null;

    // Get current user's profile ID first
    const getCurrentUserProfile = async () => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      currentUserProfileId = userProfile?.id || null;
    };

    getCurrentUserProfile();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMessage = payload.new;
          // Only add to local state if it's not from current user
          const isFromCurrentUser = newMessage.sender_id === currentUserProfileId;
          if (!isFromCurrentUser) {
            setMessages(prev => [...prev, {
              id: newMessage.id,
              senderId: newMessage.sender_id,
              text: newMessage.content,
              timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  const fetchMatchData = async () => {
    if (!user || !matchId) return;
    
    setLoading(true);
    try {
      // Get user's profile first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        toast({
          title: "Error",
          description: "Could not find your profile.",
          variant: "destructive",
        });
        navigate('/matches');
        return;
      }

      // Fetch match data
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          property_id,
          buyer_id,
          seller_id,
          properties!inner (
            id,
            title,
            city,
            state,
            price,
            images,
            bedrooms,
            bathrooms,
            square_feet,
            property_type,
            amenities,
            address,
            description
          ),
          buyer_profile:profiles!buyer_id (
            id,
            display_name,
            avatar_url,
            user_type,
            bio,
            phone,
            location
          ),
          seller_profile:profiles!seller_id (
            id,
            display_name,
            avatar_url,
            user_type,
            bio,
            phone,
            location
          )
        `)
        .eq('id', matchId)
        .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`)
        .single();

      if (error || !matchData) {
        console.error('Error fetching match:', error);
        toast({
          title: "Match not found",
          description: "This match could not be found or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/matches');
        return;
      }

      // Transform the data
      const isUserBuyer = matchData.buyer_id === userProfile.id;
      const otherUser = isUserBuyer ? matchData.seller_profile : matchData.buyer_profile;
      const property = matchData.properties;

      const transformedMatch = {
        id: matchData.id,
        buyerId: matchData.buyer_id,
        sellerId: matchData.seller_id,
        user: {
          name: otherUser?.display_name || 'Unknown User',
          avatar: otherUser?.avatar_url || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
          type: otherUser?.user_type === 'seller' ? 'Real Estate Agent' : 'Buyer',
          bio: otherUser?.bio || 'No bio available',
          phone: otherUser?.phone || 'No phone provided',
          location: otherUser?.location || 'Location not provided',
          profileId: otherUser?.id
        },
        property: {
          title: property.title,
          location: `${property.city}, ${property.state}`,
          price: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(property.price),
          image: property.images?.[0] || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.square_feet,
          type: property.property_type,
          amenities: property.amenities || [],
          address: property.address,
          description: property.description
        }
      };

      setMatch(transformedMatch);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load match data.",
        variant: "destructive",
      });
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!matchId) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Get current user's profile ID to determine which messages are from "me"
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id === userProfile?.id ? "me" : msg.sender_id,
        text: msg.content,
        attachment: msg.attachment_url ? {
          url: msg.attachment_url,
          type: msg.attachment_type,
          name: msg.attachment_name
        } : null,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // User profile and property details are now loaded from the match data

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (file: File) => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Error",
          description: "Failed to upload file.",
          variant: "destructive",
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: file.type,
        name: file.name
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const attachment = await uploadFile(file);
    if (attachment) {
      await sendMessageWithAttachment("", attachment);
    }
  };

  const sendMessageWithAttachment = async (messageText: string, attachment?: any) => {
    if (!user || !match) return;

    try {
      // Get current user's profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .single();

      if (!senderProfile) {
        toast({
          title: "Error",
          description: "Could not find your profile.",
          variant: "destructive",
        });
        return;
      }

      // Save message to database
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderProfile.id,
          content: messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
          attachment_url: attachment?.url || null,
          attachment_type: attachment?.type || null,
          attachment_name: attachment?.name || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
        return;
      }

      // Add message to local state for immediate UI update
      const newMessage = {
        id: messageData.id,
        senderId: "me",
        text: messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
        attachment: attachment || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage("");

      // Send push notification to recipient
      try {
        const recipientId = match.buyerId === senderProfile.id ? match.sellerId : match.buyerId;
        
        await supabase.functions.invoke('send-push-notification', {
          body: {
            recipientUserId: recipientId,
            senderId: senderProfile.id,
            messageContent: messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
            matchId: matchId
          }
        });
      } catch (notificationError) {
        console.error('Failed to send push notification:', notificationError);
        // Don't show error to user as the message was sent successfully
      }

    } catch (error) {
      console.error('Error in sendMessageWithAttachment:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !match) return;

    await sendMessageWithAttachment(message.trim());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Match not found</p>
          <Button onClick={() => navigate('/matches')} className="mt-4">
            Back to Matches
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Avatar 
            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => setShowUserProfile(true)}
          >
            <AvatarImage src={match.user.avatar} />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 
              className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={() => setShowUserProfile(true)}
            >
              {match.user.name}
            </h2>
            <p className="text-sm text-muted-foreground">{match.user.type}</p>
          </div>
          
          <Heart className="w-5 h-5 text-love" />
        </div>
      </div>

      {/* Property Info */}
      <div className="bg-accent/30 border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Card 
            className="p-3 bg-card border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowPropertyDetails(true)}
          >
            <div className="flex gap-3">
              <img 
                src={match.property.image} 
                alt={match.property.title}
                className="w-16 h-16 object-cover rounded-lg hover:scale-105 transition-transform"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                  {match.property.title}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{match.property.location}</span>
                </div>
                <div className="text-primary font-semibold text-sm mt-1">
                  {match.property.price}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderId === 'me'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                {msg.text && <p className="text-sm">{msg.text}</p>}
                
                {msg.attachment && (
                  <div className="mt-2">
                    {msg.attachment.type.startsWith('image/') ? (
                      <img 
                        src={msg.attachment.url} 
                        alt={msg.attachment.name}
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.attachment.url, '_blank')}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded bg-background/20 border border-border/50">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm truncate flex-1">{msg.attachment.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1"
                          onClick={() => window.open(msg.attachment.url, '_blank')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  msg.senderId === 'me' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              accept="*/*"
            />
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              accept="image/*"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
            >
              <Image className="w-4 h-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={uploading ? "Uploading..." : "Type a message..."}
              className="flex-1"
              disabled={uploading}
            />
            <Button 
              type="submit" 
              variant="default" 
              size="icon"
              disabled={uploading || (!message.trim())}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* User Profile Dialog */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={match.user.avatar} />
                <AvatarFallback>{match.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span>{match.user.name}</span>
                </div>
                <p className="text-sm text-muted-foreground font-normal">{match.user.type}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Type</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{match.user.type}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{match.user.location}</p>
            </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Phone</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{match.user.phone}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">About</h4>
              <p className="text-sm text-muted-foreground">{match.user.bio}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Details Dialog */}
      <Dialog open={showPropertyDetails} onOpenChange={setShowPropertyDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{match.property.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <img 
              src={match.property.image} 
              alt={match.property.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{match.property.bedrooms}</p>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{match.property.bathrooms}</p>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{match.property.sqft ? new Intl.NumberFormat().format(match.property.sqft) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Sq Ft</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Location & Price</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  {match.property.location}
                </div>
                <p className="text-xl font-bold text-primary">{match.property.price}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Type</h4>
                <Badge variant="secondary">{match.property.type}</Badge>
              </div>

              {match.property.amenities && match.property.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.property.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {match.property.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{match.property.description}</p>
                </div>
              )}

              <div className="text-sm">
                <span className="font-medium">Address:</span>
                <span className="ml-2 text-muted-foreground">{match.property.address}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;