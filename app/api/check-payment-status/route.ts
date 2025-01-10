// app/api/check-payment-status/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedTransactionWithMeta, LAMPORTS_PER_SOL } from '@solana/web3.js';

const PAYMENT_RECIPIENT = '2ZcQzgr9HbnvE7DgeBnBBWHmVwaooKKK352hG738Xsvv';
const REQUIRED_AMOUNT = 0.001 * LAMPORTS_PER_SOL;
export const dynamic = 'force-dynamic'; // 确保路由不被缓存

export async function GET(request: Request) {
   console.log('API Route: check-payment-status called');
  
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
 console.log('Checking payment for address:', address);
  console.log('RPC Endpoint:', process.env.NEXT_PUBLIC_RPC_ENDPOINT);

  if (!address) {
    console.log('No address provided');
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
    
    // 获取最近的交易
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(PAYMENT_RECIPIENT),
      { limit: 20 }
    );

    console.log('Found signatures:', signatures.length);

    // 检查每个交易
    for (const sig of signatures) {
      if (sig.err) continue;
      
      const tx = await connection.getParsedTransaction(sig.signature);
      console.log('Checking transaction:', sig.signature);
      
      // 验证交易
      const isValidPayment = validateTransaction(tx, address, PAYMENT_RECIPIENT, REQUIRED_AMOUNT);
      
      if (isValidPayment) {
        console.log('Valid payment found');
        return NextResponse.json({ hasPaid: true });
      }
    }

    console.log('No valid payment found');
    return NextResponse.json({ hasPaid: false });
    
  } catch (error) {
    console.error('Payment check failed:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}

function validateTransaction(
  tx: ParsedTransactionWithMeta,
  fromAddress: string,
  toAddress: string,
  amount: number
): boolean {
  if (!tx?.meta || tx.meta.err) return false;

  // 检查转账信息
  const transfer = tx.transaction.message.instructions.find(
    ix => ix.program === 'system' && ix.parsed?.type === 'transfer'
  );

  if (!transfer) return false;

  return (
    transfer.parsed.info.source === fromAddress &&
    transfer.parsed.info.destination === toAddress &&
    transfer.parsed.info.lamports >= amount
  );
}
