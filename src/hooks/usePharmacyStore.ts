import { useState, useEffect } from 'react';
import { StoreData } from "@/types";
import * as storeApi from "@/lib/api/store";
import * as logger from "@/lib/api/logger"; 
import { LOG_ACTIONS } from "@/lib/constants";

export const usePharmacyStore = (storeId: string | null) => {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // APIサービスの購読関数を利用
    const unsub = storeApi.subscribeToStore(
      storeId,
      (data) => {
        setStoreData(data);
        setLoading(false);
      },
      (error) => {
        console.error("Store subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId]);

  const toggleOpen = async () => {
    if (!storeData || !storeId) return;
    const nextIsOpen = !storeData.isOpen;
    
    // 閉局時にカウントが残っていればリセットする判定
    const shouldResetCount = !nextIsOpen && storeData.waitCount > 0;
    
    try {
      // API呼び出し
      await storeApi.updateStoreStatus(storeId, nextIsOpen, shouldResetCount);
      
      // ログ送信
      const logCount = (!nextIsOpen) ? 0 : storeData.waitCount;
      await logger.sendLog(storeId, nextIsOpen ? LOG_ACTIONS.OPEN : LOG_ACTIONS.CLOSE, logCount);
      
    } catch (err) {
      console.error("Failed to toggle open status:", err);
    }
  };

  const updateCount = async (isIncrement: boolean) => {
    if (!storeData || !storeId) return;
    
    try {
      await storeApi.updateStoreWaitCount(storeId, isIncrement);

      const nextCount = storeData.waitCount + (isIncrement ? 1 : -1);
      
      // ログ送信
      await logger.sendLog(storeId, isIncrement ? LOG_ACTIONS.INCREMENT : LOG_ACTIONS.DECREMENT, nextCount);
      
    } catch (err) {
      console.error("Failed to update count:", err);
    }
  };

  const updateAvgTime = async (newTime: number) => {
    if (!storeData || !storeId) return;
    // 1分未満などの無効な値は無視
    if (newTime < 1) return;

    try {
      await storeApi.updateStoreAvgTime(storeId, newTime);
    } catch (err) {
      console.error("Failed to update average time:", err);
    }
  };

  return { storeData, loading, toggleOpen, updateCount, updateAvgTime };
};