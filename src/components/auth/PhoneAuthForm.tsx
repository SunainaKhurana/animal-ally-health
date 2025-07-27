
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import PhoneInput from 'react-phone-number-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { validatePhoneNumber, validateEmail, sanitizeInput } from '@/lib/security';
import welcomePets from '@/assets/welcome-pets.png';
import otpVerification from '@/assets/otp-verification.png';
import 'react-phone-number-input/style.css';

type AuthMode = 'login' | 'signup';
type PhoneAuthStep = 'phone' | 'otp';

export const PhoneAuthForm = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<PhoneAuthStep>('phone');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phone || !validatePhoneNumber(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Clear any existing session
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        throw error;
      }

      setStep('otp');
      toast({
        title: "OTP sent! 📱",
        description: "Check your phone for the verification code",
      });
    } catch (error: any) {
      console.error('OTP send error:', error);
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      console.log('OTP verification successful:', data);
      
      if (!data.session || !data.user) {
        throw new Error('Authentication succeeded but session is invalid');
      }

      toast({
        title: "Welcome! 🎉",
        description: "You're successfully logged in!",
      });

      // Redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = "The code you entered is incorrect. Please try again.";
      if (error.message?.includes('expired')) {
        errorMessage = "The verification code has expired. Please request a new one.";
      } else if (error.message?.includes('session')) {
        errorMessage = "Session error occurred. Please try logging in again.";
      }
      
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail || !validateEmail(sanitizedEmail) || !password) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Clear any existing session
      await supabase.auth.signOut();

      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) {
          throw error;
        }
        
        console.log('Sign up successful:', data);
        
        if (data.user && !data.session) {
          toast({
            title: "Check your email! 📧",
            description: "Please check your email and click the confirmation link to complete your account setup.",
          });
        } else if (data.session) {
          toast({
            title: "Account created! 🎉",
            description: "Welcome to PetZone!",
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });
        
        if (error) {
          throw error;
        }
        
        console.log('Sign in successful:', data);
        
        if (!data.session || !data.user) {
          throw new Error('Authentication succeeded but session is invalid');
        }
        
        toast({
          title: "Welcome back! 🐾",
          description: "You're successfully logged in!",
        });

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      
      let errorMessage = error.message;
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      }
      
      toast({
        title: "Authentication failed",
        description: errorMessage,
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
            Your pet's health journey starts here. Choose how you'd like to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleEmailAuth}
                className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
                disabled={loading || !email || !password}
              >
                {loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In 🚀' : 'Create Account 🎉')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  {authMode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="space-y-6">
              <div className="space-y-2">
                <Label>Phone Number</Label>
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
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
