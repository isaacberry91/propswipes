import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample matches data
const sampleMatches = [
  {
    id: 1,
    property: {
      title: "Modern Downtown Condo",
      price: "$850,000",
      location: "Downtown, Seattle",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"
    },
    matchedUser: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b429?w=100&h=100&fit=crop&crop=face",
      type: "Buyer"
    },
    matchedAt: "2 hours ago",
    lastMessage: "Hi! I'm really interested in this property. When can we schedule a viewing?",
    unreadCount: 2
  },
  {
    id: 2,
    property: {
      title: "Cozy Suburban House",
      price: "$650,000",
      location: "Bellevue, WA",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400&h=300&fit=crop"
    },
    matchedUser: {
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      type: "Investor"
    },
    matchedAt: "1 day ago",
    lastMessage: "What's the neighborhood like? Any upcoming developments?",
    unreadCount: 0
  },
  {
    id: 3,
    property: {
      title: "Luxury Waterfront Loft",
      price: "$1,200,000",
      location: "Capitol Hill, Seattle",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
    },
    matchedUser: {
      name: "Emma Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      type: "Buyer"
    },
    matchedAt: "3 days ago",
    lastMessage: "The views are amazing! Is the HOA fee included in the price?",
    unreadCount: 1
  }
];

const Matches = () => {
  const navigate = useNavigate();
  const [matches] = useState(sampleMatches);

  const handleChatClick = (matchId: number) => {
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-love mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Matches</h1>
          <p className="text-muted-foreground">Connect with people interested in the same properties</p>
        </div>

        {matches.length === 0 ? (
          <Card className="p-8 text-center shadow-card border-0">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-4">
              Start swiping to find people interested in the same properties!
            </p>
            <Button variant="gradient" onClick={() => navigate('/discover')}>
              Start Discovering
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-4 shadow-card border-0 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-4">
                  {/* Property Image */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={match.property.image} 
                      alt={match.property.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Match Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          {match.property.title}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{match.property.location}</span>
                        </div>
                      </div>
                      <span className="text-primary font-semibold text-sm">
                        {match.property.price}
                      </span>
                    </div>
                    
                    {/* Matched User Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={match.matchedUser.avatar} 
                        alt={match.matchedUser.name}
                        className="w-6 h-6 object-cover rounded-full"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {match.matchedUser.name}
                      </span>
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                        {match.matchedUser.type}
                      </span>
                    </div>
                    
                    {/* Last Message */}
                    <p className="text-sm text-muted-foreground truncate mb-3">
                      {match.lastMessage}
                    </p>
                    
                    {/* Match Time & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{match.matchedAt}</span>
                      </div>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleChatClick(match.id)}
                        className="relative"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                        {match.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-love text-love-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {match.unreadCount}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;