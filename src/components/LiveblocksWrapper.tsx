import React from "react";
import { LiveblocksProvider } from "@liveblocks/react";
import { client } from "../../liveblocks.config";

interface LiveblocksWrapperProps {
  children: React.ReactNode;
}

export default function LiveblocksWrapper({ children }: LiveblocksWrapperProps) {
  return (
    <LiveblocksProvider client={client}>
      {children}
    </LiveblocksProvider>
  );
}
