import React from "react";
import { RoomProvider } from "../../liveblocks.config";

interface LiveblocksWrapperProps {
  children: React.ReactNode;
  roomId: string;
  user?: any;
}

export default function LiveblocksWrapper({ children, roomId, user }: LiveblocksWrapperProps) {
  return (
    <RoomProvider 
      id={roomId}
      initialPresence={{}}
      initialStorage={{}}
    >
      {children}
    </RoomProvider>
  );
}