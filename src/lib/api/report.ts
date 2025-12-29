import { db } from "@/lib/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  collection, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { calculateDailyStats } from "@/lib/analytics";
import { Store } from "@/types";

export const getOrUpdateDailyStats = async (store: Store) => {
  const storeId = store.id;
  const updatedAt = store.updatedAt?.toDate() || new Date(0);
  
  // 1. キャッシュチェック
  const report = store.dailyReport;
  
  // 書き込み直後(Latency Compensation中)は calculatedAt が null になるため
  // それを検知して「キャッシュ有効」と判定させる
  const isPendingWrite = report && !report.calculatedAt;
  const calculatedAt = report?.calculatedAt?.toDate();

  if (report && (isPendingWrite || (calculatedAt && calculatedAt.getTime() >= updatedAt.getTime()))) {
    console.log("Using Cached Report");
    return report.data;
  }

  // 2. 再計算プロセス (キャッシュ無効時)
  console.log("Fetching Logs & Recalculating...");
  
  // updatedAt が過去(0)の場合は、現在時刻を基準にする
  const targetDate = updatedAt.getTime() === 0 ? new Date() : updatedAt;
  
  const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);

  const q = query(
    collection(db, "logs"),
    where("storeId", "==", storeId),
    where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
    where("createdAt", "<=", Timestamp.fromDate(endOfDay)),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(d => d.data());

  // 計算実行
  const stats = calculateDailyStats(logs, startOfDay);

  // 3. キャッシュ更新 (非同期)
  updateDoc(doc(db, "stores", storeId), {
    dailyReport: {
      calculatedAt: serverTimestamp(),
      data: stats
    }
  }).catch(e => console.error("Cache update failed", e));

  return stats;
};