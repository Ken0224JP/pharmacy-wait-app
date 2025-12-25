"use client";

import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvgTime: number;
  onSave: (newTime: string) => void; // Hook側の仕様に合わせてstringで渡すか、numberに統一するか要調整。ここではHookがstringを受け取る想定で
}

export default function SettingsModal({ isOpen, onClose, currentAvgTime, onSave }: SettingsModalProps) {
  const [inputAvgTime, setInputAvgTime] = useState<number | string>(5);

  useEffect(() => {
    if (isOpen) {
      setInputAvgTime(currentAvgTime || 5);
    }
  }, [isOpen, currentAvgTime]);

  const handleSave = () => {
    const val = parseInt(String(inputAvgTime), 10);
    if (!isNaN(val) && val > 0) {
      // usePharmacyStoreのupdateAvgTimeはstringを期待している(Step1のコード参照)ため文字列化
      onSave(String(val));
      onClose();
    } else {
      alert("有効な数値を入力してください");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      {/* 中身は変更なし */}
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
            onClick={onClose}
            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}