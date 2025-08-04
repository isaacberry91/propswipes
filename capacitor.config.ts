import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c53d60b9f83247acaabd6a1765b647a5',
  appName: 'PropSwipes',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scheme: 'PropSwipes',
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;