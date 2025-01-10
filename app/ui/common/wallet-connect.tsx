// app/ui/common/wallet-connect.tsx

import { useWalletStore } from '@/app/lib/store'
import { Button } from '@nextui-org/react'
import dynamic from 'next/dynamic'

const DynamicWalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

export default function WalletConnect() {
  const { isConnected, messageCount, hasUnlimitedAccess } = useWalletStore()

  return (
    <div className="flex items-center gap-4">
      <DynamicWalletMultiButton />
      {isConnected && !hasUnlimitedAccess && (
        <div className="text-sm">
          剩余免费消息: {Math.max(0, 3 - messageCount)}
        </div>
      )}
    </div>
  )
}
