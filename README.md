# **薬局待ち時間表示アプリ**

近隣薬局の混雑状況や待ち時間をリアルタイムで可視化・管理するためのWebアプリケーションです。  
患者様（ユーザー）はスマホ等から各薬局の待ち状況を確認でき、薬局側（管理者）はタブレット等で簡単に状況を更新できます。  
また、簡易的な直近の営業日の平均待ち時間や来局状況の集計の表示機能もあります。

## **概要**

このアプリは、Next.js と Firebase を使用して構築されています。  
リアルタイムデータベース（Firestore）を利用しているため、薬局側での操作は即座にユーザー画面に反映されます。  

### **主な機能**

#### **ユーザー向け機能 (患者様)**

* **店舗一覧表示**: 登録されている薬局の一覧と、現在の営業状況（営業中/受付終了）、待ち人数を表示します。  
* **詳細画面**: 特定の薬局の「現在の待ち人数」と「目安の待ち時間（人数 × 5分）」を大きく表示します。  
* **混雑状況の可視化**: 待ち人数に応じて背景色が変化し、混雑具合を直感的に把握できます。  
  * 🟢 空き (0-2人)  
  * 🟡 やや混雑 (3-5人)  
  * 🔴 混雑 (6人以上)  
  * ⚪ 閉店/受付終了  
※上記の人数はデフォルト値です。店舗ごとに個別に変更可能です。  

#### **管理者向け機能 (薬局スタッフ)**

* **店舗管理ログイン**: 店舗IDとパスワードによる認証。  
* **ステータス管理**:  
  * **人数の増減**: 「＋」「－」ボタンで待ち人数を簡単に操作。  
  * **開店/閉店切り替え**: ワンタップで営業中と受付終了を切り替え。閉店操作時に人数を自動リセットする安全機能付き。  
  * **店舗ごとの設定カスタマイズ**: 状況に応じて、一人当たり待ち時間目安や混雑状況の色の切り替え閾値を設定・変更できます。  
  * **自動ロック回避（Wake Lock）**: ブラウザが対応している場合、管理画面で店舗ステータスが「開店（Open）」の間、デバイスの自動スリープ（画面ロック）を防止します。  
* **ログ記録**: 操作内容（OPEN, CLOSE, INCREMENT, DECREMENT）と操作後の人数をFirestoreに自動記録。
* **簡易集計機能**: 閉局中は、直近営業日の平均待ち時間・総受付人数・営業時間のまとめを表示。

## **技術スタック**

* **フレームワーク**: Next.js 16 (App Router)  
* **言語**: Typescript  
* **スタイリング**: Tailwind CSS  
* **バックエンド (BaaS)**: Firebase  
  * **Authentication**: メール/パスワード認証  
  * **Firestore**: リアルタイムデータベース & ログ基盤
* **その他**: FontAwesome (アイコン)

## **Firebase データベース設計 & 設定**

本アプリのバックエンド設定詳細です。Firebaseコンソールで以下の通り設定を行ってください。

### **1\. Authentication (認証)**

管理画面へのログインに、内部処理としては Email/Password認証 を使用しています。  
運用ルールとして、以下の形式でアカウントを作成してください（店舗IDとメールアドレスを紐付けるため）。

* **メールアドレス**: {店舗ID}@pharmacy.local  
  * 例: 店舗IDが store\_xxx の場合 → store\_xxx@pharmacy.local  
* **パスワード**: 任意のセキュアなパスワード

### **2\. Firestore Data Model**

#### stores Collection
公開用の店舗データです。誰でも読み取り可能です。  
  * **Collection**: stores  
  * **Document ID**: {storeId} (例: store\_xxx)

| Field Name | Type | Description |
| :---- | :---- | :---- |
| name | string | 表示される店舗名 |
| isOpen | boolean | 営業中フラグ (true: 営業中, false: 受付終了) |
| waitCount | number | 現在の待ち人数 |
| updatedAt | timestamp | 最終更新日時 |
| avgTime | number | 店舗設定：一人当たり待ち時間(分) |
| thresholdLow | number | 店舗設定：混雑状況 低 の上限(人) |
| thresholdMedium | number | 店舗設定：混雑状況 中 の上限(人) |

#### dailyLogs Collection
操作ログを保存します。一般ユーザーからは読み取れないのはもちろん、管理者も削除は不可としています。  
  * **Collection**: dailyLogs  
  * **Document ID**: Document ID: {YYYY-MM-DD}_{storeId} (例: 2025-12-25_store_xxx)  
1日分の操作ログを1つのドキュメント内の配列として保存(日次バケット)し、読み取り回数を削減します。

| Field Name | Type | Description |
| :---- | :---- | :---- |
| storeId | string | 店舗ID |
| date | string | 日付文字列 (YYYY-MM-DD) |
| updatedAt | timestamp | ドキュメント更新日時 |
| logs | array | 操作ログの配列 |
| └ [].action | string | 操作内容 (OPEN, CLOSE, INCREMENT, DECREMENT) |
| └ [].resultCount | number | 操作後の待ち人数 |
| └ [].timestamp | number | タイムスタンプ (ミリ秒) |

### **3\. Firestore Security Rules**

セキュリティルールは最低でも以下のように設定し、必要に応じて適宜強化してください。  
基本的に「ログイン中のメールアドレスの@前の部分」 と 「書き込もうとしているドキュメントID」 が一致する場合のみ書き込みを許可する設定になっています。  
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================================
    // 共通関数
    // =========================================================

    // 店舗オーナーかどうか判定
    function isStoreOwner(storeId) {
      return request.auth != null 
          && request.auth.token.email == storeId + "@pharmacy.local";
    }

    // =========================================================
    // 1. 店舗データ (stores)
    // =========================================================
    match /stores/{storeId} {
      // 誰でも読み取りOK (表示用)
      allow read: if true;

      // 更新: オーナーのみ
      allow update: if isStoreOwner(storeId)
                    // 型チェック
                    && (!('waitCount' in request.resource.data) || request.resource.data.waitCount is int)
                    && (!('isOpen' in request.resource.data) || request.resource.data.isOpen is bool)
                    && (!('avgTime' in request.resource.data) || request.resource.data.avgTime is number)
                    && (!('thresholdLow' in request.resource.data) || request.resource.data.thresholdLow is number)
                    && (!('thresholdMedium' in request.resource.data) || request.resource.data.thresholdMedium is number)
    }

    // =========================================================
    // 2. 日次ログ (dailyLogs)
    // =========================================================
    match /dailyLogs/{logId} {

      // ログのデータ構造チェック
      function isValidLogSchema(data) {
        return data.storeId is string
            && data.date is string
            && data.date.matches('^\\d{4}-\\d{2}-\\d{2}$') // YYYY-MM-DD
            && data.logs is list
            && data.updatedAt is timestamp;
      }

      // Read
      allow read: if isStoreOwner(resource.data.storeId);

      // Create
      allow create: if isStoreOwner(request.resource.data.storeId)
                    && isValidLogSchema(request.resource.data)
                    && request.resource.data.updatedAt == request.time;

      // Update
      allow update: if isStoreOwner(resource.data.storeId)
                    && isValidLogSchema(request.resource.data)
                    // 改ざん防止
                    && request.resource.data.storeId == resource.data.storeId
                    && request.resource.data.date == resource.data.date
                    // 削除防止 (ログ配列のサイズが増えていること)
                    && request.resource.data.logs.size() > resource.data.logs.size()
                    && request.resource.data.updatedAt == request.time;
      
      // Delete (禁止)
      allow delete: if false;
    }
  }
}
```

## **セットアップ手順**

### **1\. リポジトリのクローン**

```bash
git clone <repository-url>  
cd pharmacy-wait-app
```

### **2\. 依存関係のインストール**

```bash
npm install
```

### **3\. 環境変数の設定**

ルートディレクトリに .env.local ファイルを作成し、以下の環境変数を設定してください。  

```
# Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id  
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com  
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id  
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### **4\. 開発サーバーの起動**

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスするとアプリが表示されます。

## **ディレクトリ構成 (主要なファイル)**

```text
src/
├── app/
│   ├── admin/
│   │   └── page.tsx            # 店舗管理画面 (認証・状態管理・WakeLock制御)
│   ├── view/
│   │   └── page.tsx            # 患者向け表示画面 (個別店舗の待ち状況表示)
│   ├── globals.css             # グローバルスタイル (Tailwind CSS)
│   ├── layout.tsx              # アプリケーション全体のレイアウト
│   └── page.tsx                # トップページ (全店舗の一覧表示)
│
├── components/                 # UIコンポーネント
│   ├── admin/
│   │   ├── LoginForm.tsx       # 管理画面：ログインフォーム
│   │   ├── Header.tsx          # 管理画面：ヘッダー
│   │   ├── ReportPanel.tsx     # 管理画面：集計結果表示パネル
│   │   ├── CongestionGraph.tsx # 管理画面：集計のグラフ部分
│   │   ├── SettingsModal.tsx   # 管理画面：待ち時間設定モーダル
│   │   └── StatusPanel.tsx     # 管理画面：待ち人数操作・表示パネル
│   └── StoreStatusDisplay.tsx  # 店舗状況表示コンポーネント
│
├── hooks/                      # カスタムフック (UIロジックの分離)
│   ├── useAllStores.ts         # 全店舗のリアルタイムデータ取得
│   ├── usePharmacyStore.ts     # 個別店舗の状態管理
│   └── useWakeLock.ts          # 画面の常時点灯 (Wake Lock API) の制御
│
├── lib/                        # ユーティリティ・設定・API
│   ├── api/                    # 外部通信ロジック
│   │   ├── logger.ts           # Firestoreへのログ送信
│   │   ├── report.ts           # レポート取得・キャッシュ管理API
│   │   └── store.ts            # Firestoreデータベース操作
│   ├── analytics.ts            # ログ集計ロジック
│   ├── constants.ts            # 定数定義 (配色設定など)
│   ├── firebase.ts             # Firebase初期化・設定
│   └── utils.ts                # 共通ロジック (時間計算・フォーマット・テーマ判定)
│
└── types/                      # 型定義
    └── index.ts                # 共通の型定義 (Store, StoreDataなど)
```