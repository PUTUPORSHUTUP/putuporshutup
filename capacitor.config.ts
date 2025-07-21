import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cad0db3fccc9403ea31acbece28dd2e9',
  appName: 'match-royale-bets',
  webDir: 'dist',
  server: {
    url: 'https://cad0db3f-ccc9-403e-a31a-cbece28dd2e9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK'
    }
  }
};

export default config;