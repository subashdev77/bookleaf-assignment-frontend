"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { SOCKET_URL } from "@/lib/constants";

type ConnectionState = "connecting" | "connected" | "disconnected";

interface RealtimeContextValue {
  socket: Socket | null;
  state: ConnectionState;
}

const RealtimeContext = createContext<RealtimeContextValue>({ socket: null, state: "disconnected" });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket] = useState<Socket>(() =>
    io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: (cb) => {
        api
          .get("/auth/socket-token")
          .then((res) => cb({ token: res.data.data.token }))
          .catch(() => cb({ token: "" }));
      },
      reconnectionDelayMax: 10000,
    }),
  );
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const onConnect = () => setState("connected");
    const onDisconnect = () => setState("disconnected");
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return <RealtimeContext.Provider value={{ socket, state }}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeState() {
  return useContext(RealtimeContext).state;
}

export function useRealtimeEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { socket } = useContext(RealtimeContext);
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
