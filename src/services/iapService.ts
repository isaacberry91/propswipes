import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Extend window interface for native purchases
declare global {
  interface Window {
    NativePurchases?: any;
  }
}

// PropSwipes App-Specific Product IDs
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
  private nativePurchases: any = null;

  async initialize(): Promise<boolean> {
    console.log('PropSwipes: Initializing IAP service...');
    console.log('PropSwipes: Platform:', Capacitor.getPlatform());
    console.log('PropSwipes: Is native platform:', Capacitor.isNativePlatform());

    if (!Capacitor.isNativePlatform()) {
      console.log('PropSwipes: Not on native platform, IAP will use mock data');
      this.isInitialized = true;
      return true;
    }

    if (this.isInitialized) {
      console.log('PropSwipes: IAP already initialized');
      return true;
    }

    try {
      console.log('PropSwipes: Attempting to import @capgo/native-purchases...');
      
      // Try different import methods
      let NativePurchases;
      try {
        // Use Capacitor's registerPlugin method for native plugins
        const { NativePurchases: NP } = await import('@capgo/native-purchases');
        NativePurchases = NP;
        console.log('PropSwipes: ES6 import successful');
      } catch (esError) {
        console.log('PropSwipes: ES6 import failed, trying direct import:', esError);
        // Try with Capacitor's registerPlugin
        try {
          const { registerPlugin } = await import('@capacitor/core');
          NativePurchases = registerPlugin('NativePurchases');
          console.log('PropSwipes: Plugin registered with Capacitor');
        } catch (registerError) {
          console.log('PropSwipes: Capacitor register failed:', registerError);
          // Try accessing from window/global if plugin is registered differently
          if (window.NativePurchases) {
            NativePurchases = window.NativePurchases;
            console.log('PropSwipes: Found NativePurchases on window');
          } else {
            throw new Error('Plugin not found in any import method');
          }
        }
      }

      if (!NativePurchases) {
        throw new Error('NativePurchases is undefined after import');
      }

      this.nativePurchases = NativePurchases;
      console.log('PropSwipes: Native purchases plugin loaded successfully');
      
      // Test that the plugin actually works
      try {
        await this.nativePurchases.getProducts({ productIdentifiers: [] });
        console.log('PropSwipes: Plugin functionality test passed');
      } catch (testError) {
        console.log('PropSwipes: Plugin test failed:', testError);
        throw testError;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('PropSwipes: Failed to load native purchases plugin:', error);
      this.isInitialized = true; // Mark as initialized to avoid repeated attempts
      return false;
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.nativePurchases && Capacitor.isNativePlatform()) {
      try {
        const productIds = Object.values(PRODUCT_IDS);
        const result = await this.nativePurchases.getProducts({ 
          productIdentifiers: productIds 
        });
        
        return result.products.map((product: any) => ({
          id: product.productIdentifier,
          title: product.localizedTitle,
          description: product.localizedDescription,
          price: product.localizedPrice,
          currency: product.currencyCode || 'USD'
        }));
      } catch (error) {
        console.error('Native Purchases: Error getting products', error);
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

    if (this.nativePurchases && Capacitor.isNativePlatform()) {
      try {
        console.log(`Starting purchase for product: ${productId}`);
        
        const result = await this.nativePurchases.purchaseProduct({ 
          productIdentifier: productId 
        });
        
        console.log('Native purchase result:', result);
        
        // Handle different possible result structures from the plugin
        const purchase: IAPPurchase = {
          productId: productId,
          transactionId: result.transactionIdentifier || result.transactionId || result.identifier,
          receipt: result.transactionReceipt || result.receipt || result.receiptData,
          platform: Capacitor.getPlatform() as 'ios' | 'android'
        };

        console.log('Constructed purchase object:', purchase);

        // Verify purchase with backend
        await this.verifyPurchase(purchase);
        
        return purchase;
      } catch (error) {
        console.error('Purchase failed:', error);
        throw error;
      }
    }

    // If no plugin available, throw error to guide proper setup
    throw new Error(
      'Native purchases plugin not available. Make sure:\n\n' +
      '1. App is built and run from Xcode (not browser)\n' +
      '2. @capgo/native-purchases is properly installed\n' +
      '3. Products are configured in App Store Connect\n' +
      '4. Sandbox test user is signed in\n\n' +
      'Current platform: ' + Capacitor.getPlatform()
    );
  }

  async verifyPurchase(purchase: IAPPurchase): Promise<void> {
    try {
      console.log('Verifying purchase with backend', purchase);
      
      // Validate required purchase data before sending
      if (!purchase.transactionId || !purchase.receipt || !purchase.productId) {
        console.error('Missing required purchase data:', {
          hasTransactionId: !!purchase.transactionId,
          hasReceipt: !!purchase.receipt,
          hasProductId: !!purchase.productId,
          purchase
        });
        throw new Error('Purchase data is incomplete. Cannot verify purchase.');
      }
      
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          transactionId: purchase.transactionId,
          receiptData: purchase.receipt,
          productId: purchase.productId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Verification failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Verification response error:', data);
        throw new Error(`Purchase verification failed: ${data?.error || 'Unknown error'}`);
      }

      console.log('Purchase verified successfully');
    } catch (error) {
      console.error('Purchase verification failed', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<IAPPurchase[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.nativePurchases && Capacitor.isNativePlatform()) {
      try {
        const result = await this.nativePurchases.restorePurchases();
        
        const restored: IAPPurchase[] = [];
        
        // Process each restored transaction
        if (result.transactions && result.transactions.length > 0) {
          for (const transaction of result.transactions) {
            const purchase: IAPPurchase = {
              productId: transaction.productIdentifier,
              transactionId: transaction.transactionIdentifier,
              receipt: transaction.transactionReceipt,
              platform: Capacitor.getPlatform() as 'ios' | 'android'
            };
            
            // Verify each restored purchase
            await this.verifyPurchase(purchase);
            restored.push(purchase);
          }
        }
        
        return restored;
      } catch (error) {
        console.error('Restore purchases failed:', error);
        throw error;
      }
    }

    console.log('Restore purchases - no plugin available');
    return [];
  }

  async getCustomerInfo(): Promise<any> {
    if (!this.isInitialized || !this.nativePurchases) {
      return null;
    }

    try {
      // Note: @capgo/native-purchases doesn't have a direct getCustomerInfo equivalent
      // You might need to implement this differently based on your needs
      return null;
    } catch (error) {
      console.error('Error getting customer info', error);
      return null;
    }
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const iapService = new IAPService();