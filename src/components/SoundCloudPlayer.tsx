import React, { useState, useEffect, useRef } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

interface MusicPlayerProps {
  className?: string;
}

// 🎵 PLAYLIST MANAGEMENT - Add your songs here! 🎵
const PLAYLIST_DATA: Track[] = [
  {
    id: '1',
    title: 'LAX',
    artist: 'Tom Rothrock',
    url: '/audio/Tom_Rothrock_-_LAX_(Rilds.com).mp3'
  },
  // Add more tracks here:
  // {
  //   id: '2',
  //   title: 'Your Song Title',
  //   artist: 'Artist Name',
  //   url: '/audio/your-song.mp3'
  // },
];

const MusicPlayer: React.FC<MusicPlayerProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlist, setPlaylist] = useState<Track[]>(PLAYLIST_DATA);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = playlist[currentTrackIndex];

  // Format time helper
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
    
    // Only load from localStorage after hydration
    const savedExpanded = localStorage.getItem('music-player-expanded');
    const savedVisible = localStorage.getItem('music-player-visible');
    const savedTrackIndex = localStorage.getItem('music-player-track-index');
    
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true');
    }
    if (savedVisible !== null) {
      setIsVisible(savedVisible === 'true');
    }
    if (savedTrackIndex !== null) {
      setCurrentTrackIndex(parseInt(savedTrackIndex));
    }
  }, []);

  // Save state to localStorage
  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem('music-player-expanded', newExpanded.toString());
  };

  const toggleVisible = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    localStorage.setItem('music-player-visible', newVisible.toString());
  };

  const goToTrack = (index: number) => {
    setCurrentTrackIndex(index);
    localStorage.setItem('music-player-track-index', index.toString());
    setIsPlaying(false); // Stop current track
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    goToTrack(nextIndex);
  };

  const prevTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    goToTrack(prevIndex);
  };

  // Control music player
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('🎵 Play failed:', error);
        });
      }
    }
  };

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next track
      nextTrack();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  // Initialize audio when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Handle view transitions for persistent playback
  useEffect(() => {
    const handleBeforePreparation = () => {
      // Save current track and playing state
      localStorage.setItem('music-player-current-track', currentTrackIndex.toString());
      localStorage.setItem('music-player-is-playing', isPlaying.toString());
    };

    const handleAfterSwap = () => {
      // Restore track and playing state
      const savedTrackIndex = localStorage.getItem('music-player-current-track');
      const savedIsPlaying = localStorage.getItem('music-player-is-playing');
      
      if (savedTrackIndex !== null) {
        setCurrentTrackIndex(parseInt(savedTrackIndex));
      }
      if (savedIsPlaying !== null) {
        setIsPlaying(savedIsPlaying === 'true');
      }
    };

    document.addEventListener('astro:before-preparation', handleBeforePreparation);
    document.addEventListener('astro:after-swap', handleAfterSwap);

    return () => {
      document.removeEventListener('astro:before-preparation', handleBeforePreparation);
      document.removeEventListener('astro:after-swap', handleAfterSwap);
    };
  }, [currentTrackIndex, isPlaying]);

  if (!isHydrated) {
    return (
      <div className={`music-player collapsed ${className}`}>
        <div className="music-player-bar">
          <div className="track-info">
            <div className="track-details">
              <div className="track-title">Loading...</div>
              <div className="track-artist">Please wait</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className={`music-player-minimized ${className}`}>
        <button 
          className="music-player-toggle-btn"
          onClick={toggleVisible}
          aria-label="Open music player"
          title="Open music player"
        >
          🎵
        </button>
      </div>
    );
  }

  return (
    <div className={`music-player ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
      />

      {/* Horizontal Player Bar */}
      <div className="music-player-bar">
        {/* Track Info */}
        <div className="track-info">
          <div className="track-details">
            <div className="track-title">{currentTrack?.title || 'No track'}</div>
            <div className="track-artist">{currentTrack?.artist || 'Unknown'}</div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="player-controls">
          <button className="control-btn shuffle-btn" aria-label="Shuffle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          
          <button className="control-btn prev-btn" onClick={prevTrack} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button className="control-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {isPlaying ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              ) : (
                <path d="M8 5v14l11-7z"/>
              )}
            </svg>
          </button>
          
          <button className="control-btn next-btn" onClick={nextTrack} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          
          <button className="control-btn repeat-btn" aria-label="Repeat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <span className="time current-time">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleProgressClick}>
            <div 
              className="progress-fill" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="time total-time">{formatTime(duration)}</span>
        </div>

        {/* Expand/Collapse Button */}
        <button 
          className="control-btn expand-btn"
          onClick={toggleExpanded}
          aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
          title={isExpanded ? 'Collapse player' : 'Expand player'}
        >
          {isExpanded ? '−' : '+'}
        </button>

        {/* Close Button */}
        <button 
          className="control-btn close-btn"
          onClick={toggleVisible}
          aria-label="Close player"
          title="Close player"
        >
          ×
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="music-player-content">
          {/* Current Track Info */}
          <div className="current-track-info">
            <h3>Now Playing</h3>
            <div className="track-details-large">
              <div className="track-title-large">{currentTrack?.title}</div>
              <div className="track-artist-large">{currentTrack?.artist}</div>
              <div className="track-type">📁 Local MP3</div>
            </div>
            <div className="audio-info">
              <p>Format: MP3</p>
              <p>Duration: {formatTime(duration)}</p>
              <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
            </div>
          </div>

          {/* Playlist Display */}
          <div className="playlist-section">
            <div className="playlist-header">
              <h3>Playlist ({playlist.length} tracks)</h3>
            </div>

            {/* Playlist */}
            <div className="playlist-tracks">
              {playlist.map((track, index) => (
                <div 
                  key={track.id} 
                  className={`playlist-track ${index === currentTrackIndex ? 'current' : ''}`}
                  onClick={() => goToTrack(index)}
                >
                  <div className="track-info">
                    <span className="track-number">{index + 1}</span>
                    <div className="track-details">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.artist}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
