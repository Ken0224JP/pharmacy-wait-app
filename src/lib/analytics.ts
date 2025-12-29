import { DailyStats } from "@/types";
import { Timestamp } from "firebase/firestore";
import { formatTime } from "@/lib/utils";
import { MAX_VALID_WAIT_MINUTES } from "@/lib/constants";

export const calculateDailyStats = (logs: any[], targetDate: Date): DailyStats => {
  // --- 集計用変数 ---
  let arrivalQueue: number[] = [];
  let totalWaitTimeMinutes = 0;
  let resolvedPatients = 0;
  let totalVisitors = 0;
  let prevCount = 0;
  let maxWaitCount = 0;

  // --- 営業時間管理用 ---
  let lastOpenTime: number | null = null;
  let lastCloseTime: number | null = null;
  let latestLogTime: number | null = null;

  // デフォルト値
  const emptyResult: DailyStats = {
    totalVisitors: 0,
    resolvedCount: 0,
    avgWaitTime: 0,
    maxWaitCount: 0,
    date: "",
    openTime: "",
    closeTime: "",
    duration: "-",
  };

  if (!logs || logs.length === 0) {
    return emptyResult;
  }

  // --- ループ処理 ---
  for (const log of logs) {
    const timestamp = (log.createdAt instanceof Timestamp) 
      ? log.createdAt.toMillis() 
      : new Date(log.createdAt).getTime();

    latestLogTime = timestamp;

    const action = log.action;
    const currentCount = Number(log.resultCount);

    if (action === "OPEN") {
      // 開店時刻: その日まだ記録されていなければ記録
      if (!lastOpenTime) {
        lastOpenTime = timestamp;
      }
      
      // 閉店時刻リセット（営業中の状態にする）
      lastCloseTime = null;
      continue;
    }

    if (action === "CLOSE") {
      lastCloseTime = timestamp;
    }

    if (currentCount > maxWaitCount) {
      maxWaitCount = currentCount;
    }

    const diff = currentCount - prevCount;
    if (diff > 0) {
      for (let k = 0; k < diff; k++) {
        arrivalQueue.push(timestamp);
        totalVisitors++;
      }
    } else if (diff < 0) {
      const decreaseCount = Math.abs(diff);
      for (let k = 0; k < decreaseCount; k++) {
        if (arrivalQueue.length > 0) {
          const arrivedAt = arrivalQueue.shift();
          if (arrivedAt !== undefined) {
            const leftAt = timestamp;
            const waitMinutes = (leftAt - arrivedAt) / (1000 * 60);
            
            // 異常値（長時間放置など）の除外
            if (waitMinutes > 0 && waitMinutes < MAX_VALID_WAIT_MINUTES) {
              totalWaitTimeMinutes += waitMinutes;
              resolvedPatients++;
            }
          }
        }
      }
    }
    prevCount = currentCount;
  }

  // --- 結果の整形 ---
  const avgWaitTime = resolvedPatients > 0 
    ? Math.round(totalWaitTimeMinutes / resolvedPatients) 
    : 0;

  // 各種フォーマット
  let dateStr = "";
  let openTimeStr = "";
  let closeTimeStr = "";
  let durationStr = "-";

  if (lastOpenTime) {
    const openDateObj = new Date(lastOpenTime);
    
    // 日付 (yyyy/MM/dd)
    const y = openDateObj.getFullYear();
    const m = (openDateObj.getMonth() + 1).toString().padStart(2, '0');
    const d = openDateObj.getDate().toString().padStart(2, '0');
    dateStr = `${y}/${m}/${d}`;

    // 時刻フォーマット (utilsの関数を使用)
    openTimeStr = formatTime(openDateObj);

    // 終了時刻の確定
    const endTime = lastCloseTime 
      ? lastCloseTime 
      : (latestLogTime ? latestLogTime : new Date().getTime());

    // Dateオブジェクトに変換して渡す
    closeTimeStr = formatTime(new Date(endTime));

    // 期間（分）の計算
    const durationMillis = endTime - lastOpenTime;
    if (durationMillis >= 0) {
      const durationMinutes = Math.floor(durationMillis / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      durationStr = `${hours}時間${mins}分`;
    }
  }

  return {
    totalVisitors,
    resolvedCount: resolvedPatients,
    avgWaitTime,
    maxWaitCount,
    date: dateStr,
    openTime: openTimeStr,
    closeTime: closeTimeStr,
    duration: durationStr,
  };
};