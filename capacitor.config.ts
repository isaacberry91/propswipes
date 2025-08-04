import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c53d60b9f83247acaabd6a1765b647a5',
  appName: 'PropSwipes',
  webDir: 'dist',
  server: {
    url: 'https://c53d60b9-f832-47ac-aabd-6a1765b647a5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    scheme: 'PropSwipes'
  }
};

export default config;