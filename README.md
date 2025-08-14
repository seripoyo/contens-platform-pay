# Net Salary - コンテンツ販売手取り額計算ツール

![Net Salary](https://img.shields.io/badge/version-v1.1.1-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Canvas API](https://img.shields.io/badge/Canvas%20API-Enabled-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## 🎯 アプリケーション概要
![コンテンツ販売プラットフォーム](assets/images/sample.webp)

URL→https://net-salary.seripoyo.com/

**Net Salary**は、コンテンツクリエイター向けの販売手取り額計算ツールです。note・tips・Brain・ココナラコンテンツマーケットの4大プラットフォームで、同じ販売価格でも手数料により異なる手取り額を一括計算。結果を16:9のJPEG画像として保存できます。

### 💡 主な特徴

- **🔍 4大プラットフォーム対応**: note、tips、Brain、ココナラを網羅
- **💳 詳細な手数料計算**: noteの決済方法別手数料にも対応
- **📸 画像保存機能**: Canvas APIで16:9の結果画像を生成
- **📱 レスポンシブ対応**: PC・タブレット・スマートフォンに最適化
- **🎨 シンプルUI**: メインカラー#00c79eの統一デザイン

## 📱 対象ユーザー

- 📝 **コンテンツクリエイター**: ブログ記事・教材の販売者
- 🎯 **マーケター**: 価格戦略の立案者
- 💰 **フリーランサー**: 収益計算が必要な個人事業主
- 📊 **EC運営者**: 複数プラットフォーム展開の管理者
- 🚀 **起業家**: デジタルコンテンツビジネス運営者

## 🚀 使い方

### 1. 販売価格を入力
販売予定の価格を円単位で入力

### 2. 各種オプションを選択
- **note**: 決済方法（クレジットカード/キャリア決済/PayPay）を選択
- **tips**: 会員種別（通常会員/プラス会員）を選択

### 3. 計算実行
「計算する」ボタンをクリック

### 4. 結果確認・保存
各プラットフォームの手取り額が表示され、画像として保存可能

#### 📊 計算結果の内容
- **手数料内訳**: 各プラットフォームの詳細な手数料
- **手取り額**: 振込手数料を差し引いた最終的な受取額
- **比較表示**: 4プラットフォームの一覧比較

## 🔧 技術仕様

### フロントエンド
- **言語**: JavaScript (ES6+)
- **スタイル**: CSS3（カスタムプロパティ使用）
- **画像生成**: Canvas API
- **フォント**: Noto Sans JP
- **レイアウト**: Flexbox/Grid

### 対応ブラウザ
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📦 インストール方法

### 前提条件
- モダンブラウザ（上記対応ブラウザ参照）
- ローカルサーバー環境（開発時）

### セットアップ手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/seripoyo/https://github.com/seripoyo/contens-platform-pay.git
cd https://github.com/seripoyo/contens-platform-pay
```

2. **ローカルサーバーの起動**

Python を使用する場合:
```bash
python -m http.server 8080
```

Node.js を使用する場合:
```bash
npx serve .
# または
npx live-server
```

3. **アクセス**
ブラウザで http://localhost:8080 を開く

## 🌐 デプロイメント

### 推奨構成
- **ホスティング**: GitHub Pages / Netlify / Vercel
- **CDN**: CloudFlare（オプション）

静的サイトのため、任意の静的ホスティングサービスで動作します。

## 📋 使用例

### note有料記事の販売
**入力例**: 
```
販売価格: 1,000円
決済方法: クレジットカード
```

**計算結果**:
- 事務手数料: 50円（5%）
- プラットフォーム利用料: 95円（10%）
- 振込手数料: 270円
- **手取り額: 585円**

### 複数プラットフォーム比較
同じ1,000円の商品でも：
- **note（クレカ）**: 585円
- **tips（通常会員）**: 310円
- **Brain**: 605円
- **ココナラ**: 620円

## 💰 手数料体系

### note（有料記事）
- 事務手数料: 5%〜15%（決済方法による）
- プラットフォーム利用料: 10%
- 振込手数料: 270円

### tips
- 販売手数料: 14%
- 振込手数料: 550円（通常）/ 330円（プラス会員）

### Brain
- 販売手数料: 12%
- 出金手数料: 275円

### ココナラコンテンツマーケット
- 販売手数料: 22%
- 振込手数料: 160円（3,000円未満）/ 無料（3,000円以上）

## 📂 プロジェクト構成

```
https://github.com/seripoyo/contens-platform-pay/
├── index.html              # メインページ
├── README.md              # この文書
├── CLAUDE.md              # 開発ガイドライン
├── src/
│   ├── css/
│   │   ├── style.css           # メインスタイル
│   │   ├── responsive.css      # レスポンシブ対応
│   │   └── components.css      # UIコンポーネント
│   ├── js/
│   │   ├── main.js            # メイン処理
│   │   ├── calculator.js      # 計算ロジック
│   │   ├── imageGenerator.js  # 画像生成
│   │   └── utils.js           # ユーティリティ
│   └── fonts/
│       └── NotoSansJP/        # Webフォント
└── assets/
    └── images/
        ├── favicon.ico        # ファビコン
        ├── sample.webp        # サンプル画像
        └── Net_Salary.webp    # ロゴ
```

## ⚠️ 注意事項

- 手数料は2025年8月時点の情報です
- 各プラットフォームの最新の手数料体系をご確認ください
- 計算結果は参考値であり、実際の振込額と異なる場合があります

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/seripoyo/https://github.com/seripoyo/contens-platform-pay/issues)
- **ドキュメント**: [CLAUDE.md](./CLAUDE.md)

## 📄 ライセンス

本プロジェクトはMITライセンスの下で公開されています。

---

**最終更新**: 2025年8月14日  
**バージョン**: v1.1.1  
**開発者**: [@seripoyo](https://github.com/seripoyo/seripoyo)