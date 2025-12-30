import { db } from "@/lib/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query,      
  where,      
  getDocs     
} from "firebase/firestore";
import { calculateDailyStats } from "@/lib/analytics";
import { Store, DailyLogDocument } from "@/types";

export const getOrUpdateDailyStats = async (store: Store) => {
  const storeId = store.id;
  const updatedAt = store.updatedAt ? store.updatedAt.toDate() : new Date();
  
  // 1. キャッシュチェック
  const report = store.dailyReport;
  const isPendingWrite = report && !report.calculatedAt;
  const calculatedAt = report?.calculatedAt?.toDate();

  if (report && (isPendingWrite || (calculatedAt && calculatedAt.getTime() >= updatedAt.getTime()))) {
    console.log("Using Cached Report");
    return report.data;
  }

  // 2. データ取得 (Queryに変更)
  console.log("Fetching Daily Log...");
  
  const targetDate = updatedAt; 
  const y = targetDate.getFullYear();
  const m = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const d = targetDate.getDate().toString().padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  // 新規店舗で初回ログイン時エラー表示回避するため
  // ID指定(getDoc)ではなく、検索(query)を使ってます 
  const q = query(
    collection(db, "dailyLogs"),
    where("storeId", "==", storeId),
    where("date", "==", dateStr)
  );
  
  const snapshot = await getDocs(q);

  // データがない（新規店舗など）場合は null を返す
  if (snapshot.empty) {
    return null;
  }

  // データがあれば取得
  const data = snapshot.docs[0].data() as DailyLogDocument;
  const logs = data.logs.map(item => ({
    ...item,
    createdAt: new Date(item.timestamp)
  }));

  // 計算実行
  const stats = calculateDailyStats(logs, targetDate);

  // 3. キャッシュ更新
  updateDoc(doc(db, "stores", storeId), {
    dailyReport: {
      calculatedAt: serverTimestamp(),
      data: stats
    }
  }).catch(e => console.error("Cache update failed", e));

  return stats;
};