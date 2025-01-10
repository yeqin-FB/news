'use client';

import clsx from "clsx";
import { debounce } from 'lodash';
import { React, useEffect, useRef, useState } from "react";
import { useChatRecordStore, ChatRole, ChatMessage, useAgentEngineSettingsStore, useAgentModeStore, useMuteStore, useInteractionModeStore, InteractionMode, useAudioAutoStopStore } from "@/app/lib/store";
import { ConfirmAlert } from "@/app/ui/common/alert";
import { AUDIO_SUPPORT_ALERT, AI_THINK_MESSAGE } from "@/app/lib/constants";
import { Comm } from "@/app/lib/comm";
import { CharacterManager } from "@/app/lib/character";
import Recorder from 'js-audio-recorder';
import Markdown from 'react-markdown';
import { UnlockDialog } from './unlock-dialog'
import { useWalletStore } from '@/app/lib/store'

let micRecorder: Recorder | null = null;
let isRecording: boolean = false;


export default function Chatbot(props: { showChatHistory: boolean }) {
    const { showChatHistory } = props;
    const { chatRecord, addChatRecord, updateLastRecord, clearChatRecord } = useChatRecordStore();
    const { mute } = useMuteStore();
    const { agentEngine } = useAgentModeStore();
    const { mode } = useInteractionModeStore();
    const { agentSettings } = useAgentEngineSettingsStore();
    const { audioAutoStop } = useAudioAutoStopStore();
    const [settings, setSettings] = useState<{[key: string]: string}>({});
    const [conversationId, setConversationId] = useState("");
    const [micRecording, setMicRecording] = useState(false);
    const [micRecordAlert, setmicRecordAlert] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatbotRef = useRef<HTMLDivElement>(null);
    
    // Inside component
    const { isConnected, messageCount, hasUnlimitedAccess, incrementMessageCount } = useWalletStore()
  
    const [showUnlockDialog, setShowUnlockDialog] = useState(false)

    useEffect(() => {
        let newSettings: {[key: string]: string} = {}
        if (agentEngine in agentSettings) {
            for (let setting of agentSettings[agentEngine]){
                newSettings[setting.NAME] = setting.DEFAULT;
            }
            setSettings(newSettings);
        }
        Comm.getInstance().getConversionId(agentEngine, newSettings).then((id) => {
            console.log("conversationId: ", id);
            setConversationId(id);
        });
        clearChatRecord();
    }, [agentEngine, agentSettings]);

    const chatWithAI = (message: string) => {
        console.log("chatWithAI: ", message);
        addChatRecord({ role: ChatRole.HUMAN, content: message });
        // 请求AI
        let responseText = "";
        let audioText = "";
        // 保证顺序执行
        let audioRecorderIndex = 0;
        let audioRecorderDict = new Map<number, ArrayBuffer>();
        addChatRecord({ role: ChatRole.AI, content: AI_THINK_MESSAGE });
        if (audioAutoStop) {
            CharacterManager.getInstance().clearAudioQueue();
        }
        Comm.getInstance().streamingChat(message, agentEngine, conversationId, settings, (index: number, data: string) => {
            responseText += data;
            updateLastRecord({ role: ChatRole.AI, content: responseText });
            if (!mute && mode != InteractionMode.CHATBOT) {
                // 按照标点符号断句处理
                audioText += data;
                // 断句判断符号
                // let punc = ["。", ".", "！", "!", "？", "?", "；", ";", "，", ",", "(", ")", "（", "）"];
                let punc = ["。", ".", "？", "?", "；", ";", "，", ","];
                // 找到最后一个包含这些符号的位置
                let lastPuncIndex = -1;
                for (let i = 0; i < punc.length; i++) {
                    let index = audioText.lastIndexOf(punc[i]);
                    if (index > lastPuncIndex) {
                        // 防止需要连续的符号断句
                        let firstPart = audioText.slice(0, index + 1);
                        if (firstPart.split("(").length - firstPart.split(")").length != 0) {
                            break;
                        }
                        if (firstPart.split("[").length - firstPart.split("]").length != 0) {
                            break;
                        }
                        lastPuncIndex = index;
                        break;
                    }
                }
                if (lastPuncIndex !== -1) {
                    let firstPart = audioText.slice(0, lastPuncIndex + 1);
                    let secondPart = audioText.slice(lastPuncIndex + 1);
                    console.log("tts:", firstPart);
                    Comm.getInstance().tts(firstPart, settings).then(
                        (data: ArrayBuffer) => {
                            if (data) {
                                audioRecorderDict.set(index, data);
                                while (true) {
                                    if (!audioRecorderDict.has(audioRecorderIndex)) break;
                                    CharacterManager.getInstance().pushAudioQueue(audioRecorderDict.get(audioRecorderIndex)!);
                                    audioRecorderIndex++;
                                }
                            }
                        }
                    )
                    audioText = secondPart;
                } else {
                    audioRecorderDict.set(index, null)
                }
            }
        }, (index: number) => {
            // 处理剩余tts
            if (!mute && audioText) {
                console.log("tts:", audioText);
                Comm.getInstance().tts(audioText, settings).then(
                    (data: ArrayBuffer) => {
                        if (data) {
                            audioRecorderDict.set(index, data);
                            while (true) {
                                if (!audioRecorderDict.has(audioRecorderIndex)) break;
                                CharacterManager.getInstance().pushAudioQueue(audioRecorderDict.get(audioRecorderIndex)!);
                                audioRecorderIndex++;
                            }
                        }
                    }
                )
            }
            setIsProcessing(false);
        });
    }


    const micClick = () => {
        if (isProcessing) return;
        if (micRecorder == null) {
            micRecorder = new Recorder({
                sampleBits: 16,         // 采样位数，支持 8 或 16，默认是16
                sampleRate: 16000,      // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，我的chrome是48000
                numChannels: 1,         // 声道，支持 1 或 2， 默认是1
            });
        }
        if (!isRecording) {
            if (audioAutoStop) {
                CharacterManager.getInstance().clearAudioQueue();
            }
            micRecorder.start().then(
                () => {
                    isRecording = true;
                    setMicRecording(true);
                },
                (error) => {
                    console.error(error);
                    setmicRecordAlert(true);
                }
            );
        } else {
            micRecorder.stop();
            isRecording = false;
            setMicRecording(false);
            setIsProcessing(true);
            Comm.getInstance().asr(micRecorder.getWAVBlob(), settings).then(
                (res) => {
                    console.log("asr: ", res);
                    if (res) {
                        chatWithAI(res);
                    } else {
                        setIsProcessing(false);
                    }
                }
            ).catch(
                (error) => {
                    setIsProcessing(false);
                }
            )
        }
    }

    const fileClick = () => {
        console.log("file clicked");
    }

  

 const sendClick = () => {
    if (!isConnected) {
      alert('请先连接钱包')
      return
    }
    if (!hasUnlimitedAccess && messageCount >= 3) {
      setShowUnlockDialog(true)
      return
    }

    // 发送消息逻辑
    incrementMessageCount()
    if (inputRef.current.value === "") return;
        setIsProcessing(true);
        chatWithAI(inputRef.current.value);
        inputRef.current.value = "";
  }

    //发送按钮
    const [isButtonDisabled, setButtonDisabled] = useState(true);

    const handleInputChange = () => {
        const value = inputRef.current.value;
        setMessage(value);
        setButtonDisabled(value.trim() === '');
    };
  
  const unlockUnlimited = async () => {
    // 调用支付0.001 SOL的逻辑
    // 支付成功后:
    setUnlimitedAccess(true)
  }






    const enterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendClick();
        }
    }

    // 定义一个防抖函数，用于处理 Ctrl + M 的按键组合  
    const handleCtrlM = debounce(() => {
        console.log('Ctrl + M was pressed!');
        micClick();
    }, 500); // 1000 毫秒内多次触发只执行一次   

    useEffect(() => {
        // 聊天滚动条到底部
        chatbotRef.current.scrollTop = chatbotRef.current.scrollHeight + 100;
        // 添加事件监听器  
        const handleKeyDown = (event: KeyboardEvent) => {
            // 检查是否按下了 Ctrl + M
            if (event.ctrlKey && event.key === 'm') {
                handleCtrlM();
            }
        };

        // 绑定事件监听器到 document 或其他适当的 DOM 元素  
        document.addEventListener('keydown', handleKeyDown);
        // 清理函数，用于移除事件监听器  
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    })
    return (

        <div className="p-2 sm:p-6 justify-between flex flex-col h-full">
            {micRecordAlert ? <ConfirmAlert message={AUDIO_SUPPORT_ALERT} /> : null}
            <div id="messages" ref={chatbotRef} className="flex flex-col space-y-4 p-3 overflow-y-auto no-scrollbar z-10">
                {
                    showChatHistory ?
                        chatRecord.map((chat: ChatMessage, index: number) => (
                            <div className="chat-message" key={index}>
                                <div className={clsx(
                                    "flex items-end",
                                    chat.role == ChatRole.AI ? "" : "justify-end"
                                )}>
                                    <div className={clsx(
                                        "flex flex-col space-y-2 text-xs max-w-xs mx-2",
                                        chat.role == ChatRole.AI ? "order-2 items-start" : "order-1 items-end"
                                    )}>
                                        <div><Markdown className="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-gray-300 text-gray-600">{chat.content}</Markdown></div>
                                    </div>
                                    <img src={chat.role == ChatRole.HUMAN ? "/icons/human_icon.svg" : "/icons/ai_icon.svg"} className="w-6 h-6 rounded-full order-1 self-start" />
                                </div>
                            </div>
                        ))
                        :
                        <></>
                }
                
            </div>
   
            <div className="px-4 pt-4 mb-2 sm:mb-0 z-10 w-full">
                <div className="relative flex">
            	<textarea
            			enterKeyHint="send"
            			disabled={isProcessing}
            			placeholder="Write your message!"
            			ref={inputRef}
            			onKeyDown={enterPress}
            			style={{ height: '100px' }}
            			className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-4 bg-gray-200 rounded-md py-3 resize-none"
            		/>
            		<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            
            			<button type="button" onClick={micClick} disabled={isProcessing} className={clsx(
                            "inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-500 ease-in-out hover:bg-gray-300 focus:outline-none",
                            micRecording ? "text-red-600" : "text-green-600",
                        )}>
                            {
                                micRecording ?
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
                                    </svg>
                                    :
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                    </svg>
                            }
                        </button>				
                    </div>
                </div>
            </div>

            <UnlockDialog
			   isOpen={showUnlockDialog}
			   onClose={() => setShowUnlockDialog(false)}
		   />
          
        </div>
    );
}