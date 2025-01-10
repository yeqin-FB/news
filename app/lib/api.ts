import "whatwg-fetch";

const SERVER_PROTOCOL = process.env.NEXT_PUBLIC_LUCE_SERVER_PROTOCOL || "http";
const SERVER_PORT = process.env.NEXT_PUBLIC_LUCE_SERVER_PORT || "8000";
const VERSION = process.env.NEXT_PUBLIC_LUCE_SERVER_VERSION || "v0";

function getURL(): string {
  const SERVER_IP = process.env.NEXT_PUBLIC_LUCE_SERVER_IP || globalThis.location?.hostname;
  const URL = SERVER_PROTOCOL + "://" + SERVER_IP;
  return URL;
}


export function get_heatbeat_wss() {
  const URL = getURL();

  const wsURL = URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${wsURL}/luce/common/${VERSION}/heartbeat`;
}

export async function asr_infer_api(
  data: string,
  engine: string = "default",
  format: string = "wav",
  sampleRate: Number = 16000,
  sampleWidth: Number = 2,
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/luce/asr/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      format: format,
      sampleRate: sampleRate,
      sampleWidth: sampleWidth,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function tts_infer_api(
  data: string,
  engine: string = "default",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/luce/tts/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agents_list_api() {
  const URL = getURL();
  let response = await fetch(URL + `/luce/agent/${VERSION}/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function agent_default_api() {
  const URL = getURL();
  let response = await fetch(URL + `/luce/agent/${VERSION}/default`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function agent_settings_api(engine: string) {
  const URL = getURL();
  let response = await fetch(URL + `/luce/agent/${VERSION}/settings`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agent_conversationid_api(
  engine: string = "default",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/luce/agent/${VERSION}/conversation_id`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      settings: settings,
      streaming: true,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agent_infer_streaming_api(
  data: string,
  engine: string = "default",
  conversationId: string = "",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  // 将conversationId填充到settings中
  settings["conversation_id"] = conversationId;
  let response = await fetch(URL + `/luce/agent/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      // 默认使用streaming模式
      streaming: true,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.body.getReader();
}
