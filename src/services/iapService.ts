import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// PropSwipes App-Specific Product IDs for RevenueCat
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
  private purchasesPlugin: any = null;

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('PropSwipes: Not on native platform, using web fallback');
      this.isInitialized = true;
      return true;
    }

    if (this.isInitialized) {
      console.log('PropSwipes: IAP already initialized');
      return true;
    }

    try {
      // Import RevenueCat Purchases
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      this.purchasesPlugin = Purchases;
      
      // Configure RevenueCat
      await this.purchasesPlugin.configure({
        apiKey: 'appl_YOUR_REVENUECAT_API_KEY_HERE', // Replace with your RevenueCat API key
        appUserID: null, // Let RevenueCat generate anonymous ID
        observerMode: false,
        userDefaultsSuiteName: null,
        useAmazon: false,
        shouldShowInAppMessagesAutomatically: true
      });
      
      console.log('PropSwipes: RevenueCat initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('PropSwipes: RevenueCat initialization failed:', error);
      // Still mark as initialized for fallback
      this.isInitialized = true;
      return true;
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.purchasesPlugin) {
      try {
        const productIds = Object.values(PRODUCT_IDS);
        const offerings = await this.purchasesPlugin.getProducts({
          productIdentifiers: productIds,
          type: 'SUBSCRIPTION'
        });
        
        return offerings.map((product: any) => ({
          id: product.identifier,
          title: product.title,
          description: product.description,
          price: product.priceString,
          currency: product.currencyCode || 'USD'
        }));
      } catch (error) {
        console.error('RevenueCat: Error getting products', error);
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

    if (this.purchasesPlugin) {
      try {
        console.log(`RevenueCat: Starting purchase for ${productId}`);
        
        // Get the product first
        const products = await this.purchasesPlugin.getProducts({
          productIdentifiers: [productId],
          type: 'SUBSCRIPTION'
        });
        
        if (products.length === 0) {
          throw new Error(`Product ${productId} not found`);
        }
        
        // Purchase the product
        const result = await this.purchasesPlugin.purchaseProduct({
          product: products[0]
        });
        
        const purchase: IAPPurchase = {
          productId: productId,
          transactionId: result.transaction.transactionIdentifier,
          receipt: result.transaction.originalJSON,
          platform: Capacitor.getPlatform() as 'ios' | 'android'
        };

        // Verify purchase with backend
        await this.verifyPurchase(purchase);
        
        return purchase;
      } catch (error) {
        console.error('RevenueCat: Purchase failed', error);
        throw error;
      }
    }

    // If no plugin available, throw error to guide proper setup
    throw new Error(
      'RevenueCat plugin not available. Make sure:\n\n' +
      '1. App is built and run from Xcode (not browser)\n' +
      '2. @revenuecat/purchases-capacitor is properly installed\n' +
      '3. Products are configured in RevenueCat Dashboard\n' +
      '4. RevenueCat API key is set\n' +
      '5. Sandbox test user is signed in\n\n' +
      'Current platform: ' + Capacitor.getPlatform()
    );
  }

  async verifyPurchase(purchase: IAPPurchase): Promise<void> {
    try {
      console.log('RevenueCat: Verifying purchase with backend');
      
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

      console.log('RevenueCat: Purchase verified successfully');
    } catch (error) {
      console.error('RevenueCat: Purchase verification failed', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<IAPPurchase[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    if (this.purchasesPlugin) {
      try {
        const result = await this.purchasesPlugin.restorePurchases();
        
        const restored: IAPPurchase[] = [];
        
        // Process active subscriptions
        if (result.purchaserInfo && result.purchaserInfo.activeSubscriptions) {
          for (const subscription of result.purchaserInfo.activeSubscriptions) {
            const purchase: IAPPurchase = {
              productId: subscription,
              transactionId: `restored_${subscription}_${Date.now()}`,
              receipt: JSON.stringify(result.purchaserInfo),
              platform: Capacitor.getPlatform() as 'ios' | 'android'
            };
            
            // Verify each restored purchase
            await this.verifyPurchase(purchase);
            restored.push(purchase);
          }
        }
        
        return restored;
      } catch (error) {
        console.error('RevenueCat: Restore failed', error);
        throw error;
      }
    }

    console.log('RevenueCat: Restore purchases - no plugin available');
    return [];
  }

  async getCustomerInfo(): Promise<any> {
    if (!this.isInitialized || !this.purchasesPlugin) {
      return null;
    }

    try {
      const customerInfo = await this.purchasesPlugin.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('RevenueCat: Error getting customer info', error);
      return null;
    }
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const iapService = new IAPService();