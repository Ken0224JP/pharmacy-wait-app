import { Timestamp } from "firebase/firestore";
import type { LogAction } from "@/lib/constants";

// 集計グラフのデータポイント
export interface GraphPoint {
  time: string;        // "09:00", "09:15" 等
  intervalMaxWait: number;     // その区間の最大同時待ち人数（折れ線）
  intervalNewVisitors: number; // その区間の新規受付人数（棒グラフ）
  intervalAvgWaitTime: number; // 平均待ち時間（右軸・分）
}

// グラフの表示設定（Cookie保存用）
export interface GraphSettings {
  showNewVisitors: boolean;
  showMaxWait: boolean;
  showAvgWait: boolean;
  graphInterval?: number;
}

// 集計結果の型定義
export interface DailyStats {
  dailyTotalVisitors: number;
  dailyAvgWaitTime: number;
  dailyMaxWaitCount: number;
  date: string;       // "2023/12/25"
  openTime: string;   // "09:00"
  closeTime: string;  // "18:00"
  duration: string;   // "9時間0分"
  graphData: GraphPoint[];
}

// Firestoreに保存されているデータの型
export interface StoreData {
  name: string;
  isOpen: boolean;
  waitCount: number;
  avgTime: number;
  thresholdLow?: number;
  thresholdMedium?: number;
  updatedAt: Timestamp | null;
}

export interface Store extends StoreData {
  id: string;
}

export interface LogEntry {
  action: LogAction;
  resultCount: number;
  timestamp: number; // 配列内で扱いやすいようミリ秒(number)で保存
}

export interface DailyLogDocument {
  storeId: string;
  date: string; // "YYYY-MM-DD"
  logs: LogEntry[];
  updatedAt: Timestamp;
}