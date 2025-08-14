import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Heart, Home, MapPin, Paperclip, Image, User, Building, Mail, Phone } from "lucide-react";


const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Fetch actual match data from API
  const match = {
    id: matchId,
    user: {
      name: "Sarah Chen",
      avatar: "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
      type: "Real Estate Agent"
    },
    property: {
      title: "Modern Downtown Condo",
      location: "Downtown Seattle",
      price: "$850,000",
      image: "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png"
    }
  };

  // TODO: Fetch actual user and property data from API
  const userProfile = {
    name: "Sarah Chen",
    avatar: "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
    type: "Real Estate Agent",
    verified: true,
    company: "Premier Realty",
    position: "Senior Agent",
    email: "sarah.chen@premierrealty.com",
    phone: "(555) 123-4567",
    bio: "Experienced real estate professional with 8+ years helping clients find their perfect home.",
    memberSince: "January 2020"
  };
  
  const propertyDetails = {
    title: "Modern Downtown Condo",
    image: "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
    bedrooms: "2",
    bathrooms: "2",
    sqft: "1,200",
    yearBuilt: "2019",
    location: "Downtown Seattle, WA",
    price: "$850,000",
    amenities: ["Pool", "Gym", "Concierge", "Rooftop Deck"],
    features: ["Hardwood Floors", "Stainless Appliances", "City Views"],
    hoaFees: "$350/month",
    parking: "1 Garage Space",
    petPolicy: "Cats & Dogs Allowed"
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      senderId: "me",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

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
                <p className="text-sm">{msg.text}</p>
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
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
            >
              <Image className="w-4 h-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" variant="default" size="icon">
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
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span>{userProfile.name}</span>
                  {userProfile.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-normal">{userProfile.type}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Company</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{userProfile.company}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Position</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{userProfile.position}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Email</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{userProfile.email}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Phone</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{userProfile.phone}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">About</h4>
              <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Member since {userProfile.memberSince}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Details Dialog */}
      <Dialog open={showPropertyDetails} onOpenChange={setShowPropertyDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{propertyDetails.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <img 
              src={propertyDetails.image} 
              alt={propertyDetails.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{propertyDetails.bedrooms}</p>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{propertyDetails.bathrooms}</p>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{propertyDetails.sqft}</p>
                <p className="text-sm text-muted-foreground">Sq Ft</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{propertyDetails.yearBuilt}</p>
                <p className="text-sm text-muted-foreground">Year Built</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Location & Price</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  {propertyDetails.location}
                </div>
                <p className="text-xl font-bold text-primary">{propertyDetails.price}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {propertyDetails.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {propertyDetails.features.map((feature, index) => (
                    <Badge key={index} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">HOA Fees:</span>
                  <span className="ml-2 text-muted-foreground">{propertyDetails.hoaFees}</span>
                </div>
                <div>
                  <span className="font-medium">Parking:</span>
                  <span className="ml-2 text-muted-foreground">{propertyDetails.parking}</span>
                </div>
                <div>
                  <span className="font-medium">Pet Policy:</span>
                  <span className="ml-2 text-muted-foreground">{propertyDetails.petPolicy}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;