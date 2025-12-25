import { useState, useEffect } from 'react';
import { Store } from "@/types";
import * as storeApi from "@/lib/api/store";

export const useAllStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = storeApi.subscribeToAllStores(
      (data) => {
        setStores(data);
        setLoading(false);
      },
      (error) => {
        console.error("All stores subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { stores, loading };
};