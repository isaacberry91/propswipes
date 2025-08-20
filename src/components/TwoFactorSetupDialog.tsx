import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }: TwoFactorSetupDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'contact' | 'verify'>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const resetDialog = () => {
    setStep('contact');
    setContact('');
    setCode('');
    setLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(resetDialog, 300);
  };

  const handleSendCode = async () => {
    if (!contact.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: { 
          method: 'email', 
          contact: contact.trim(),
          type: 'email'
        }
      });

      if (error) throw error;

      toast({
        title: "Verification code sent",
        description: `A 6-digit code has been sent to ${contact}`
      });
      
      setStep('verify');
    } catch (error: any) {
      console.error('Error sending 2FA code:', error);
      toast({
        title: "Error sending code",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { 
          code: code.trim(),
          setup: true
        }
      });

      if (error) throw error;

      if (data?.verified) {
        toast({
          title: "2FA enabled successfully",
          description: `Two-factor authentication has been enabled using ${data.contact}`
        });
        
        onSuccess();
        handleClose();
      } else {
        toast({
          title: "Invalid code",
          description: "The verification code is incorrect or has expired.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error verifying 2FA code:', error);
      toast({
        title: "Error verifying code",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          {step === 'contact' && (
            <>
              <DialogHeader>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  We'll send verification codes to your email address to secure your account.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">@</span>
                  </div>
                  <div>
                    <p className="font-medium">Email Authentication</p>
                    <p className="text-sm text-muted-foreground">Receive codes via email</p>
                  </div>
                </div>
                <Label htmlFor="contact">Email Address</Label>
                <Input
                  id="contact"
                  type="email"
                  placeholder="your@email.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendCode} 
                  disabled={!contact || loading}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'verify' && (
            <>
              <DialogHeader>
                <DialogTitle>Enter Verification Code</DialogTitle>
                <DialogDescription>
                  Please enter the 6-digit code sent to {contact}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-2 text-center tracking-widest text-lg font-mono"
                  maxLength={6}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Didn't receive the code? 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-1 text-sm"
                    onClick={() => setStep('contact')}
                  >
                    Try again
                  </Button>
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('contact')}>
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={code.length !== 6 || loading}
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}