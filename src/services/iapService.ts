import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// PropSwipes App-Specific Product IDs for Apple App Store and Google Play Store
// Using unique prefix to avoid conflicts with other PropSwipes apps
export const PRODUCT_IDS = {
  BUYER_PRO: 'com.propswipes.main.buyer.pro.monthly',
  SELLER_BASIC: 'com.propswipes.main.seller.basic.monthly', 
  SELLER_PROFESSIONAL: 'com.propswipes.main.seller.professional.monthly',
  SELLER_ENTERPRISE: 'com.propswipes.main.seller.enterprise.monthly'
};

export interface IAPProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export interface IAPPurchase {
  productId: string;
  transactionId: string;
  receipt: string;
  platform: 'ios' | 'android';
}

class IAPService {
  private isInitialized = false;
  private iapPlugin: any = null;

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('PropSwipes Main: Not on native platform, using web fallback');
      this.isInitialized = true;
      return true;
    }

    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      console.log('PropSwipes Main: IAP already initialized');
      return true;
    }

    try {
      // Clear any existing webtoappview IAP instances that might conflict
      if (typeof window !== 'undefined') {
        // Clear any existing global IAP references from other PropSwipes apps
        delete (window as any).__propswipes_iap__;
        delete (window as any).__webtoappview_iap__;
      }

      // Add timeout to prevent hanging
      const initTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('IAP initialization timeout after 10 seconds')), 10000)
      );

      const initPromise = (async () => {
        // Only try to import in actual native environment
        if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins) {
          try {
            // Dynamic import to avoid Vite resolution issues
            const moduleName = '@capgo/native-purchases';
            const { NativePurchases } = await import(/* @vite-ignore */ moduleName);
            this.iapPlugin = NativePurchases;
            
            // Set unique app identifier to prevent conflicts
            (window as any).__propswipes_main_iap__ = this.iapPlugin;
            
            // Initialize the plugin with app-specific settings
            await this.iapPlugin.initialize({
              apiKey: '', // Will be set in App Store Connect
              appUserID: `propswipes_main_${Date.now()}`, // Unique identifier
              observerMode: false // Take control of purchases
            });
            
            console.log('PropSwipes Main: Native purchases plugin initialized successfully');
          } catch (importError) {
            console.log('PropSwipes Main: Native purchases not available, using fallback');
            // Don't throw, just continue with fallback
          }
        } else {
          console.log('PropSwipes Main: Capacitor plugins not available, using mock service');
        }
      })();

      // Race between initialization and timeout
      await Promise.race([initPromise, initTimeout]);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('PropSwipes Main: IAP initialization failed, continuing with fallback service. Error:', error);
      this.isInitialized = true; // Still mark as initialized to allow fallback
      return true; // Return true to allow app to continue
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.iapPlugin) {
      try {
        const productIds = Object.values(PRODUCT_IDS);
        const products = await this.iapPlugin.getProducts(productIds);
        return products.map((product: any) => ({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          currency: product.currency || 'USD'
        }));
      } catch (error) {
        console.error('IAP: Error getting products', error);
        // Fall through to mock data
      }
    }

    // Mock data for development/testing
    return [
      {
        id: PRODUCT_IDS.BUYER_PRO,
        title: 'Buyer Pro Monthly',
        description: 'Unlimited likes and premium features',
        price: '$9.99',
        currency: 'USD'
      },
      {
        id: PRODUCT_IDS.SELLER_BASIC,
        title: 'Seller Basic Monthly',
        description: '5 property listings and analytics',
        price: '$29.99',
        currency: 'USD'
      },
      {
        id: PRODUCT_IDS.SELLER_PROFESSIONAL,
        title: 'Seller Professional Monthly',
        description: '25 property listings and team tools',
        price: '$100.00',
        currency: 'USD'
      },
      {
        id: PRODUCT_IDS.SELLER_ENTERPRISE,
        title: 'Seller Enterprise Monthly',
        description: 'Unlimited listings and full features',
        price: '$250.00',
        currency: 'USD'
      }
    ];
  }

  async purchaseProduct(productId: string): Promise<IAPPurchase> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.iapPlugin) {
      try {
        console.log(`IAP: Starting purchase for ${productId}`);
        const result = await this.iapPlugin.purchaseProduct(productId);
        
        const purchase: IAPPurchase = {
          productId: result.productId,
          transactionId: result.transactionId,
          receipt: result.receipt,
          platform: Capacitor.getPlatform() as 'ios' | 'android'
        };

        // Verify purchase with backend
        await this.verifyPurchase(purchase);
        
        return purchase;
      } catch (error) {
        console.error('IAP: Purchase failed', error);
        throw error;
      }
    }

    // If no plugin available, throw error to guide proper setup
    throw new Error(
      'Native IAP plugin not available. Make sure:\n\n' +
      '1. App is built and run from Xcode (not browser)\n' +
      '2. @capgo/native-purchases is properly installed\n' +
      '3. Products are configured in App Store Connect\n' +
      '4. Sandbox test user is signed in\n\n' +
      'Current platform: ' + Capacitor.getPlatform()
    );
  }

  async verifyPurchase(purchase: IAPPurchase): Promise<void> {
    try {
      console.log('IAP: Verifying purchase with backend');
      
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          transactionId: purchase.transactionId,
          receiptData: purchase.receipt,
          productId: purchase.productId
        }
      });

      if (error) {
        throw new Error(`Verification failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(`Purchase verification failed: ${data.error}`);
      }

      console.log('IAP: Purchase verified successfully');
    } catch (error) {
      console.error('IAP: Purchase verification failed', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<IAPPurchase[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.iapPlugin) {
      try {
        const restored = await this.iapPlugin.restorePurchases();
        
        // Verify each restored purchase
        for (const purchase of restored) {
          await this.verifyPurchase({
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            receipt: purchase.receipt,
            platform: Capacitor.getPlatform() as 'ios' | 'android'
          });
        }
        
        return restored;
      } catch (error) {
        console.error('IAP: Restore failed', error);
        throw error;
      }
    }

    console.log('IAP: Restore purchases - mock mode');
    return [];
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const iapService = new IAPService();