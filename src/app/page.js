"use client";

import Link from "next/link";
import { useAllStores } from "@/hooks/useAllStores";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseMedical } from "@fortawesome/free-solid-svg-icons";
import { COLOR_CONFIG } from "@/lib/constants";

export default function Home() {
  const { stores, loading } = useAllStores();

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  const getTheme = (store) => {
    if (!store.isOpen) return COLOR_CONFIG.closed;
    if (store.waitCount <= 2) return COLOR_CONFIG.low;
    if (store.waitCount <= 5) return COLOR_CONFIG.medium;
    return COLOR_CONFIG.high;
  };

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
            {stores.map((store) => {
              const theme = getTheme(store);
              const waitTime = store.waitCount * 5;

              return (
                <Link 
                  href={`/view?id=${store.id}`} 
                  key={store.id} 
                  className="block group w-full max-w-sm"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                    
                    {/* 店舗名ヘッダー */}
                    <div 
                      className="py-4 px-4 text-center transition-colors duration-300"
                      style={{ backgroundColor: theme.headerBg }}
                    >
                      <h2 
                        className="text-xl font-bold truncate"
                        style={{ color: theme.headerText }}
                      >
                        {store.name}
                      </h2>
                    </div>

                    {/* カード本文 */}
                    <div className="p-6 text-center flex-1 flex flex-col justify-center">
                      {store.isOpen ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">現在の待ち人数</p>
                            <div className="flex items-baseline justify-center">
                              <span 
                                className="text-7xl font-bold leading-none tracking-tight transition-colors duration-300"
                                style={{ color: theme.accentColor }}
                              >
                                {store.waitCount}
                              </span>
                              <span className="text-xl text-gray-400 font-bold ml-1 -translate-y-2">人</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-gray-400 text-sm font-bold mb-1">待ち時間の目安</p>
                            <p 
                                className="text-3xl font-bold transition-colors duration-300"
                                style={{ color: theme.accentColor }}
                              >
                              {store.waitCount === 0 ? "なし" : `約 ${waitTime} 分`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8">
                        <div className="mb-4 opacity-30 text-gray-400">
                           <FontAwesomeIcon icon={faHouseMedical} className="text-6xl" />
                        </div>
                        <p className="text-xl font-bold text-gray-400">
                          受付終了
                        </p>
                      </div>
                      )}

                      {store.updatedAt && (
                        <div className="mt-6 pt-3 border-t border-gray-50">
                          <p className="text-xs text-gray-400 font-mono">
                            更新: {formatTime(store.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}