// app/lib/wallet.ts

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

export async function paySOL(amount: number) {
  const { publicKey, signTransaction } = useWallet()
  if (!publicKey || !signTransaction) return false

  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  
  // 创建转账交易
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey('2ZcQzgr9HbnvE7DgeBnBBWHmVwaooKKK352hG738Xsvv'), // 替换为接收地址
      lamports: amount * LAMPORTS_PER_SOL
    })
  )

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [signTransaction]
    )
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export async function checkNFTOwnership(walletAddress: string): Promise<boolean> {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  
  // 检查指定NFT的所有权
  const nftMint = new PublicKey('https://www.baidu.com') // 替换为NFT的mint地址
  
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: nftMint }
    )
    return tokenAccounts.value.length > 0
  } catch (err) {
    console.error(err) 
    return false
  }
}
