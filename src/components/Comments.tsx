import React from "react";
import { RoomProvider } from "../lib/liveblocks";
import { Thread } from "@liveblocks/react-ui";
import "@liveblocks/react-ui/styles.css";

interface CommentsProps {
  roomId: string;
}

export default function Comments({ roomId }: CommentsProps) {
  return (
    <RoomProvider id={roomId} initialPresence={{}}>
      <div className="comments-section">
        <h3>Comments</h3>
        <div className="comments-container">
          <Thread threadId="main-thread" />
        </div>
      </div>
    </RoomProvider>
  );
}
