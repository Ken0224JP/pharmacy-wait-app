/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← これを追加（静的書き出しモードにする）
  trailingSlash: false,
  // 画像最適化機能を無効化（Static Exportでは使えないため）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;