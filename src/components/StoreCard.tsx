"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseMedical } from "@fortawesome/free-solid-svg-icons";
import { formatTime, getStoreTheme, calculateWaitTime } from "@/lib/utils";
import { Store } from "@/types";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  // テーマと待ち時間の計算ロジックをここで実行
  const theme = getStoreTheme(store.isOpen, store.waitCount);
  const waitTime = calculateWaitTime(store.waitCount, store.avgTime);

  return (
    <Link 
      href={`/view?id=${store.id}`} 
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
}