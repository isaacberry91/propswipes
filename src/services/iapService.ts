import { Capacitor } from '@capacitor/core';

// Product IDs for Apple App Store and Google Play Store
export const PRODUCT_IDS = {
  BUYER_PRO: 'com.propswipes.subscription.buyer_pro',
  SELLER_BASIC: 'com.propswipes.seller_basic', 
  SELLER_PROFESSIONAL: 'com.propswipes.seller_professional',
  SELLER_ENTERPRISE: 'com.propswipes.seller_enterprise'
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

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('IAP: Not on native platform');
      return false;
    }

    try {
      // For now, we'll prepare for when IAP plugin is added
      console.log('IAP: Service initialized for native platform');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('IAP: Failed to initialize', error);
      return false;
    }
  }

  async getProducts(): Promise<IAPProduct[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    // This will be implemented once we add the IAP plugin
    // For now, return mock data
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

    // This will be implemented with the actual IAP plugin
    console.log(`IAP: Attempting to purchase ${productId}`);
    
    // For development, throw an error to show the flow
    throw new Error('In-App Purchases will be available once the app is published to the App Store and Google Play Store. The IAP plugin requires the app to be signed and distributed through official stores.');
  }

  async restorePurchases(): Promise<IAPPurchase[]> {
    if (!this.isInitialized) {
      throw new Error('IAP service not initialized');
    }

    // This will restore previous purchases
    console.log('IAP: Restoring purchases');
    return [];
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const iapService = new IAPService();