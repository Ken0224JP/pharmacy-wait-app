"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import StoreStatusDisplay from "@/components/StoreStatusDisplay"; 

function StoreViewContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const { storeData, loading } = usePharmacyStore(storeId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-500 animate-pulse">読み込み中...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-xl text-red-500">店舗データが見つかりませんでした。</p>
        <Link href="/" className="text-blue-500 underline">
          店舗一覧に戻る
        </Link>
      </div>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200 transition-colors duration-500">
      
      <div className="w-full max-w-2xl">
        <StoreStatusDisplay 
          store={storeData} 
          variant="detail" 
        />
      </div>

      <div className="mt-8">
        <Link href="/" className="text-gray-400 hover:text-gray-800 underline">
          店舗一覧に戻る
        </Link>
      </div>
    </main>
  );
}

export default function StoreView() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <StoreViewContent />
    </Suspense>
  );
}