import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

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
      // Import @capgo/native-purchases
      const { NativePurchases } = await import('@capgo/native-purchases');
      this.nativePurchases = NativePurchases;
      
      console.log('PropSwipes: Native purchases plugin loaded successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('PropSwipes: Failed to load native purchases plugin:', error);
      // Still mark as initialized for testing
      this.isInitialized = true;
      return true;
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
        
        const purchase: IAPPurchase = {
          productId: productId,
          transactionId: result.transactionIdentifier,
          receipt: result.transactionReceipt,
          platform: Capacitor.getPlatform() as 'ios' | 'android'
        };

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
      console.log('Verifying purchase with backend');
      
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