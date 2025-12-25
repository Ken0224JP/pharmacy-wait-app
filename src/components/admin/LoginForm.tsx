"use client";

import { useState, FormEvent } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const auth = getAuth();

  const handleLogin = async (e: FormEvent) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center text-gray-800">店舗管理ログイン</h1>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2 text-gray-700">店舗ID</label>
          <input 
            type="text" 
            value={loginId} 
            onChange={(e) => setLoginId(e.target.value)} 
            className="w-full border p-2 rounded bg-gray-50 text-gray-900 placeholder-gray-400" 
            placeholder="IDを入力" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-gray-700">パスワード</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full border p-2 rounded text-gray-900 placeholder-gray-400" 
            placeholder="パスワードを入力" 
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}