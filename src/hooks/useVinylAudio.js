import { useState, useEffect, useRef, useCallback } from 'react';
export const useVinylAudio = (audioUrl) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const rawBufferRef = useRef(null); // RAW arrayBuffer storage
  const sourceRef = useRef(null);
  const gainRef = useRef(null);

  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const playbackRateRef = useRef(1);

  // 1. Download the MP3 file on mount (fetch only, no decoding)
  useEffect(() => {
    let active = true;
    const fetchAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        if (active) {
          rawBufferRef.current = arrayBuffer;
          setIsReady(true); // "Ready" now means "Downloaded"
        }
      } catch (e) {
        console.error("Audio fetch failed", e);
      }
    };

    if (audioUrl) fetchAudio();

    return () => {
      active = false;
      audioContextRef.current?.close();
    };
  }, [audioUrl]);

  // 2. Helper to "Unlock" Audio on First Click (iOS Requirement)
  const ensureAudioReady = async () => {
    // A. Create Context if missing
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Master Gain
      gainRef.current = audioContextRef.current.createGain();
      gainRef.current.gain.value = 0.8;
      gainRef.current.connect(audioContextRef.current.destination);
    }

    const ctx = audioContextRef.current;

    // B. Resume if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // C. Decode Audio if we have the raw file but not the decoded buffer
    if (!audioBufferRef.current && rawBufferRef.current) {
      try {
        // Copy buffer to prevent detachment issues if decoded multiple times (rare but safe)
        const bufferCopy = rawBufferRef.current.slice(0);
        audioBufferRef.current = await ctx.decodeAudioData(bufferCopy);
      } catch (e) {
        console.error("Decode failed", e);
      }
    }
  };

  const play = useCallback(async () => {
    // Initialize & Unlock Context (Must be triggered by user gesture)
    await ensureAudioReady();

    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (isPlaying) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.loop = true;
    source.playbackRate.value = playbackRateRef.current;
    source.connect(gainRef.current);

    const offset = pausedAtRef.current % audioBufferRef.current.duration;

    source.start(0, offset);
    startedAtRef.current = audioContextRef.current.currentTime - offset;

    sourceRef.current = source;
    setIsPlaying(true);
  }, [isPlaying]);

  const pause = useCallback(() => {
    if (!sourceRef.current || !isPlaying) return;

    sourceRef.current.stop();
    const currentTime = audioContextRef.current ? audioContextRef.current.currentTime : 0;
    const elapsed = currentTime - startedAtRef.current;
    pausedAtRef.current = elapsed;

    sourceRef.current = null;
    setIsPlaying(false);
  }, [isPlaying]);

  const setScratchRate = useCallback((rate) => {
    playbackRateRef.current = rate;
    if (sourceRef.current) {
      sourceRef.current.playbackRate.value = rate;
    }
  }, []);

  const triggerSiren = useCallback(async () => {
    await ensureAudioReady(); // Ensure context exists
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5);
    osc.frequency.linearRampToValueAtTime(400, t + 1.0);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.2);

    osc.start(t);
    osc.stop(t + 1.2);
  }, []);

  const triggerLaser = useCallback(async () => {
    await ensureAudioReady(); // Ensure context exists
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }, []);

  return {
    isReady,
    isPlaying,
    play,
    pause,
    setScratchRate,
    triggerSiren,
    triggerLaser
  };
};
