"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGraphSettings } from "@/hooks/useGraphSettings";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { useWakeLock } from "@/hooks/useWakeLock";
import { GraphSettings } from "@/types";

import LoginForm from "@/components/admin/LoginForm";
import Header from "@/components/admin/Header";
import StatusPanel from "@/components/admin/StatusPanel";
import ReportPanel from "@/components/admin/ReportPanel";
import SettingsModal from "@/components/admin/SettingsModal";
import LogDownloadModal from "@/components/admin/LogDownloadModal";

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetStoreId = searchParams.get("id");

  // --- 1. Custom Hooks (ロジックの注入) ---
  const { user, loading: authLoading, isMismatch, logout } = useAdminAuth(targetStoreId);
  const { settings: graphSettings, saveSettings: saveGraphSettings } = useGraphSettings();
  const { storeData, loading: dataLoading, toggleOpen, updateCount, updateSettings } = usePharmacyStore(targetStoreId);

  // --- 2. Local State (モーダルの開閉管理とWakeLockの制御) ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  // 常時点灯（Wake Lock）の手動切り替え用ステート
  const [isWakeLockEnabled, setIsWakeLockEnabled] = useState(false);
  
  // storeData?.isOpen ではなく、手動切り替えのステートを渡す
  const { isLocked } = useWakeLock(isWakeLockEnabled);

  // --- 3. Event Handlers ---
  
  // 開店・閉店の切り替え（確認ダイアログ付き）
  const handleToggleStatus = async () => {
    if (!storeData) return;
    
    if (storeData.isOpen && storeData.waitCount > 0) {
      const isConfirmed = window.confirm("閉店（受付終了）に切り替えますか？\n\n※まだ待ち人数が残っていますが、自動的に「0人」にリセットされます。");
      if (!isConfirmed) return;
    }
    toggleOpen();
  };

  // 設定の一括保存 (Firestore + Cookie)
  const handleSaveSettings = async (
    storeSettings: { avgTime: number; thresholdLow: number; thresholdMedium: number },
    localSettings: GraphSettings
  ) => {
    await updateSettings(storeSettings);
    saveGraphSettings(localSettings);
  };

  // --- 4. Render Guards (条件分岐による表示切り替え) ---

  // 認証チェック中
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">認証確認中...</div>;
  }

  // 未ログイン -> ログインフォーム
  if (!user || !targetStoreId) {
    return <LoginForm />;
  }

  // 店舗ID不一致 (ログイン中のIDとURLのIDが違う)
  if (isMismatch) {
    const loggedInStoreId = user.email?.split("@")[0] || "";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">店舗不一致</h2>
          <p className="text-gray-600 mb-6">ログイン中のアカウントでは、この店舗ページ（{targetStoreId}）にアクセスできません。</p>
          <button 
            onClick={() => router.push(`/admin?id=${loggedInStoreId}`)} 
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
          >
            ログイン中の店舗へ移動
          </button>
        </div>
      </div>
    );
  }

  // 店舗データ読み込み中
  if (dataLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">店舗データ読み込み中...</div>;
  }

  // 店舗データが見つからない
  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="text-center text-gray-500">
          <p>店舗データが見つかりません</p>
          <p className="text-sm mt-1">(ID: {targetStoreId})</p>
        </div>
      </div>
    );
  }

  // --- 5. Main Render (正常表示) ---
  return (
    <div className="min-h-screen bg-gray-200 relative pb-20">
      {/* ヘッダー (メニュー操作はここから) */}
      <Header 
        storeData={storeData}
        onToggleStatus={handleToggleStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        onLogout={logout}
      />

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto pt-6 px-6 space-y-8 animate-fade-in">
        {storeData.isOpen ? (
          <StatusPanel 
            storeData={storeData} 
            updateCount={updateCount}
          />
        ) : (
          <ReportPanel 
            store={{ ...storeData, id: targetStoreId }} 
            graphSettings={graphSettings} 
          />
        )}
      </main>

      {/* 常時点灯（Wake Lock）切り替え用のフローティングボタン */}
      <button
        onClick={() => setIsWakeLockEnabled(!isWakeLockEnabled)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 opacity-40 hover:opacity-100 z-50 ${
          isLocked 
            ? "bg-blue-600 text-white shadow-blue-500/30" 
            : "bg-gray-500 text-white"
        }`}
        title={isLocked ? "常時点灯を解除" : "画面を常時点灯にする"}
      >
        {isLocked ? (
          /* ONのアイコン（太陽） */
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 21v-2.25m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
          </svg>
        ) : (
          /* OFFのアイコン（月） */
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        )}
      </button>

      {/* 設定モーダル */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAvgTime={storeData.avgTime}
        currentThresholdLow={storeData.thresholdLow}
        currentThresholdMedium={storeData.thresholdMedium}
        currentGraphSettings={graphSettings}
        onSave={handleSaveSettings}
      />

      {/* 業務ログ出力モーダル */}
      <LogDownloadModal 
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        storeId={targetStoreId}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <AdminContent />
    </Suspense>
  );
}
