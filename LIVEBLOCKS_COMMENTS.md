# Liveblocks Comments Implementation

This implementation provides real-time commenting functionality using Liveblocks for your Astro site.

## Features

- ✅ Real-time comments using Liveblocks
- ✅ Thread-based commenting system
- ✅ Error handling and loading states
- ✅ Proper TypeScript support
- ✅ Responsive design
- ✅ Integration with Astro's React support

## Usage

### Basic Usage

The comments system is already integrated into your blog posts. Each blog post automatically gets its own comment room based on the post title:

```astro
<!-- In BlogPost.astro -->
<CommentsSection roomId={roomId} />
```

### Manual Usage

To add comments to any page, import and use the CommentsSection component:

```astro
---
import CommentsSection from '../components/CommentsSection.astro';
---

<CommentsSection roomId="unique-room-id" />
```

### Room ID Strategy

The room ID should be unique for each page or content piece where you want comments. Current implementation uses:

- **Blog posts**: Generated from post title (lowercase, hyphenated)
- **Manual usage**: Pass any unique string identifier

## Configuration

### API Key

The Liveblocks API key is configured in `liveblocks.config.ts`:

```typescript
export const client = createClient({
  publicApiKey: "pk_prod_AYSG44fe_rqa58ry7eAipRHqAS9AxPT82wZLfE0MGHtAYVHpatyZFOuuBxo6adXk",
});
```

### Types

TypeScript types are defined in `liveblocks.config.ts` for:
- `Presence`: User presence data
- `Storage`: Room storage data  
- `UserMeta`: User metadata
- `RoomEvent`: Room events

## Components

### Comments.tsx
- Main React component handling Liveblocks integration
- Uses `useThreads` hook to manage comment threads
- Includes error handling and loading states
- Client-side only rendering to prevent hydration issues

### CommentsSection.astro
- Astro wrapper component
- Handles styling and layout
- Passes roomId to the React component

## Styling

The component includes comprehensive CSS styling for:
- Comment composer
- Comment threads
- Loading states
- Error states
- Liveblocks UI customization

All styles are scoped to prevent conflicts with your existing CSS.

## Next Steps

1. **Authentication**: Add user authentication to show user names and avatars
2. **Moderation**: Implement comment moderation features
3. **Notifications**: Add email notifications for new comments
4. **Customization**: Further customize the UI to match your design system

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors, ensure you have the required type packages:
```bash
npm install --save-dev @types/react @types/react-dom
```

### Comments Not Loading
- Check your Liveblocks API key
- Ensure the room ID is unique
- Check browser console for errors
- Verify network connectivity

### Styling Issues
- Check that Liveblocks CSS is imported: `@liveblocks/react-ui/styles.css`
- Verify CSS specificity with your existing styles
- Use browser dev tools to inspect component structure
