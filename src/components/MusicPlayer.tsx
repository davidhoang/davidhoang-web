import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

interface MusicPlayerProps {
  className?: string;
}

const PLAYLIST_DATA: Track[] = [
  {
    id: '1',
    title: 'LAX',
    artist: 'Tom Rothrock',
    url: '/audio/Tom_Rothrock_-_LAX_(Rilds.com).mp3'
  },
];

const MusicPlayer: React.FC<MusicPlayerProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isStereo, setIsStereo] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [equalizerOn, setEqualizerOn] = useState(false);
  const [preamp, setPreamp] = useState(0);
  const [frequencies, setFrequencies] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [position, setPosition] = useState({ left: 0, bottom: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [volume, setVolume] = useState(75);
  const [balance, setBalance] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const spectrumBarsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Refs for stable callback access (avoids stale closures)
  const isPlayingRef = useRef(isPlaying);
  const currentTrackIndexRef = useRef(currentTrackIndex);
  const showPlaylistRef = useRef(showPlaylist);
  const showEqualizerRef = useRef(showEqualizer);
  const volumeRef = useRef(volume);

  isPlayingRef.current = isPlaying;
  currentTrackIndexRef.current = currentTrackIndex;
  showPlaylistRef.current = showPlaylist;
  showEqualizerRef.current = showEqualizer;
  volumeRef.current = volume;

  const playlist = PLAYLIST_DATA;
  const currentTrack = playlist[currentTrackIndex];

  // Format time helper
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ensure audio is loaded, then play
  const loadAndPlay = useCallback(async () => {
    if (!audioRef.current) return;
    const track = playlist[currentTrackIndexRef.current];
    if (!track) return;

    try {
      if (audioRef.current.src !== new URL(track.url, window.location.origin).href || audioRef.current.readyState < 2) {
        audioRef.current.src = track.url;
        audioRef.current.volume = volumeRef.current / 100;
        audioRef.current.load();
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            audioRef.current?.removeEventListener('canplay', onCanPlay);
            resolve();
          };
          audioRef.current?.addEventListener('canplay', onCanPlay);
          setTimeout(resolve, 1000);
        });
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    }
  }, [playlist]);

  const handlePlay = useCallback(() => loadAndPlay(), [loadAndPlay]);

  const handlePause = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const goToTrack = useCallback((index: number) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setCurrentTrackIndex(index);
    setIsPlaying(false);
    localStorage.setItem('music-player-track-index', index.toString());
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentTrackIndexRef.current > 0) {
      goToTrack(currentTrackIndexRef.current - 1);
    }
  }, [goToTrack]);

  const handleNext = useCallback(() => {
    if (currentTrackIndexRef.current < playlist.length - 1) {
      goToTrack(currentTrackIndexRef.current + 1);
    }
  }, [goToTrack, playlist.length]);

  const handleEject = useCallback(() => {
    const newVal = !showPlaylistRef.current;
    setShowPlaylist(newVal);
    localStorage.setItem('music-player-show-pl', newVal.toString());
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlayingRef.current) {
      handlePause();
    } else {
      await loadAndPlay();
    }
  }, [handlePause, loadAndPlay]);

  // Seek slider handlers
  const handleSeekStart = () => setIsSeeking(true);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekPosition(parseFloat(e.target.value));
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

  // Spectrum analyzer — update DOM directly via refs instead of setState
  useEffect(() => {
    if (!audioRef.current || !isHydrated || !isPlaying) return;

    let audioContext = audioContextRef.current;
    let analyser = analyserRef.current;

    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
      }

      if (!sourceRef.current) {
        try {
          const source = audioContext.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          sourceRef.current = source;
        } catch (e) {
          console.warn('Audio source creation failed:', e);
        }
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateSpectrum = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);

        // Update DOM directly — no setState, no re-render
        for (let i = 0; i < 20; i++) {
          const bar = spectrumBarsRef.current[i];
          if (!bar) continue;
          const index = Math.floor((i / 20) * dataArray.length);
          const value = dataArray[index] / 255;
          bar.style.height = `${value * 100}%`;
          bar.style.backgroundColor = value > 0.7 ? '#ff0000' : value > 0.4 ? '#ff8800' : '#00ff00';
        }

        if (isPlayingRef.current && audioRef.current && !audioRef.current.paused) {
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
      };
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  }, [isPlaying, isHydrated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Hydration — restore saved state
  useEffect(() => {
    setIsHydrated(true);
    setIsVisible(false);

    const savedTrackIndex = localStorage.getItem('music-player-track-index');
    const savedShowEqualizer = localStorage.getItem('music-player-show-eq');
    const savedShowPlaylist = localStorage.getItem('music-player-show-pl');
    const savedPosition = localStorage.getItem('music-player-position');
    const savedVolume = localStorage.getItem('music-player-volume');
    const savedBalance = localStorage.getItem('music-player-balance');

    if (savedTrackIndex !== null) {
      setCurrentTrackIndex(parseInt(savedTrackIndex));
    }
    if (savedShowEqualizer !== null) {
      setShowEqualizer(savedShowEqualizer === 'true');
    }
    if (savedShowPlaylist !== null) {
      setShowPlaylist(savedShowPlaylist === 'true');
    }
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch {}
    }
    if (savedVolume !== null) {
      const vol = parseInt(savedVolume);
      setVolume(vol);
      // Apply saved volume to audio element immediately
      if (audioRef.current) {
        audioRef.current.volume = vol / 100;
      }
    }
    if (savedBalance !== null) {
      setBalance(parseInt(savedBalance));
    }
  }, []);

  // Save visibility state
  const toggleVisible = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    localStorage.setItem('music-player-visible', newVisible.toString());
  };

  const handleFrequencyChange = (index: number, value: number) => {
    const newFrequencies = [...frequencies];
    newFrequencies[index] = value;
    setFrequencies(newFrequencies);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && playerRef.current) {
        const newLeft = e.clientX - dragOffset.x;
        const newTop = e.clientY - dragOffset.y;
        const maxLeft = window.innerWidth - playerRef.current.offsetWidth;
        const maxTop = window.innerHeight - playerRef.current.offsetHeight;
        const constrainedLeft = Math.max(0, Math.min(newLeft, maxLeft));
        const constrainedTop = Math.max(0, Math.min(newTop, maxTop));
        const constrainedBottom = window.innerHeight - constrainedTop - playerRef.current.offsetHeight;

        setPosition({ left: constrainedLeft, bottom: Math.max(0, constrainedBottom) });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (playerRef.current) {
          const rect = playerRef.current.getBoundingClientRect();
          localStorage.setItem('music-player-position', JSON.stringify({
            left: rect.left,
            bottom: window.innerHeight - rect.bottom
          }));
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // Keyboard shortcuts — uses refs so handlers are always current
  useEffect(() => {
    if (!isHydrated || !isVisible) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'x': handlePlay(); break;
        case 'c': handlePause(); break;
        case 'v': handleStop(); break;
        case 'b': handleNext(); break;
        case 'z': handlePrevious(); break;
        case 'l': handleEject(); break;
        case 'g': {
          const newVal = !showEqualizerRef.current;
          setShowEqualizer(newVal);
          localStorage.setItem('music-player-show-eq', newVal.toString());
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHydrated, isVisible, handlePlay, handlePause, handleStop, handleNext, handlePrevious, handleEject]);

  // Audio event listeners
  useEffect(() => {
    if (!isHydrated) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      const idx = currentTrackIndexRef.current;
      if (idx < playlist.length - 1) {
        const nextIndex = idx + 1;
        setCurrentTrackIndex(nextIndex);
        localStorage.setItem('music-player-track-index', nextIndex.toString());
        // Auto-play next track
        setTimeout(() => {
          if (audioRef.current && playlist[nextIndex]) {
            audioRef.current.src = playlist[nextIndex].url;
            audioRef.current.volume = volumeRef.current / 100;
            audioRef.current.load();
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }, 100);
      }
    };
    const onError = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [isHydrated, playlist]);

  if (!isHydrated) return null;

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

  return (
    <div
      ref={playerRef}
      className={`winamp-player ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.left || undefined,
        bottom: position.bottom || undefined,
      }}
    >
      <audio ref={audioRef} preload="none" style={{ display: 'none' }} />

      {/* Main Player Window */}
      <div className="winamp-main">
        <div
          className="winamp-titlebar"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="winamp-logo">OAIDU</span>
          <span className="winamp-title">WINAMP</span>
          <div className="winamp-window-controls" onMouseDown={(e) => e.stopPropagation()}>
            <button className="winamp-btn-minimize" onClick={() => setIsVisible(false)}>−</button>
            <button className="winamp-btn-close" onClick={() => setIsVisible(false)}>×</button>
          </div>
        </div>

        <div className="winamp-display">
          {/* Time Display */}
          <div className="winamp-time-container">
            <div className="winamp-time-display">
              {formatTime(currentTime).split('').map((char, i) => (
                <span key={i} className={`winamp-digit ${char === ':' ? 'colon' : ''}`}>{char}</span>
              ))}
            </div>
            <div className="winamp-time-remaining">-{formatTime(duration - currentTime)}</div>
          </div>

          {/* Seek Slider */}
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

          {/* Track Info */}
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

          {/* Spectrum Analyzer — DOM-ref driven, no re-renders */}
          <div className="winamp-spectrum">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                ref={(el) => { spectrumBarsRef.current[i] = el; }}
                className="winamp-spectrum-bar"
                style={{ height: '2px', backgroundColor: '#00ff00' }}
              />
            ))}
          </div>

          {/* Volume and Balance */}
          <div className="winamp-volume-balance-container">
            <div className="winamp-volume-control">
              <label className="winamp-label">VOL</label>
              <input
                type="range" min="0" max="100" value={volume}
                onChange={handleVolumeChange}
                className="winamp-volume-slider" aria-label="Volume"
              />
              <span className="winamp-volume-display">{volume}</span>
            </div>
            <div className="winamp-balance-control">
              <label className="winamp-label">BAL</label>
              <input
                type="range" min="-100" max="100" value={balance}
                onChange={handleBalanceChange}
                className="winamp-balance-slider" aria-label="Balance"
              />
              <span className="winamp-balance-display">
                {balance === 0 ? 'C' : balance < 0 ? `L${Math.abs(balance)}` : `R${balance}`}
              </span>
            </div>
          </div>

          {/* Mode Buttons */}
          <div className="winamp-mode-buttons">
            <button className={`winamp-mode-btn ${!isStereo ? 'active' : ''}`} onClick={() => setIsStereo(false)}>mono</button>
            <button className={`winamp-mode-btn ${isStereo ? 'active' : ''}`} onClick={() => setIsStereo(true)}>stereo</button>
          </div>

          {/* Toggle Buttons */}
          <div className="winamp-toggle-buttons">
            <button
              className={`winamp-toggle-btn ${showEqualizer ? 'active' : ''}`}
              onClick={() => {
                const newVal = !showEqualizer;
                setShowEqualizer(newVal);
                localStorage.setItem('music-player-show-eq', newVal.toString());
              }}
            >EQ</button>
            <button
              className={`winamp-toggle-btn ${showPlaylist ? 'active' : ''}`}
              onClick={() => {
                const newVal = !showPlaylist;
                setShowPlaylist(newVal);
                localStorage.setItem('music-player-show-pl', newVal.toString());
              }}
            >PL</button>
          </div>
        </div>

        <div className="winamp-controls">
          <button className="winamp-control-btn" onClick={handlePrevious} title="Previous Track (Z)" aria-label="Previous Track" disabled={currentTrackIndex === 0}>⏮</button>
          <button className="winamp-control-btn" onClick={handlePlay} title="Play (X)" aria-label="Play">▶</button>
          <button className="winamp-control-btn" onClick={handlePause} title="Pause (C)" aria-label="Pause" disabled={!isPlaying}>⏸</button>
          <button className="winamp-control-btn" onClick={handleStop} title="Stop (V)" aria-label="Stop">■</button>
          <button className="winamp-control-btn" onClick={handleNext} title="Next Track (B)" aria-label="Next Track" disabled={currentTrackIndex >= playlist.length - 1}>⏭</button>
          <button className="winamp-control-btn" onClick={handleEject} title="Eject / Toggle Playlist (L)" aria-label="Toggle Playlist">⏏</button>
        </div>
      </div>

      {/* Equalizer */}
      {showEqualizer && (
        <div className="winamp-equalizer">
          <div className="winamp-titlebar">
            <span className="winamp-title">WINAMP EQUALIZER</span>
          </div>
          <div className="winamp-eq-controls">
            <button className={`winamp-eq-btn ${equalizerOn ? 'active' : ''}`} onClick={() => setEqualizerOn(!equalizerOn)}>ON</button>
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
                  type="range" min="-20" max="20" value={preamp}
                  onChange={(e) => setPreamp(parseInt(e.target.value))}
                  className="winamp-eq-slider" data-orient="vertical"
                />
              </div>
              {freqLabels.map((label, index) => (
                <div key={index} className="winamp-eq-slider-container">
                  <label>{label}</label>
                  <input
                    type="range" min="-20" max="20" value={frequencies[index]}
                    onChange={(e) => handleFrequencyChange(index, parseInt(e.target.value))}
                    className="winamp-eq-slider" data-orient="vertical"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Playlist */}
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
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </div>
            <div className="winamp-playlist-bottom">
              <button className="winamp-playlist-btn">LOAD LIST</button>
              <div className="winamp-mini-controls">
                <button className="winamp-mini-btn" onClick={togglePlay}>{isPlaying ? '||' : '▶'}</button>
                <button className="winamp-mini-btn" onClick={handleStop}>■</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
