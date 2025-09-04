
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, LogOut, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/more')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-orange-500" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email || 'Not provided'}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{user?.phone || 'Not provided'}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Account created</p>
              <p className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <Separator />
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="w-full"
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Export</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Change Password</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-Factor Authentication</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Session Management</span>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">PetZone v1.0.0</p>
              <p className="text-xs text-gray-500">Made with ❤️ for pet parents</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
