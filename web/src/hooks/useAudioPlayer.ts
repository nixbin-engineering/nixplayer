import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { streamUrl } from '../api/client';

let audioElement: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
  }
  return audioElement;
}

export function useAudioPlayer() {
  const audio = useRef(getAudio());
  const { currentTrack, isPlaying, volume } = usePlayerStore();
  const { setCurrentTime, setDuration, setPlaying } = usePlayerStore();
  const { playNext } = useQueueStore();

  // Load track
  useEffect(() => {
    const el = audio.current;
    if (currentTrack) {
      el.src = streamUrl(currentTrack.id);
      el.load();
      el.play().catch(() => {});
    }
  }, [currentTrack?.id]);

  // Play/pause
  useEffect(() => {
    const el = audio.current;
    if (isPlaying) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    audio.current.volume = volume;
  }, [volume]);

  // Events
  useEffect(() => {
    const el = audio.current;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onEnded = () => playNext();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('durationchange', onDurationChange);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [playNext]);

  const seek = (time: number) => {
    audio.current.currentTime = time;
    setCurrentTime(time);
  };

  return { audio: audio.current, seek };
}
