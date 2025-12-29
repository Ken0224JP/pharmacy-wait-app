# **薬局待ち時間表示アプリ**

近隣薬局の混雑状況や待ち時間をリアルタイムで可視化・管理するためのWebアプリケーションです。  
患者様（ユーザー）はスマホ等から各薬局の待ち状況を確認でき、薬局側（管理者）はタブレット等で簡単に状況を更新できます。  
店舗側の操作ログ（開店・閉店、人数の増減）は Firebase Firestore に記録され、管理画面で過去の営業実績として参照可能です。

## **概要**

このアプリは、Next.js と Firebase を使用して構築されています。  
リアルタイムデータベース（Firestore）を利用しているため、薬局側での操作は即座にユーザー画面に反映されます。また、ログの集計にはキャッシュ戦略を導入しており、Firestoreの読み取りコストを最小限に抑えつつ、正確な統計データを表示します。

### **主な機能**

#### **ユーザー向け機能 (患者様)**

* **店舗一覧表示**: 登録されている薬局の一覧と、現在の営業状況（営業中/受付終了）、待ち人数を表示します。  
* **詳細画面**: 特定の薬局の「現在の待ち人数」と「目安の待ち時間（人数 × 5分）」を大きく表示します。  
* **混雑状況の可視化**: 待ち人数に応じて背景色が変化し、混雑具合を直感的に把握できます。  
  * 🟢 空き (0-2人)  
  * 🟡 やや混雑 (3-5人)  
  * 🔴 混雑 (6人以上)  
  * ⚪ 閉店/受付終了

#### **管理者向け機能 (薬局スタッフ)**

* **店舗管理ログイン**: 店舗IDとパスワードによる認証。  
* **ステータス管理**:  
  * **人数の増減**: 「＋」「－」ボタンで待ち人数を簡単に操作。  
  * **開店/閉店切り替え**: ワンタップで営業中と受付終了を切り替え。閉店操作時に人数を自動リセットする安全機能付き。  
  * **待ち時間目安のカスタマイズ**: 状況に応じて一人当たり待ち時間目安を設定・変更できます。  
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
  * **Collection**: stores  
  * **Document ID**: {storeId} (例: store\_xxx)

| Field Name | Type | Description |
| :---- | :---- | :---- |
| name | string | 表示される店舗名 |
| isOpen | boolean | 営業中フラグ (true: 営業中, false: 受付終了) |
| waitCount | number | 現在の待ち人数 |
| updatedAt | timestamp | 最終更新日時 |
| avgTime | number | 一人当たり待ち時間設定(分) |
| dailyReport | map | 集計結果のキャッシュ |
| └ calculatedAt | timestamp | キャッシュ作成日時 |
| └ data | map | 集計データオブジェクト (平均待ち時間, 人数など) |

#### logs Collection
  * **Collection**: logs  
  * **Document ID**: Auto ID

| Field Name | Type | Description |
| :---- | :---- | :---- |
| storeId | string | 店舗ID |
| action | string | 操作内容 (OPEN, CLOSE, INCREMENT, DECREMENT) |
| resultCount | number | 操作後の待ち人数 |
| createdAt | timestamp | ログ作成日時 |


### **3\. Firestore Security Rules**

セキュリティルールは以下のように設定してください。  
「ログイン中のメールアドレスの@前の部分」 と 「書き込もうとしているドキュメントID」 が一致する場合のみ書き込みを許可する設定になっています。  

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 店舗データ
    match /stores/{storeId} {
      // 読み取りは誰でもOK
      allow read: if true;      
      // 書き込みは、「ログインしている」 かつ
      // 「ログインユーザーのメアドが、店舗ID + @pharmacy.local と一致する場合」のみ許可
      allow write: if request.auth != null
                   && request.auth.token.email == storeId + "@pharmacy.local";
    }
    // 操作ログ
    match /logs/{logId} {
      // 読み取り・作成: ログイン済みユーザーのみ許可
      allow read, create: if request.auth != null;      
      // 更新・削除: 改ざん防止のため禁止
      allow update, delete: if false;
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
NEXT\_PUBLIC\_GAS\_API\_URL には、上記で発行したURLを貼り付けます。  

```
# Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id  
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com  
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id  
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Logging API (Google Apps Script Web App URL)  
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/xxxx/exec\
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
│   │   └── page.tsx           # 店舗管理画面 (認証・状態管理・WakeLock制御)
│   ├── view/
│   │   └── page.tsx           # 患者向け表示画面 (個別店舗の待ち状況表示)
│   ├── globals.css            # グローバルスタイル (Tailwind CSS)
│   ├── layout.tsx             # アプリケーション全体のレイアウト
│   └── page.tsx               # トップページ (全店舗の一覧表示)
│
├── components/                # UIコンポーネント
│   ├── admin/
│   │   ├── LoginForm.tsx      # 管理画面：ログインフォーム
│   │   ├── ReportPanel.tsx    # 管理画面：集計結果表示パネル
│   │   ├── SettingsModal.tsx  # 管理画面：待ち時間設定モーダル
│   │   └── StatusPanel.tsx    # 管理画面：待ち人数操作・表示パネル
│   └── StoreStatusDisplay.tsx # 店舗状況表示コンポーネント
│
├── hooks/                     # カスタムフック (UIロジックの分離)
│   ├── useAllStores.ts        # 全店舗のリアルタイムデータ取得
│   ├── usePharmacyStore.ts    # 個別店舗の状態管理
│   └── useWakeLock.ts         # 画面の常時点灯 (Wake Lock API) の制御
│
├── lib/                       # ユーティリティ・設定・API
│   ├── api/                   # 外部通信ロジック
│   │   ├── logger.ts          # Firestoreへのログ送信
│   │   ├── report.ts          # レポート取得・キャッシュ管理API
│   │   └── store.ts           # Firestoreデータベース操作
│   ├── analytics.ts           # ログ集計ロジック
│   ├── constants.ts           # 定数定義 (配色設定など)
│   ├── firebase.ts            # Firebase初期化・設定
│   └── utils.ts               # 共通ロジック (時間計算・フォーマット・テーマ判定)
│
└── types/                     # 型定義
    └── index.ts               # 共通の型定義 (Store, StoreDataなど)
```