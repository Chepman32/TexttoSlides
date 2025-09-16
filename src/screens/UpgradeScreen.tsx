import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import IAPService from '../services/IAPService';

const UpgradeScreen: React.FC = () => {
  const handlePurchase = async () => {
    try {
      const success = await IAPService.purchaseProduct('text_to_slides_pro');
      
      if (success) {
        Alert.alert(
          'Success',
          'Thank you for upgrading to Pro! You now have access to all premium features.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'There was an issue processing your purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        'There was an issue processing your purchase. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const success = await IAPService.restorePurchases();
      
      if (success) {
        Alert.alert(
          'Success',
          'Your purchases have been restored!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Restore Failed',
          'No previous purchases found.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'There was an issue restoring your purchases. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Go Pro</Text>
        <Text style={styles.subtitle}>Unlock all features</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Pro Features</Text>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>Remove watermarks from exported slides</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>Create unlimited slides per post</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>Access to premium text layout templates</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>Future premium updates included</Text>
          </View>
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.oneTime}>One-time purchase</Text>
        </View>

        <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
          <Text style={styles.purchaseButtonText}>Buy Pro Version</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitCheck: {
    fontSize: 20,
    color: '#34C759',
    marginRight: 15,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  oneTime: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UpgradeScreen;