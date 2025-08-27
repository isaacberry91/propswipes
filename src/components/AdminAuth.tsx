import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

const AdminAuth = ({ onAuthenticated }: AdminAuthProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔧 Attempting admin password verification...");
      
      // Call the edge function to verify admin password
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { password }
      });

      if (error) {
        console.error('Admin password verification error:', error);
        setError("Authentication failed. Please try again.");
        return;
      }

      if (data.isValid) {
        console.log('🔧 Admin password verified successfully');

        // Try to sign in as the admin user so RLS admin policies apply
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.adminEmail,
          password: data.adminPassword,
        });

        if (signInError) {
          console.warn('Admin sign-in failed, attempting to create admin user:', signInError);

          // Attempt to create the admin user via edge function, then sign in again
          const { data: createData, error: createError } = await supabase.functions.invoke('create-admin-user', {
            body: { password }
          });

          if (createError) {
            console.error('Create admin user failed:', createError);
            setError('Could not establish admin session.');
            return;
          }

          // Retry sign-in after creation
          const retry = await supabase.auth.signInWithPassword({
            email: data.adminEmail,
            password: data.adminPassword,
          });
          signInData = retry.data;
          signInError = retry.error;
        }

        if (signInError) {
          console.error('Admin sign-in failed after creation attempt:', signInError);
          setError('Could not establish admin session.');
          return;
        }

        localStorage.setItem("admin-authenticated", "true");
        localStorage.setItem("admin-session-email", data.adminEmail);
        
        toast({
          title: "Admin Access Granted",
          description: `Welcome, Administrator!`,
        });
        
        onAuthenticated();
      } else {
        setError("Invalid admin password. Access denied.");
      }

    } catch (error) {
      console.error('Admin authentication error:', error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter the admin password to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password}
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;