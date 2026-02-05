import { DailyStats, GraphPoint } from "@/types";
import { formatTime } from "@/lib/utils";

// ★定数定義
const GRAPH_INTERVAL = 30; // 分単位

export const calculateDailyStats = (logs: any[]): DailyStats => {
  let dailyTotalArea = 0;      
  let dailyTotalVisitors = 0;  
  let prevTime = 0;
  let prevCount = 0;
  let dailyMaxWaitCount = 0;
  let lastOpenTime: number | null = null;
  let lastCloseTime: number | null = null;
  
  // ★グラフ用データ配列
  const graphData: GraphPoint[] = [];

  const emptyResult: DailyStats = {
    dailyTotalVisitors: 0,
    dailyAvgWaitTime: 0,
    dailyMaxWaitCount: 0,
    date: "",
    openTime: "",
    closeTime: "",
    duration: "データなし",
    graphData: [],
  };

  if (!logs || logs.length === 0) return emptyResult;

  // 時系列順に確実にソート
  const sortedLogs = [...logs].sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    return tA - tB;
  });

  // 1. 全体の統計計算（日次）
  for (const log of sortedLogs) {
    const timestamp = new Date(log.timestamp).getTime();
    const currentCount = Number(log.resultCount);

    if (prevTime > 0) {
      const durationMinutes = (timestamp - prevTime) / (1000 * 60);
      if (durationMinutes > 0) {
        dailyTotalArea += prevCount * durationMinutes;
      }
    }

    if (log.action === "INCREMENT") dailyTotalVisitors++;
    if (log.action === "OPEN" && !lastOpenTime) lastOpenTime = timestamp;
    if (log.action === "CLOSE") lastCloseTime = timestamp;
    if (currentCount > dailyMaxWaitCount) dailyMaxWaitCount = currentCount;

    prevTime = timestamp;
    prevCount = currentCount;
  }

  // 2. グラフデータの生成ロジック
  if (lastOpenTime) {
    // 開始時刻を30分単位に切り捨て
    let currentBucketTime = new Date(lastOpenTime);
    currentBucketTime.setMinutes(Math.floor(currentBucketTime.getMinutes() / GRAPH_INTERVAL) * GRAPH_INTERVAL);
    currentBucketTime.setSeconds(0);
    currentBucketTime.setMilliseconds(0);
    
    // 終了時刻
    const endTime = lastCloseTime || prevTime;

    let logIndex = 0;
    
    // シミュレーション用変数
    let currentSimCount = 0; 
    let lastCalcTime = currentBucketTime.getTime();

    // 終了時刻を超えるまで 30分ずつループ
    while (currentBucketTime.getTime() <= endTime) {
      const nextBucketTime = currentBucketTime.getTime() + (GRAPH_INTERVAL * 60 * 1000);
      
      let maxInBucket = currentSimCount; 
      
      // ★分母計算用：このバケットに関与したユニーク人数
      // = (バケット開始時にいた人数) + (バケット期間中に新しく来た人数)
      const startCount = currentSimCount; 
      let newVisitorsInBucket = 0;
      
      let bucketArea = 0; 

      // 次の区間時刻になるまでのログを全て処理
      while (logIndex < sortedLogs.length) {
        const log = sortedLogs[logIndex];
        const logTime = new Date(log.timestamp).getTime();
        
        if (logTime < nextBucketTime) {
          const durationMin = (logTime - lastCalcTime) / (1000 * 60);
          bucketArea += currentSimCount * durationMin;

          if (log.action === "INCREMENT") {
            newVisitorsInBucket++;
          }
          
          currentSimCount = Number(log.resultCount);
          if (currentSimCount > maxInBucket) {
            maxInBucket = currentSimCount;
          }

          lastCalcTime = logTime;
          logIndex++;
        } else {
          break;
        }
      }

      // 区間終了までの残りの面積を加算
      const remainingDuration = (nextBucketTime - lastCalcTime) / (1000 * 60);
      bucketArea += currentSimCount * remainingDuration;
      
      // 計算基準時刻を更新
      lastCalcTime = nextBucketTime;

      // ★平均待ち時間の算出
      // 面積(延べ待ち時間) ÷ (開始時人数 ＋ 新規人数)
      // これにより、値は必ず 0 〜 30(バケット長) の間に収まる
      const totalParticipants = startCount + newVisitorsInBucket;
      const avgWaitInBucket = totalParticipants > 0 
        ? Math.round(bucketArea / totalParticipants) 
        : 0;

      graphData.push({
        time: formatTime(currentBucketTime),
        intervalMaxWait: maxInBucket,
        intervalNewVisitors: newVisitorsInBucket,
        intervalAvgWaitTime: avgWaitInBucket
      });

      // 次の枠へ進める
      currentBucketTime.setTime(nextBucketTime);
    }
  }

  // 結果の整形
  const dailyAvgWaitTime = dailyTotalVisitors > 0 ? Math.round(dailyTotalArea / dailyTotalVisitors) : 0;
  
  let dateStr = "";
  let openTimeStr = "";
  let closeTimeStr = "";
  let durationStr = "-";

  if (lastOpenTime) {
    const openDateObj = new Date(lastOpenTime);
    dateStr = `${openDateObj.getFullYear()}/${(openDateObj.getMonth() + 1).toString().padStart(2, '0')}/${openDateObj.getDate().toString().padStart(2, '0')}`;
    openTimeStr = formatTime(openDateObj);
    const endT = lastCloseTime || prevTime;
    closeTimeStr = formatTime(new Date(endT));
    const durationMinutes = Math.floor((endT - lastOpenTime) / (1000 * 60));
    durationStr = `${Math.floor(durationMinutes / 60)}時間${durationMinutes % 60}分`;
  }

  return {
    dailyTotalVisitors,
    dailyAvgWaitTime,
    dailyMaxWaitCount,
    date: dateStr,
    openTime: openTimeStr,
    closeTime: closeTimeStr,
    duration: durationStr,
    graphData,
  };
};