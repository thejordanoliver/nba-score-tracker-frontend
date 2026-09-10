// hooks/useLiveVotes.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "utils/apiClient";
import { getSocketNamespaceUrl } from "utils/apiConfig";
import { PollResult } from "./useGameVotes";

const SOCKET_NAMESPACE = "/votes";
const SOCKET_URL = getSocketNamespaceUrl(SOCKET_NAMESPACE);

type VoteUpdatePayload = {
  gameId: string | number;
  votes: PollResult[];
};

type JoinGameAck =
  | ({ ok: true } & VoteUpdatePayload)
  | { ok: false; error: string };

type CastVotePayload = {
  gameId: number;
  teamId: string | number;
};

export type CastVoteAck = { ok: true } | { ok: false; error: string };

type VoteServerToClientEvents = {
  voteUpdate: (payload: VoteUpdatePayload) => void;
};

type VoteClientToServerEvents = {
  joinGame: (
    gameId: number,
    callback?: (response: JoinGameAck) => void,
  ) => void;
  castVote: (
    payload: CastVotePayload,
    callback?: (response: CastVoteAck) => void,
  ) => void;
};

const VOTE_ACK_TIMEOUT_MS = 8000;

export function useLiveVotes(gameId: number) {
  const [votes, setVotes] = useState<PollResult[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<
    VoteServerToClientEvents,
    VoteClientToServerEvents
  > | null>(null);

  useEffect(() => {
    let socket: Socket<
      VoteServerToClientEvents,
      VoteClientToServerEvents
    > | null = null;
    let mounted = true;

    const connectSocket = async () => {
      setVotes(null);
      setIsConnected(false);

      const token = await getAccessToken();

      if (!mounted) return;
      if (!token) {
        console.warn("No access token found; skipping socket connection");
        return;
      }

      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        auth: { token },
        autoConnect: false,
      });

      const joinGame = () => {
        socket?.emit("joinGame", gameId, (response) => {
          if (!mounted) return;

          if (response.ok && String(response.gameId) === String(gameId)) {
            setVotes(response.votes);
            return;
          }

          if (!response.ok) {
            console.warn("Vote room join error", response.error);
          }
        });
      };

      socket.on("connect", () => {
        setIsConnected(true);
        joinGame();
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setIsConnected(false);
        console.warn("Vote socket connection error", err.message);
      });

      socket.on(
        "voteUpdate",
        ({ gameId: updatedGameId, votes: updatedVotes }) => {
          if (String(updatedGameId) === String(gameId)) {
            setVotes(updatedVotes);
          }
        },
      );

      socketRef.current = socket;
      socket.connect();
    };

    connectSocket();

    return () => {
      mounted = false;
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [gameId]);

  const castVote = (teamId: string | number): Promise<CastVoteAck> => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return Promise.resolve({
        ok: false,
        error: "Realtime voting is reconnecting. Try again.",
      });
    }

    return new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve({ ok: false, error: "Vote timed out. Try again." });
      }, VOTE_ACK_TIMEOUT_MS);

      socket.emit("castVote", { gameId, teamId }, (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(response);
      });
    });
  };

  return { votes, castVote, isConnected };
}
