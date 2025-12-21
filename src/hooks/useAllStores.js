import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useAllStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 店舗名順で取得（必要に応じて作成日順などに変更可）
    const q = query(collection(db, "stores"), orderBy("name"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // 営業中の店舗をリストの上に並び替えるロジック
      const sortedStores = storesData.sort((a, b) => {
        // bが営業中(true)でaが閉店(false)なら、bを先に
        return Number(b.isOpen) - Number(a.isOpen);
      });

      setStores(sortedStores);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stores, loading };
};