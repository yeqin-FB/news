// app/lib/utils/payment.ts
import { Connection, PublicKey } from '@solana/web3.js'

export async function checkPaymentStatus(address: string): Promise<boolean> {
  console.log('Checking payment status for:', address);
  
  try {
    const response = await fetch(`/api/check-payment-status?address=${address}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Payment status response:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Payment status data:', data);
    
    return data.hasPaid;
  } catch (error) {
    console.error('Payment status check failed:', error);
    return false;
  }
}
