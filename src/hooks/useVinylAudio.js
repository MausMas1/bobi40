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

  // Initialize Audio Logic
  useEffect(() => {
    let active = true;

    const initAudio = async () => {
      // 1. Create Context immediately (starts Suspended on iOS, Running on Desktop)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      // 2. Setup Gain Node
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.8;
      gainNode.connect(ctx.destination);
      gainRef.current = gainNode;

      // Global Unlock Handler (Video Hack for Mute Switch Bypass)
      const unlockHandler = () => {
        const video = document.createElement('video');
        video.src = 'data:video/mp4;base64,AAAAIGZ0eXGlc29tAAAAAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAZmZGF0AAAAAAACAAAABG1vb3YAAABsbXZoAAAAAgEAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAIAAAAATAAAADdHJhawAAAFx0a2hkAAAAAdnQAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAADAAAAAAAAdWR0YQAAADxtZXRhAAAAAAAAACFoZGxyAAAAAAAAAAG1ZGlyAAAAAAAAAAAAAAAAAAAAAAADAAAAI2lsc3QAAAAZaW9vAAAAEWRhdGEAAAAATGF2ZjU2LjQwLjEwMAAAACRlbHN0AAAAAAAAAAEAAAADAAABAAAAAAABAAAAAQAAAAAAAABtbWRpYQAAACBtZGhkAAAAAdnQAAAAAAABAAAAAAABAAAAAAAAAAAAAAA4aGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAADgbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAADgbXRibAAAACxzdHNkAAAAAAAAAAEAAAAmbXA0YQAAAAAAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAACBzdHRzAAAAAAAAAAEAAAADAAABAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAwAAAAEAAAAUc3RzegAAAAAAAAAEAAAAIAAAABBzdGNvAAAAAAAAAAEAAAA4AAAAYXVkdGEAAAAZdGFnZwAAAAhkYXRhAAAAADEwNTZsYXZjNTYuNjAuMTAw';
        video.style.display = 'none';
        video.setAttribute('playsinline', 'true');
        video.muted = true; // Still needed for autoplay permission usually, but we want to trigger 'media' session
        document.body.appendChild(video);

        // We try to play. Even if muted, it triggers the 'media' session on iOS 
        // which inadvertently unlocks Web Audio to ignore the ringer switch.
        video.play().then(() => {
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              video.pause();
              video.remove();
              ['touchstart', 'touchend', 'click'].forEach(evt =>
                document.removeEventListener(evt, unlockHandler)
              );
            });
          }
        }).catch(e => {
          console.log("Video hack failed, trying resume anyway", e);
          if (ctx.state === 'suspended') ctx.resume();
        });
      };

      ['touchstart', 'touchend', 'click'].forEach(evt =>
        document.addEventListener(evt, unlockHandler, { once: true })
      );

      // 3. Fetch and Decode immediately (Allowed on iOS if Context exists)
      try {
        if (audioUrl) {
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();

          if (active) {
            // Decode logic
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            audioBufferRef.current = decodedBuffer;
            setIsReady(true);
          }
        }
      } catch (e) {
        console.error("Audio init failed", e);
      }
    };

    initAudio();

    return () => {
      active = false;
      audioContextRef.current?.close();
    };
  }, [audioUrl]);

  // Robust Play function for iOS
  const play = useCallback(async () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    const ctx = audioContextRef.current;

    // 1. Resume Context (Critical for iOS - Must be in user gesture)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error("Resume failed", e);
      }
    }

    if (isPlaying) return;

    // 2. Create and Start Source
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.loop = true;
    source.playbackRate.value = playbackRateRef.current;
    source.connect(gainRef.current);

    const offset = pausedAtRef.current % audioBufferRef.current.duration;

    source.start(0, offset);
    startedAtRef.current = ctx.currentTime - offset;

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
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') await ctx.resume();

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
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') await ctx.resume();

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
