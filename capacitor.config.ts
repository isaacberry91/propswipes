import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propswipes.main',
  appName: 'PropSwipes',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scheme: 'PropSwipes',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false
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