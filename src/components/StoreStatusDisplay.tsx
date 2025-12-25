"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseMedical } from "@fortawesome/free-solid-svg-icons";
import { formatTime, formatDateTime, getStoreTheme, calculateWaitTime } from "@/lib/utils";
import { StoreData } from "@/types";

// サイズやレイアウトの違いを定義
const VARIANTS = {
  card: {
    containerClass: "rounded-2xl shadow-sm border border-gray-100",
    headerPadding: "py-4 px-4",
    titleSize: "text-xl",
    bodyPadding: "p-6",
    labelSize: "text-sm",
    countSize: "text-7xl",
    unitSize: "text-xl -translate-y-2",
    timeSize: "text-3xl",
    iconSize: "text-6xl",
    closedTitleSize: "text-xl",
    countGap: "mb-1",
  },
  detail: {
    containerClass: "rounded-3xl shadow-xl border border-gray-100",
    headerPadding: "py-6 px-4",
    titleSize: "text-2xl md:text-3xl",
    bodyPadding: "px-8 pt-8 pb-4 md:px-12 md:pt-12 md:pb-6",
    labelSize: "text-lg md:text-xl",
    countSize: "text-[10rem] md:text-[14rem]",
    unitSize: "text-3xl md:text-5xl -translate-y-4 md:-translate-y-8",
    timeSize: "text-4xl md:text-6xl",
    iconSize: "text-8xl",
    closedTitleSize: "text-3xl",
    countGap: "mb-0 md:mb-2",
  }
};

interface StoreStatusDisplayProps {
  store: StoreData;
  variant: "card" | "detail";
  className?: string;
}

export default function StoreStatusDisplay({ store, variant, className = "" }: StoreStatusDisplayProps) {
  const styles = VARIANTS[variant];
  const theme = getStoreTheme(store.isOpen, store.waitCount);
  const waitTime = calculateWaitTime(store.waitCount, store.avgTime);

  return (
    <div className={`bg-white overflow-hidden flex flex-col h-full ${styles.containerClass} ${className}`}>
      
      {/* 店舗名ヘッダー */}
      <div 
        className={`${styles.headerPadding} text-center transition-colors duration-300`}
        style={{ backgroundColor: theme.headerBg }}
      >
        <h2 
          className={`${styles.titleSize} font-bold truncate transition-colors duration-300`}
          style={{ color: theme.headerText }}
        >
          {store.name}
        </h2>
      </div>

      {/* コンテンツ本文 */}
      <div className={`${styles.bodyPadding} text-center flex-1 flex flex-col justify-center`}>
        {store.isOpen ? (
          <div className="space-y-4">
            <div className={variant === 'detail' ? "mt-2" : ""}>
              <p className={`text-gray-400 font-bold ${styles.countGap} ${styles.labelSize}`}>
                現在の待ち人数
              </p>
              <div className="flex items-baseline justify-center">
                <span 
                  className={`${styles.countSize} font-bold leading-none tracking-tight transition-colors duration-300`}
                  style={{ color: theme.accentColor }}
                >
                  {store.waitCount}
                </span>
                <span className={`text-gray-400 font-bold ml-1 ${styles.unitSize}`}>人</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className={`text-gray-400 font-bold mb-1 ${styles.labelSize}`}>
                待ち時間の目安
              </p>
              <p 
                className={`${styles.timeSize} font-bold transition-colors duration-300`}
                style={{ color: theme.accentColor }}
              >
                {store.waitCount === 0 ? "なし" : `約 ${waitTime} 分`}
              </p>
            </div>
            
            {variant === 'detail' && (
               <p className="text-sm text-gray-400 mt-2">
                ※状況により前後することがあります
               </p>
            )}
          </div>
        ) : (
          <div className={variant === 'detail' ? "py-10" : "py-8"}>
            <div className={`mb-4 opacity-30 text-gray-400`}>
               <FontAwesomeIcon icon={faHouseMedical} className={styles.iconSize} />
            </div>
            <p className={`${styles.closedTitleSize} font-bold text-gray-400 mb-4`}>
              {variant === 'detail' ? "本日の受付は終了しました" : "受付終了"}
            </p>
            {variant === 'detail' && (
              <p className="text-gray-400">
                またのご利用をお待ちしております。
              </p>
            )}
          </div>
        )}

        {store.updatedAt && (
          <div className="mt-6 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400 font-mono">
              最終更新：{store.isOpen ? formatTime(store.updatedAt) : formatDateTime(store.updatedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}