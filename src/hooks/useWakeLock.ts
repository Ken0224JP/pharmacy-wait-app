import { useEffect, useRef, useCallback, useState } from 'react';

// Wake Lock APIの型定義
interface WakeLockSentinel extends EventTarget {
  release: () => Promise<void>;
  readonly released: boolean;
  readonly type: WakeLockType;
}

export const useWakeLock = () => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  // 実際のロック状態と、ユーザーがロックを希望しているかの状態を管理
  const [isLocked, setIsLocked] = useState(false);
  const [shouldLock, setShouldLock] = useState(false);

  const releaseLock = useCallback(async () => {
    setShouldLock(false); // ロック希望を取り下げ
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsLocked(false);
        console.log("Wake Lock released: 画面の常時点灯を解除しました");
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  }, []);

  const requestLock = useCallback(async () => {
    setShouldLock(true); // ロックを希望
    if (wakeLockRef.current) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      console.warn("このブラウザは Wake Lock API に対応していません");
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen') as WakeLockSentinel;
      
      wakeLockRef.current = sentinel;
      setIsLocked(true);
      console.log("Wake Lock active: 画面の常時点灯を有効にしました");

      // OSやブラウザによって強制的に解除された場合のハンドリング
      sentinel.addEventListener('release', () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
          setIsLocked(false); // 強制解除されたらStateもfalseにしてUIを更新
          console.log("システムによってWake Lockが解除されました");
        }
      });
    } catch (err) {
      console.error("Wake Lock request failed:", err);
      setIsLocked(false);
    }
  }, []);

  // 手動でON/OFFを切り替える関数
  const toggleLock = useCallback(() => {
    if (isLocked) {
      releaseLock();
    } else {
      requestLock();
    }
  }, [isLocked, requestLock, releaseLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // 別のタブ等から戻ってきた際、ユーザーがONにしていたなら再取得を試みる
      if (document.visibilityState === 'visible' && shouldLock) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // アンマウント時のクリーンアップ
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [shouldLock, requestLock]);

  // isLocked と手動操作用の toggleLock を返す
  return { isLocked, toggleLock };
};
