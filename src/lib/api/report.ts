import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp, 
  collection, 
  query,      
  where,      
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { calculateDailyStats } from "@/lib/analytics";
import { Store, DailyLogDocument, StoreReportDocument } from "@/types";
import { 
  FIRESTORE_COLLECTION_LOGS,    
  FIRESTORE_COLLECTION_REPORTS  
} from "@/lib/constants";


export const getOrUpdateDailyStats = async (store: Store) => {
  const storeId = store.id;
  const storeUpdatedAt = store.updatedAt ? store.updatedAt.toDate() : new Date();
  
  // ---------------------------------------------------------
  // 1. キャッシュチェック
  // ---------------------------------------------------------
  const reportRef = doc(db, FIRESTORE_COLLECTION_REPORTS, storeId);
  const reportSnap = await getDoc(reportRef);
  
  let cachedReport: StoreReportDocument | null = null;
  if (reportSnap.exists()) {
    cachedReport = reportSnap.data() as StoreReportDocument;
  }

  const calculatedAt = cachedReport?.calculatedAt?.toDate();

  // キャッシュが有効ならそれを返す
  // (レポートが存在し、かつ、店舗の最終更新よりも後に計算されたものであれば最新とみなす)
  if (cachedReport && calculatedAt && calculatedAt.getTime() >= storeUpdatedAt.getTime()) {
    console.log("Using Cached Report (Secure)");
    return cachedReport.data;
  }

  // ---------------------------------------------------------
  // 2. データ取得 & 再計算 (ここからは管理者のみ実行可能と想定)
  // ---------------------------------------------------------
  console.log("Fetching Daily Log & Recalculating...");
  
  const targetDate = storeUpdatedAt; 
  const y = targetDate.getFullYear();
  const m = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const d = targetDate.getDate().toString().padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  const q = query(
    collection(db, FIRESTORE_COLLECTION_LOGS),
    where("storeId", "==", storeId),
    where("date", "==", dateStr)
  );
  
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data() as DailyLogDocument;
  const logs = data.logs.map(item => ({
    ...item,
    createdAt: new Date(item.timestamp)
  }));

  const stats = calculateDailyStats(logs, targetDate);

  // ---------------------------------------------------------
  // 3. キャッシュを保存
  // ---------------------------------------------------------
  // storeReports/{id} に保存します。
  // ここは一般ユーザーからは読み取れないようにセキュリティルールで守ります。
  
  const newReport: StoreReportDocument = {
    storeId,
    calculatedAt: serverTimestamp() as Timestamp, // 型キャスト
    data: stats
  };

  try {
    await setDoc(reportRef, newReport);
    console.log("Secure Report Cache Updated");
  } catch (e) {
    console.error("Failed to update secure report cache", e);
  }

  return stats;
};