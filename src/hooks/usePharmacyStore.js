import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

export const usePharmacyStore = (storeId) => {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const storeRef = doc(db, "stores", storeId);
    const unsub = onSnapshot(storeRef, (doc) => {
      if (doc.exists()) {
        setStoreData(doc.data());
      } else {
        setStoreData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [storeId]);

  const sendLog = (action, resultCount) => {
    fetch(GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, action, resultCount })
    }).catch(err => console.error("GAS Log Error:", err));
  };

  const toggleOpen = async () => {
    if (!storeData) return;
    const nextIsOpen = !storeData.isOpen;
    
    const updates = {
      isOpen: nextIsOpen,
      updatedAt: serverTimestamp()
    };

    if (!nextIsOpen && storeData.waitCount > 0) {
      updates.waitCount = 0;
    }
    
    await updateDoc(doc(db, "stores", storeId), updates);
    
    const logCount = (!nextIsOpen) ? 0 : storeData.waitCount;
    sendLog(nextIsOpen ? "OPEN" : "CLOSE", logCount);
  };

  const updateCount = async (isIncrement) => {
    if (!storeData) return;
    
    await updateDoc(doc(db, "stores", storeId), {
      waitCount: increment(isIncrement ? 1 : -1),
      updatedAt: serverTimestamp()
    });

    const nextCount = storeData.waitCount + (isIncrement ? 1 : -1);
    sendLog(isIncrement ? "INCREMENT" : "DECREMENT", nextCount);
  };

  const updateAvgTime = async (newTime) => {
    if (!storeData) return;
    const time = parseInt(newTime, 10);
    if (isNaN(time) || time < 1) return;

    await updateDoc(doc(db, "stores", storeId), {
      avgTime: time,
      updatedAt: serverTimestamp()
    });
  };

  return { storeData, loading, toggleOpen, updateCount, updateAvgTime };
};