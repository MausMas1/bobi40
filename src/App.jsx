import { useState } from 'react'
import { Vinyl } from './components/Vinyl'
import { Controls } from './components/Controls'
import { useVinylAudio } from './hooks/useVinylAudio'

function App() {
  const [pitch, setPitch] = useState(1.0);

  const {
    isReady,
    isPlaying,
    play,
    pause,
    setScratchRate,
    triggerSiren,
    triggerLaser
  } = useVinylAudio('/40 Bjorn.mp3');

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else play();
  };

  return (
    <>
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
      />
    </>
  )
}

export default App
