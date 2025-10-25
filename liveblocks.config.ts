import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Define the types for your application
type Presence = {
  // Define presence properties if needed
  // For example: cursor: { x: number; y: number } | null;
};

type Storage = {
  // Define storage properties if needed
  // For example: canvasObjects: LiveObject<CanvasObject[]>;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
  };
};

type RoomEvent = {
  // Define room events if needed
  // For example: type: "SHAPE_CREATED";
};

// Create the client with proper fallback
const apiKey = import.meta.env.PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_prod_AYSG44fe_rqa58ry7eAipRHqAS9AxPT82wZLfE0MGHtAYVHpatyZFOuuBxo6adXk";

if (!apiKey) {
  throw new Error("Liveblocks API key is required. Please set PUBLIC_LIVEBLOCKS_PUBLIC_KEY in your environment variables.");
}

export const client = createClient({
  publicApiKey: apiKey,
});

// Create the room context with proper types
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useThreads,
  useCreateThread,
  useEditThreadMetadata,
  useCreateComment,
  useEditComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
