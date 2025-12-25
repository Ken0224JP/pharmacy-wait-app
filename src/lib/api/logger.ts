const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

export const sendGasLog = async (storeId: string, action: string, resultCount: number) => {
  if (!GAS_API_URL) {
    console.warn("GAS_API_URL is not defined in environment variables.");
    return;
  }

  try {
    await fetch(GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, action, resultCount })
    });
  } catch (err) {
    console.error("Failed to send GAS log:", err);
    // 将来的にSentryなどのエラー監視を入れる場合はここに記述
  }
};