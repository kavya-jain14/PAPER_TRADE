import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * useReplayData — Engine for Bar Replay Mode.
 * Fetches historical chunk, loads initial state, and imperatively pushes
 * replay buffer candles based on playback state without React render thrashing.
 *
 * @param {string} symbol - Ticker symbol
 * @param {string} targetDate - ISO string date
 * @param {string} interval - e.g. '1d', '1h'
 * @param {function} onInit - Callback fired to load initial chart history
 * @param {function} onTick - Callback fired when a replay candle is pushed
 */
export default function useReplayData(symbol, targetDate, interval, token, onInit, onTick) {
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 3x, 10x
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentPrice, setCurrentPrice] = useState(0);

  const bufferRef = useRef([]);
  const currentIndexRef = useRef(0);
  const timerRef = useRef(null);

  // Stable callbacks for external imperative calls
  const onInitRef = useRef(onInit);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onInitRef.current = onInit;
    onTickRef.current = onTick;
  }, [onInit, onTick]);

  // 1. Fetch Data Chunk
  useEffect(() => {
    if (!symbol || !targetDate) return;

    let isMounted = true;
    setLoading(true);
    setIsPlaying(false);
    currentIndexRef.current = 0;
    setProgress(0);

    const fetchData = async () => {
      try {
        const url = new URL(`${API_URL}/api/replay/data/${encodeURIComponent(symbol)}`);
        url.searchParams.append('date', targetDate);
        url.searchParams.append('interval', interval);

        const res = await fetch(url.toString(), {
          headers: { 'auth-token': token }
        });

        if (res.status === 401) {
          throw new Error('Authentication failed (401). Please log in again.');
        }

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to load replay data');

        if (isMounted) {
          bufferRef.current = data.replayBuffer;

          if (data.initialState.length > 0) {
            onInitRef.current(data.initialState);
            const lastCandle = data.initialState[data.initialState.length - 1];
            setCurrentPrice(lastCandle.close);
          }

          setLoading(false);
          toast.success(`Replay loaded: ${data.replayBuffer.length} bars ahead.`);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          toast.error(err.message);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, targetDate, interval, token]);

  // 2. Playback Engine
  const pushNextCandle = useCallback(() => {
    const buffer = bufferRef.current;
    const idx = currentIndexRef.current;

    if (idx >= buffer.length) {
      setIsPlaying(false);
      toast('Replay reached the end of the loaded range.');
      return false; // Reached end
    }

    const candle = buffer[idx];
    if (onTickRef.current) {
      onTickRef.current(candle);
    }
    setCurrentPrice(candle.close);

    currentIndexRef.current = idx + 1;
    setProgress(Math.round(((idx + 1) / buffer.length) * 100));

    return true; // Successfully pushed
  }, []);

  // 3. Playback Loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isPlaying) {
      // Base interval is 1000ms (1 second) for 1x speed.
      // 3x = 333ms, 10x = 100ms
      const tickInterval = 1000 / speedMultiplier;

      timerRef.current = setInterval(() => {
        const hasMore = pushNextCandle();
        if (!hasMore) {
          clearInterval(timerRef.current);
        }
      }, tickInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, pushNextCandle]);

  // Controls API
  const togglePlay = () => setIsPlaying(p => !p);
  const stepForward = () => {
    setIsPlaying(false);
    pushNextCandle();
  };
  const setSpeed = (mul) => setSpeedMultiplier(mul);
  const pause = () => setIsPlaying(false);

  return {
    loading,
    isPlaying,
    togglePlay,
    pause,
    stepForward,
    speedMultiplier,
    setSpeed,
    progress,
    currentPrice,
    totalBars: bufferRef.current.length
  };
}
