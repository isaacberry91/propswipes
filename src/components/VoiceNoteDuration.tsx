import { useState, useEffect } from 'react';

interface VoiceNoteDurationProps {
  audioUrl: string;
  initialDuration?: number;
}

const VoiceNoteDuration = ({ audioUrl, initialDuration }: VoiceNoteDurationProps) => {
  const [duration, setDuration] = useState<number | null>(initialDuration || null);
  const [loading, setLoading] = useState(!initialDuration);

  useEffect(() => {
    if (initialDuration) {
      setDuration(initialDuration);
      setLoading(false);
      return;
    }

    const audio = new Audio();
    audio.preload = 'metadata';
    
    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    audio.src = audioUrl;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, [audioUrl, initialDuration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <span>Loading...</span>;
  }

  if (duration === null) {
    return <span>Duration: N/A</span>;
  }

  return <span>{formatDuration(duration)}</span>;
};

export default VoiceNoteDuration;