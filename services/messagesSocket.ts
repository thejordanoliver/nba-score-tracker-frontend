import { io, Socket } from "socket.io-client";
import {
  ConversationReadPayload,
  SendDirectMessagePayload,
} from "types/messages";
import { getSocketNamespaceUrl } from "utils/apiConfig";

const SOCKET_NAMESPACE = "/messages";
const SOCKET_URL = getSocketNamespaceUrl(SOCKET_NAMESPACE);

let messagesSocket: Socket | null = null;
let activeToken: string | null = null;

export const getMessagesSocket = (token?: string | null) => {
  if (!token || !SOCKET_URL) return null;

  if (messagesSocket && activeToken === token) {
    if (!messagesSocket.connected) {
      messagesSocket.connect();
    }

    return messagesSocket;
  }

  messagesSocket?.disconnect();
  activeToken = token;

  messagesSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });

  return messagesSocket;
};

export const disconnectMessagesSocket = () => {
  messagesSocket?.disconnect();
  messagesSocket = null;
  activeToken = null;
};

export const emitMessageSend = (
  payload: SendDirectMessagePayload & { conversationId: string },
  callback?: (response?: unknown) => void,
) => {
  messagesSocket?.emit("message:send", payload, callback);
};

export const emitTypingStart = (conversationId: string) => {
  messagesSocket?.emit("typing:start", { conversationId });
};

export const emitTypingStop = (conversationId: string) => {
  messagesSocket?.emit("typing:stop", { conversationId });
};

export const emitConversationRead = (
  conversationId: string,
  callback?: (response?: ConversationReadPayload | unknown) => void,
) => {
  if (!messagesSocket?.connected) return false;

  messagesSocket.emit("conversation:read", { conversationId }, callback);

  return true;
};

export const emitConversationPin = (
  conversationId: string,
  isPinned: boolean,
) => {
  messagesSocket?.emit("conversation:pin", { conversationId, isPinned });
};

export const emitConversationDelete = (conversationId: string) => {
  messagesSocket?.emit("conversation:delete", { conversationId });
};
