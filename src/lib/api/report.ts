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
import { FIRESTORE_COLLECTION_LOGS, DEFAULT_GRAPH_INTERVAL } from "@/lib/constants";

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