
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.764a25a0d9024701b52943550cad5f2b',
  appName: 'animal-ally-health',
  webDir: 'dist',
  server: {
    url: 'https://764a25a0-d902-4701-b529-43550cad5f2b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f97316',
      showSpinner: false
    }
  }
};

export default config;
