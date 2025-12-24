import { COLOR_CONFIG } from "@/lib/constants";

/**
 * タイムスタンプを "HH:MM" 形式の文字列に変換
 * @param {Object|Date} timestamp - Firebase Timestamp または Date オブジェクト
 * @returns {string} フォーマットされた時刻文字列
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
};

/**
 * 店舗の状態と待ち人数に応じてカラー設定を取得
 * @param {boolean} isOpen - 開店しているかどうか
 * @param {number} waitCount - 現在の待ち人数
 * @returns {Object} COLOR_CONFIG の該当するテーマオブジェクト
 */
export const getStoreTheme = (isOpen, waitCount) => {
  if (!isOpen) return COLOR_CONFIG.closed;
  if (waitCount <= 2) return COLOR_CONFIG.low;
  if (waitCount <= 5) return COLOR_CONFIG.medium;
  return COLOR_CONFIG.high;
};

/**
 * 待ち時間の目安を計算
 * @param {number} waitCount - 待ち人数
 * @param {number} avgTime - 1人あたりの平均待ち時間 (分)
 * @returns {number} 合計待ち時間 (分)
 */
export const calculateWaitTime = (waitCount, avgTime) => {
  // avgTimeが未設定(null/undefined)の場合はデフォルト値 5 を使用
  const timePerPerson = avgTime || 5;
  return waitCount * timePerPerson;
};