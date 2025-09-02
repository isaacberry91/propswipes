import { useState, useEffect } from 'react';

interface VoiceNoteDurationProps {
  audioUrl: string;
  initialDuration?: number;
}

const VoiceNoteDuration = ({ audioUrl, initialDuration }: VoiceNoteDurationProps) => {
  const [duration, setDuration] = useState<number | null>(typeof initialDuration === 'number' ? Math.max(0, Math.round(initialDuration)) : null);
  const [loading, setLoading] = useState(!(typeof initialDuration === 'number'));

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    const finish = (secs: number | null) => {
      if (cancelled) return;
      if (typeof secs === 'number' && Number.isFinite(secs)) {
        setDuration(Math.max(0, Math.round(secs)));
      }
      setLoading(false);
    };

    if (typeof initialDuration === 'number') {
      finish(initialDuration);
      return;
    }

    const tryHtmlAudio = () =>
      new Promise<number | null>((resolve) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';

        const cleanup = () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('durationchange', handleDurationChange);
          audio.removeEventListener('canplaythrough', handleCanPlayThrough);
          audio.removeEventListener('error', handleError);
          audio.src = '';
        };

        const trySet = () => {
          if (Number.isFinite(audio.duration) && audio.duration >= 0) {
            const secs = Math.max(0, Math.round(audio.duration));
            cleanup();
            resolve(secs);
          }
        };

        const handleLoadedMetadata = () => trySet();
        const handleDurationChange = () => trySet();
        const handleCanPlayThrough = () => trySet();
        const handleError = () => {
          cleanup();
          resolve(null);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('canplaythrough', handleCanPlayThrough);
        audio.addEventListener('error', handleError);

        // Force metadata fetch and Safari duration calculation
        audio.src = audioUrl + (audioUrl.includes('#') ? '' : '#t=0.001');
        audio.load();
        setTimeout(() => {
          try {
            // Safari trick to compute duration for some streams
            audio.currentTime = 1e7;
            audio.currentTime = 0;
          } catch {}
        }, 300);
      });

    const tryWebAudio = async (): Promise<number | null> => {
      try {
        const res = await fetch(audioUrl, { mode: 'cors', cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const buf = await res.arrayBuffer();
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return null;
        const ctx = new Ctx();
        const audioBuf: AudioBuffer = await new Promise((resolve, reject) => {
          ctx.decodeAudioData(buf.slice(0), resolve, reject);
        });
        const secs = audioBuf.duration;
        try { ctx.close(); } catch {}
        return Number.isFinite(secs) ? secs : null;
      } catch {
        return null;
      }
    };

    setLoading(true);

    (async () => {
      timeoutId = window.setTimeout(() => finish(null), 5000);

      const a = await tryHtmlAudio();
      if (a !== null) {
        if (timeoutId) clearTimeout(timeoutId);
        finish(a);
        return;
      }

      const b = await tryWebAudio();
      if (timeoutId) clearTimeout(timeoutId);
      finish(b);
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [audioUrl, initialDuration]);

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || duration === null) {
    return <span>0:00</span>;
  }

  return <span>{formatDuration(duration)}</span>;
};

export default VoiceNoteDuration;