import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { getStoreTheme } from "@/lib/utils";
import { StoreData } from "@/types";

interface HeaderProps {
  storeData: StoreData;
  onToggleStatus: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function Header({ 
  storeData, 
  onToggleStatus, 
  onOpenSettings, 
  onLogout 
}: HeaderProps) {
  const theme = getStoreTheme(
    storeData.isOpen,
    storeData.waitCount,
    storeData.thresholdLow,
    storeData.thresholdMedium
  );

  // 共通のボタン基本スタイル
  const baseBtnClass = "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95";

  return (
    <header className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-40">
      {/* 左端: 店舗名 */}
      <div className="font-bold text-gray-800 text-sm md:text-base w-1/3 truncate">
        {storeData.name}
      </div>

      {/* 中央: 開店閉店切り替えボタン */}
      <div className="w-1/3 flex justify-center">
        <button
          onClick={onToggleStatus}
          className={`
            px-6 py-2 rounded-full font-bold shadow-sm transition-all border text-sm md:text-base whitespace-nowrap
            ${!storeData.isOpen
              ? "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
              : "hover:opacity-90 border-transparent"}
          `}
          style={storeData.isOpen ? {
            backgroundColor: theme.headerBg,
            color: theme.headerText,
          } : {}}
        >
          {storeData.isOpen ? "営業中" : "閉店中"}
        </button>
      </div>

      {/* 右端: 設定 & ログアウト */}
      <div className="w-1/3 flex justify-end items-center">
        <div className="flex items-center gap-1">
          {/* 設定ボタン */}
          <button
            onClick={onOpenSettings}
            className={`${baseBtnClass} text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:scale-110`}
            title="設定"
          >
            <FontAwesomeIcon icon={faCog} size="lg" />
          </button>
          
          {/* ログアウトボタン */}
          <button
            onClick={onLogout}
            className={`${baseBtnClass} text-gray-400 hover:bg-red-50 hover:text-red-500 hover:scale-110`}
            title="ログアウト"
          >
            <FontAwesomeIcon icon={faRightFromBracket} size="lg" />
          </button>
        </div>
      </div>
    </header>
  );
}