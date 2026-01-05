/**
 * Ambient Sound System
 *
 * Generates subtle ambient soundscapes using Web Audio API
 * based on the current theme's mood. No audio files needed.
 */

class AmbientSound {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.nodes = [];
    this.currentMood = 'calm';
  }

  /**
   * Initialize the audio context (must be called from user interaction)
   */
  init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Map theme characteristics to a mood
   */
  static getThemeMood(themeData) {
    if (!themeData) return 'calm';

    const name = (themeData.name || '').toLowerCase();
    const desc = (themeData.description || '').toLowerCase();
    const linkStyle = themeData.links?.style || '';
    const cardStyle = themeData.cards?.style || '';
    const texture = themeData.background?.texture || '';
    const imageStyle = themeData.images?.style || '';

    // Check for specific moods based on theme properties
    if (name.includes('neon') || name.includes('cyber') || name.includes('electric') ||
        name.includes('rebellion') || name.includes('brutal')) {
      return 'digital';
    }

    if (name.includes('forest') || name.includes('ocean') || name.includes('mountain') ||
        name.includes('desert') || name.includes('nature') || texture === 'grain') {
      return 'nature';
    }

    if (name.includes('warm') || name.includes('cozy') || name.includes('autumn') ||
        name.includes('library') || name.includes('study') || name.includes('antiquarian')) {
      return 'warm';
    }

    if (name.includes('swiss') || name.includes('minimal') || name.includes('precision') ||
        name.includes('grid') || cardStyle === 'flat') {
      return 'minimal';
    }

    if (name.includes('bazaar') || name.includes('midnight') || name.includes('noir') ||
        name.includes('cinema') || imageStyle === 'duotone') {
      return 'mysterious';
    }

    if (linkStyle === 'highlight' || cardStyle === 'glass') {
      return 'dreamy';
    }

    return 'calm';
  }

  /**
   * Create ambient soundscape based on mood
   */
  createSoundscape(mood) {
    this.stopAllNodes();

    switch (mood) {
      case 'digital':
        this.createDigitalAmbience();
        break;
      case 'nature':
        this.createNatureAmbience();
        break;
      case 'warm':
        this.createWarmAmbience();
        break;
      case 'minimal':
        this.createMinimalAmbience();
        break;
      case 'mysterious':
        this.createMysteriousAmbience();
        break;
      case 'dreamy':
        this.createDreamyAmbience();
        break;
      default:
        this.createCalmAmbience();
    }

    this.currentMood = mood;
  }

  /**
   * Calm: Soft, slow-moving pad sounds
   */
  createCalmAmbience() {
    const frequencies = [220, 277.18, 329.63]; // A3, C#4, E4 (A major)
    frequencies.forEach((freq, i) => {
      this.createDrone(freq, 0.03, 8 + i * 2);
    });
  }

  /**
   * Digital: Subtle electronic tones with slight modulation
   */
  createDigitalAmbience() {
    // Low sub bass
    this.createDrone(55, 0.04, 10, 'sine');
    // Mid digital tone
    this.createDrone(440, 0.015, 6, 'triangle');
    // High shimmer
    this.createShimmer(880, 0.01, 4);
    // Subtle noise
    this.createFilteredNoise(0.02, 2000, 4000);
  }

  /**
   * Nature: Wind-like noise with subtle tonal elements
   */
  createNatureAmbience() {
    // Wind
    this.createFilteredNoise(0.04, 200, 800);
    // Distant tone (like wind through trees)
    this.createDrone(146.83, 0.02, 12, 'sine'); // D3
    this.createDrone(220, 0.015, 15, 'sine'); // A3
  }

  /**
   * Warm: Rich, comforting tones
   */
  createWarmAmbience() {
    // Warm pad
    this.createDrone(130.81, 0.03, 10, 'sine'); // C3
    this.createDrone(164.81, 0.025, 12, 'sine'); // E3
    this.createDrone(196, 0.02, 14, 'sine'); // G3
    // Subtle crackle
    this.createCrackle(0.008);
  }

  /**
   * Minimal: Very sparse, clean tones
   */
  createMinimalAmbience() {
    this.createDrone(261.63, 0.02, 20, 'sine'); // C4
    this.createShimmer(523.25, 0.008, 15); // C5
  }

  /**
   * Mysterious: Dark, evolving textures
   */
  createMysteriousAmbience() {
    this.createDrone(73.42, 0.035, 8, 'sine'); // D2
    this.createDrone(110, 0.025, 10, 'triangle'); // A2
    this.createFilteredNoise(0.015, 100, 400);
    this.createShimmer(293.66, 0.01, 6); // D4
  }

  /**
   * Dreamy: Soft, floating tones with movement
   */
  createDreamyAmbience() {
    this.createDrone(196, 0.025, 12, 'sine'); // G3
    this.createDrone(293.66, 0.02, 14, 'sine'); // D4
    this.createDrone(392, 0.015, 16, 'sine'); // G4
    this.createShimmer(587.33, 0.01, 8); // D5
  }

  /**
   * Create a sustained drone tone
   */
  createDrone(frequency, volume, lfoSpeed, waveform = 'sine') {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    osc.type = waveform;
    osc.frequency.value = frequency;

    // LFO for subtle movement
    lfo.type = 'sine';
    lfo.frequency.value = 1 / lfoSpeed;
    lfoGain.gain.value = volume * 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    lfo.start();

    this.nodes.push({ osc, gain, lfo, lfoGain });
  }

  /**
   * Create shimmering high tones
   */
  createShimmer(frequency, volume, speed) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    lfo.type = 'sine';
    lfo.frequency.value = 1 / speed;
    lfoGain.gain.value = volume;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    lfo.start();

    this.nodes.push({ osc, gain, lfo, lfoGain });
  }

  /**
   * Create filtered noise (wind-like)
   */
  createFilteredNoise(volume, lowFreq, highFreq) {
    const bufferSize = 2 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = highFreq;

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = lowFreq;

    const gain = this.audioContext.createGain();
    gain.gain.value = volume;

    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();

    this.nodes.push({ noise, gain, lowpass, highpass });
  }

  /**
   * Create subtle crackling (fireplace-like)
   */
  createCrackle(volume) {
    const tick = () => {
      if (!this.isPlaying) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = 1000 + Math.random() * 2000;

      gain.gain.setValueAtTime(volume * Math.random(), this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.05);

      // Random interval for next crackle
      setTimeout(tick, 100 + Math.random() * 400);
    };

    tick();
  }

  /**
   * Stop all sound nodes
   */
  stopAllNodes() {
    this.nodes.forEach(node => {
      try {
        if (node.osc) node.osc.stop();
        if (node.noise) node.noise.stop();
        if (node.lfo) node.lfo.stop();
      } catch (e) {
        // Node might already be stopped
      }
    });
    this.nodes = [];
  }

  /**
   * Start playing ambient sound
   */
  play(mood = 'calm') {
    if (!this.audioContext) this.init();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.createSoundscape(mood);

    // Fade in
    this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 2);
  }

  /**
   * Stop playing
   */
  stop() {
    if (!this.audioContext || !this.masterGain) return;

    this.isPlaying = false;

    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);

    // Stop nodes after fade
    setTimeout(() => {
      this.stopAllNodes();
    }, 1100);
  }

  /**
   * Change mood while playing
   */
  changeMood(mood) {
    if (!this.isPlaying) return;
    if (mood === this.currentMood) return;

    // Crossfade to new soundscape
    this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);

    setTimeout(() => {
      this.createSoundscape(mood);
      this.masterGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 1);
    }, 1100);
  }

  /**
   * Toggle play/stop
   */
  toggle(mood = 'calm') {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play(mood);
    }
    return this.isPlaying;
  }
}

// Export singleton instance
export const ambientSound = new AmbientSound();
export { AmbientSound };
