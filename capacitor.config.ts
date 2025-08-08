import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propswipes.app',
  appName: 'PropSwipes',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Enable development server for iOS simulator
  server: {
    url: 'https://c53d60b9-f832-47ac-aabd-6a1765b647a5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
    PurchasesCapacitor: {
      // RevenueCat will be configured in the app
    }
  }
};

export default config;