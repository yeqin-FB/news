'use client'

import { useEffect } from "react";
import { useHeartbeatStore } from "@/app/lib/store";
import { HeadAlert } from "@/app/ui/common/alert";
import { PROJ_NAME, HEART_BEAT_ALERT, HEART_BEAT_CHECK_1S } from "@/app/lib/constants";
import { WindowMenu, PhoneMenu } from "./menu";
import { WalletButton } from './wallet-button'
import Link from "next/link";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { get_heatbeat_wss } from '@/app/lib/api';



export default function Header() {
    const { heartbeat, setHeartbeat } = useHeartbeatStore();
    const { readyState } = useWebSocket(
        get_heatbeat_wss(),
        {
            shouldReconnect: () => true,
            heartbeat: {
                message: 'ping',
                returnMessage: 'pong',
                timeout: 3000, // 3s
                interval: HEART_BEAT_CHECK_1S,
            },
        }
    );

    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            setHeartbeat(true);
        } else {
            setHeartbeat(false);
        }
    }, [readyState]);


    return (
        <header className="text-gray-600 min-w-full h-min z-10">
            {heartbeat ? null : <HeadAlert message={HEART_BEAT_ALERT} />}
            <div className="flex flex-nowrap mx-auto p-1 md:p-5 flex-row items-center">
                <Link href={"/"} target="_blank" className="flex title-font font-medium items-center text-gray-900 hover:text-gray-600">
                    <img src="/icons/Luce.png" className="w-8 h-8 md:w-10 md:h-10 text-white p-2 rounded-full border-2 border-black" />
                   
                </Link>

                <div className="absolute right-2">
                    <WalletButton />
                </div>
            </div>
        </header>
    );
}