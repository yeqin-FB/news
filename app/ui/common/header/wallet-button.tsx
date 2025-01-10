'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useWalletStore } from '@/app/lib/store'

function CustomWalletButton() {
  const { connecting, connected, publicKey } = useWallet()
  const [isClient, setIsClient] = useState(false)
  const { setWalletState } = useWalletStore()
  
  useEffect(() => {
    setIsClient(true)
    if (isClient && connected !== undefined) {
      setWalletState(connected, publicKey?.toBase58() || null)
    }
  }, [connected, publicKey, setWalletState, isClient])

  // 移动端样式优化
  const buttonClass = "py-2 px-4 rounded-md font-medium transition-colors " + 
    (connected 
      ? "bg-green-600 hover:bg-green-700 text-white text-sm"
      : connecting
        ? "bg-yellow-500 hover:bg-yellow-600 text-white text-sm cursor-wait"
        : "bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
    )

  // 移动端显示优化
  const buttonText = connected 
    ? `已连接 (${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-2)})` 
    : connecting
      ? "连接中..."
      : "连接钱包"

  return (
    <WalletMultiButton 
      className={buttonClass}
      style={{
        justifyContent: 'center',
        minWidth: 'auto',
        width: '100%'
      }}
    >
      {buttonText}
    </WalletMultiButton>
  )
}

export const WalletButton = dynamic(
  () => Promise.resolve(CustomWalletButton),
  { 
    ssr: false,
    loading: () => (
      <button 
        className="py-2 px-4 rounded-md font-medium bg-gray-400 text-white cursor-not-allowed text-sm"
        disabled
      >
        加载中...
      </button>
    )
  }
)
