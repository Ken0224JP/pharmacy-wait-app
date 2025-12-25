import { useEffect, useRef, useCallback } from 'react';

export const useWakeLock = (shouldLock) => {
  // ステート(useState)ではなくRef(useRef)を使うことで、
  // ロック取得時に再レンダリング（＝無限ループ）が起きないように修正
  const wakeLockRef = useRef(null);

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
    // 既にロックがある場合、またはブラウザが非対応の場合は何もしない
    if (wakeLockRef.current) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      console.log("Wake Lock active: 画面の常時点灯を有効にしました");

      // システム側（省電力モードなど）で勝手に解除された場合のクリーンアップ
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
      // タブが再びアクティブになった時にロックを再取得
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
      // アンマウント時やshouldLockがfalseになった時に確実に解放
      releaseLock();
    };
  }, [shouldLock, requestLock, releaseLock]);

  return { isLocked: !!wakeLockRef.current };
};