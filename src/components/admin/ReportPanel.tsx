"use client";

import { useState, useEffect } from "react";
import { COLOR_CONFIG, RATIO_THRESHOLD_LOW, RATIO_THRESHOLD_MEDIUM } from "@/lib/constants";

const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

interface ReportData {
  date: string;
  avgWaitTime: number;
  totalVisitors: number;
  duration: string;
  openTime: string;
  closeTime: string;
}

interface ReportPanelProps {
  storeId: string;
  settingAvgTime: number;
}

export default function ReportPanel({ storeId, settingAvgTime }: ReportPanelProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!storeId || !GAS_API_URL) return;

      try {
        setLoading(true);
        const url = `${GAS_API_URL}?storeId=${storeId}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Network response was not ok");
        
        const data = await res.json();
        setReport(data);
        setError(false);
      } catch (err) {
        console.error("GAS Fetch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [storeId]);

  const getWaitTimeColor = (actualTime: number) => {
    if (!settingAvgTime || settingAvgTime <= 0) return COLOR_CONFIG.low.accentColor;

    const ratio = actualTime / settingAvgTime;

    if (ratio <= RATIO_THRESHOLD_LOW) {
      return COLOR_CONFIG.low.accentColor;
    } else if (ratio <= RATIO_THRESHOLD_MEDIUM) {
      return COLOR_CONFIG.medium.accentColor;
    } else {
      return COLOR_CONFIG.high.accentColor;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6 shadow-sm min-h-[200px]">
       {/* UI部分は変更なしのため省略なしでそのまま記述 */}
       {/* ... (元のJSXをそのまま維持) ... */}
       <div className="flex justify-between items-center pb-4 mb-4 min-h-[3rem]">
        <h3 className="font-bold text-gray-700 text-lg">直近の営業実績</h3>
        
        <div className="text-right">
          {!loading && report?.date && (
            <span className="text-gray-400 text-lg animate-fade-in">
              {report.date}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">データを集計中...</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-10 text-red-400 text-sm">
          <p>レポートの取得に失敗しました</p>
          <button onClick={() => window.location.reload()} className="mt-2 underline text-xs">再読み込み</button>
        </div>
      )}

      {!loading && !error && (!report || !report.date) && (
        <div className="text-center py-10 text-gray-400 text-sm">
          直近の営業データが見つかりませんでした
        </div>
      )}

      {!loading && !error && report && report.date && (
        <div className="animate-fade-in">
          <div className="flex justify-center divide-x divide-gray-200 mb-6">            
            <div className="w-1/2 text-center px-2">
              <p className="text-gray-500 mb-1">平均待ち時間</p>
              <p 
                className="text-7xl font-bold transition-colors duration-300"
                style={{ color: getWaitTimeColor(report.avgWaitTime) }}
              >
                {report.avgWaitTime}<span className="text-sm text-gray-400 ml-1">分</span>
              </p>
              {settingAvgTime > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  (設定：{settingAvgTime}分)
                </p>
              )}
            </div>

            <div className="w-1/2 text-center px-2">
              <p className="text-gray-500 mb-1">総受付人数</p>
              <p className="text-7xl font-bold text-gray-800">
                {report.totalVisitors}<span className="text-sm text-gray-400 ml-1">人</span>
              </p>
            </div>
          </div>

          <div className="text-center bg-gray-50 rounded-lg py-3 mb-2">
            <p className="text-sm font-bold text-gray-600">
              営業時間：{report.duration} <span className="font-normal text-gray-500 ml-1">({report.openTime}〜{report.closeTime})</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}