"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { usePharmacyStore } from "@/hooks/usePharmacyStore";
import { COLOR_CONFIG } from "@/lib/constants";
// アイコンのインポート
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";

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

  const { storeData, loading: dataLoading, toggleOpen, updateCount, updateAvgTime } = usePharmacyStore(targetStoreId);

  // 設定モーダル用ステート
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputAvgTime, setInputAvgTime] = useState(5);

  // ★ 追加: Wake Lock(画面常時点灯)用のステート
  const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

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

  // モーダル初期値設定
  useEffect(() => {
    if (storeData) {
      setInputAvgTime(storeData.avgTime || 5);
    }
  }, [storeData, isSettingsOpen]);

  // ★ 追加: 画面ロック操作用の関数
  const requestWakeLock = async () => {
    // ブラウザがAPIに対応しているか確認
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        console.log("Screen Wake Lock active: 画面の常時点灯を有効にしました");
      } catch (err) {
        console.error("Wake Lock request failed:", err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        console.log("Screen Wake Lock released: 画面の常時点灯を解除しました");
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  };

  // ★ 追加: タブ切り替えなどでロックが外れた場合、営業中なら再取得を試みる
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && storeData?.isOpen) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [storeData?.isOpen]);


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

  const handleToggleStatus = async () => {
    if (storeData.isOpen && storeData.waitCount > 0) {
      const isConfirmed = window.confirm("閉店（受付終了）に切り替えますか？\n\n※まだ待ち人数が残っていますが、自動的に「0人」にリセットされます。");
      if (!isConfirmed) return;
    }

    // ★ 追加: ボタン操作に合わせてWake Lockを切り替え
    // これから「開店」する場合 -> ロック取得
    // これから「閉店」する場合 -> ロック解除
    if (!storeData.isOpen) {
      await requestWakeLock();
    } else {
      await releaseWakeLock();
    }

    toggleOpen();
  };

  const handleSaveSettings = () => {
    const val = parseInt(inputAvgTime, 10);
    if (!isNaN(val) && val > 0) {
        updateAvgTime(val);
        setIsSettingsOpen(false);
    } else {
        alert("有効な数値を入力してください");
    }
  };

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
  const currentAvgTime = storeData.avgTime || 5;

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
            
            {/* 目安時間表示と歯車アイコン */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <p className="text-xl font-bold text-gray-600">
                目安待ち時間: <span>{storeData.waitCount * currentAvgTime}</span> 分
              </p>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                title="計算設定を変更"
              >
                <FontAwesomeIcon icon={faCog} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 設定用モーダル */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
              設定
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-600 mb-2">
                一人あたりの目安時間
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1"
                  value={inputAvgTime}
                  onChange={(e) => setInputAvgTime(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-xl font-bold text-gray-700 focus:border-blue-500 focus:outline-none text-right"
                />
                <span className="text-gray-500 font-bold">分</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                ※ この時間 × 待ち人数 で全体の待ち時間を計算します。
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                キャンセル
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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