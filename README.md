# **薬局待ち時間表示アプリ**

近隣薬局の混雑状況や待ち時間をリアルタイムで可視化・管理するためのWebアプリケーションです。  
患者様（ユーザー）はスマホ等から各薬局の待ち状況を確認でき、薬局側（管理者）はタブレット等で簡単に状況を更新できます。  
また、店舗側の操作ログ（開店・閉店、人数の増減）は **Google Apps Script (GAS)** を経由して **Googleスプレッドシート** に自動的に記録される仕組みを備えています。

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

#### **管理者向け機能 (薬局スタッフ)**

* **店舗管理ログイン**: 店舗IDとパスワードによる認証。  
* **ステータス管理**:  
  * **人数の増減**: 「＋」「－」ボタンで待ち人数を簡単に操作。  
  * **開店/閉店切り替え**: ワンタップで営業中と受付終了を切り替え。閉店操作時に人数を自動リセットする安全機能付き。  
  * **待ち時間目安のカスタマイズ**: 状況に応じて一人当たり待ち時間目安を設定・変更できます。  
  * **自動ロック回避（Wake Lock）**: ブラウザが対応している場合、管理画面で店舗ステータスが「開店（Open）」の間、デバイスの自動スリープ（画面ロック）を防止します。  
* **ログ記録**: 操作内容（OPEN, CLOSE, INCREMENT, DECREMENT）と操作後の人数をスプレッドシートに自動記録。
* **簡易集計機能**: 閉局中は、前回営業時の平均待ち時間・総受付人数・営業時間のまとめを表示。

## **技術スタック**

* **フレームワーク**: Next.js 16 (App Router)  
* **言語**: Typescript  
* **スタイリング**: Tailwind CSS  
* **バックエンド (BaaS)**: Firebase  
  * **Authentication**: メール/パスワード認証  
  * **Firestore**: リアルタイムデータベース  
* **ログ収集**: Google Apps Script (GAS) / Google Sheets  
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

Firestoreのデータベース構造は以下の通りです。

* **Collection**: stores  
  * **Document ID**: {storeId} (例: store\_xxx)

| Field Name | Type | Description |
| :---- | :---- | :---- |
| name | string | 表示される店舗名 |
| isOpen | boolean | 営業中フラグ (true: 営業中, false: 受付終了) |
| waitCount | number | 現在の待ち人数 |
| updatedAt | timestamp | 最終更新日時 |
| avgTime | number | 一人当たり待ち時間(分) |

### **3\. Firestore Security Rules**

セキュリティルールは以下のように設定してください。  
「ログイン中のメールアドレスの@前の部分」 と 「書き込もうとしているドキュメントID」 が一致する場合のみ書き込みを許可する設定になっています。  

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /stores/{storeId} {
      // 読み取りは誰でもOK
      allow read: if true;
      
      // 書き込みは、「ログインしている」 かつ
      // 「ログインユーザーのメアドが、店舗ID + @pharmacy.local と一致する場合」のみ許可
      allow write: if request.auth != null
                   && request.auth.token.email == storeId + "@pharmacy.local";
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

### **3\. Google Apps Script (GAS) の準備**

ログ収集および集計用のAPIを作成します。

1. Googleスプレッドシートを新規作成します。  
2. 1行目に以下のヘッダーを設定します。  
   * A列: timestamp  
   * B列: storeId  
   * C列: action  
   * D列: resultCount  
3. 「拡張機能」\>「Apps Script」を開き、以下のコードを Code.gs に貼り付けます。  
```GAS
// Code.gs
function doPost(e) {
  try {
    // JSONデータを受け取る
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 現在時刻を「yyyy/MM/dd HH:mm:ss」形式（秒まで含む）に変換
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

    // 行を追加: 日時(秒付き), 店舗ID, 操作, 結果人数
    sheet.appendRow([
      formattedDate, 
      data.storeId, 
      data.action, 
      data.resultCount
    ]);

    // 成功レスポンス (CORS対応)
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var targetStoreId = e.parameter.storeId;
  
  if (!targetStoreId) {
    return createJSONOutput({ error: "Store ID is required" });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  // 直近3000行を取得（高速化）
  var lastRow = sheet.getLastRow();
  var startRow = Math.max(1, lastRow - 3000); 
  var numRows = lastRow - startRow + 1;
  
  if (numRows < 1) {
    return createJSONOutput({});
  }

  var data = sheet.getRange(startRow, 1, numRows, 4).getValues();
  
  // 集計用変数
  var arrivalQueue = []; 
  var totalWaitTimeMinutes = 0; 
  var resolvedPatients = 0; 
  var totalVisitors = 0; 
  var prevCount = 0; 
  
  // 営業時間管理用
  var lastOpenTime = null; // Dateオブジェクト
  var lastCloseTime = null; // Dateオブジェクト

  // ループ処理
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (row[0] === "timestamp" || row[0] === "日時") continue;

    var storeId = row[1];
    if (String(storeId) !== String(targetStoreId)) continue;

    var timestamp = new Date(row[0]);
    var action = row[2];
    var currentCount = Number(row[3]);

    // OPEN検知: リセット処理
    if (action === "OPEN") {
      arrivalQueue = [];
      totalWaitTimeMinutes = 0;
      resolvedPatients = 0;
      totalVisitors = 0;
      prevCount = 0;
      
      // 開店時刻を記録、閉店時刻はリセット
      lastOpenTime = timestamp;
      lastCloseTime = null; 
      
      continue; 
    }
    
    // CLOSE検知: 閉店時刻を記録
    if (action === "CLOSE") {
      lastCloseTime = timestamp;
      // CLOSEでも人数精算ロジックは通すため continue はしない
    }

    // --- 人数増減ロジック (前回と同じ) ---
    var diff = currentCount - prevCount;
    if (diff > 0) {
      for (var k = 0; k < diff; k++) {
        arrivalQueue.push(timestamp.getTime());
        totalVisitors++;
      }
    } else if (diff < 0) {
      var decreaseCount = Math.abs(diff);
      for (var k = 0; k < decreaseCount; k++) {
        if (arrivalQueue.length > 0) {
          var arrivedAt = arrivalQueue.shift();
          var leftAt = timestamp.getTime();
          var waitMinutes = (leftAt - arrivedAt) / (1000 * 60);
          if (waitMinutes > 0 && waitMinutes < 300) { 
            totalWaitTimeMinutes += waitMinutes;
            resolvedPatients++;
          }
        }
      }
    }
    prevCount = currentCount;
  }

  // --- 結果の整形 ---
  var avgTime = resolvedPatients > 0 ? Math.round(totalWaitTimeMinutes / resolvedPatients) : 0;
  
  // 営業日・時間の計算
  var dateStr = "";
  var openTimeStr = "";
  var closeTimeStr = "";
  var durationStr = "";

  if (lastOpenTime) {
    // 日付 (YYYY-MM-DD)
    dateStr = Utilities.formatDate(lastOpenTime, "JST", "yyyy/MM/dd");
    // 開店時刻 (HH:mm)
    openTimeStr = Utilities.formatDate(lastOpenTime, "JST", "HH:mm");
    
    // 閉店時刻と期間
    // もしCLOSEログがない（営業中）場合は、最後のログ時刻または現在時刻を仮終了とする
    var endTime = lastCloseTime ? lastCloseTime : new Date(); 
    
    if (lastCloseTime) {
       closeTimeStr = Utilities.formatDate(lastCloseTime, "JST", "HH:mm");
    } else {
       closeTimeStr = "営業中";
    }

    // 期間（分）の計算
    var durationMillis = endTime.getTime() - lastOpenTime.getTime();
    var durationMinutes = Math.floor(durationMillis / (1000 * 60));
    var hours = Math.floor(durationMinutes / 60);
    var mins = durationMinutes % 60;
    durationStr = hours + "時間" + mins + "分";
  }

  var result = {
    date: dateStr,           // "2023/12/25"
    openTime: openTimeStr,   // "09:00"
    closeTime: closeTimeStr, // "18:00" または "営業中"
    duration: durationStr,   // "9時間0分"
    totalVisitors: totalVisitors,
    avgWaitTime: avgTime,
    resolvedCount: resolvedPatients
  };
  
  return createJSONOutput(result);
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. 「デプロイ」\>「新しいデプロイ」を選択します。  
   * **種類の選択**: ウェブアプリ  
   * **説明**: 任意（例: Pharmacy Log API）  
   * **次のユーザーとして実行**: 自分 (Me)  
   * **アクセスできるユーザー**: **全員 (Anyone)**  
5. デプロイ完了後に発行される **ウェブアプリ URL** をコピーします。

### **4\. 環境変数の設定**

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

### **5\. 開発サーバーの起動**

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
│   └── StoreCard.tsx          # 店舗カードコンポーネント (一覧表示用)
│
├── hooks/                     # カスタムフック (UIロジックの分離)
│   ├── useAllStores.ts        # 全店舗のリアルタイムデータ取得
│   ├── usePharmacyStore.ts    # 個別店舗の状態管理
│   └── useWakeLock.ts         # 画面の常時点灯 (Wake Lock API) の制御
│
├── lib/                       # ユーティリティ・設定・API
│   ├── api/                   # 外部通信ロジック
│   │   ├── logger.ts          # GASへのログ送信
│   │   └── store.ts           # Firestoreデータベース操作
│   ├── constants.ts           # 定数定義 (配色設定など)
│   ├── firebase.ts            # Firebase初期化・設定
│   └── utils.ts               # 共通ロジック (時間計算・フォーマット・テーマ判定)
│
└── types/                     # 型定義
    └── index.ts               # 共通の型定義 (Store, StoreDataなど)
```