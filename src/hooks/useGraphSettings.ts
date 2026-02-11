import { useState, useEffect } from "react";
import { GraphSettings } from "@/types";
import { DEFAULT_GRAPH_INTERVAL } from "@/lib/constants";

const COOKIE_KEY_GRAPH_SETTINGS = "pharmacy_graph_settings";

export const useGraphSettings = () => {
  // 初期値設定
  const [settings, setSettings] = useState<GraphSettings>({
    showNewVisitors: true,
    showMaxWait: true,
    showAvgWait: true,
    graphInterval: DEFAULT_GRAPH_INTERVAL
  });

  // マウント時にCookieから設定を読み込む
  useEffect(() => {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY_GRAPH_SETTINGS + '=([^;]+)'));
      if (match) {
        const savedSettings = JSON.parse(decodeURIComponent(match[2]));
        // 既存の設定にマージ（将来新しい設定項目が増えても壊れないように）
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (e) {
      console.error("Failed to load graph settings from cookie", e);
    }
  }, []);

  // 設定を保存する関数 (State更新 + Cookie保存)
  const saveSettings = (newSettings: GraphSettings) => {
    try {
      // 1. Cookieに保存 (有効期限: 1年)
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `${COOKIE_KEY_GRAPH_SETTINGS}=${encodeURIComponent(JSON.stringify(newSettings))}; expires=${expires.toUTCString()}; path=/`;

      // 2. State更新
      setSettings(newSettings);
    } catch (e) {
      console.error("Failed to save graph settings", e);
    }
  };

  return { 
    settings, 
    saveSettings 
  };
};