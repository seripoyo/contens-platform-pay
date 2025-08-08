<div id="top"></div>

## 使用技術一覧

<!-- シールド一覧 -->
<p style="display: inline">
  <img src="https://img.shields.io/badge/-Html5-E34F26.svg?logo=html5&style=for-the-badge">
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

<p align="right">(<a href="#top">トップへ</a>)</p>

## 5. 対象外機能

### 5.1 除外機能
- アフィリエイト機能の計算
- URL共有機能
- 印刷・PDF出力機能
- 計算履歴保存機能
- プレビュー機能

### 5.2 対象外プラットフォーム
- tips/Brainのアフィリエイター収益計算
- noteの定期購読マガジン等（有料記事以外）

## 6. 成果物

### 6.1 開発成果物
- **index.html**: メインページ
- **src/css/**: スタイルシート群（style.css, responsive.css, components.css）
- **src/js/**: JavaScript群（main.js, calculator.js, imageGenerator.js, utils.js）
- **src/fonts/**: Webフォント（Noto Sans JP）
- **assets/**: 画像リソース
- **README.md**: セットアップ手順・使用方法
- **claude.md**: 開発履歴・技術メモ

### 6.2 ドキュメント
- 要件定義書（本書）
- 技術仕様書
- 操作マニュアル

---

**作成日:** 2025年8月7日  
**最終更新:** 2025年8月7日  
**バージョン:** 1.0