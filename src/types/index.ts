import { Timestamp } from "firebase/firestore";

// 集計結果の型定義
export interface DailyStats {
  totalVisitors: number;
  resolvedCount: number;
  avgWaitTime: number;
  maxWaitCount: number;
  // 以下、個別に定義
  date: string;       // "2023/12/25"
  openTime: string;   // "09:00"
  closeTime: string;  // "18:00"
  duration: string;   // "9時間0分"
}

// Firestoreに保存されているデータの型
export interface StoreData {
  name: string;
  isOpen: boolean;
  waitCount: number;
  avgTime: number;
  updatedAt: Timestamp | null;
}

export interface Store extends StoreData {
  id: string;
}

export type StoreReportDocument = {
  storeId: string;
  calculatedAt: Timestamp;
  data: DailyStats; 
};

export interface LogEntry {
  action: string;
  resultCount: number;
  timestamp: number; // 配列内で扱いやすいようミリ秒(number)で保存
}

export interface DailyLogDocument {
  storeId: string;
  date: string; // "YYYY-MM-DD"
  logs: LogEntry[];
  updatedAt: Timestamp;
}