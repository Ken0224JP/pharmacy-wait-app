import { Timestamp } from "firebase/firestore";
import { COLOR_CONFIG, ThemeColor, DEFAULT_AVG_WAIT_MINUTES, DEFAULT_THRESHOLD_LOW, DEFAULT_THRESHOLD_MEDIUM } from "@/lib/constants";
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
 * 店舗個別の閾値設定があればそれを使い、なければデフォルト定数を使う
 */
export const getStoreTheme = (
  isOpen: boolean, 
  waitCount: number,
  low: number = DEFAULT_THRESHOLD_LOW,
  medium: number = DEFAULT_THRESHOLD_MEDIUM
): ThemeColor => {
  if (!isOpen) return COLOR_CONFIG.closed;
  if (waitCount <= low) return COLOR_CONFIG.low;
  if (waitCount <= medium) return COLOR_CONFIG.medium;
  return COLOR_CONFIG.high;
};

/**
 * 待ち時間の目安を計算
 */
export const calculateWaitTime = (waitCount: number, avgTime: number | null | undefined): number => {
  // avgTimeが未設定の場合はデフォルト値を使用
  const timePerPerson = avgTime || DEFAULT_AVG_WAIT_MINUTES;
  return waitCount * timePerPerson;
};