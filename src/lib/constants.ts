export interface ThemeColor {
  headerBg: string;
  headerText: string;
  accentColor: string;
}
// ==========================================
// Firestore 関連
// ==========================================
// /** 店舗情報コレクション */
export const FIRESTORE_COLLECTION_STORES = "stores";
/** ログ（日次アクション）コレクション */
export const FIRESTORE_COLLECTION_LOGS = "dailyLogs";

/** 認証用メールアドレスのサフィックス */
export const AUTH_DOMAIN_SUFFIX = "@pharmacy.local";


// ==========================================
// 混雑状況関連の設定
// ==========================================

/** 混雑状況によるテーマカラーの設定 */
export const COLOR_CONFIG: Record<string, ThemeColor> = {
  closed: { headerBg: "#6b7280", headerText: "#ffffff", accentColor: "#d1d5db" },
  low: { headerBg: "#0E9488", headerText: "#ffffff", accentColor: "#0E9488" },
  medium: { headerBg: "#AB8410", headerText: "#ffffff", accentColor: "#947B0E" },
  high: { headerBg: "#940E10", headerText: "#ffffff", accentColor: "#940E10" }
};
/**
 * 混雑度の閾値設定（デフォルト）
 * 店舗ごとの設定がない場合に使用されます
 * - waitCount <= DEFAULT_THRESHOLD_LOW  -> low (青)
 * - waitCount <= DEFAULT_THRESHOLD_MEDIUM  -> medium (黄)
 * - それ以上                               -> high (赤)
 */
export const DEFAULT_THRESHOLD_LOW = 2;
export const DEFAULT_THRESHOLD_MEDIUM = 5;
/**
 * レポート表示時の色判定基準（設定時間に対する実績時間の比率）
 * - 実績 ÷ 設定 <= RATIO_THRESHOLD_LOW (1.5倍以内) -> 青
 * - 実績 ÷ 設定 <= RATIO_THRESHOLD_MEDIUM (2.0倍以内) -> 黄
 * - それ以上 -> 赤
 */
export const RATIO_THRESHOLD_LOW = 1.5;
export const RATIO_THRESHOLD_MEDIUM = 2.0;


// ==========================================
// 待ち時間関係の設定
// ==========================================

/** デフォルトの1人あたりの待ち時間（分） */
export const DEFAULT_AVG_WAIT_MINUTES = 5;

// ==========================================
// その他の設定
// ==========================================

/** ログのアクション種別と型定義 */
export const LOG_ACTIONS = {
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  INCREMENT: "INCREMENT",
  DECREMENT: "DECREMENT",
} as const;
export type LogAction = typeof LOG_ACTIONS[keyof typeof LOG_ACTIONS];