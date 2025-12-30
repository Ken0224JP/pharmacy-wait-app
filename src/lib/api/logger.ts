import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_COLLECTION_LOGS, LogAction } from "@/lib/constants";

export const sendLog = async (storeId: string, action: LogAction, resultCount: number) => {
  try {
    // 1. 今日の日付文字列を作成 (クライアントの端末時刻を使用)
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // 2. ドキュメントIDを決定 (例: 2024-05-20_store_abc)
    const docId = `${dateStr}_${storeId}`;

    // 3. 配列に追加するデータ
    const newLog = {
      action,
      resultCount,
      timestamp: now.getTime() // Date.now()
    };

    // 4. 保存実行
    // setDoc + merge: true を使うことで、
    // "その日のドキュメントがなければ作成、あれば更新" を自動でやってくれます
    const logRef = doc(db, FIRESTORE_COLLECTION_LOGS, docId);
    
    await setDoc(logRef, {
      storeId,
      date: dateStr,
      logs: arrayUnion(newLog), // 配列に要素を追加
      updatedAt: serverTimestamp() // ドキュメント自体の更新時刻
    }, { merge: true });

  } catch (err) {
    console.error("Log failed:", err);
  }
};