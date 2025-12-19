import { useState } from 'react'
import { Vinyl } from './components/Vinyl'
import { Controls } from './components/Controls'
import { useVinylAudio } from './hooks/useVinylAudio'

function App() {
  const [pitch, setPitch] = useState(1.0);

  const audioUrl = import.meta.env.BASE_URL + '40 Bjorn.mp3';

  const {
    isReady,
    isPlaying,
    play,
    pause,
    setScratchRate,
    triggerSiren,
    triggerLaser
  } = useVinylAudio(audioUrl);

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else play();
  };

  return (
    <>
      {/* Loading Overlay */}
      {!isReady && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Muziek laden...</p>
        </div>
      )}

      {/* Branding */}
      <h1 className="brand-logo">Bobi's platenspeler</h1>

      {/* Container for Vinyl + Static Shine */}
      <div style={{ position: 'relative', width: 'var(--vinyl-size)', height: 'var(--vinyl-size)' }}>
        <Vinyl isPlaying={isPlaying} setScratchRate={setScratchRate} playbackSpeed={pitch} />

        {/* Static Shine Overlay */}
        <div className="vinyl-shine" style={{ pointerEvents: 'none' }}></div>
      </div>

      <Controls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        triggerSiren={triggerSiren}
        triggerLaser={triggerLaser}
        pitch={pitch}
        setPitch={setPitch}
        audioUrl={audioUrl}
      />
    </>
  )
}

export default App
