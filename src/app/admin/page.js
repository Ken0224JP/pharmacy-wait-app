"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { COLOR_CONFIG } from "@/lib/constants";

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetStoreId = searchParams.get("id");
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { storeData, loading: dataLoading, toggleOpen, updateCount } = usePharmacyStore(targetStoreId);

  useEffect(() => {
    if (targetStoreId) {
      setLoginId(targetStoreId);
    }
  }, [targetStoreId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const email = `${loginId}@pharmacy.local`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(`/admin?id=${loginId}`);
    } catch (err) {
      console.error(err);
      setError("ログインに失敗しました。IDかパスワードを確認してください。");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleToggleStatus = () => {
    if (storeData.isOpen && storeData.waitCount > 0) {
      const isConfirmed = window.confirm("閉店（受付終了）に切り替えますか？\n\n※まだ待ち人数が残っていますが、自動的に「0人」にリセットされます。");
      if (!isConfirmed) return;
    }
    toggleOpen();
  };

  // 状況に応じたカラー設定を取得する関数（Viewと同じロジック）
  const getTheme = () => {
    if (!storeData) return COLOR_CONFIG.closed;
    if (!storeData.isOpen) return COLOR_CONFIG.closed;
    if (storeData.waitCount <= 2) return COLOR_CONFIG.low;
    if (storeData.waitCount <= 5) return COLOR_CONFIG.medium;
    return COLOR_CONFIG.high;
  };

  // --- 表示ロジック ---

  if (authLoading) return <div className="p-10 text-center">認証確認中...</div>;

  if (user && targetStoreId) {
    const loggedInStoreId = user.email.split("@")[0];
    if (loggedInStoreId !== targetStoreId) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">店舗不一致</h2>
            <p className="text-gray-600 mb-6">ログイン中のID: <b>{loggedInStoreId}</b><br/>アクセス先のID: <b>{targetStoreId}</b></p>
            <div className="flex flex-col gap-2">
              <button onClick={() => router.push(`/admin?id=${loggedInStoreId}`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">ログイン中の店舗管理画面へ移動</button>
              <button onClick={handleLogout} className="text-gray-500 underline text-sm mt-2">ログアウトする</button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (!user || !targetStoreId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center text-gray-800">店舗管理ログイン</h1>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2 text-gray-700">店舗ID</label>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full border p-2 rounded bg-gray-50 text-gray-900 placeholder-gray-400" placeholder="IDを入力" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-gray-700">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded text-gray-900 placeholder-gray-400" placeholder="パスワードを入力" />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">ログイン</button>
        </form>
      </div>
    );
  }

  if (dataLoading) return <div className="p-10 text-center">店舗データ読み込み中...</div>;
  if (!storeData) return <div className="p-10 text-center">店舗データが見つかりません (ID: {targetStoreId})</div>;

  const theme = getTheme();

  return (
    <div className="min-h-screen bg-gray-200">
      <header className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-50">
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
        {/* 待ち人数操作パネル */}
        <section className={`transition-opacity duration-300 ${storeData.isOpen ? "opacity-100" : "opacity-50 pointer-events-none grayscale"}`}>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-6">待ち人数の操作</p>
            
            <div className="flex items-center justify-between gap-4">
              {/* 減らすボタン */}
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
              
              {/* 増やすボタン */}
              <button 
                onClick={() => updateCount(true)} 
                className="w-20 h-20 rounded-full bg-white border-2 border-gray-300 text-gray-600 text-4xl font-bold flex items-center justify-center shadow-md hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 active:scale-95 transition-all"
              >
                ＋
              </button>
            </div>
            
            <p className="mt-6 text-xl font-bold text-gray-600">
              目安待ち時間: <span>{storeData.waitCount * 5}</span> 分
            </p>
          </div>
        </section>
      </main>
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