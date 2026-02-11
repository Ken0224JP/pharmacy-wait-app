"use client";

import { useState } from "react";
import { getRangeLogCsv } from "@/lib/api/report";
import RangeCalendar from "./RangeCalendar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";

interface LogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export default function LogDownloadModal({ isOpen, onClose, storeId }: LogDownloadModalProps) {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      alert("期間を選択してください。");
      return;
    }
    
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    setLoading(true);
    try {
      const csvData = await getRangeLogCsv(storeId, startStr, endStr);

      if (!csvData) {
        alert(`${startStr} 〜 ${endStr} のデータは見つかりませんでした。`);
        setLoading(false);
        return;
      }

      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log_${storeId}_${startStr}_to_${endStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0 shadow-[0_0_6px_0_rgba(0,0,0,0.15)] bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-gray-800">ログ出力</h3>
            <p className="text-xs text-gray-500 mt-0.5">出力したい期間を選択してください</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="p-6 overflow-y-auto">
          
          {/* 選択範囲表示 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-blue-600 font-bold tracking-wider uppercase mb-1">出力対象期間</span>
            <div className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>{startDate ? formatDisplayDate(startDate) : "選択なし"}</span>
              <span className="text-gray-400">〜</span>
              <span>{endDate ? formatDisplayDate(endDate) : "選択なし"}</span>
            </div>
          </div>

          {/* カレンダー */}
          <div className="border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-2">
            <RangeCalendar 
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            ※ 開始日をクリックし、次に終了日をクリックしてください
          </p>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 flex justify-end gap-3 p-6 border-t border-gray-200 shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 border border-gray-300 bg-white font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            キャンセル
          </button>
          <button 
            onClick={handleDownload} 
            disabled={loading || !startDate || !endDate}
            className={`
              px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md font-bold text-sm flex items-center gap-2
              ${(loading || !startDate || !endDate) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5"}
              transition-all
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                作成中...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} />
                <span>CSVをダウンロード</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}