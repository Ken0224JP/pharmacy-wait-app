"use client";

import { useState, useEffect } from "react";
import { 
  DEFAULT_AVG_WAIT_MINUTES,
  DEFAULT_THRESHOLD_LOW,
  DEFAULT_THRESHOLD_MEDIUM,
  COLOR_CONFIG // constants.ts から色設定をインポート
} from "@/lib/constants";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvgTime: number;
  currentThresholdLow?: number;
  currentThresholdMedium?: number;
  // page.tsx 等の実装に合わせてオブジェクト形式でデータを渡します
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
  const [avgTime, setAvgTime] = useState<number | string>(DEFAULT_AVG_WAIT_MINUTES);
  const [thresholdLow, setThresholdLow] = useState<number | string>(DEFAULT_THRESHOLD_LOW);
  const [thresholdMedium, setThresholdMedium] = useState<number | string>(DEFAULT_THRESHOLD_MEDIUM);

  useEffect(() => {
    if (isOpen) {
      setAvgTime(currentAvgTime || DEFAULT_AVG_WAIT_MINUTES);
      setThresholdLow(currentThresholdLow ?? DEFAULT_THRESHOLD_LOW);
      setThresholdMedium(currentThresholdMedium ?? DEFAULT_THRESHOLD_MEDIUM);
    }
  }, [isOpen, currentAvgTime, currentThresholdLow, currentThresholdMedium]);

  const handleSave = () => {
    const avgVal = Number(avgTime);
    const lowVal = Number(thresholdLow);
    const medVal = Number(thresholdMedium);

    if (!isNaN(avgVal) && avgVal > 0 && !isNaN(lowVal) && !isNaN(medVal)) {
      // バリデーション: 低の閾値 < 中の閾値 である必要があります
      if (lowVal >= medVal) {
        alert("「混雑度：低」の人数は「混雑度：中」の人数より小さく設定してください");
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
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-800">
            店舗設定
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        
        {/* 一人あたりの待ち時間 */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            一人あたりの目安時間 (分)
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              inputMode="numeric"
              min="1"
              value={avgTime}
              onChange={(e) => setAvgTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-24 text-lg font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
            />
            <span className="text-gray-600 font-bold">分</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ※ この値 × 待ち人数 で「目安待ち時間」が計算されます。
          </p>
        </div>

        {/* 混雑状況に応じた色変化の閾値 */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-800 mb-3">混雑状況に応じた色変化の閾値</h4>
          
          {/* カラーバー */}
          <div className="flex w-full h-10 rounded-lg overflow-hidden text-xs md:text-sm text-white font-bold shadow-sm mb-3">
            {/* 低 (青) */}
            <div 
              className="flex-1 flex items-center justify-center"
              style={{ backgroundColor: COLOR_CONFIG.low.headerBg }}
            >
              混雑度：低
            </div>
            {/* 中 (黄) */}
            <div 
              className="flex-1 flex items-center justify-center"
              style={{ backgroundColor: COLOR_CONFIG.medium.headerBg }}
            >
              混雑度：中
            </div>
            {/* 高 (赤) */}
            <div 
              className="flex-1 flex items-center justify-center"
              style={{ backgroundColor: COLOR_CONFIG.high.headerBg }}
            >
              混雑度：高
            </div>
          </div>

          {/* 入力フィールド */}
          <div className="flex w-full gap-2">
            {/* 青の下 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 justify-center w-full">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={thresholdLow}
                  onChange={(e) => setThresholdLow(e.target.value)}
                  className="w-full max-w-[4rem] p-2 border border-gray-300 rounded text-center font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">人まで</span>
              </div>
            </div>

            {/* 黄色の下 */}
            <div className="flex-1 flex flex-col items-center border-l border-r border-gray-100 px-1">
              <div className="flex items-center gap-1 justify-center w-full">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={thresholdMedium}
                  onChange={(e) => setThresholdMedium(e.target.value)}
                  className="w-full max-w-[4rem] p-2 border border-gray-300 rounded text-center font-bold text-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
                />
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">人まで</span>
              </div>
            </div>

            {/* 赤の下 */}
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              それ以上
            </div>
          </div>
          
          <p className="mt-3 text-xs text-gray-500 mt-1">
            ※ 待ち人数に応じて背景や文字の色が変化します。
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}