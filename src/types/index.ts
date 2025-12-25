import { Timestamp } from "firebase/firestore";

// Firestoreに保存されているデータの型
export interface StoreData {
  name: string;
  isOpen: boolean;
  waitCount: number;
  avgTime: number;
  updatedAt: Timestamp | null;
}

// IDを含んだ、アプリ内で扱う店舗オブジェクトの型
export interface Store extends StoreData {
  id: string;
}