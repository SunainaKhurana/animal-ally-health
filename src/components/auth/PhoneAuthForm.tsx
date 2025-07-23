import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PhoneInput from 'react-phone-number-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import welcomePets from '@/assets/welcome-pets.png';
import otpVerification from '@/assets/otp-verification.png';
import 'react-phone-number-input/style.css';

type PhoneAuthStep = 'phone' | 'otp';

export const PhoneAuthForm = () => {
  const [step, setStep] = useState<PhoneAuthStep>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phone) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      setStep('otp');
      toast({
        title: "OTP sent! 📱",
        description: "Check your phone for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your phone.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;

      toast({
        title: "Welcome! 🎉",
        description: "You're successfully logged in!",
      });
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: "The code you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img 
                src={otpVerification} 
                alt="OTP Verification" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Enter Verification Code
            </CardTitle>
            <CardDescription>
              We sent a 6-digit code to {phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                className="gap-2"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button 
              onClick={handleVerifyOTP}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Continue 🚀'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-orange-600 hover:text-orange-700 text-sm"
                disabled={loading}
              >
                Didn't receive the code? Resend
              </button>
              <br />
              <button
                type="button"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                ← Change phone number
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img 
              src={welcomePets} 
              alt="Welcome Pets" 
              className="w-40 h-40 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to PetZone! 🐾
          </CardTitle>
          <CardDescription className="text-base">
            Your pet's health journey starts here. Sign in with your phone number to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="phone-input-container">
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="US"
                value={phone}
                onChange={setPhone}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSendOTP}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
            disabled={loading || !phone}
          >
            {loading ? 'Sending...' : 'Send Verification Code 📱'}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              We'll send you a verification code via SMS.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};