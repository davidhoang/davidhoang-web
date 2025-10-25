import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: import.meta.env.PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_placeholder",
  // For public commenting, we'll use a simple auth approach
  authEndpoint: "/api/liveblocks-auth",
});

// Create room context for React components
export const {
  RoomProvider,
  useRoom,
  useThreads,
  useCreateThread,
  useEditThreadMetadata,
  useCreateComment,
  useEditComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
  useUser,
  useMyPresence,
  useOthersPresence,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext(client);

export { client };
