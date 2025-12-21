# **Pharmacy Wait App (薬局待ち時間表示アプリ)**

近隣薬局の混雑状況や待ち時間をリアルタイムで可視化・管理するためのWebアプリケーションです。  
患者様（ユーザー）はスマホ等から各薬局の待ち状況を確認でき、薬局側（管理者）はタブレット等で簡単に状況を更新できます。  
また、店舗側の操作ログ（開店・閉店、人数の増減）は **Google Apps Script (GAS)** を経由して **Googleスプレッドシート** に自動的に記録される仕組みを備えています。

## **📖 概要**

このアプリは、Next.js と Firebase を使用して構築されています。  
リアルタイムデータベース（Firestore）を利用しているため、薬局側での操作は即座にユーザー画面に反映されます。

### **主な機能**

#### **🏥 ユーザー向け機能 (患者様)**

* **店舗一覧表示**: 登録されている薬局の一覧と、現在の営業状況（営業中/受付終了）、待ち人数を表示します。  
* **詳細画面**: 特定の薬局の「現在の待ち人数」と「目安の待ち時間（人数 × 5分）」を大きく表示します。  
* **混雑状況の可視化**: 待ち人数に応じて背景色が変化し、混雑具合を直感的に把握できます。  
  * 🟢 空き (0-2人)  
  * 🟡 やや混雑 (3-5人)  
  * 🔴 混雑 (6人以上)  
  * ⚪ 閉店/受付終了

#### **💊 管理者向け機能 (薬局スタッフ)**

* **店舗管理ログイン**: 店舗IDとパスワードによる認証。  
* **ステータス管理**:  
  * **人数の増減**: 「＋」「－」ボタンで待ち人数を簡単に操作。  
  * **開店/閉店切り替え**: ワンタップで営業中と受付終了を切り替え。閉店操作時に人数を自動リセットする安全機能付き。  
* **ログ記録**: 操作内容（OPEN, CLOSE, INCREMENT, DECREMENT）と操作後の人数をスプレッドシートに自動記録。

## **🛠 技術スタック**

* **フレームワーク**: Next.js 16 (App Router)  
* **言語**: JavaScript / React  
* **スタイリング**: Tailwind CSS  
* **バックエンド (BaaS)**: Firebase  
  * **Authentication**: メール/パスワード認証  
  * **Firestore**: リアルタイムデータベース  
* **ログ収集**: Google Apps Script (GAS) / Google Sheets  
* **その他**: FontAwesome (アイコン)

## **🔥 Firebase データベース設計 & 設定**

本アプリのバックエンド設定詳細です。Firebaseコンソールで以下の通り設定を行ってください。

### **1\. Authentication (認証)**

管理画面へのログインには Email/Password認証 を使用します。  
運用ルールとして、以下の形式でアカウントを作成してください（店舗IDとメールアドレスを紐付けるため）。

* **メールアドレス**: {店舗ID}@pharmacy.local  
  * 例: 店舗IDが store\_kyoto の場合 → store\_kyoto@pharmacy.local  
* **パスワード**: 任意のセキュアなパスワード

### **2\. Firestore Data Model**

Firestoreのデータベース構造は以下の通りです。

* **Collection**: stores  
  * **Document ID**: {storeId} (例: store\_kyoto, komada)

| Field Name | Type | Description |
| :---- | :---- | :---- |
| name | string | 表示される店舗名 |
| isOpen | boolean | 営業中フラグ (true: 営業中, false: 受付終了) |
| waitCount | number | 現在の待ち人数 |
| updatedAt | timestamp | 最終更新日時 |

### **3\. Firestore Security Rules**

セキュリティルールは以下のように設定してください。  
「ログイン中のメールアドレスの@前の部分」 と 「書き込もうとしているドキュメントID」 が一致する場合のみ書き込みを許可する設定になっています。  

```
rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {  
      
    match /stores/{storeId} {  
      // 読み取りは誰でもOK  
      allow read: if true;  
        
      // 書き込みは、「ログインしている」 かつ  
      // 「ログインユーザーのメアドが、店舗ID \+ @pharmacy.local と一致する場合」のみ許可  
      allow write: if request.auth \!= null  
                   && request.auth.token.email \== storeId \+ "@pharmacy.local";  
    }  
  }  
}
```

## **🚀 セットアップ手順**

### **1\. リポジトリのクローン**

```bash
git clone \<repository-url\>  
cd pharmacy-wait-app
```

### **2\. 依存関係のインストール**

```bash
npm install
```

### **3\. Google Apps Script (GAS) の準備**

ログ収集用のAPIを作成します。

1. Googleスプレッドシートを新規作成します。  
2. 1行目に以下のヘッダーを設定します。  
   * A列: timestamp  
   * B列: storeId  
   * C列: action  
   * D列: resultCount  
3. 「拡張機能」\>「Apps Script」を開き、以下のコードを Code.gs に貼り付けます。  
```
   // Code.gs  
   function doPost(e) {  
     try {  
       // JSONデータを受け取る  
       const data \= JSON.parse(e.postData.contents);  
       const sheet \= SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

       // 行を追加: 日時, 店舗ID, 操作, 結果人数  
       sheet.appendRow(\[  
         new Date(),   
         data.storeId,   
         data.action,   
         data.resultCount  
       \]);

       // 成功レスポンス (CORS対応)  
       return ContentService.createTextOutput(JSON.stringify({ status: "success" }))  
         .setMimeType(ContentService.MimeType.JSON);

     } catch (error) {  
       return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))  
         .setMimeType(ContentService.MimeType.JSON);  
     }  
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
\# Firebase Configuration  
NEXT\_PUBLIC\_FIREBASE\_API\_KEY=your\_api\_key  
NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=your\_project\_id.firebaseapp.com  
NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=your\_project\_id  
NEXT\_PUBLIC\_FIREBASE\_STORAGE\_BUCKET=your\_project\_id.appspot.com  
NEXT\_PUBLIC\_FIREBASE\_MESSAGING\_SENDER\_ID=your\_messaging\_sender\_id  
NEXT\_PUBLIC\_FIREBASE\_APP\_ID=your\_app\_id

\# Logging API (Google Apps Script Web App URL)  
NEXT\_PUBLIC\_GAS\_API\_URL=\[https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec\](https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec)
```

### **5\. 開発サーバーの起動**

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスするとアプリが表示されます。

## **📂 ディレクトリ構成 (主要なファイル)**

```
src/  
├── app/  
│   ├── page.js           \# トップページ（店舗一覧）  
│   ├── view/             \# 店舗詳細表示ページ (/view?id=xxx)  
│   ├── admin/            \# 管理画面 (/admin?id=xxx)  
│   └── globals.css       \# グローバルスタイル (Tailwind directives)  
├── hooks/  
│   ├── useAllStores.js   \# 全店舗データの取得ロジック  
│   └── usePharmacyStore.js \# 単一店舗データの取得・更新ロジック (GAS送信処理含む)  
└── lib/  
    ├── firebase.js       \# Firebase初期化設定  
    └── constants.js      \# 定数定義（カラー設定など）
```