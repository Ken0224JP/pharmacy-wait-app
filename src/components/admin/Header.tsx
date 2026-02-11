import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faFileCsv, faCog, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { getStoreTheme } from "@/lib/utils";
import { StoreData } from "@/types";

interface HeaderProps {
  storeData: StoreData;
  onToggleStatus: () => void;
  onOpenSettings: () => void;
  onOpenLogs: () => void;
  onLogout: () => void;
}

export default function Header({ 
  storeData, 
  onToggleStatus, 
  onOpenSettings, 
  onOpenLogs,
  onLogout 
}: HeaderProps) {
  const theme = getStoreTheme(
    storeData.isOpen,
    storeData.waitCount,
    storeData.thresholdLow,
    storeData.thresholdMedium
  );

  const [isInactive, setIsInactive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 放置警告ロジック
  useEffect(() => {
    const checkInactivity = () => {
      if (!storeData.isOpen || !storeData.updatedAt) {
        setIsInactive(false);
        return;
      }
      const lastUpdate = storeData.updatedAt.toMillis();
      const now = Date.now();
      const diff = now - lastUpdate;
      setIsInactive(diff >= 15*60*1000);
    };
    checkInactivity();
    const intervalId = setInterval(checkInactivity, 60000);
    return () => clearInterval(intervalId);
  }, [storeData.isOpen, storeData.updatedAt]);

  // メニュー外クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      onLogout();
    }
  };

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
            ${isInactive ? "animate-pulse" : ""} 
          `}
          style={storeData.isOpen ? {
            backgroundColor: theme.headerBg,
            color: theme.headerText,
          } : {}}
        >
          {storeData.isOpen ? "営業中" : "閉店中"}
        </button>
      </div>

      {/* 右端: ハンバーガーメニュー */}
      <div className="w-1/3 flex justify-end relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="メニューを開く"
        >
          <FontAwesomeIcon icon={faBars} size="lg" className="text-gray-600" />
        </button>

        {/* ドロップダウンメニュー */}
        {isMenuOpen && (
          <div className="absolute top-12 right-0 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-fade-in-down">
            {/* 業務ログ出力 */}
            <button 
              onClick={() => { setIsMenuOpen(false); onOpenLogs(); }} 
              className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
            >
              <div className="w-6 text-center"><FontAwesomeIcon icon={faFileCsv} className="text-gray-400" /></div>
              <span>業務ログ出力</span>
            </button>
            
            {/* 店舗設定 */}
            <button 
              onClick={() => { setIsMenuOpen(false); onOpenSettings(); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
            >
              <div className="w-6 text-center"><FontAwesomeIcon icon={faCog} className="text-gray-400" /></div>
              <span>店舗設定</span>
            </button>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            {/* ログアウト */}
            <button 
              onClick={() => { setIsMenuOpen(false); handleLogout(); }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
            >
              <div className="w-6 text-center"><FontAwesomeIcon icon={faRightFromBracket} /></div>
              <span>ログアウト</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}