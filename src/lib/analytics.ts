import { DailyStats } from "@/types";
import { formatTime } from "@/lib/utils";

export const calculateDailyStats = (logs: any[]): DailyStats => {
  let totalArea = 0;      // (待ち人数 × 継続時間) の総和
  let totalVisitors = 0;  // 総来客数
  let prevTime = 0;
  let prevCount = 0;
  let maxWaitCount = 0;
  let lastOpenTime: number | null = null;
  let lastCloseTime: number | null = null;

  // デフォルト値
  const emptyResult: DailyStats = {
    totalVisitors: 0,
    avgWaitTime: 0,
    maxWaitCount: 0,
    date: "",
    openTime: "",
    closeTime: "",
    duration: "データなし",
  };

  if (!logs || logs.length === 0) return emptyResult;

  for (const log of logs) {
    const timestamp = new Date(log.timestamp).getTime();
    const currentCount = Number(log.resultCount);

    // 1. 面積の加算（前の状態の人数 × 次のイベントまでの経過時間）
    if (prevTime > 0) {
      const durationMinutes = (timestamp - prevTime) / (1000 * 60);
      if (durationMinutes > 0) {
        totalArea += prevCount * durationMinutes;
      }
    }

    // 2. 来客数のカウント（INCREMENTアクションをカウント）
    if (log.action === "INCREMENT") {
      totalVisitors++;
    }

    // 3. 各種状態の記録
    if (log.action === "OPEN" && !lastOpenTime) lastOpenTime = timestamp;
    if (log.action === "CLOSE") lastCloseTime = timestamp;
    if (currentCount > maxWaitCount) maxWaitCount = currentCount;

    prevTime = timestamp;
    prevCount = currentCount;
  }

  // 平均待ち時間 = 総滞在面積 / 総来客数
  const avgWaitTime = totalVisitors > 0 ? Math.round(totalArea / totalVisitors) : 0;

  // 結果の整形
  let dateStr = "";
  let openTimeStr = "";
  let closeTimeStr = "";
  let durationStr = "-";

  if (lastOpenTime) {
    const openDateObj = new Date(lastOpenTime);
    dateStr = `${openDateObj.getFullYear()}/${(openDateObj.getMonth() + 1).toString().padStart(2, '0')}/${openDateObj.getDate().toString().padStart(2, '0')}`;
    openTimeStr = formatTime(openDateObj);
    
    const endTime = lastCloseTime || prevTime; // CLOSEがない場合は最後のログ時刻
    closeTimeStr = formatTime(new Date(endTime));

    const durationMinutes = Math.floor((endTime - lastOpenTime) / (1000 * 60));
    durationStr = `${Math.floor(durationMinutes / 60)}時間${durationMinutes % 60}分`;
  }

  return {
    totalVisitors,
    avgWaitTime,
    maxWaitCount,
    date: dateStr,
    openTime: openTimeStr,
    closeTime: closeTimeStr,
    duration: durationStr,
  };
};