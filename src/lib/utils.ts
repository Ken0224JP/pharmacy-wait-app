import { Timestamp } from "firebase/firestore";
import { COLOR_CONFIG, ThemeColor } from "@/lib/constants";

/**
 * タイムスタンプを "HH:MM" 形式の文字列に変換
 */
export const formatTime = (timestamp: Timestamp | Date | null | undefined): string => {
  if (!timestamp) return "";
  
  // Firestore Timestampには toDate() があるが、Dateオブジェクトにはないための判定
  const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp as Date);
  
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
};

/**
 * タイムスタンプを "mm/dd HH:MM" 形式の文字列に変換
 */
export const formatDateTime = (timestamp: Timestamp | null) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
};

/**
 * 店舗の状態と待ち人数に応じてカラー設定を取得
 */
export const getStoreTheme = (isOpen: boolean, waitCount: number): ThemeColor => {
  if (!isOpen) return COLOR_CONFIG.closed;
  if (waitCount <= 2) return COLOR_CONFIG.low;
  if (waitCount <= 5) return COLOR_CONFIG.medium;
  return COLOR_CONFIG.high;
};

/**
 * 待ち時間の目安を計算
 */
export const calculateWaitTime = (waitCount: number, avgTime: number | null | undefined): number => {
  // avgTimeが未設定の場合はデフォルト値 5 を使用
  const timePerPerson = avgTime || 5;
  return waitCount * timePerPerson;
};