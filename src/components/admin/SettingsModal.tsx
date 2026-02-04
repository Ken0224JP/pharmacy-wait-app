"use client";

import { useState, useEffect } from "react";
import { 
  DEFAULT_AVG_WAIT_MINUTES,
  DEFAULT_THRESHOLD_LOW,
  DEFAULT_THRESHOLD_MEDIUM
} from "@/lib/constants";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvgTime: number;
  currentThresholdLow?: number;    // 追加
  currentThresholdMedium?: number; // 追加
  onSave: (settings: { avgTime: number; thresholdLow: number; thresholdMedium: number }) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentAvgTime, 
  currentThresholdLow, 
  currentThresholdMedium, 
  onSave 
}: SettingsModalProps) {
  const [inputAvgTime, setInputAvgTime] = useState<number | string>(DEFAULT_AVG_WAIT_MINUTES);
  const [inputLow, setInputLow] = useState<number | string>(DEFAULT_THRESHOLD_LOW);
  const [inputMedium, setInputMedium] = useState<number | string>(DEFAULT_THRESHOLD_MEDIUM);

  useEffect(() => {
    if (isOpen) {
      setInputAvgTime(currentAvgTime || DEFAULT_AVG_WAIT_MINUTES);
      setInputLow(currentThresholdLow ?? DEFAULT_THRESHOLD_LOW);
      setInputMedium(currentThresholdMedium ?? DEFAULT_THRESHOLD_MEDIUM);
    }
  }, [isOpen, currentAvgTime, currentThresholdLow, currentThresholdMedium]);

  const handleSave = () => {
    const avgVal = Number(inputAvgTime);
    const lowVal = Number(inputLow);
    const medVal = Number(inputMedium);

    if (!isNaN(avgVal) && avgVal > 0 && !isNaN(lowVal) && !isNaN(medVal)) {
      if (lowVal >= medVal) {
        alert("「青→黄」の人数は「黄→赤」の人数より小さく設定してください");
        return;
      }
      onSave({ 
        avgTime: avgVal, 
        thresholdLow: lowVal, 
        thresholdMedium: medVal 
      });
      onClose();
    } else {
      alert("有効な数値を入力してください");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
          店舗設定
        </h3>
        
        {/* 一人あたりの待ち時間 */}
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
          <p className="text-xs text-gray-400 mt-1">
            ※ この時間 × 待ち人数 で待ち時間を計算
          </p>
        </div>

        {/* 混雑表示の閾値設定 */}
        <div className="mb-6 border-t pt-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">混雑表示の色変化</h4>
          
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 mb-1">
              青 <span className="text-gray-400">→</span> 黄 (混雑気味) に変わる人数
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">waiting &gt;</span>
              <input 
                type="number" 
                min="0"
                value={inputLow}
                onChange={(e) => setInputLow(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-2 py-1 w-20 text-lg font-bold text-center focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-gray-600">人</span>
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">
              黄 <span className="text-gray-400">→</span> 赤 (高混雑) に変わる人数
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">waiting &gt;</span>
              <input 
                type="number" 
                min="0"
                value={inputMedium}
                onChange={(e) => setInputMedium(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-2 py-1 w-20 text-lg font-bold text-center focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-gray-600">人</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm">
            キャンセル
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}