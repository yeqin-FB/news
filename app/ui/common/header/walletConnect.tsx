import { useWallet } from '@solana/wallet-adapter-react';

export default function WalletConnect() {
    const { connected, wallet, connect, disconnect } = useWallet();

    return (
        <div>
            {connected ? (
                <button onClick={disconnect}>
                    Disconnect {wallet?.name}
                </button>
            ) : (
                <button onClick={connect}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
}