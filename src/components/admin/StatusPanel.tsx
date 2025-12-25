"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { getStoreTheme, calculateWaitTime } from "@/lib/utils";
import { StoreData } from "@/types";

interface StatusPanelProps {
  storeData: StoreData;
  updateCount: (isIncrement: boolean) => void;
  onOpenSettings: () => void;
}

export default function StatusPanel({ storeData, updateCount, onOpenSettings }: StatusPanelProps) {
  const theme = getStoreTheme(storeData.isOpen, storeData.waitCount);
  const waitTime = calculateWaitTime(storeData.waitCount, storeData.avgTime);

  return (
    <section className={`transition-opacity duration-300 ${storeData.isOpen ? "opacity-100" : "opacity-50 pointer-events-none grayscale"}`}>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-6">待ち人数の操作</p>
        
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={() => updateCount(false)} 
            disabled={storeData.waitCount <= 0} 
            className="w-20 h-20 rounded-full bg-white border-2 border-gray-300 text-gray-600 text-4xl font-bold flex items-center justify-center shadow-md hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            －
          </button>
          
          <div className="flex-1">
            <span 
              className="text-6xl font-bold transition-colors duration-300"
              style={{ color: theme.accentColor }}
            >
              {storeData.waitCount}
            </span>
            <span className="text-gray-500 ml-1">人</span>
          </div>
          
          <button 
            onClick={() => updateCount(true)} 
            className="w-20 h-20 rounded-full bg-white border-2 border-gray-300 text-gray-600 text-4xl font-bold flex items-center justify-center shadow-md hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 active:scale-95 transition-all"
          >
            ＋
          </button>
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-2">
          <p className="text-xl font-bold text-gray-600">
            目安待ち時間: <span>{waitTime}</span> 分
          </p>
          <button 
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            title="計算設定を変更"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>
    </section>
  );
}