import React, { useRef, useEffect, useState } from 'react';
import friendImg from '../assets/friend.png';

export const Vinyl = ({ isPlaying, setScratchRate, playbackSpeed = 1.0 }) => {
    const containerRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const lastAngleRef = useRef(0);
    const isDraggingRef = useRef(false);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(1);
    const rafRef = useRef(null);

    const BASE_SPEED = 0.05;

    // ... [Interaction handlers unchanged] ...
    const getAngle = (clientX, clientY) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(clientY - cy, clientX - cx);
    };

    const startDrag = (e) => {
        isDraggingRef.current = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        lastAngleRef.current = getAngle(clientX, clientY);
        lastTimeRef.current = performance.now();
    };

    const moveDrag = (e) => {
        if (!isDraggingRef.current) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const currentAngle = getAngle(clientX, clientY);
        let delta = currentAngle - lastAngleRef.current;

        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;

        setRotation(r => r + delta * (180 / Math.PI));

        lastAngleRef.current = currentAngle;

        const rate = delta / BASE_SPEED;
        setScratchRate(rate);
        velocityRef.current = rate;
    };

    const endDrag = () => {
        isDraggingRef.current = false;
    };

    useEffect(() => {
        let lastFrameTime = performance.now();
        const loop = (time) => {
            const dt = time - lastFrameTime;
            lastFrameTime = time;

            if (!isDraggingRef.current) {
                // Use playbackSpeed as target
                const targetRate = isPlaying ? playbackSpeed : 0;

                const diff = targetRate - velocityRef.current;
                if (Math.abs(diff) > 0.01) {
                    velocityRef.current += diff * 0.1;
                } else {
                    velocityRef.current = targetRate;
                }

                const frameMoved = BASE_SPEED * velocityRef.current * (dt / 16.66);
                setRotation(r => r + frameMoved * (180 / Math.PI));
                setScratchRate(velocityRef.current);
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isPlaying, setScratchRate, playbackSpeed]);

    return (
        <div
            className="vinyl-disc"
            ref={containerRef}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            onMouseMove={moveDrag}
            onTouchMove={moveDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchEnd={endDrag}
            style={{
                width: '100%',
                height: '100%',
                cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                touchAction: 'none',
                transform: `rotate(${rotation}deg)`
            }}
        >
            {/* Repeating Grooves */}
            <div style={{
                position: 'absolute',
                top: '2%', left: '2%', right: '2%', bottom: '2%',
                borderRadius: '50%',
                background: 'repeating-radial-gradient(#111 0, #111 2px, #222 3px, #111 4px)',
                opacity: 0.7
            }}></div>

            {/* Label Area */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '55%',
                height: '55%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #111',
                background: '#d4af37',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
            }}>
                {/* SVG TEXT LAYER (Behind photo? No, front. Actually Blend mode works best if photo is bg or overlaid.)
               Let's put Photo as BG, then text on top.
           */}
                <img
                    src={friendImg}
                    alt="Friend"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        mixBlendMode: 'multiply',
                        opacity: 0.85,
                        filter: 'sepia(0.3) contrast(1.1)'
                    }}
                />
            </div>

            {/* Text needs to be OUTSIDE the overflow:hidden label to not be clipped if it's large?
            No, text should be ON the label.
            We need a new container for text that sits on top of label but adheres to its rotation.
        */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                width: '55%', height: '55%',
                pointerEvents: 'none'
            }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'scale(0.9)' }}>
                    <defs>
                        <path id="topCurve" d="M 20,50 A 30,30 0 0,1 80,50" />
                        <path id="bottomCurve" d="M 15,50 A 35,35 0 0,0 85,50" />
                    </defs>
                    <text fontSize="8" fontWeight="900" fill="#ffffff" letterSpacing="0.5" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}>
                        <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
                            BJORN
                        </textPath>
                    </text>
                    <text fontSize="5" fontWeight="bold" fill="#ffffff" letterSpacing="0.2" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}>
                        <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
                            40 JAAR SONG
                        </textPath>
                    </text>


                </svg>
            </div>

            {/* Center Hole */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px', height: '12px',
                background: '#000',
                borderRadius: '50%',
                zIndex: 10
            }}></div>

        </div>
    );
};
