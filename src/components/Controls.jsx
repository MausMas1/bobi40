import React from 'react';
import { Play, Pause, Download, Zap, Siren } from 'lucide-react';

export const Controls = ({
    isPlaying,
    onPlayPause,
    crackleEnabled,
    toggleCrackle,
    filterEnabled,
    toggleFilter,
    pitch = 1.0,
    setPitch,
    triggerSiren,
    triggerLaser,
    audioUrl
}) => {
    return (
        <div className="controls-container" style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            padding: '0 20px',
            zIndex: 10
        }}>

            {/* Main Playback Control */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Spacer */}
                <div style={{ width: '60px' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={onPlayPause}
                        className="icon-btn"
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: isPlaying ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.1)',
                            border: '2px solid var(--accent-color)',
                            color: 'var(--accent-color)',
                            boxShadow: isPlaying ? '0 0 30px var(--accent-glow)' : 'none'
                        }}
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                    }}>
                        {isPlaying ? 'Scratch to Remix' : 'Tap to Play'}
                    </p>
                    {!isPlaying && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: '5px',
                            fontWeight: 'bold'
                        }}>
                            ⚠️ To listen, unmute phone ⚠️
                        </p>
                    )}
                </div>

                {/* Pitch Slider (Vertical) */}
                <div style={{
                    width: '60px',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '10px 0'
                }}>
                    <span style={{ fontSize: '9px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>PITCH</span>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="0.8"
                            max="1.2"
                            step="0.01"
                            value={pitch}
                            onChange={(e) => setPitch(parseFloat(e.target.value))}
                            style={{
                                writingMode: 'bt-lr', /* For Firefox/Chrome support variance, transform is safer */
                                WebkitAppearance: 'slider-vertical', /* Native vertical if supported */
                                width: '4px',
                                height: '100%',
                                accentColor: 'var(--accent-color)',
                                cursor: 'pointer'
                            }}
                            className="pitch-slider"
                        />
                    </div>
                    <span style={{ fontSize: '9px', color: '#666', marginTop: '5px' }}>
                        {Math.round((pitch - 1) * 100)}%
                    </span>
                </div>
            </div>

            {/* FX Panel */}
            <div className="glass-panel" style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
            }}>
                {/* ... existing buttons ... */}

                <button
                    onClick={triggerLaser}
                    className="icon-btn"
                    style={{ flexDirection: 'column', gap: '5px', color: 'var(--text-secondary)' }}
                    title="Laser Effect"
                >
                    <Zap size={24} />
                    <span style={{ fontSize: '10px' }}>Laser</span>
                </button>

                <button
                    onClick={triggerSiren}
                    className="icon-btn"
                    style={{ flexDirection: 'column', gap: '5px', color: 'var(--text-secondary)' }}
                    title="Siren Effect"
                >
                    <Siren size={24} />
                    <span style={{ fontSize: '10px' }}>Siren</span>
                </button>

                <a
                    href={audioUrl}
                    download="40-bjorn-party-mix.mp3"
                    className="icon-btn"
                    style={{ flexDirection: 'column', gap: '5px', color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                    <Download size={24} />
                    <span style={{ fontSize: '10px' }}>Save MP3</span>
                </a>
            </div>
        </div>
    );
};
