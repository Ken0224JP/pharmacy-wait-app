"use client";

import { useAllStores } from "@/hooks/useAllStores";
import StoreCard from "@/components/StoreCard";

export default function Home() {
  const { stores, loading } = useAllStores();

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          近隣薬局 待ち状況一覧
        </h1>

        {stores.length === 0 ? (
          <p className="text-center text-gray-500">
            店舗データがありません。管理画面から店舗を追加してください。
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}