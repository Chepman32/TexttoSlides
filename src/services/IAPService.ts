// Mock IAP service for now since we're having issues with the actual library
class IAPService {
  private isProUser: boolean = false;

  // Initialize the IAP service
  async init(): Promise<void> {
    console.log('IAP Service initialized');
  }

  // Mock purchase function
  async purchaseProduct(_productId: string): Promise<boolean> {
    // Simulate a successful purchase
    this.isProUser = true;
    return true;
  }

  // Mock restore purchases
  async restorePurchases(): Promise<boolean> {
    // Simulate restoring purchases
    this.isProUser = true;
    return true;
  }

  // Check if user is pro
  async isPro(): Promise<boolean> {
    return this.isProUser;
  }

  // Set pro status (for testing)
  setProStatus(status: boolean): void {
    this.isProUser = status;
  }

  // Clean up
  async endConnection(): Promise<void> {
    console.log('IAP connection ended');
  }
}

export default new IAPService();