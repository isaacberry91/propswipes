# Native Mobile App Setup for App Store Approval

This guide will help you set up the native mobile app with proper In-App Purchases (IAP) that will get approved by Apple App Store and Google Play Store.

## 📱 What's Already Done

✅ **Capacitor Configuration**: `capacitor.config.ts` is set up with your app ID
✅ **IAP Service**: Complete IAP service in `src/services/iapService.ts`
✅ **Subscription Backend**: Edge function `verify-purchase` is ready
✅ **UI Components**: Native subscription page with proper IAP flow
✅ **Database Schema**: Subscribers table with proper RLS policies

## 🚀 Next Steps (You Need To Do)

### 1. Export to GitHub and Set Up Local Development

1. Click the **"Export to Github"** button in Lovable
2. Clone your repository locally:
   ```bash
   git clone [your-github-repo-url]
   cd [your-project-name]
   npm install
   ```

### 2. Add Native Platforms

```bash
# Initialize Capacitor (if not already done)
npx cap init

# Add iOS platform (requires macOS)
npx cap add ios

# Add Android platform  
npx cap add android
```

### 3. Install IAP Plugin

You'll need to install the IAP plugin manually in your local environment:

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

### 4. Configure App Store Connect (iOS)

1. **Create App in App Store Connect**
   - Use App ID: `app.lovable.c53d60b9f83247acaabd6a1765b647a5`
   - App Name: `swipes-and-chats`

2. **Set Up In-App Purchases**
   Create these exact product IDs in App Store Connect:
   - `com.propswipes.subscription.buyer_pro` - $9.99/month
   - `com.propswipes.seller_basic` - $29.99/month  
   - `com.propswipes.seller_professional` - $100.00/month
   - `com.propswipes.seller_enterprise` - $250.00/month

3. **Configure Pricing**
   - Set up subscription groups
   - Configure auto-renewable subscriptions
   - Set pricing tiers

### 5. Configure Google Play Console (Android)

1. **Create App in Google Play Console**
   - Use same App ID: `app.lovable.c53d60b9f83247acaabd6a1765b647a5`

2. **Set Up In-App Products**
   Create the same product IDs with same pricing

### 6. Build and Test

```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Run on iOS (requires macOS + Xcode)
npx cap run ios

# Run on Android (requires Android Studio)
npx cap run android
```

### 7. Test IAP Flow

1. **iOS Testing**:
   - Use TestFlight for beta testing
   - Create sandbox Apple ID for testing
   - Test purchase flow with sandbox account

2. **Android Testing**:
   - Use Google Play Internal Testing
   - Create test accounts
   - Test purchase flow

## 🔧 Key Features Already Implemented

- **Native IAP Detection**: App automatically detects native platform
- **Subscription Verification**: Backend verifies purchases with Apple/Google
- **Database Integration**: Subscriptions stored in Supabase
- **Feature Gating**: Subscription-based feature access
- **Error Handling**: Proper error messages and fallbacks

## 📝 Important Notes

1. **Product IDs Must Match**: The product IDs in the code must exactly match those in App Store Connect and Google Play Console

2. **Subscription Management**: Users can manage subscriptions through Apple/Google's native interfaces

3. **Revenue Share**: Apple and Google take 30% of subscription revenue

4. **Testing Required**: Thoroughly test the purchase flow before submission

5. **App Review**: Both stores will review your IAP implementation

## 🆘 Need Help?

If you encounter issues:
1. Check the Capacitor logs: `npx cap open ios` or `npx cap open android`
2. Verify product IDs match exactly
3. Ensure App Store Connect/Google Play Console is properly configured
4. Test with sandbox/test accounts first

The app is ready for native development and App Store submission once you complete these steps!