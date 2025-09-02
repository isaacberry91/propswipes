import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Heart, Home, MapPin, Paperclip, Image, User, Building, Mail, Phone, X, Download, MoreVertical, Flag, Shield, Trash2, Mic, Square, Play, Pause, Copy } from "lucide-react";
import VoiceNoteDuration from "@/components/VoiceNoteDuration";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";
import { resolveUserProfile } from "@/utils/profileUtils";


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
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [recipientPrivacySettings, setRecipientPrivacySettings] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [messagePlaybackSpeeds, setMessagePlaybackSpeeds] = useState<{[key: string]: number}>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Context menu state for message actions
  const [contextMenu, setContextMenu] = useState<{ show: boolean; messageId: string | null; x: number; y: number }>({ show: false, messageId: null, x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
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
               attachment: newMessage.attachment_url ? {
                url: newMessage.attachment_url,
                type: newMessage.attachment_type,
                name: newMessage.attachment_name,
                isVoiceNote: newMessage.attachment_type?.startsWith('audio/') && newMessage.content === 'Sent a voice note'
              } : null,
              duration_seconds: newMessage.duration_seconds ?? null,
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
          properties!left (
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
            description,
            deleted_at
          )
        `)
        .eq('id', matchId)
        .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`)
        .maybeSingle();

      console.log('🔍 Chat: Raw match data from database:', matchData);
      console.log('🔍 Chat: Database query error:', error);

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

      // Get the other user's profile using shared utility
      const isUserBuyer = matchData.buyer_id === userProfile.id;
      const otherUserProfileId = isUserBuyer ? matchData.seller_id : matchData.buyer_id;
      
      console.log('🔍 Chat: User is buyer:', isUserBuyer);
      console.log('🔍 Chat: Other user profile ID:', otherUserProfileId);

      // Use shared utility to resolve user profile (no joined profile since we removed joins)
      const resolvedUser = await resolveUserProfile(otherUserProfileId, null);
      
      const propertyData = matchData.properties;

      const transformedMatch = {
        id: matchData.id,
        buyerId: matchData.buyer_id,
        sellerId: matchData.seller_id,
        user: resolvedUser,
        property: {
          title: propertyData?.title || 'Removed Property',
          location: propertyData ? `${propertyData.city}, ${propertyData.state}` : '—',
          price: propertyData?.price != null ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(propertyData.price) : '—',
          image: propertyData?.images?.[0] || "/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png",
          bedrooms: propertyData?.bedrooms,
          bathrooms: propertyData?.bathrooms,
          sqft: propertyData?.square_feet,
          type: propertyData?.property_type,
          amenities: propertyData?.amenities || [],
          address: propertyData?.address,
          description: propertyData?.description,
          isDeleted: !propertyData || !!propertyData.deleted_at
        }
      };

      setMatch(transformedMatch);
      fetchRecipientPrivacySettings();
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

      const formattedMessages = messagesData?.map(msg => {
        const attachment = msg.attachment_url ? {
          url: msg.attachment_url,
          type: msg.attachment_type,
          name: msg.attachment_name,
          isVoiceNote: msg.attachment_type?.startsWith('audio/') && msg.content === 'Sent a voice note'
        } : null;
        
        console.log('Message attachment from DB:', attachment);
        console.log('Message raw data:', msg);
        
        return {
          id: msg.id,
          senderId: msg.sender_id === userProfile?.id ? "me" : msg.sender_id,
          text: msg.content,
          attachment,
          duration_seconds: msg.duration_seconds ?? null,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
      }) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchRecipientPrivacySettings = async () => {
    if (!match || !user) return;
    
    try {
      // Get current user's profile ID first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!userProfile) return;
      
      // Get the recipient's profile ID
      const recipientId = match.buyerId === userProfile.id ? match.sellerId : match.buyerId;
      
      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('profile_id', recipientId)
        .single();
        
      setRecipientPrivacySettings(privacySettings);
    } catch (error) {
      console.error('Error fetching recipient privacy settings:', error);
      // Default to allowing messages if no settings found
      setRecipientPrivacySettings(null);
    }
  };

  // Check if messaging is allowed based on privacy settings
  const isMessagingAllowed = () => {
    if (!recipientPrivacySettings) return true; // Default to allow if no settings
    
    const { allow_messages_from } = recipientPrivacySettings;
    
    if (allow_messages_from === 'none') return false;
    if (allow_messages_from === 'everyone') return true;
    if (allow_messages_from === 'matches_only') {
      // Check if they are actually matched (we're in a chat, so they should be)
      return true;
    }
    
    return true; // Default to allow
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup any playing audio element on unmount
  useEffect(() => {
    return () => {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.src = '';
          currentAudioRef.current = null;
        }
      } catch (_) {}
    };
  }, []);

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
           content: messageText || (attachment ? 
             attachment.isVoiceNote ? 'Sent a voice note' :
             attachment.type.startsWith('image/') ? 'Sent an image' : 'Sent a file'
           : ''),
          attachment_url: attachment?.url || null,
          attachment_type: attachment?.type || null,
          attachment_name: attachment?.name || null,
          duration_seconds: attachment?.isVoiceNote && attachment?.duration ? Math.round(attachment.duration) : null
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
        text: messageText || (attachment ? 
          attachment.isVoiceNote ? 'Sent a voice note' :
          attachment.type.startsWith('image/') ? 'Sent an image' : 'Sent a file'
        : ''),
        attachment: attachment || null,
        duration_seconds: messageData.duration_seconds ?? (attachment?.isVoiceNote ? Math.round(attachment.duration) : null),
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      setAudioChunks([]);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access microphone.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording && !isRecordingPaused) {
      mediaRecorder.pause();
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && isRecording && isRecordingPaused) {
      mediaRecorder.resume();
      setIsRecordingPaused(false);
      // Resume the timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
    }
  };

  const sendVoiceNote = async () => {
    try {
      // If recording is still active, stop and wait for the final data chunk
      let chunks: Blob[] = audioChunks;

      if (mediaRecorder && isRecording) {
        chunks = await new Promise<Blob[]>((resolve) => {
          const localChunks: Blob[] = [];
          const handleData = (event: any) => {
            if (event.data && event.data.size > 0) localChunks.push(event.data);
          };
          const handleStop = () => {
            mediaRecorder.removeEventListener('dataavailable', handleData as any);
            resolve(localChunks.length > 0 ? localChunks : audioChunks);
          };
          mediaRecorder.addEventListener('dataavailable', handleData);
          mediaRecorder.addEventListener('stop', handleStop as any, { once: true } as any);
          try { mediaRecorder.stop(); } catch (e) { /* noop */ }
        });
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      }

      if (!chunks || chunks.length === 0) {
        toast({
          title: "Recording Error",
          description: "No audio captured. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      if (audioBlob.size === 0) {
        toast({
          title: "Recording Error",
          description: "Empty audio. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
      const attachment = await uploadFile(audioFile);
      if (attachment) {
        console.log('Voice note duration being sent:', recordingDuration);
        const voiceAttachment = { ...attachment, isVoiceNote: true, duration: recordingDuration };
        console.log('Complete voice attachment:', voiceAttachment);
        await sendMessageWithAttachment("", voiceAttachment);
      }

      setAudioChunks([]);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error sending voice note:', error);
      toast({
        title: "Error",
        description: "Failed to send voice note.",
        variant: "destructive",
      });
    }
  };

  const stopCurrentAudio = () => {
    const a = currentAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      a.src = '';
      a.load();
    } catch (e) {
      console.warn('Error stopping audio', e);
    } finally {
      setPlayingAudio(null);
      setCurrentTime(0);
      setAudioDuration(0);
      currentAudioRef.current = null;
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    const existing = currentAudioRef.current;

    // If the same message is playing, toggle stop
    if (existing && playingAudio === messageId && !existing.paused) {
      stopCurrentAudio();
      return;
    }

    // Stop anything else first
    if (existing) {
      stopCurrentAudio();
    }

    const audio = existing || new Audio();
    audio.preload = 'auto';

    audio.onended = () => {
      setPlayingAudio(null);
      setCurrentTime(0);
      setAudioDuration(0);
    };

    audio.onerror = () => {
      setPlayingAudio(null);
      setCurrentTime(0);
      setAudioDuration(0);
      toast({
        title: "Playback Error",
        description: "Could not play voice note.",
        variant: "destructive",
      });
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.src = audioUrl;
    audio.currentTime = 0;
    // Get individual speed for this message (default to 1x)
    const messageSpeed = messagePlaybackSpeeds[messageId] || 1;
    audio.playbackRate = messageSpeed;
    currentAudioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise && typeof (playPromise as Promise<void>).then === 'function') {
      (playPromise as Promise<void>)
        .then(() => setPlayingAudio(messageId))
        .catch((error) => {
          console.error('Audio playback error:', error);
          setPlayingAudio(null);
        });
    } else {
      setPlayingAudio(messageId);
    }
  };

  const togglePlaybackSpeed = (messageId: string) => {
    const speeds = [1, 1.5, 2];
    const currentSpeed = messagePlaybackSpeeds[messageId] || 1;
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    setMessagePlaybackSpeeds(prev => ({
      ...prev,
      [messageId]: nextSpeed
    }));
    
    // Update current audio speed if this message is playing
    if (currentAudioRef.current && playingAudio === messageId) {
      currentAudioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Long press handlers for context menu
  const handleLongPressStart = (messageId: string, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        show: true,
        messageId,
        x: clientX,
        y: clientY
      });
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = (event?: React.TouchEvent | React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Context menu actions
  const copyMessage = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message?.text) {
      try {
        await navigator.clipboard.writeText(message.text);
        toast({
          title: "Copied",
          description: "Message copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy message.",
          variant: "destructive",
        });
      }
    }
    setContextMenu({ show: false, messageId: null, x: 0, y: 0 });
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message Deleted",
        description: "Message has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive",
      });
    }
    setContextMenu({ show: false, messageId: null, x: 0, y: 0 });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (contextMenu.show) {
        // Check if the click is on the context menu itself
        const target = event.target as Element;
        if (target && !target.closest('.context-menu')) {
          setContextMenu({ show: false, messageId: null, x: 0, y: 0 });
        }
      }
    };

    if (contextMenu.show) {
      // Add a small delay to prevent immediate dismissal
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [contextMenu.show]);


  const handleDeleteMatch = async () => {
    if (!match) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', match.id);

      if (error) throw error;

      toast({
        title: "Conversation Deleted",
        description: "This conversation has been permanently deleted.",
      });

      navigate('/matches');
    } catch (error) {
      console.error('Error deleting match:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation.",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async () => {
    if (!match || !user) return;

    try {
      // Get current user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      // Determine which user to block
      const otherUserId = match.buyerId === userProfile.id ? match.sellerId : match.buyerId;

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: userProfile.id,
          blocked_id: otherUserId,
          reason: 'Blocked from chat'
        });

      if (error) throw error;

      toast({
        title: "User Blocked",
        description: `${match.user.name} has been blocked and won't be able to contact you.`,
      });

      navigate('/matches');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block the user.",
        variant: "destructive",
      });
    }
  };

  const handleReportUser = async () => {
    if (!match || !user || !reportType) {
      toast({
        title: "Error",
        description: "Please select a report type.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      // Determine which user to report
      const reportedUserId = match.buyerId === userProfile.id ? match.sellerId : match.buyerId;

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: userProfile.id,
          reported_user_id: reportedUserId,
          match_id: match.id,
          report_type: reportType,
          description: reportDescription
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for reporting. Our admin team will review this case.",
      });

      // Reset form and close dialog
      setReportDialogOpen(false);
      setReportType("");
      setReportDescription("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit the report.",
        variant: "destructive",
      });
    }
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
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-md mx-auto">
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
          
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-love" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowUserProfile(true)}>
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPropertyDetails(true)}>
                  <Building className="w-4 h-4 mr-2" />
                  Property Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setReportDialogOpen(true)}
                  className="text-warning"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report Contact
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBlockUser}
                  className="text-destructive"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Block Contact
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this conversation with {match.user.name}? 
                        This action cannot be undone and will permanently remove all messages.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteMatch}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="bg-gradient-to-r from-accent/20 to-accent/30 border-b border-border/50 p-4">
        <div className="max-w-md mx-auto">
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
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background/50 to-background">
        <div className="max-w-md mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${
                  msg.senderId === 'me'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                    : 'bg-card text-card-foreground border border-border/50 rounded-bl-md backdrop-blur-sm'
                }`}
                onTouchStart={msg.text ? (e) => handleLongPressStart(msg.id, e) : undefined}
                onTouchEnd={msg.text ? (e) => handleLongPressEnd(e) : undefined}
                onMouseDown={msg.text ? (e) => handleLongPressStart(msg.id, e) : undefined}
                onMouseUp={msg.text ? (e) => handleLongPressEnd(e) : undefined}
                onMouseLeave={msg.text ? (e) => handleLongPressEnd(e) : undefined}
                onContextMenu={msg.text ? (e) => e.preventDefault() : undefined}
                style={{ userSelect: 'none' }}
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
                       ) : msg.attachment.type.startsWith('audio/') || msg.attachment.isVoiceNote ? (
                         <div className="flex items-center gap-2 p-2 rounded bg-background/20 border border-border/50">
                           <Button
                             size="sm"
                             variant="ghost"
                             className="h-auto p-1"
                             onClick={() => {
                               console.log('Playing audio, attachment:', msg.attachment);
                               playAudio(msg.attachment.url, msg.id);
                             }}
                           >
                             {playingAudio === msg.id ? (
                               <Pause className="w-4 h-4" />
                             ) : (
                               <Play className="w-4 h-4" />
                             )}
                           </Button>
                           <div className="flex flex-col flex-1">
                             <span className="text-sm">Voice Note</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                   {playingAudio === msg.id ? (
                                     <span>{formatDuration(Math.max(0, (msg.duration_seconds || audioDuration) - currentTime))}</span>
                                   ) : msg.duration_seconds ? (
                                     <span>{formatDuration(msg.duration_seconds)}</span>
                                   ) : (
                                     <VoiceNoteDuration audioUrl={msg.attachment.url} />
                                   )}
                                </div>
                           </div>
                         <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-xs"
                          onClick={() => togglePlaybackSpeed(msg.id)}
                        >
                          {messagePlaybackSpeeds[msg.id] || 1}x
                        </Button>
                      </div>
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
              </div>
              
              <p className="text-xs text-muted-foreground mt-1 px-2">
                {msg.timestamp}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg z-50 py-1 context-menu"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 80),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            onClick={() => copyMessage(contextMenu.messageId!)}
          >
            <Copy className="w-4 h-4" />
            Copy Message
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-destructive"
            onClick={() => deleteMessage(contextMenu.messageId!)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Message
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-border/50 bg-card/90 backdrop-blur-sm p-4 sticky bottom-0">
        {match.property.isDeleted ? (
          <div className="max-w-md mx-auto">
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <div className="flex items-center gap-2 text-center justify-center">
                <X className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  This property has been removed. You can view previous messages but cannot send new ones.
                </p>
              </div>
            </Card>
          </div>
        ) : !isMessagingAllowed() ? (
          <div className="max-w-md mx-auto">
            <Card className="p-4 bg-muted/50 border-muted">
              <div className="flex items-center gap-2 text-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                  This user has restricted messaging. You can view previous messages but cannot send new ones.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-3">
             {isRecording && (
               <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${isRecordingPaused ? 'bg-yellow-500' : 'bg-destructive animate-pulse'}`}></div>
                   <span className="text-sm font-medium">
                     {isRecordingPaused ? 'Recording Paused' : 'Recording...'}
                   </span>
                   <span className="text-sm text-muted-foreground ml-auto">
                     {formatDuration(recordingDuration)}
                   </span>
                 </div>
                 <div className="flex gap-2 mt-3">
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm"
                     onClick={stopRecording}
                     className="flex-1"
                   >
                     <Square className="w-4 h-4 mr-2" />
                     Cancel
                   </Button>
                   {isRecordingPaused ? (
                     <Button 
                       type="button" 
                       variant="secondary" 
                       size="sm"
                       onClick={resumeRecording}
                       className="flex-1"
                     >
                       <Play className="w-4 h-4 mr-2" />
                       Resume
                     </Button>
                   ) : (
                     <Button 
                       type="button" 
                       variant="secondary" 
                       size="sm"
                       onClick={pauseRecording}
                       className="flex-1"
                     >
                       <Pause className="w-4 h-4 mr-2" />
                       Pause
                     </Button>
                   )}
                   <Button 
                     type="button" 
                     variant="default" 
                     size="sm"
                     onClick={() => {
                       sendVoiceNote();
                     }}
                     className="flex-1"
                   >
                     <Send className="w-4 h-4 mr-2" />
                     Send
                   </Button>
                 </div>
               </div>
             )}
            
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
                  disabled={uploading || isRecording}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="shrink-0"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading || isRecording}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="shrink-0"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploading}
                >
                  {isRecording ? (
                    <Square className="w-4 h-4 text-destructive" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={uploading ? "Uploading..." : isRecording ? "Recording voice note..." : messages.length === 0 ? "Start the conversation..." : "Type a message..."}
                  className="flex-1"
                  disabled={uploading || isRecording}
                />
                <Button 
                  type="submit" 
                  variant="default" 
                  size="icon"
                  disabled={uploading || isRecording || (!message.trim())}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
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

      {/* Report User Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Contact</DialogTitle>
            <DialogDescription>
              Report {match.user.name} for inappropriate behavior. 
              Our support team will review this case.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_real_estate">Not using for property business</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate content</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="fake_profile">Fake profile</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide additional details about the issue..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportUser} className="bg-destructive hover:bg-destructive/90">
              <Flag className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;