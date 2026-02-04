import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  Timestamp,
  FirestoreError
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Store, StoreData } from "@/types";
import { FIRESTORE_COLLECTION_STORES } from "@/lib/constants";


// 店舗のリアルタイム監視
export const subscribeToStore = (
  storeId: string, 
  onUpdate: (data: StoreData | null) => void,
  onError?: (error: FirestoreError) => void
) => {
  const storeRef = doc(db, FIRESTORE_COLLECTION_STORES, storeId);
  // onSnapshotの返り値（unsubscribe関数）をそのまま返す
  return onSnapshot(storeRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as StoreData);
    } else {
      onUpdate(null);
    }
  }, onError);
};

// 全店舗のリアルタイム監視
export const subscribeToAllStores = (
  onUpdate: (stores: Store[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const q = query(collection(db, FIRESTORE_COLLECTION_STORES), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const storesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Store[];
    onUpdate(storesData);
  }, onError);
};

// ステータス（開局/閉局）の更新
export const updateStoreStatus = async (
  storeId: string, 
  isOpen: boolean, 
  shouldResetCount: boolean = false
) => {
  const updates: Partial<StoreData> = {
    isOpen,
    updatedAt: serverTimestamp() as Timestamp
  };

  if (shouldResetCount) {
    updates.waitCount = 0;
  }

  await updateDoc(doc(db, FIRESTORE_COLLECTION_STORES, storeId), updates);
};

// 待ち人数の増減
export const updateStoreWaitCount = async (storeId: string, isIncrement: boolean) => {
  await updateDoc(doc(db, FIRESTORE_COLLECTION_STORES, storeId), {
    waitCount: increment(isIncrement ? 1 : -1),
    updatedAt: serverTimestamp()
  });
};

// 平均待ち時間と閾値の設定を更新
export const updateStoreSettings = async (
  storeId: string, 
  settings: { avgTime: number; thresholdLow: number; thresholdMedium: number }
) => {
  await updateDoc(doc(db, FIRESTORE_COLLECTION_STORES, storeId), {
    ...settings,
    updatedAt: serverTimestamp()
  });
};