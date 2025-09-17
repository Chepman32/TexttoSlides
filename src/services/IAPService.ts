import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Product IDs for App Store and Google Play
const PRODUCT_IDS = Platform.select({
  ios: ['com.texttoslides.pro', 'com.texttoslides.pro.monthly'],
  android: ['com.texttoslides.pro', 'com.texttoslides.pro.monthly'],
  default: []
});

interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  type: 'iap' | 'subs';
}

interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: string;
  transactionReceipt: string;
}

class IAPService {
  private static instance: IAPService;
  private isInitialized: boolean = false;
  private products: Product[] = [];
  private purchases: Purchase[] = [];
  private listeners: Array<() => void> = [];

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  // Initialize the IAP service
  async init(): Promise<void> {
    try {
      // In production, initialize the IAP library here
      // For now, we'll simulate with mock data
      console.log('IAP Service initializing...');

      // Load cached purchase status
      const cachedProStatus = await AsyncStorage.getItem('proStatus');
      const cachedPurchases = await AsyncStorage.getItem('purchases');

      if (cachedPurchases) {
        this.purchases = JSON.parse(cachedPurchases);
      }

      // Simulate available products
      this.products = [
        {
          productId: 'com.texttoslides.pro',
          title: 'Text to Slides Pro',
          description: 'Unlock all features: Remove watermark, unlimited slides, premium templates',
          price: '4.99',
          localizedPrice: '$4.99',
          currency: 'USD',
          type: 'iap'
        },
        {
          productId: 'com.texttoslides.pro.monthly',
          title: 'Text to Slides Pro Monthly',
          description: 'Monthly subscription to all Pro features',
          price: '1.99',
          localizedPrice: '$1.99/month',
          currency: 'USD',
          type: 'subs'
        }
      ];

      this.isInitialized = true;
      console.log('IAP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      this.isInitialized = false;
    }
  }

  // Get available products
  async getProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.products;
  }

  // Purchase a product
  async purchaseProduct(productId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const product = this.products.find(p => p.productId === productId);
      if (!product) {
        Alert.alert('Error', 'Product not found');
        return false;
      }

      // Simulate purchase flow
      // In production, this would call the native IAP API
      return new Promise((resolve) => {
        Alert.alert(
          'Confirm Purchase',
          `Purchase ${product.title} for ${product.localizedPrice}?`,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            {
              text: 'Buy',
              onPress: async () => {
                // Simulate successful purchase
                const purchase: Purchase = {
                  productId,
                  transactionId: `trans_${Date.now()}`,
                  transactionDate: new Date().toISOString(),
                  transactionReceipt: `receipt_${Date.now()}`
                };

                this.purchases.push(purchase);
                await this.savePurchases();

                Alert.alert('Success', 'Purchase successful! Pro features unlocked.');
                this.notifyListeners();
                resolve(true);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Purchase failed. Please try again.');
      return false;
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Simulate restore
      // In production, this would call the native restore API
      const restoredPurchases = await AsyncStorage.getItem('purchases');

      if (restoredPurchases) {
        this.purchases = JSON.parse(restoredPurchases);
        if (this.purchases.length > 0) {
          this.notifyListeners();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }

  // Check if user has pro access
  async isPro(): Promise<boolean> {
    if (this.purchases.length === 0) {
      // Try loading from storage
      const cachedPurchases = await AsyncStorage.getItem('purchases');
      if (cachedPurchases) {
        this.purchases = JSON.parse(cachedPurchases);
      }
    }

    // Check if any purchase is valid
    // In production, would validate receipts
    return this.purchases.length > 0;
  }

  // Get active subscription or purchase
  async getActivePurchase(): Promise<Purchase | null> {
    if (await this.isPro()) {
      // Return the most recent purchase
      return this.purchases[this.purchases.length - 1];
    }
    return null;
  }

  // Save purchases to storage
  private async savePurchases(): Promise<void> {
    try {
      await AsyncStorage.setItem('purchases', JSON.stringify(this.purchases));
      await AsyncStorage.setItem('proStatus', (this.purchases.length > 0).toString());
    } catch (error) {
      console.error('Error saving purchases:', error);
    }
  }

  // Clear purchases (for testing)
  async clearPurchases(): Promise<void> {
    this.purchases = [];
    await AsyncStorage.removeItem('purchases');
    await AsyncStorage.removeItem('proStatus');
    this.notifyListeners();
  }

  // Add listener for purchase updates
  addPurchaseUpdateListener(callback: () => void): void {
    this.listeners.push(callback);
  }

  // Remove listener
  removePurchaseUpdateListener(callback: () => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notify all listeners of purchase updates
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Clean up connections
  async endConnection(): Promise<void> {
    // In production, would close IAP connections
    console.log('IAP connection ended');
    this.isInitialized = false;
  }

  // Get price for a product
  async getPrice(productId: string): Promise<string> {
    const product = this.products.find(p => p.productId === productId);
    return product?.localizedPrice || '$4.99';
  }

  // Validate receipt (mock)
  async validateReceipt(receipt: string): Promise<boolean> {
    // In production, would validate with App Store/Play Store
    console.log('Validating receipt:', receipt);
    return true;
  }
}

export default IAPService.getInstance();