
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { validateEmail, sanitizeInput } from '@/lib/security';
import welcomePets from '@/assets/welcome-pets.png';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Clear any existing session
      await supabase.auth.signOut();

      if (isLogin) {
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
      } else {
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
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
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
            {isLogin 
              ? 'Sign in to access your pet dashboard' 
              : 'Join us to start tracking your pet\'s health journey'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-12"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
              disabled={loading || !email || !password}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In 🚀' : 'Create Account 🎉')}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-orange-600 hover:text-orange-700 text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

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

export default AuthForm;
