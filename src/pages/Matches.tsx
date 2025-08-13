import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Matches = () => {
  const navigate = useNavigate();
  const [matches] = useState([]); // TODO: Fetch actual matches from API

  const handleChatClick = (matchId: number) => {
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
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