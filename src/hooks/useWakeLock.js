import { useState, useEffect, useCallback } from 'react';

export const useWakeLock = (shouldLock) => {
  const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

  const requestLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        console.log("Wake Lock active: 画面の常時点灯を有効にしました");
      } catch (err) {
        console.error("Wake Lock request failed:", err);
      }
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        console.log("Wake Lock released: 画面の常時点灯を解除しました");
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  }, [wakeLockSentinel]);

  // shouldLockフラグやvisibilitychangeに応じて自動制御
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldLock) {
        await requestLock();
      }
    };

    if (shouldLock) {
      requestLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      releaseLock();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock(); // コンポーネントアンマウント時に解除
    };
  }, [shouldLock, requestLock, releaseLock]);

  return { isLocked: !!wakeLockSentinel };
};