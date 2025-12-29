import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const sendLog = async (storeId: string, action: string, resultCount: number) => {
  try {
    await addDoc(collection(db, "logs"), {
      storeId,
      action,
      resultCount,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Log failed:", err);
  }
};