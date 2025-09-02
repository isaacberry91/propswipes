import { useState, useEffect } from 'react';

interface VoiceNoteDurationProps {
  audioUrl: string;
  initialDuration?: number;
}

const VoiceNoteDuration = ({ audioUrl, initialDuration }: VoiceNoteDurationProps) => {
  const [duration, setDuration] = useState<number | null>(typeof initialDuration === 'number' ? Math.max(0, Math.round(initialDuration)) : null);
  const [loading, setLoading] = useState(!(typeof initialDuration === 'number'));

  useEffect(() => {
    if (typeof initialDuration === 'number') {
      setDuration(Math.max(0, Math.round(initialDuration)));
      setLoading(false);
      return;
    }

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';

    const trySetDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration >= 0) {
        setDuration(Math.max(0, Math.round(audio.duration)));
        setLoading(false);
      }
    };

    const handleLoadedMetadata = () => {
      trySetDuration();
    };

    const handleDurationChange = () => {
      trySetDuration();
    };

    const handleCanPlayThrough = () => {
      trySetDuration();
    };

    const handleError = () => {
      setLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
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