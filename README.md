<div id="top"></div>

## 使用技術一覧

<!-- シールド一覧 -->
<p style="display: inline">
  <img src="https://img.shields.io/badge/-Html5-E34F26.svg?logo=html5&style=plastic">
  <img src="https://img.shields.io/badge/-CSS3-1572B6.svg?logo=css3&style=for-the-badge">
  <img src="https://img.shields.io/badge/-JavaScript-F7DF1E.svg?logo=javascript&style=for-the-badge&logoColor=black">
  <img src="https://img.shields.io/badge/-Canvas%20API-FF6B35.svg?logo=html5&style=for-the-badge">
</p>

## 目次

1. [プロジェクトについて](#プロジェクトについて)
2. [環境](#環境)
3. [ディレクトリ構成](#ディレクトリ構成)
4. [開発環境構築](#開発環境構築)
5. [トラブルシューティング](#トラブルシューティング)

<br />
<div align="right">
    <a href="#top"><strong>トップへ »</strong></a>
</div>
<br />

## プロジェクト名

Net Salary - コンテンツ販売プラットフォーム手取り額計算ツール

## プロジェクトについて

各コンテンツ販売サイト（note・tips・Brain・ココナラコンテンツマーケット）の手数料体系を基に、販売価格から実際の手取り額を一括計算し、結果を16:9のJPEG画像として保存できるWEBアプリケーションです。

**主な特徴:**
- 4つの主要プラットフォームの手数料を一括比較
- noteでは決済方法別の詳細な手数料計算
- Canvas APIによる16:9画像生成・保存機能
- レスポンシブ対応（PC/タブレット/スマートフォン）

<p align="right">(<a href="#top">トップへ</a>)</p>

## 環境

<!-- 言語、フレームワーク、ミドルウェア、インフラの一覧とバージョンを記載 -->

| 技術 | バージョン |
| ----- | ---------- |
| HTML5 | - |
| CSS3 | - |
| JavaScript | ES6+ |
| Canvas API | - |
| Noto Sans JP | - |

その他のリソースについては `assets/` フォルダを参照してください

<p align="right">(<a href="#top">トップへ</a>)</p>

## ディレクトリ構成

<!-- Treeコマンドを使ってディレクトリ構成を記載 -->

```
contents-hanbai/
├── index.html              # メインページ
├── README.md              # プロジェクト説明
├── CLAUDE.md              # Claude Code開発履歴
├── template.md            # README.mdテンプレート
├── src/
│   ├── css/
│   │   ├── style.css           # メインスタイル・CSS変数・フォント設定
│   │   ├── responsive.css      # レスポンシブ対応（モバイル・タブレット）
│   │   └── components.css      # UIコンポーネント別スタイル
│   ├── js/
│   │   ├── main.js            # メイン処理・DOM操作・イベント制御
│   │   ├── calculator.js      # 計算ロジック（各プラットフォーム手数料）
│   │   ├── imageGenerator.js  # Canvas API画像生成・16:9 JPEG出力
│   │   └── utils.js           # ユーティリティ関数・バリデーション
│   └── fonts/
│       └── NotoSansJP/        # Webフォントファイル（WOFF2/WOFF）
└── assets/
    └── images/
        ├── favicon.ico        # ファビコン
        ├── sample.webp        # 画像保存サンプル
        ├── Net_Salary.webp    # ロゴ画像
        └── *.webp             # その他UI用画像
```

## 開発環境構築

<!-- コンテナの作成方法、パッケージのインストール方法など、開発環境構築に必要な情報を記載 -->

### ローカル開発環境の起動

本プロジェクトは静的WEBアプリケーションのため、ビルドツールは不要です。

#### Python を使用する場合

```bash
python -m http.server 8080
```

#### Node.js を使用する場合

```bash
npx serve .
```

#### ライブリロード機能付き（任意）

```bash
npx live-server
```

### 動作確認

http://localhost:8080 または http://127.0.0.1:8080 にアクセスできるか確認  
アクセスできたら成功

### 手数料設定一覧

#### note（有料記事のみ）
**事務手数料（決済手段別）:**
- クレジットカード決済: 5%
- 携帯キャリア決済: 15%
- PayPay決済: 7%
- Amazon Pay決済: 7%
- noteポイント決済: 10%
- PayPal決済: 6.5%

**プラットフォーム利用料:** 10%（事務手数料差引後に適用）  
**振込手数料:** 270円（1回あたり）

#### tips
**コンテンツ販売手数料:** 14%  
**振込手数料:** 通常会員550円、プラス会員330円

#### Brain
**コンテンツ販売手数料:** 12%  
**出金手数料:** 275円（税込）

#### ココナラコンテンツマーケット
**販売手数料:** 22%（税込）  
**振込手数料:** 売上金額3,000円未満160円、3,000円以上無料

<p align="right">(<a href="#top">トップへ</a>)</p>

## トラブルシューティング

### 画像が表示されない

assets/images/ フォルダ内の画像ファイルが存在することを確認してください

### 計算結果が正しくない

各プラットフォームの手数料体系は変更される可能性があります。  
最新情報は各サービスの公式サイトでご確認ください

### フォントが正しく表示されない

src/fonts/NotoSansJP/ フォルダ内のフォントファイルが存在することを確認してください

### Canvas API エラーが発生する

ローカルサーバー経由でアクセスしていることを確認してください。  
ファイル直接アクセス（file://）では Canvas API が正しく動作しない場合があります

<p align="right">(<a href="#top">トップへ</a>)</p>