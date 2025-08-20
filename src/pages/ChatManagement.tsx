import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageCircle, Search, User, Building, Paperclip, Image, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";

interface Conversation {
  matchId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerId: string;
  propertyTitle: string;
  propertyImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  } | null;
  timestamp: string;
}

const ChatManagement = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (matchId && conversations.length > 0) {
      const conversation = conversations.find(c => c.matchId === matchId);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessages(matchId);
      }
    }
  }, [matchId, conversations]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        navigate('/matches');
        return;
      }

      // Check if user has properties (making them eligible for chat management)
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userProfile.id)
        .is('deleted_at', null)
        .limit(1);

      const hasProperties = userProperties && userProperties.length > 0;

      // Allow access if user is a seller OR has properties
      if (userProfile.user_type !== 'seller' && !hasProperties) {
        navigate('/matches');
        return;
      }

      // Fetch all matches for this seller
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          buyer_id,
          seller_id,
          property_id,
          created_at,
          properties!inner (
            title,
            images
          ),
          buyer_profile:profiles!buyer_id (
            display_name,
            avatar_url
          )
        `)
        .eq('seller_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // For each match, get the latest message
      const conversationsData = await Promise.all(
        matches?.map(async (match) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages (messages not from current user)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .neq('sender_id', userProfile.id);

          return {
            matchId: match.id,
            buyerName: match.buyer_profile?.display_name || 'Unknown Buyer',
            buyerAvatar: match.buyer_profile?.avatar_url || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
            buyerId: match.buyer_id,
            propertyTitle: match.properties?.title || 'Unknown Property',
            propertyImage: match.properties?.images?.[0] || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
            lastMessage: lastMessage?.content || 'No messages yet',
            lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : '',
            unreadCount: unreadCount || 0
          };
        }) || []
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
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

      // Get current user's profile ID
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

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (urlError) {
        console.error('Signed URL error:', urlError);
        toast({
          title: "Upload Error",
          description: "Failed to generate file URL.",
          variant: "destructive",
        });
        return null;
      }

      return {
        url: signedUrlData.signedUrl,
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
    if (!user || !selectedConversation) return;

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
          match_id: selectedConversation.matchId,
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

      // Add message to local state
      const newMessage = {
        id: messageData.id,
        senderId: "me",
        text: messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
        attachment: attachment || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage("");

      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.matchId === selectedConversation.matchId 
          ? { ...conv, lastMessage: messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''), lastMessageTime: new Date().toLocaleDateString() }
          : conv
      ));

      // Send push notification
      await notificationService.sendMessageNotification(
        selectedConversation.buyerId,
        senderProfile.display_name || 'Real Estate Agent',
        messageText || (attachment ? `Sent ${attachment.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
        selectedConversation.matchId,
        selectedConversation.propertyTitle
      );

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
    if (!message.trim() || !user || !selectedConversation) return;

    await sendMessageWithAttachment(message.trim());
  };

  const filteredConversations = conversations.filter(conv =>
    conv.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Chat Management</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.matchId}
                className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                  selectedConversation?.matchId === conv.matchId ? 'bg-accent' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conv);
                  fetchMessages(conv.matchId);
                  navigate(`/chat-management/${conv.matchId}`);
                }}
              >
                <div className="flex gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.buyerAvatar} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground truncate">{conv.buyerName}</h3>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {conv.propertyTitle}
                    </p>
                    
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.lastMessageTime}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.buyerAvatar} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="font-semibold text-foreground">{selectedConversation.buyerName}</h2>
                  <p className="text-sm text-muted-foreground">{selectedConversation.propertyTitle}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-border bg-card p-4">
              <form onSubmit={handleSendMessage}>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;