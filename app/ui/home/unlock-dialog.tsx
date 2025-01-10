// app/ui/home/unlock-dialog.tsx
import { Modal, Button , ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";

import { useWalletStore } from '@/app/lib/store'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  TransactionInstruction 
} from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
// app/ui/home/unlock-dialog.tsx
import { checkPaymentStatus } from '@/app/lib/utils/payment'




export function UnlockDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { publicKey, sendTransaction } = useWallet()
  const { setUnlimitedAccess } = useWalletStore()
  const { connection } = useConnection() // Add this

  const handlePaySOL = async () => {
    if (!publicKey) return;
    
    try {
      const transaction = new Transaction();
      
      // 添加转账指令
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('2ZcQzgr9HbnvE7DgeBnBBWHmVwaooKKK352hG738Xsvv'),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );
  
      // 添加memo指令来标识支付者
      transaction.add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(publicKey.toBase58(), 'utf-8')
        })
      );
  
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
  
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);
      
      await connection.confirmTransaction(signature);
      console.log('Transaction confirmed');
  
      // 等待一段时间让交易完全确认
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查支付状态
      const hasPaid = await checkPaymentStatus(publicKey.toString());
      console.log('Payment verification:', hasPaid);
      
      if (hasPaid) {
        setUnlimitedAccess(true);
        onClose();
        alert('支付成功!');
      } else {
        alert('支付已完成，但验证失败，请联系客服');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('支付失败，请重试');
    }
  };
  
              
  
  const handleBuyNFT = () => {
    window.open('https://www.baidu.com', '_blank') // Replace with NFT marketplace URL
  }

 // app/ui/home/unlock-dialog.tsx
return (
  <Modal 
    isOpen={isOpen} 
    onClose={onClose}
    backdrop="blur"
  >
    <ModalContent>
      {(onClose) => (
        <>
          <ModalHeader>解锁无限对话</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Button 
                onPress={handlePaySOL}
                color="primary" 
                className="w-full"
              >
                支付 0.001 SOL 解锁
              </Button>
              <div className="text-center">或</div>
              <Button
                onPress={handleBuyNFT}
                color="secondary"
                className="w-full" 
              >
                购买 NFT 解锁
              </Button>
            </div>
          </ModalBody>
        </>
      )}
    </ModalContent>
  </Modal>
);
}
