"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseMedical } from "@fortawesome/free-solid-svg-icons";
import { COLOR_CONFIG } from "@/lib/constants";

function StoreViewContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");

  const { storeData, loading } = usePharmacyStore(storeId);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-gray-500 animate-pulse">読み込み中...</p></div>;
  if (!storeData) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4"><p className="text-xl text-red-500">店舗データが見つかりませんでした。</p><Link href="/" className="text-blue-500 underline">店舗一覧に戻る</Link></div>;

  const { name, isOpen, waitCount, updatedAt } = storeData;
  const avgTime = storeData.avgTime || 5;
  const waitTime = waitCount * avgTime;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 状況に応じたカラー設定を取得する関数
  const getTheme = () => {
    if (!isOpen) return COLOR_CONFIG.closed;
    if (waitCount <= 2) return COLOR_CONFIG.low;
    if (waitCount <= 5) return COLOR_CONFIG.medium;
    return COLOR_CONFIG.high;
  };

  const theme = getTheme();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200 transition-colors duration-500">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* 店舗名ラベル */}
        <div 
          className="w-full py-6 px-4 text-center transition-colors duration-300"
          style={{ backgroundColor: theme.headerBg }}
        >
          <h1 
            className="text-2xl md:text-3xl font-bold transition-colors duration-300"
            style={{ color: theme.headerText }}
          >
            {name}
          </h1>
        </div>

        <div className="px-8 pt-8 pb-4 md:px-12 md:pt-12 md:pb-6 text-center">
          
          {isOpen ? (
            <div className="space-y-2">
              <div className="mt-2">
                <p className="text-gray-500 text-lg md:text-xl font-bold mb-0">現在の待ち人数</p>
                <div className="flex items-baseline justify-center">
                  <span 
                    className="text-[10rem] md:text-[14rem] font-bold leading-none tracking-tighter transition-colors duration-300"
                    style={{ color: theme.accentColor }}
                  >
                    {waitCount}
                  </span>
                  <span className="text-3xl md:text-5xl text-gray-400 font-bold ml-2 -translate-y-4 md:-translate-y-8">人</span>
                </div>
              </div>

              <div className="py-4 border-t border-gray-100">
                <p className="text-gray-500 text-lg md:text-xl mb-2 font-bold">待ち時間の目安</p>
                <p 
                  className="text-4xl md:text-6xl font-bold transition-colors duration-300"
                  style={{ color: theme.accentColor }}
                >
                  {waitCount === 0 ? "なし" : `約 ${waitTime} 分`}
                </p>
              </div>

              <p className="text-sm text-gray-400">
                ※状況により前後することがあります
              </p>
            </div>
          ) : (
            <div className="py-10">
              <div className="mb-6 opacity-30 text-gray-400">
                <FontAwesomeIcon icon={faHouseMedical} className="text-8xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-400 mb-4">
                本日の受付は終了しました
              </h2>
              <p className="text-gray-400">
                またのご利用をお待ちしております。
              </p>
            </div>
          )}

          {updatedAt && (
            <div className="mt-6 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-mono">
                最終更新: {formatTime(updatedAt)}
              </p>
            </div>
          )}

        </div>
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