"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { useWakeLock } from "@/hooks/useWakeLock";

import LoginForm from "@/components/admin/LoginForm";
import Header from "@/components/admin/Header";
import StatusPanel from "@/components/admin/StatusPanel";
import SettingsModal from "@/components/admin/SettingsModal";
import ReportPanel from "@/components/admin/ReportPanel";

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetStoreId = searchParams.get("id");
  const auth = getAuth();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { storeData, loading: dataLoading, toggleOpen, updateCount, updateSettings } = usePharmacyStore(targetStoreId);

  useWakeLock(storeData?.isOpen || false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/admin");
  };

  const handleToggleStatus = async () => {
    if (!storeData) return;
    
    if (storeData.isOpen && storeData.waitCount > 0) {
      const isConfirmed = window.confirm("閉店（受付終了）に切り替えますか？\n\n※まだ待ち人数が残っていますが、自動的に「0人」にリセットされます。");
      if (!isConfirmed) return;
    }
    toggleOpen();
  };

  if (authLoading) return <div className="p-10 text-center">認証確認中...</div>;

  if (!user || !targetStoreId) {
    return <LoginForm />;
  }

  const loggedInStoreId = user.email ? user.email.split("@")[0] : "";
  if (loggedInStoreId !== targetStoreId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">店舗不一致</h2>
          <button onClick={() => router.push(`/admin?id=${loggedInStoreId}`)} className="bg-blue-600 text-white px-4 py-2 rounded">ログイン中の店舗へ移動</button>
        </div>
      </div>
    );
  }

  if (dataLoading) return <div className="p-10 text-center">店舗データ読み込み中...</div>;
  if (!storeData) return <div className="p-10 text-center">店舗データが見つかりません (ID: {targetStoreId})</div>;

  return (
    <div className="min-h-screen bg-gray-200 relative">
      {/* Headerコンポーネントを使用 */}
      <Header 
        storeData={storeData}
        onToggleStatus={handleToggleStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-md mx-auto p-6 mt-6 space-y-8 ">
        {storeData.isOpen ? (
          <StatusPanel 
            storeData={storeData} 
            updateCount={updateCount}
            // onOpenSettings はHeaderに移ったため削除
          />
        ) : (
          <ReportPanel 
            store={{ ...storeData, id: targetStoreId }} 
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAvgTime={storeData.avgTime}
        currentThresholdLow={storeData.thresholdLow}
        currentThresholdMedium={storeData.thresholdMedium}
        onSave={updateSettings}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">読み込み中...</div>}>
      <AdminContent />
    </Suspense>
  );
}