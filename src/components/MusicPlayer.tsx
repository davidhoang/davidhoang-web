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
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlist, setPlaylist] = useState<Track[]>(PLAYLIST_DATA);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isStereo, setIsStereo] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [equalizerOn, setEqualizerOn] = useState(false);
  const [preamp, setPreamp] = useState(0);
  const [frequencies, setFrequencies] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [spectrumData, setSpectrumData] = useState<number[]>(Array(20).fill(0));
  const [position, setPosition] = useState({ left: 0, bottom: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const currentTrack = playlist[currentTrackIndex];

  // Format time helper
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize audio context and analyser for spectrum
  useEffect(() => {
    if (!audioRef.current || !isHydrated) return;

    // Reuse existing audio context if available
    let audioContext = audioContextRef.current;
    let analyser = analyserRef.current;
    let source: MediaElementAudioSourceNode | null = null;

    try {
      // Create new audio context if needed
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
      }

      // Resume audio context if suspended (required by browser autoplay policies)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch((err) => {
          console.warn('Audio context resume failed:', err);
        });
      }

      // Create analyser if needed
      if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
      }

      // Create source only if we don't have one already
      // Note: createMediaElementSource can only be called once per audio element
      if (!sourceRef.current) {
        try {
          source = audioContext.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          sourceRef.current = source;
        } catch (sourceError: any) {
          console.warn('Audio source creation failed:', sourceError);
        }
      } else {
        source = sourceRef.current;
      }

      // Update spectrum data
      const updateSpectrum = () => {
        if (!analyser) return;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Convert to 20 bars for visualization
        const bars: number[] = [];
        for (let i = 0; i < 20; i++) {
          const index = Math.floor((i / 20) * dataArray.length);
          bars.push(dataArray[index] / 255);
        }
        setSpectrumData(bars);
        
        if (isPlaying && audioRef.current && !audioRef.current.paused) {
          animationFrameRef.current = requestAnimationFrame(updateSpectrum);
        }
      };
      
      if (isPlaying && audioRef.current && !audioRef.current.paused) {
        updateSpectrum();
      }

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        // Don't disconnect source or close context here - reuse them
        // Only cleanup on component unmount
      };
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  }, [isPlaying, currentTrack, isHydrated]);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Don't restore visibility - always start collapsed by default
    const savedTrackIndex = localStorage.getItem('music-player-track-index');
    const savedIsPlaying = localStorage.getItem('music-player-is-playing');
    const savedShowEqualizer = localStorage.getItem('music-player-show-eq');
    const savedShowPlaylist = localStorage.getItem('music-player-show-pl');
    const savedPosition = localStorage.getItem('music-player-position');
    
    // Always start collapsed - don't restore visibility state
    setIsVisible(false);
    
    if (savedTrackIndex !== null) {
      setCurrentTrackIndex(parseInt(savedTrackIndex));
    }
    if (savedIsPlaying !== null) {
      setIsPlaying(savedIsPlaying === 'true');
    }
    if (savedShowEqualizer !== null) {
      setShowEqualizer(savedShowEqualizer === 'true');
    }
    if (savedShowPlaylist !== null) {
      setShowPlaylist(savedShowPlaylist === 'true');
    }
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch (e) {
        // Use default position
      }
    }
  }, []);

  // Save state to localStorage
  const toggleVisible = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    localStorage.setItem('music-player-visible', newVisible.toString());
  };

  const goToTrack = (index: number) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setCurrentTrackIndex(index);
    setIsPlaying(false);
    localStorage.setItem('music-player-track-index', index.toString());
  };

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure audio is loaded before playing
        if (!audioRef.current.src || audioRef.current.readyState < 2) {
          audioRef.current.src = currentTrack.url;
          audioRef.current.load();
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve(undefined);
            };
            audioRef.current?.addEventListener('canplay', handleCanPlay);
            // Fallback timeout
            setTimeout(resolve, 1000);
          });
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('🎵 Playback error:', error);
      setIsPlaying(false);
      // If autoplay is blocked, show a message or handle gracefully
      if ((error as any).name === 'NotAllowedError') {
        console.warn('🎵 Autoplay blocked. User interaction required.');
      }
    }
  };

  const handleFrequencyChange = (index: number, value: number) => {
    const newFrequencies = [...frequencies];
    newFrequencies[index] = value;
    setFrequencies(newFrequencies);
    // Note: HTML5 audio doesn't support equalizer directly, this is visual only
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && playerRef.current) {
        const newLeft = e.clientX - dragOffset.x;
        const newTop = e.clientY - dragOffset.y;
        
        // Constrain to viewport
        const maxLeft = window.innerWidth - playerRef.current.offsetWidth;
        const maxTop = window.innerHeight - playerRef.current.offsetHeight;
        
        const constrainedLeft = Math.max(0, Math.min(newLeft, maxLeft));
        const constrainedTop = Math.max(0, Math.min(newTop, maxTop));
        
        // Convert top to bottom for positioning
        const constrainedBottom = window.innerHeight - constrainedTop - playerRef.current.offsetHeight;
        
        setPosition({
          left: constrainedLeft,
          bottom: Math.max(0, constrainedBottom)
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save position to localStorage
        if (playerRef.current) {
          const rect = playerRef.current.getBoundingClientRect();
          const savedPosition = {
            left: rect.left,
            bottom: window.innerHeight - rect.bottom
          };
          localStorage.setItem('music-player-position', JSON.stringify(savedPosition));
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // Handle audio events
  useEffect(() => {
    if (!isHydrated) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Simply stop when track ends
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
  }, [isHydrated]);

  // Initialize audio when track changes
  useEffect(() => {
    if (!isHydrated || !audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Set up audio element
    audio.src = currentTrack.url;
    audio.volume = 0.75; // Default volume
    audio.preload = 'metadata';
    
    // Load the audio
    audio.load();
    
    // Handle errors
    const handleError = (e: Event) => {
      console.error('🎵 Audio error:', e);
      setIsPlaying(false);
    };
    
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, isHydrated]);

  if (!isHydrated) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className={`winamp-minimized ${className}`}>
        <button 
          className="winamp-toggle-btn"
          onClick={toggleVisible}
          aria-label="Open Winamp"
          title="Open Winamp"
        >
          WINAMP
        </button>
      </div>
    );
  }

  const freqLabels = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];
  const totalPlaylistTime = playlist.reduce((sum, track) => {
    // Approximate duration - in real implementation, you'd get this from metadata
    return sum + 180; // 3 minutes average
  }, 0);

  return (
    <div 
      ref={playerRef}
      className={`winamp-player ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.left || undefined,
        bottom: position.bottom || undefined,
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
      />

      {/* Main Player Window */}
      <div className="winamp-main">
        <div 
          className="winamp-titlebar"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="winamp-logo">OAIDU</span>
          <span className="winamp-title">WINAMP</span>
          <div 
            className="winamp-window-controls"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="winamp-btn-minimize" onClick={() => setIsVisible(false)}>−</button>
            <button className="winamp-btn-close" onClick={() => setIsVisible(false)}>×</button>
          </div>
        </div>

        <div className="winamp-display">
          <div className="winamp-time-display">{formatTime(currentTime)}</div>
          <div className="winamp-track-info">
            {currentTrackIndex + 1}. {currentTrack?.artist || 'Unknown'} - {currentTrack?.title || 'No track'} &lt;{formatTime(duration)}&gt;
          </div>
          <div className="winamp-spectrum">
            {spectrumData.map((value, i) => (
              <div
                key={i}
                className="winamp-spectrum-bar"
                style={{
                  height: `${value * 100}%`,
                  backgroundColor: value > 0.7 ? '#ff0000' : value > 0.4 ? '#ff8800' : '#00ff00'
                }}
              />
            ))}
          </div>
          <div className="winamp-audio-info">
            <span>128 kbps</span>
            <span>48 kHz</span>
          </div>
          <div className="winamp-mode-buttons">
            <button 
              className={`winamp-mode-btn ${!isStereo ? 'active' : ''}`}
              onClick={() => setIsStereo(false)}
            >
              mono
            </button>
            <button 
              className={`winamp-mode-btn ${isStereo ? 'active' : ''}`}
              onClick={() => setIsStereo(true)}
            >
              stereo
            </button>
          </div>
          <div className="winamp-toggle-buttons">
            <button 
              className={`winamp-toggle-btn ${showEqualizer ? 'active' : ''}`}
              onClick={() => {
                setShowEqualizer(!showEqualizer);
                localStorage.setItem('music-player-show-eq', (!showEqualizer).toString());
              }}
            >
              EQ
            </button>
            <button 
              className={`winamp-toggle-btn ${showPlaylist ? 'active' : ''}`}
              onClick={() => {
                setShowPlaylist(!showPlaylist);
                localStorage.setItem('music-player-show-pl', (!showPlaylist).toString());
              }}
            >
              PL
            </button>
          </div>
        </div>

        <div className="winamp-controls">
          <button className="winamp-control-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? '||' : '▶'}
          </button>
          <button className="winamp-control-btn" onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              setIsPlaying(false);
            }
          }} title="Stop">
            ■
          </button>
        </div>
      </div>

      {/* Equalizer Window */}
      {showEqualizer && (
        <div className="winamp-equalizer">
          <div className="winamp-titlebar">
            <span className="winamp-title">WINAMP EQUALIZER</span>
          </div>
          <div className="winamp-eq-controls">
            <button 
              className={`winamp-eq-btn ${equalizerOn ? 'active' : ''}`}
              onClick={() => setEqualizerOn(!equalizerOn)}
            >
              ON
            </button>
            <button className="winamp-eq-btn">AUTO</button>
            <button className="winamp-eq-btn">PRESETS</button>
          </div>
          <div className="winamp-eq-sliders">
            <div className="winamp-eq-scale">
              {[20, 10, 0, -10, -20].map((db) => (
                <div key={db} className="winamp-eq-scale-label">{db > 0 ? '+' : ''}{db}db</div>
              ))}
            </div>
            <div className="winamp-eq-slider-group">
              <div className="winamp-eq-slider-container">
                <label>PREAMP</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={preamp}
                  onChange={(e) => setPreamp(parseInt(e.target.value))}
                  className="winamp-eq-slider"
                  data-orient="vertical"
                />
              </div>
              {freqLabels.map((label, index) => (
                <div key={index} className="winamp-eq-slider-container">
                  <label>{label}</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={frequencies[index]}
                    onChange={(e) => handleFrequencyChange(index, parseInt(e.target.value))}
                    className="winamp-eq-slider"
                    data-orient="vertical"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Playlist Window */}
      {showPlaylist && (
        <div className="winamp-playlist">
          <div className="winamp-titlebar">
            <span className="winamp-title">WINAMP PLAYLIST</span>
          </div>
          <div className="winamp-playlist-content">
            <div className="winamp-playlist-tracks">
              {playlist.map((track, index) => (
                <div
                  key={track.id}
                  className={`winamp-playlist-track ${index === currentTrackIndex ? 'active' : ''}`}
                  onClick={() => goToTrack(index)}
                >
                  {index + 1}. {track.artist} - {track.title}
                </div>
              ))}
            </div>
            <div className="winamp-playlist-controls">
              <button className="winamp-playlist-btn">+ FILE</button>
              <button className="winamp-playlist-btn">- FILE</button>
              <button className="winamp-playlist-btn">SEL ALL</button>
              <button className="winamp-playlist-btn">FILE INF</button>
            </div>
            <div className="winamp-playlist-summary">
              {formatTime(currentTime)} / {formatTime(totalPlaylistTime)}+
            </div>
            <div className="winamp-playlist-bottom">
              <button className="winamp-playlist-btn">LOAD LIST</button>
              <div className="winamp-mini-controls">
                <button className="winamp-mini-btn" onClick={togglePlay}>{isPlaying ? '||' : '▶'}</button>
                <button className="winamp-mini-btn" onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setIsPlaying(false);
                  }
                }}>■</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
