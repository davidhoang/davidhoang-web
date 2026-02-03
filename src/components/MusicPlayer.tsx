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
  const [volume, setVolume] = useState(75);
  const [balance, setBalance] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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

  // Playback handler functions
  const handlePlay = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (!audioRef.current.src || audioRef.current.readyState < 2) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            audioRef.current?.removeEventListener('canplay', handleCanPlay);
            resolve(undefined);
          };
          audioRef.current?.addEventListener('canplay', handleCanPlay);
          setTimeout(resolve, 1000);
        });
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setIsPaused(false);
      }
    } catch (error) {
      console.error('🎵 Playback error:', error);
      setIsPlaying(false);
      if ((error as any).name === 'NotAllowedError') {
        console.warn('🎵 Autoplay blocked. User interaction required.');
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Navigation handler functions
  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      goToTrack(currentTrackIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < playlist.length - 1) {
      goToTrack(currentTrackIndex + 1);
    }
  };

  const handleEject = () => {
    setShowPlaylist(!showPlaylist);
    localStorage.setItem('music-player-show-pl', (!showPlaylist).toString());
  };

  // Seek slider handlers
  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSeekPosition(value);
  };

  const handleSeekEnd = () => {
    if (!audioRef.current || !duration) {
      setIsSeeking(false);
      return;
    }

    const newTime = (seekPosition / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setIsSeeking(false);
  };

  // Volume and balance handlers
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }

    localStorage.setItem('music-player-volume', newVolume.toString());
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBalance = parseInt(e.target.value);
    setBalance(newBalance);
    localStorage.setItem('music-player-balance', newBalance.toString());
  };

  // Initialize audio context and analyser for spectrum
  // Deferred until first play to reduce main thread work on page load
  useEffect(() => {
    if (!audioRef.current || !isHydrated || !isPlaying) return;

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
          animationFrameRef.current = null;
        }
        // Don't disconnect source or close context here - reuse them
        // Only cleanup on component unmount
      };
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  }, [isPlaying, currentTrack, isHydrated]);

  // Cleanup on component unmount - cancel RAF and close audio context
  useEffect(() => {
    return () => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Close audio context to free resources
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, []);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);

    // Don't restore visibility - always start collapsed by default
    const savedTrackIndex = localStorage.getItem('music-player-track-index');
    const savedIsPlaying = localStorage.getItem('music-player-is-playing');
    const savedShowEqualizer = localStorage.getItem('music-player-show-eq');
    const savedShowPlaylist = localStorage.getItem('music-player-show-pl');
    const savedPosition = localStorage.getItem('music-player-position');
    const savedVolume = localStorage.getItem('music-player-volume');
    const savedBalance = localStorage.getItem('music-player-balance');

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
    if (savedVolume !== null) {
      setVolume(parseInt(savedVolume));
    }
    if (savedBalance !== null) {
      setBalance(parseInt(savedBalance));
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isHydrated || !isVisible) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if player is visible and no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case 'x':
          handlePlay();
          break;
        case 'c':
          handlePause();
          break;
        case 'v':
          handleStop();
          break;
        case 'b':
          handleNext();
          break;
        case 'z':
          handlePrevious();
          break;
        case 'l':
          setShowPlaylist(!showPlaylist);
          localStorage.setItem('music-player-show-pl', (!showPlaylist).toString());
          break;
        case 'g':
          setShowEqualizer(!showEqualizer);
          localStorage.setItem('music-player-show-eq', (!showEqualizer).toString());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHydrated, isVisible, isPlaying, currentTrackIndex, showPlaylist, showEqualizer]);

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

      // Auto-advance to next track if available
      if (currentTrackIndex < playlist.length - 1) {
        const nextIndex = currentTrackIndex + 1;
        setCurrentTrackIndex(nextIndex);
        localStorage.setItem('music-player-track-index', nextIndex.toString());

        // Auto-play next track
        setTimeout(() => {
          if (audioRef.current && playlist[nextIndex]) {
            audioRef.current.src = playlist[nextIndex].url;
            audioRef.current.load();
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(err => {
              console.error('Auto-play failed:', err);
            });
          }
        }, 100);
      }
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
  }, [isHydrated, currentTrackIndex, playlist]);

  // Initialize audio when track changes
  useEffect(() => {
    if (!isHydrated || !audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Set up audio element
    audio.src = currentTrack.url;
    audio.volume = volume / 100; // Use state volume
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
          {/* Enhanced Time Display with LED styling */}
          <div className="winamp-time-container">
            <div className="winamp-time-display">
              {formatTime(currentTime).split('').map((char, i) => (
                <span key={i} className={`winamp-digit ${char === ':' ? 'colon' : ''}`}>
                  {char}
                </span>
              ))}
            </div>
            <div className="winamp-time-remaining">
              -{formatTime(duration - currentTime)}
            </div>
          </div>

          {/* Seek/Position Slider */}
          <div className="winamp-seek-container">
            <input
              type="range"
              min="0"
              max="100"
              value={isSeeking ? seekPosition : (duration > 0 ? (currentTime / duration) * 100 : 0)}
              onChange={handleSeekChange}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className="winamp-seek-slider"
              disabled={!currentTrack || duration === 0}
            />
            <div
              className="winamp-seek-progress"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Track Info with Marquee */}
          <div className="winamp-track-info-container">
            <div className="winamp-track-info">
              <span className="winamp-track-scrolling">
                {currentTrackIndex + 1}. {currentTrack?.artist || 'Unknown'} - {currentTrack?.title || 'No track'}
              </span>
            </div>
            <div className="winamp-bitrate-display">
              <span className="winamp-bitrate">128</span>
              <span className="winamp-khz">48</span>
            </div>
          </div>

          {/* Spectrum Analyzer */}
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

          {/* Volume and Balance Controls */}
          <div className="winamp-volume-balance-container">
            <div className="winamp-volume-control">
              <label className="winamp-label">VOL</label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="winamp-volume-slider"
                aria-label="Volume"
              />
              <span className="winamp-volume-display">{volume}</span>
            </div>

            <div className="winamp-balance-control">
              <label className="winamp-label">BAL</label>
              <input
                type="range"
                min="-100"
                max="100"
                value={balance}
                onChange={handleBalanceChange}
                className="winamp-balance-slider"
                aria-label="Balance"
              />
              <span className="winamp-balance-display">
                {balance === 0 ? 'C' : balance < 0 ? `L${Math.abs(balance)}` : `R${balance}`}
              </span>
            </div>
          </div>

          {/* Mode Buttons */}
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

          {/* Toggle Buttons */}
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
          <button
            className="winamp-control-btn"
            onClick={handlePrevious}
            title="Previous Track (Z)"
            aria-label="Previous Track"
            disabled={currentTrackIndex === 0}
          >
            ⏮
          </button>

          <button
            className="winamp-control-btn"
            onClick={handlePlay}
            title="Play (X)"
            aria-label="Play"
          >
            ▶
          </button>

          <button
            className="winamp-control-btn"
            onClick={handlePause}
            title="Pause (C)"
            aria-label="Pause"
            disabled={!isPlaying}
          >
            ⏸
          </button>

          <button
            className="winamp-control-btn"
            onClick={handleStop}
            title="Stop (V)"
            aria-label="Stop"
          >
            ■
          </button>

          <button
            className="winamp-control-btn"
            onClick={handleNext}
            title="Next Track (B)"
            aria-label="Next Track"
            disabled={currentTrackIndex >= playlist.length - 1}
          >
            ⏭
          </button>

          <button
            className="winamp-control-btn"
            onClick={handleEject}
            title="Eject / Toggle Playlist (L)"
            aria-label="Toggle Playlist"
          >
            ⏏
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
