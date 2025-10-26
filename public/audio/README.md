# Music Player Audio Files

This directory contains MP3 files for the music player component.

## Adding Music Files

1. **Place MP3 files** in this directory (`/public/audio/`)
2. **Update the playlist** in `/src/components/MusicPlayer.tsx`:

```typescript
const PLAYLIST_DATA: Track[] = [
  {
    id: '1',
    title: 'LAX',
    artist: 'Tom Rothrock',
    url: '/audio/Tom_Rothrock_-_LAX_(Rilds.com).mp3'
  },
  {
    id: '2',
    title: 'Your Song Title',
    artist: 'Artist Name',
    url: '/audio/your-song.mp3'
  },
  // Add more tracks here...
];
```

## File Requirements

- **Format**: MP3 files only
- **Naming**: Use descriptive filenames (avoid spaces, use underscores)
- **Size**: Keep files reasonably sized for web performance
- **Rights**: Ensure you have rights to use the music files

## Example

```
/public/audio/
├── Tom_Rothrock_-_LAX_(Rilds.com).mp3
├── your_song_title.mp3
└── another_track.mp3
```

The music player will automatically load and play these files when users interact with the player.