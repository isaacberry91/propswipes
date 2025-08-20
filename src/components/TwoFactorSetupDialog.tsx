import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Shield } from 'lucide-react';

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TwoFactorSetupDialog: React.FC<TwoFactorSetupDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [step, setStep] = useState<'method' | 'contact' | 'verify'>('method');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [contact, setContact] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const resetDialog = () => {
    setStep('method');
    setMethod('email');
    setContact('');
    setVerificationCode('');
    setLoading(false);
  };

  const handleSendCode = async () => {
    if (!contact.trim()) {
      toast({
        title: "Contact required",
        description: `Please enter your ${method === 'email' ? 'email address' : 'phone number'}`,
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (method === 'email' && !contact.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (method === 'sms' && !/^\+?[\d\s\-\(\)]+$/.test(contact)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: {
          method: 'setup',
          contact: contact.trim(),
          type: method
        }
      });

      if (error) throw error;

      toast({
        title: "Code sent",
        description: `Verification code sent to your ${method === 'email' ? 'email' : 'phone'}`,
      });

      setStep('verify');
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Error sending code",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          code: verificationCode,
          setup: true
        }
      });

      if (error) throw error;

      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been successfully enabled",
      });

      onSuccess();
      onOpenChange(false);
      resetDialog();
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetDialog();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Enable Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'method' && (
            <>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to receive verification codes for enhanced security.
              </p>
              
              <RadioGroup value={method} onValueChange={(value: 'email' | 'sms') => setMethod(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Mail className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">Receive codes via email</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Phone className="w-4 h-4" />
                    <div>
                      <div className="font-medium">SMS</div>
                      <div className="text-sm text-muted-foreground">Receive codes via text message</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <Button onClick={() => setStep('contact')} className="w-full">
                Continue
              </Button>
            </>
          )}

          {step === 'contact' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="contact">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </Label>
                <Input
                  id="contact"
                  type={method === 'email' ? 'email' : 'tel'}
                  placeholder={method === 'email' ? 'Enter your email address' : 'Enter your phone number (+1234567890)'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {method === 'email' 
                    ? 'We\'ll send a verification code to this email address'
                    : 'We\'ll send a verification code to this phone number via SMS'
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('method')}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSendCode}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Code
                </Button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit code to {contact}. The code expires in 10 minutes.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('contact')}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify & Enable
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};