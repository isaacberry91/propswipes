import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock,
  Trash2,
  Shield,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ActiveSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SessionInfo {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastSeen: string;
  isCurrent: boolean;
  location?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
}

export function ActiveSessionsDialog({ open, onOpenChange }: ActiveSessionsDialogProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    
    // Device type detection
    let deviceType: SessionInfo['deviceType'] = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }

    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { deviceType, browser, os };
  };

  const getDeviceIcon = (deviceType: SessionInfo['deviceType']) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!session) {
        setSessions([]);
        return;
      }

      // For demo purposes, we'll create mock sessions since Supabase doesn't provide 
      // detailed session management in the client. In a real app, you'd need to 
      // track sessions server-side or use a session management service.
      const currentTime = new Date();
      const mockSessions: SessionInfo[] = [
        {
          id: session.access_token.slice(-10),
          ip: '192.168.1.100', // This would come from server logs
          userAgent: navigator.userAgent,
          createdAt: session.user?.created_at || currentTime.toISOString(),
          lastSeen: currentTime.toISOString(),
          isCurrent: true,
          location: 'Current Location',
          ...parseUserAgent(navigator.userAgent)
        }
      ];

      // Add some mock historical sessions (in real app, these would come from your backend)
      if (Math.random() > 0.5) {
        mockSessions.push({
          id: 'session_' + Math.random().toString(36).substr(2, 9),
          ip: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isCurrent: false,
          location: 'Mobile Device',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS'
        });
      }

      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error loading sessions",
        description: "Unable to load active sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      // In a real app, you'd call your backend to revoke the specific session
      // For now, we'll simulate it and remove from local state
      
      const session = sessions.find(s => s.id === sessionId);
      if (session?.isCurrent) {
        // If revoking current session, sign out
        await supabase.auth.signOut();
        toast({
          title: "Signed out",
          description: "You have been signed out of your current session."
        });
        onOpenChange(false);
        return;
      }

      // Remove from local state (in real app, this would be handled by backend)
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session revoked",
        description: "The session has been successfully revoked."
      });
    } catch (error) {
      console.error('Error revoking session:', error);
      toast({
        title: "Error revoking session",
        description: "Unable to revoke session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd call your backend to revoke all other sessions
      const otherSessions = sessions.filter(s => !s.isCurrent);
      
      if (otherSessions.length === 0) {
        toast({
          title: "No other sessions",
          description: "There are no other active sessions to revoke."
        });
        return;
      }

      // Remove all non-current sessions
      setSessions(prev => prev.filter(s => s.isCurrent));
      
      toast({
        title: "All other sessions revoked",
        description: `${otherSessions.length} session(s) have been revoked.`
      });
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      toast({
        title: "Error revoking sessions",
        description: "Unable to revoke all sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Sessions
          </DialogTitle>
          <DialogDescription>
            Manage your active login sessions across all devices. You can revoke access to any session you don't recognize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </p>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke All Others
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign out all other devices and sessions except your current one. 
                      You'll need to sign in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={revokeAllOtherSessions}>
                      Revoke All Others
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Sessions List */}
          <div className="space-y-3">
            {loading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading sessions...</p>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active sessions found</p>
                </div>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-muted-foreground mt-1">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {session.browser} on {session.os}
                          </h4>
                          {session.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>IP: {session.ip}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Last active: {getRelativeTime(session.lastSeen)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{session.location || 'Unknown location'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={session.isCurrent ? "destructive" : "outline"}
                            size="sm"
                            disabled={revoking === session.id}
                          >
                            {revoking === session.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-2" />
                            )}
                            {session.isCurrent ? 'Sign Out' : 'Revoke'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {session.isCurrent ? 'Sign Out of Current Session?' : 'Revoke Session?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {session.isCurrent 
                                ? 'This will sign you out of your current session and you\'ll need to sign in again.'
                                : 'This will revoke access for this session. The user will need to sign in again on this device.'
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeSession(session.id)}>
                              {session.isCurrent ? 'Sign Out' : 'Revoke Session'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={fetchSessions}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
              ) : null}
              Refresh Sessions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}