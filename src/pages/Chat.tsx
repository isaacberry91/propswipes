import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Heart, Home, MapPin } from "lucide-react";

// Sample chat data
const chatData = {
  1: {
    match: {
      property: {
        title: "Modern Downtown Condo",
        price: "$850,000",
        location: "Downtown, Seattle",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop"
      },
      user: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b429?w=100&h=100&fit=crop&crop=face",
        type: "Buyer"
      }
    },
    messages: [
      {
        id: 1,
        senderId: "other",
        text: "Hi! I'm really interested in this property. When can we schedule a viewing?",
        timestamp: "2:30 PM"
      },
      {
        id: 2,
        senderId: "me",
        text: "Hello Sarah! Great to meet another person interested in this condo. I'm available this weekend for a viewing.",
        timestamp: "2:35 PM"
      },
      {
        id: 3,
        senderId: "other",
        text: "Perfect! How about Saturday at 2 PM? Also, have you seen the building amenities yet?",
        timestamp: "2:40 PM"
      },
      {
        id: 4,
        senderId: "me",
        text: "Saturday works great! Yes, the rooftop deck and gym look amazing. Are you looking to buy or rent?",
        timestamp: "2:45 PM"
      },
      {
        id: 5,
        senderId: "other",
        text: "Looking to buy! This would be my first home purchase. What drew you to this property?",
        timestamp: "2:50 PM"
      }
    ]
  }
};

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(chatData[1]?.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const match = chatData[1]?.match;

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
          
          <img 
            src={match.user.avatar} 
            alt={match.user.name}
            className="w-10 h-10 object-cover rounded-full"
          />
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground">{match.user.name}</h2>
            <p className="text-sm text-muted-foreground">{match.user.type}</p>
          </div>
          
          <Heart className="w-5 h-5 text-love" />
        </div>
      </div>

      {/* Property Info */}
      <div className="bg-accent/30 border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-3 bg-card border-0 shadow-sm">
            <div className="flex gap-3">
              <img 
                src={match.property.image} 
                alt={match.property.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">{match.property.title}</h3>
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
    </div>
  );
};

export default Chat;