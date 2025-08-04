import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Product IDs for Apple App Store and Google Play Store
export const PRODUCT_IDS = {
  BUYER_PRO: 'com.propswipes.subscription.buyer_pro_v2',
  SELLER_BASIC: 'com.propswipes.subscription.seller_basic_v2', 
  SELLER_PROFESSIONAL: 'com.propswipes.subscription.seller_professional_v2',
  SELLER_ENTERPRISE: 'com.propswipes.subscription.seller_enterprise_v2'
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
      console.log('IAP: Not on native platform');
      this.isInitialized = true;
      return true;
    }

    try {
      // Only try to import in actual native environment
      if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins) {
        // Construct the import path dynamically to avoid Vite resolution
        const moduleName = '@capgo/native-purchases';
        const { NativePurchases } = await import(/* @vite-ignore */ moduleName);
        this.iapPlugin = NativePurchases;
        
        // Initialize the plugin
        await this.iapPlugin.initialize();
        
        console.log('IAP: Native purchases plugin initialized successfully');
      } else {
        console.log('IAP: Capacitor plugins not available, using mock service');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('IAP: Plugin not available, continuing with mock service. Error:', error);
      this.isInitialized = true;
      return true;
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

    // Mock purchase for development
    throw new Error('In-App Purchases are only available in the published app from the App Store. For testing, please use the TestFlight build with sandbox Apple ID.');
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