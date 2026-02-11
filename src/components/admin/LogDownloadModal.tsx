"use client";

import { useState } from "react";
import { getDailyLogCsv } from "@/lib/api/report"; // ★追加

interface LogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export default function LogDownloadModal({ isOpen, onClose, storeId }: LogDownloadModalProps) {
  const [targetDate, setTargetDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. CSVデータの取得
      const csvData = await getDailyLogCsv(storeId, targetDate);

      if (!csvData) {
        alert(`${targetDate} のデータは見つかりませんでした。`);
        setLoading(false);
        return;
      }

      // 2. 文字化け防止 (BOM付きUTF-8)
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvData], { type: "text/csv" });

      // 3. ダウンロードリンクの生成とクリック
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log_${storeId}_${targetDate}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // 4. 後片付け
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 完了したら閉じる
      onClose();

    } catch (err) {
      console.error(err);
      alert("ログの取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">業務ログ出力 (CSV)</h3>
          <p className="text-xs text-gray-500 mt-1">指定した日の記録をダウンロードします</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              対象日
            </label>
            <input 
              type="date" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              キャンセル
            </button>
            <button 
              onClick={handleDownload} 
              disabled={loading}
              className={`
                px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-medium
                ${loading ? "opacity-70 cursor-wait" : "hover:bg-blue-700 hover:shadow"}
                transition-all
              `}
            >
              {loading ? "作成中..." : "ダウンロード"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}