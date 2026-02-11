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

  // 営業中は画面スリープを防止
  useWakeLock(storeData?.isOpen || false);

  // --- 2. Local State (モーダルの開閉管理) ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

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