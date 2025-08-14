import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Lock, User, MapPin, Users, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/discover');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For Capacitor apps, use the deployed app URL for redirects
    const isCapacitor = window.location.protocol === 'capacitor:';
    const redirectUrl = isCapacitor 
      ? 'https://c53d60b9-f832-47ac-aabd-6a1765b647a5.lovableproject.com/discover'
      : `${window.location.origin}/discover`;

    console.log('PropSwipes Auth: Starting sign up process...');
    console.log('PropSwipes Auth: Email:', email);
    console.log('PropSwipes Auth: Is Capacitor:', isCapacitor);
    console.log('PropSwipes Auth: Window location:', window.location);
    console.log('PropSwipes Auth: Redirect URL:', redirectUrl);
    console.log('PropSwipes Auth: Navigator online:', navigator.onLine);

    try {
      // Test network connectivity first
      console.log('PropSwipes Auth: Testing network connectivity...');
      
      const displayName = `${firstName} ${lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            first_name: firstName,
            last_name: lastName,
            username: username,
            phone: phone,
            location: location,
            user_type: userType,
          }
        }
      });

      console.log('PropSwipes Auth: Sign up response:', { data, error });

      if (error) {
        console.error('PropSwipes Auth: Sign up error:', error);
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
            duration: 5000
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
            duration: 5000
          });
        }
      } else {
        console.log('PropSwipes Auth: Sign up successful');
        // Check if user is immediately signed in (auto-confirm enabled)
        if (data.user && data.session) {
          console.log('PropSwipes Auth: User auto-confirmed, navigating to discover...');
          toast({
            title: "Welcome to PropSwipes! 🎉",
            description: "Account created successfully! Let's start swiping!",
            duration: 5000
          });
          navigate('/discover');
        } else {
          console.log('PropSwipes Auth: User needs email confirmation');
          toast({
            title: "Welcome to PropSwipes! 🎉",
            description: "Check your email to confirm your account and start swiping!",
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('PropSwipes Auth: Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔐 PropSwipes Auth: Starting sign in process...');
    console.log('🔐 PropSwipes Auth: Email:', email);
    console.log('🔐 PropSwipes Auth: Password length:', password.length);
    console.log('🔐 PropSwipes Auth: Supabase URL:', 'https://jkctleefoomwpaglrvie.supabase.co');
    console.log('🔐 PropSwipes Auth: User agent:', navigator.userAgent);
    console.log('🔐 PropSwipes Auth: Online status:', navigator.onLine);

    try {
      console.log('🔐 PropSwipes Auth: Making sign in request...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 PropSwipes Auth: Sign in response:', { 
        data: {
          user: data?.user ? {
            id: data.user.id,
            email: data.user.email,
            confirmed_at: data.user.confirmed_at
          } : null,
          session: data?.session ? {
            access_token: data.session.access_token ? 'present' : 'missing',
            refresh_token: data.session.refresh_token ? 'present' : 'missing',
            expires_at: data.session.expires_at
          } : null
        },
        error: error ? {
          name: error.name,
          message: error.message,
          status: error.status,
          isAuthError: true
        } : null
      });

      if (error) {
        console.error('🔐 PropSwipes Auth: Sign in error:', {
          name: error.name,
          message: error.message,
          status: error.status,
          isAuthError: true
        });
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
      } else {
        console.log('🔐 PropSwipes Auth: Sign in successful, navigating to discover...');
        navigate('/discover');
      }
    } catch (error) {
      console.error('🔐 PropSwipes Auth: Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    console.log(`🔐 PropSwipes Auth: Starting ${provider} sign in...`);

    try {
      const isCapacitor = window.location.protocol === 'capacitor:';
      const redirectUrl = isCapacitor 
        ? 'https://c53d60b9-f832-47ac-aabd-6a1765b647a5.lovableproject.com/discover'
        : `${window.location.origin}/discover`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        console.error(`🔐 PropSwipes Auth: ${provider} sign in error:`, error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
      } else {
        console.log(`🔐 PropSwipes Auth: ${provider} sign in initiated successfully`);
        // OAuth redirect will handle the rest
      }
    } catch (error) {
      console.error(`🔐 PropSwipes Auth: Unexpected ${provider} error:`, error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({
          title: "Reset email sent! 📧",
          description: "Check your email for password reset instructions.",
          duration: 5000
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <img 
              src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
              alt="PropSwipes Logo" 
              className="h-24 w-24 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Reset Password
            </h1>
          </div>

          <Card className="backdrop-blur-sm bg-card/95 border border-border/50 shadow-xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email to receive reset instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 font-semibold transition-all" 
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png" 
            alt="PropSwipes Logo" 
            className="h-32 w-32 mx-auto mb-4 object-contain hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            PropSwipes
          </h1>
          <p className="text-muted-foreground mt-2">
            Where property dreams meet reality ✨
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border border-border/50 shadow-xl animate-scale-in">
          <CardHeader className="text-center space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
            <CardDescription>
              Join thousands finding their perfect property match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="transition-all">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="transition-all">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                {/* Social Sign In Buttons - Temporarily disabled for development */}
                {false && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={loading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors" 
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                {/* Social Sign Up Buttons - Temporarily disabled for development */}
                {false && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={loading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Sign up with Facebook
                  </Button>
                </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="johndoe123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      id="signup-location"
                      type="text"
                      placeholder="New York, NY"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      I am a...
                    </Label>
                    <Select value={userType} onValueChange={setUserType} required>
                      <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer - Looking to purchase 🏠</SelectItem>
                        <SelectItem value="seller">Seller - Selling my property 💰</SelectItem>
                        <SelectItem value="broker">Broker - Real estate professional 🤝</SelectItem>
                        <SelectItem value="investor">Investor - Investment opportunities 📈</SelectItem>
                        <SelectItem value="renter">Renter - Looking to rent 🔑</SelectItem>
                        <SelectItem value="landlord">Landlord - Renting out property 🏢</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Create Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password (8+ characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      minLength={8}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90" 
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account & Start Swiping! 🚀"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground animate-fade-in">
          <p>Ready to find your dream property? 🏡</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;