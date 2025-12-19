import { useState, useEffect, useRef, useCallback } from 'react';
export const useVinylAudio = (audioUrl) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);

  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const playbackRateRef = useRef(1);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = async () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Master Gain
      gainRef.current = audioContextRef.current.createGain();
      gainRef.current.gain.value = 0.8;
      gainRef.current.connect(audioContextRef.current.destination);

      try {
        let buffer;
        if (audioUrl) {
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        } else {
          // Fallback dummy
          buffer = await createDummyBuffer(audioContextRef.current);
        }

        audioBufferRef.current = buffer;
        setIsReady(true);
      } catch (e) {
        console.error("Audio init failed", e);
      }
    };

    initAudio();

    return () => {
      audioContextRef.current?.close();
    };
  }, [audioUrl]);

  const play = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

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
  }, [isPlaying, isReady]);

  const pause = useCallback(() => {
    if (!sourceRef.current || !isPlaying) return;

    sourceRef.current.stop();
    const elapsed = audioContextRef.current.currentTime - startedAtRef.current;
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

  const triggerSiren = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5); // Rise
    osc.frequency.linearRampToValueAtTime(400, t + 1.0); // Fall

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.2);

    osc.start(t);
    osc.stop(t + 1.2);
  }, []);

  const triggerLaser = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3); // Pewww

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
