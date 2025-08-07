import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propswipes.app',
  appName: 'PropSwipes',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Commented out for production builds - uncomment for development
  // server: {
  //   url: 'https://c53d60b9-f832-47ac-aabd-6a1765b647a5.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  ios: {
    scheme: 'PropSwipes',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false,
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    NativePurchases: {
      apiKey: "appl_YOUR_REVENUECAT_API_KEY_HERE"
    }
  }
};

export default config;