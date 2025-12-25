import { useEffect, useRef, useCallback } from 'react';

// Wake Lock APIの型定義（標準ライブラリに含まれていない場合への保険）
interface WakeLockSentinel extends EventTarget {
  release: () => Promise<void>;
  readonly released: boolean;
  readonly type: WakeLockType;
}

export const useWakeLock = (shouldLock: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake Lock released: 画面の常時点灯を解除しました");
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  }, []);

  const requestLock = useCallback(async () => {
    if (wakeLockRef.current) return;
    // navigatorにwakeLockが存在するかチェック
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    try {
      const sentinel = await navigator.wakeLock.request('screen') as WakeLockSentinel;
      
      wakeLockRef.current = sentinel;
      console.log("Wake Lock active: 画面の常時点灯を有効にしました");

      sentinel.addEventListener('release', () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
      });
    } catch (err) {
      console.error("Wake Lock request failed:", err);
    }
  }, []);

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
      releaseLock();
    };
  }, [shouldLock, requestLock, releaseLock]);

  return { isLocked: !!wakeLockRef.current };
};