"use client";

import { useState, useEffect, useRef } from "react";
import { COLOR_CONFIG, RATIO_THRESHOLD_LOW, RATIO_THRESHOLD_MEDIUM } from "@/lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUsers, faSquarePollVertical } from "@fortawesome/free-solid-svg-icons";
import { getLatestReport } from "@/lib/api/report";
import { DailyStats, Store, GraphSettings } from "@/types";
import CongestionGraph from "./CongestionGraph";

interface ReportPanelProps {
  store: Store | null;
  graphSettings: GraphSettings;
}

export default function ReportPanel({ store, graphSettings }: ReportPanelProps) {
  const [report, setReport] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const lastFetchedStoreId = useRef<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!store) return;
      try {
        setLoading(true);
        setError(false);
        const data = await getLatestReport(store);
        setReport(data);
      } catch (err) {
        console.error("Report Fetch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    const isStoreChanged = lastFetchedStoreId.current !== store?.id;    
    const isClosed = store?.isOpen === false;

    if (store?.id && (isStoreChanged || isClosed)) {
      fetchReport();
      lastFetchedStoreId.current = store.id;
    }    
  }, [store?.id, store?.isOpen]); 

  if (!store) return null;

  const settingAvgTime = store.avgTime;

  const getWaitTimeColor = (actualTime: number) => {
    if (!settingAvgTime || settingAvgTime <= 0) return COLOR_CONFIG.low.accentColor;
    
    const ratio = actualTime / settingAvgTime;
    
    if (ratio <= RATIO_THRESHOLD_LOW) return COLOR_CONFIG.low.accentColor;
    else if (ratio <= RATIO_THRESHOLD_MEDIUM) return COLOR_CONFIG.medium.accentColor;
    else return COLOR_CONFIG.high.accentColor;
  };

  // グラフを表示するかどうかの判定
  // データが存在し、かつ、表示項目が少なくとも1つ有効な場合のみ表示
  const shouldShowGraph = 
    !loading && 
    !error && 
    report?.graphData && 
    report.graphData.length > 0 &&
    (graphSettings.showNewVisitors || graphSettings.showMaxWait || graphSettings.showAvgWait);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6 shadow-sm min-h-[200px]">
       <div className="flex justify-between items-center pb-4 mb-4 min-h-[3rem]">
        <h3 className="font-bold text-gray-700 text-lg">直近の営業実績</h3>
        <div className="text-right">
          {!loading && (report?.date || store.updatedAt) && (
            <span className="text-gray-400 text-lg animate-fade-in">
              {report?.date || store.updatedAt?.toDate().toLocaleDateString("ja-JP")}
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

      {!loading && !error && !report && (
        <div className="text-center py-10 text-gray-400 text-sm">
          データが見つかりませんでした
        </div>
      )}

      {!loading && !error && report && (
        <div className="animate-fade-in">
          <div className="flex justify-center divide-x divide-gray-200 mb-6">            
            <div className="w-1/2 text-center px-2">
              <div className="text-gray-500 mb-2 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">平均待ち時間</span>
              </div>
              
              <p 
                className="text-7xl font-bold transition-colors duration-300"
                style={{ color: getWaitTimeColor(report.dailyAvgWaitTime) }}
              >
                {report.dailyAvgWaitTime}<span className="text-sm text-gray-400 ml-1">分</span>
              </p>
              {settingAvgTime > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  (設定：{settingAvgTime}分)
                </p>
              )}
            </div>

            <div className="w-1/2 text-center px-2">
              <div className="text-gray-500 mb-2 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">総受付人数</span>
              </div>

              <p className="text-7xl font-bold text-gray-800">
                {report.dailyTotalVisitors}<span className="text-sm text-gray-400 ml-1">人</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                  (最大同時待ち：{report.dailyMaxWaitCount}人)
              </p>
            </div>
          </div>

          <div className="text-center bg-gray-100 rounded-lg py-3 mb-2">
            <p className="text-sm font-bold text-gray-600">
              営業時間：{report.duration} 
              {report.openTime && report.closeTime && (
                <span className="font-normal text-gray-500 ml-1">
                  ({report.openTime}〜{report.closeTime})
                </span>
              )}
            </p>
          </div>

          {/* グラフ表示条件を満たす場合のみ描画 */}
          {shouldShowGraph && (
            <div className="pt-3">
              <div className="text-gray-500 px-2 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faSquarePollVertical} className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">時間帯別混雑状況</span>
              </div>
              <CongestionGraph data={report.graphData} settings={graphSettings} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}