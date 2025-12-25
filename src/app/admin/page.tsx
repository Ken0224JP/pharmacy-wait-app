"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { getStoreTheme } from "@/lib/utils";
import { useWakeLock } from "@/hooks/useWakeLock";

import LoginForm from "@/components/admin/LoginForm";
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

  const { storeData, loading: dataLoading, toggleOpen, updateCount, updateAvgTime } = usePharmacyStore(targetStoreId);

  useWakeLock(storeData?.isOpen || false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = () => signOut(auth);

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

  // user.email が null の場合のガードも念のため
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

  const theme = getStoreTheme(storeData.isOpen, storeData.waitCount);

  return (
    <div className="min-h-screen bg-gray-200 relative">
      <header className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="font-bold text-gray-800 text-sm md:text-base w-1/3 truncate">
          {storeData.name}
        </div>
        <div className="w-1/3 flex justify-center">
          <button 
            onClick={handleToggleStatus}
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
        <div className="w-1/3 flex justify-end">
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 underline">
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 mt-6 space-y-8 ">
        {storeData.isOpen ? (
          <StatusPanel 
            storeData={storeData} 
            updateCount={updateCount} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : (
          <ReportPanel 
            storeId={targetStoreId} 
            settingAvgTime={storeData.avgTime} 
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAvgTime={storeData.avgTime}
        onSave={updateAvgTime}
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