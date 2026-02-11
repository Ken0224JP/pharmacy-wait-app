import { db } from "@/lib/firebase";
import { 
  collection, 
  query,      
  where,      
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { calculateDailyStats } from "@/lib/analytics";
import { DailyLogDocument } from "@/types";
import { FIRESTORE_COLLECTION_LOGS, DEFAULT_GRAPH_INTERVAL, LogAction } from "@/lib/constants";

/**
 * 指定した店舗の最新の1日分ログを取得し、統計を計算して返す
 */
export const getLatestReport = async (store: { id: string }, intervalMinutes: number = DEFAULT_GRAPH_INTERVAL) => {
  const storeId = store.id;

  // 最新の1日分ログを1件だけ取得（日付降順）
  const q = query(
    collection(db, FIRESTORE_COLLECTION_LOGS),
    where("storeId", "==", storeId),
    orderBy("date", "desc"),
    limit(1)
  );
  
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // 1件目のドキュメントを取得
  const data = snapshot.docs[0].data() as DailyLogDocument;
  
  // その場で面積方式で計算
  return calculateDailyStats(data.logs, intervalMinutes);
};


// ------------------------------------------------------------
// CSV出力用のヘルパー関数 (日本語ラベル変換)
// ------------------------------------------------------------
const getActionLabel = (action: LogAction): string => {
  switch (action) {
    case "OPEN": return "開店";
    case "INCREMENT": return "増加";
    case "DECREMENT": return "減少";
    case "CLOSE": return "閉店";
    default: return action;
  }
};

/**
 * 指定した期間（開始日〜終了日）のログを取得し、CSV形式の文字列で返す
 * データが存在しない場合は null を返す
 */
export const getRangeLogCsv = async (storeId: string, startDateStr: string, endDateStr: string): Promise<string | null> => {
  // 指定期間のドキュメントを取得
  const q = query(
    collection(db, FIRESTORE_COLLECTION_LOGS),
    where("storeId", "==", storeId),
    where("date", ">=", startDateStr),
    where("date", "<=", endDateStr)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // 取得した全ドキュメントのログ配列を1つに結合
  let allLogs: any[] = [];
  snapshot.forEach(doc => {
    const data = doc.data() as DailyLogDocument;
    if (data.logs && Array.isArray(data.logs)) {
      allLogs = [...allLogs, ...data.logs];
    }
  });

  if (allLogs.length === 0) {
    return null;
  }

  // 時間の昇順にソート
  allLogs.sort((a, b) => a.timestamp - b.timestamp);

  // CSVヘッダー
  const header = "日時,操作内容,待ち人数\n";

  // CSVボディ生成
  const rows = allLogs.map(log => {
    const dateObj = new Date(log.timestamp);
    // 日時フォーマット: YYYY/MM/DD HH:mm:ss
    const formattedDate = dateObj.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const actionLabel = getActionLabel(log.action);
    
    return `${formattedDate},${actionLabel},${log.resultCount}`;
  });

  return header + rows.join("\n");
};