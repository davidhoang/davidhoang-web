import React from "react";
import { RoomProvider } from "../../liveblocks.config";

interface LiveblocksWrapperProps {
  children: React.ReactNode;
  roomId: string;
}

export default function LiveblocksWrapper({ children, roomId }: LiveblocksWrapperProps) {
  return (
    <RoomProvider id={roomId}>
      {children}
    </RoomProvider>
  );
}