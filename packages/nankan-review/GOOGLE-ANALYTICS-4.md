# Google Analytics 4 (GA4) 設定ガイド

nankan-review サイトにGoogle Analytics 4を設定するための完全ガイドです。

## ✅ 既に実装済みの機能

nankan-reviewには既に以下のGA4機能が実装されています：

- ✅ **GA4トラッキングコード** (`src/layouts/BaseLayout.astro:67-80`)
- ✅ **外部リンクトラッキング** (`src/layouts/BaseLayout.astro:207-228`)
- ✅ **ページビュー自動測定**
- ✅ **イベントトラッキング** (外部リンククリック)

**必要なのは環境変数の設定のみです！**

## 🚀 GA4セットアップ手順

### Step 1: Google Analytics 4プロパティを作成

1. https://analytics.google.com/ にアクセス
2. Googleアカウントでログイン
3. 左下の「管理」⚙️ をクリック
4. 「プロパティを作成」をクリック

### Step 2: プロパティ設定

**プロパティの詳細:**
- **プロパティ名**: `南関競馬予想サイト口コミ` または `nankan-review`
- **レポートのタイムゾーン**: 日本
- **通貨**: 日本円（JPY）

**ビジネスの詳細:**
- **業種**: メディア・パブリッシング
- **ビジネスの規模**: 小規模（1～10人）

**ビジネス目標:**
- ☑ ユーザー行動の調査
- ☑ トラフィックの測定

### Step 3: データストリームの作成

1. 「ウェブ」を選択
2. ウェブストリームの設定:
   - **ウェブサイトのURL**: `https://nankan.keiba-review.jp`
   - **ストリーム名**: `nankan-review`
3. 「ストリームを作成」をクリック

### Step 4: 測定IDを取得

データストリーム作成後、画面に表示される **測定ID** をコピー:

```
G-XXXXXXXXXX
```

例: `G-1234567890`

### Step 5: 環境変数を設定

#### ローカル開発環境

`.env` ファイルを作成または編集:

```bash
# packages/nankan-review/.env
PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Netlify本番環境

Netlify CLIを使用して設定:

```bash
# Netlifyサイトにログイン
netlify login

# nankan-reviewサイトにリンク（初回のみ）
cd packages/nankan-review
netlify link

# 環境変数を設定
netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"

# 確認
netlify env:list
```

または、Netlify Web UIから設定:

1. https://app.netlify.com/ にログイン
2. nankan-reviewサイトを選択
3. 「Site configuration」→「Environment variables」
4. 「Add a variable」をクリック
5. キー: `PUBLIC_GA_ID`、値: `G-XXXXXXXXXX`
6. 「Create variable」をクリック

#### GitHub Secrets（GitHub Actions用）

GitHub Actionsでデプロイする場合:

1. https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. 「New repository secret」をクリック
3. Name: `PUBLIC_GA_ID_NANKAN`
4. Value: `G-XXXXXXXXXX`
5. 「Add secret」をクリック

### Step 6: デプロイ

環境変数を設定したら、サイトをデプロイ:

```bash
# 変更をコミット（.envは除外されます）
git add .
git commit -m "docs(nankan-review): Add GA4 setup guide"
git push

# Netlifyで自動デプロイが開始される
```

### Step 7: 動作確認

#### 方法1: GA4リアルタイムレポート

1. Google Analytics 4管理画面にアクセス
2. 左メニューから「レポート」→「リアルタイム」を選択
3. ブラウザで https://nankan.keiba-review.jp/ を開く
4. リアルタイムレポートに自分のアクセスが表示されることを確認

#### 方法2: ブラウザ開発者ツール

1. https://nankan.keiba-review.jp/ にアクセス
2. ブラウザの開発者ツールを開く（F12）
3. 「Network」タブを選択
4. `google-analytics.com/g/collect` へのリクエストがあることを確認
5. リクエストパラメータに `tid=G-XXXXXXXXXX` が含まれていることを確認

#### 方法3: Tag Assistant

1. Chrome拡張機能「Tag Assistant」をインストール
2. https://nankan.keiba-review.jp/ にアクセス
3. Tag Assistantを起動
4. GA4タグが正しく動作していることを確認

## 📊 測定されるデータ

### 自動収集イベント

GA4が自動的に収集するイベント:

| イベント名 | 説明 |
|----------|------|
| `page_view` | ページ閲覧 |
| `first_visit` | 初回訪問 |
| `session_start` | セッション開始 |
| `user_engagement` | ユーザーエンゲージメント |
| `scroll` | スクロール（90%到達時） |

### カスタムイベント（実装済み）

nankan-reviewで実装済みのカスタムイベント:

#### 外部リンククリック

```javascript
gtag('event', 'click', {
  event_category: 'outbound',
  event_label: 'リンクURL',
  link_text: 'リンクテキスト',
  value: 1
});
```

**測定される外部リンク例:**
- nankan-analyticsへのリンク（トップページCTA、サイト詳細ページ）
- 予想サイトの公式サイトリンク

## 🎯 推奨する追加設定

### 1. コンバージョン設定

nankan-analyticsへのクリックをコンバージョンとして設定:

1. GA4管理画面 → 「設定」→「イベント」
2. `click` イベントを見つける
3. 「コンバージョンとしてマークを付ける」をON

これにより、nankan-analyticsへの導線効果を測定できます。

### 2. Search Consoleとの連携

GA4とGoogle Search Consoleを連携:

1. GA4管理画面 → 「管理」→「Search Consoleのリンク」
2. 「リンク」をクリック
3. Search Consoleプロパティを選択
4. 「送信」をクリック

連携により、以下のデータが確認可能になります:
- 検索クエリ（どんなキーワードで検索されたか）
- クリック率（CTR）
- 平均掲載順位

### 3. Googleシグナルの有効化

クロスデバイストラッキングを有効化:

1. GA4管理画面 → 「管理」→「データ設定」→「データ収集」
2. 「Googleシグナルのデータ収集」をON

これにより、ユーザーのデバイス間行動を追跡できます。

### 4. カスタムディメンションの設定

サイト別の詳細分析用:

| ディメンション名 | イベントパラメータ | 例 |
|---------------|-----------------|---|
| リンクURL | `event_label` | https://nankan-analytics.com |
| リンクテキスト | `link_text` | 南関アナリティクスへ |

設定方法:
1. GA4管理画面 → 「管理」→「カスタム定義」
2. 「カスタムディメンションを作成」
3. 上記のパラメータを設定

### 5. カスタムレポートの作成

推奨レポート:

#### A. 人気ページレポート
- ディメンション: ページタイトル、ページパス
- 指標: ページビュー数、平均エンゲージメント時間

#### B. 外部リンククリックレポート
- ディメンション: リンクURL、リンクテキスト
- 指標: クリック数（イベント数）
- フィルタ: `event_category = outbound`

#### C. デバイス別コンバージョンレポート
- ディメンション: デバイスカテゴリ
- 指標: コンバージョン数、コンバージョン率

## 🔧 トラブルシューティング

### データが表示されない

**症状**: GA4リアルタイムレポートにデータが表示されない

**確認事項:**

1. **環境変数が正しく設定されているか**
   ```bash
   netlify env:list | grep PUBLIC_GA_ID
   ```
   出力例: `PUBLIC_GA_ID = G-1234567890`

2. **測定IDが正しいか**
   - `G-`で始まる10桁の英数字
   - スペースや改行が含まれていないか確認

3. **デプロイが完了しているか**
   ```bash
   # ブラウザでソースコードを確認
   curl https://nankan.keiba-review.jp/ | grep googletagmanager
   ```
   `gtag/js?id=G-XXXXXXXXXX` が含まれていることを確認

4. **Ad Blockerを無効化**
   - ブラウザの広告ブロッカーがGA4をブロックしている可能性
   - シークレットモードで確認

5. **最大24時間の遅延**
   - GA4は通常数分でデータが表示されるが、最大24時間遅延する場合がある
   - リアルタイムレポートなら即座に確認可能

### 「タグが見つかりません」エラー

**原因**: `PUBLIC_GA_ID` 環境変数が設定されていない

**解決方法**:
```bash
# .envファイルを確認
cat packages/nankan-review/.env

# 環境変数を設定
echo "PUBLIC_GA_ID=G-XXXXXXXXXX" >> packages/nankan-review/.env

# ビルドテスト
pnpm --filter=@keiba-review/nankan-review build

# Netlifyにも設定
netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"
```

### 外部リンククリックが記録されない

**原因**: `gtag` 関数が未定義

**解決方法**:
1. GA4スクリプトが正しく読み込まれているか確認
2. ブラウザコンソールで `typeof gtag` を実行
3. `function` が返ってくれば正常、`undefined` の場合は環境変数を確認

### リアルタイムレポートに自分のアクセスが表示される

**症状**: 開発者自身のアクセスもカウントされてしまう

**解決方法**: 内部トラフィックフィルタを設定

1. GA4管理画面 → 「管理」→「データストリーム」
2. nankan-reviewストリームを選択
3. 「タグ設定を行う」→「すべて表示」
4. 「内部トラフィックの定義」をクリック
5. 自分のIPアドレスを追加

または、Chrome拡張機能「Google Analytics Opt-out Add-on」をインストール

## 📈 GA4活用のベストプラクティス

### 1. 定期的な確認（週1回推奨）

- **パフォーマンスレポート**: ページビュー、セッション、ユーザー数
- **コンバージョンレポート**: nankan-analyticsへのクリック数
- **ユーザー属性**: デバイス、地域、ブラウザ

### 2. A/Bテストの実施

- 異なるCTAボタンテキストでクリック率を比較
- ランディングページのデザイン変更による効果測定

### 3. 目標設定

| 目標 | KPI | 目標値 |
|-----|-----|-------|
| トラフィック | 月間ページビュー | 10,000PV |
| エンゲージメント | 平均セッション時間 | 2分以上 |
| コンバージョン | nankan-analyticsクリック率 | 5%以上 |

### 4. 月次レポート作成

以下の指標を毎月記録:
- ページビュー数
- ユニークユーザー数
- 平均セッション時間
- 直帰率
- nankan-analyticsへのクリック数
- 人気ページTOP5

### 5. データドリブンな改善

GA4データに基づいて以下を最適化:
- 人気の低いページのコンテンツ改善
- CTRの低いCTAボタンのデザイン変更
- 離脱率の高いページのUX改善

## 🔗 関連リンク

- [Google Analytics 4公式ドキュメント](https://support.google.com/analytics/answer/10089681)
- [GA4イベントリファレンス](https://support.google.com/analytics/answer/9234069)
- [Google Tag Manager導入ガイド](https://tagmanager.google.com/)
- [BigQueryとの連携方法](https://support.google.com/analytics/answer/9358801)

## ✅ チェックリスト

GA4設定完了後、以下を確認してください：

- [ ] GA4プロパティが作成されている
- [ ] データストリームが作成されている（nankan-review）
- [ ] 測定ID（G-XXXXXXXXXX）を取得済み
- [ ] 環境変数 `PUBLIC_GA_ID` を設定済み（Netlify）
- [ ] サイトをデプロイ済み
- [ ] リアルタイムレポートで動作確認済み
- [ ] 外部リンククリックが記録されることを確認済み
- [ ] Search Consoleと連携済み（推奨）
- [ ] コンバージョン設定済み（nankan-analyticsクリック）
- [ ] 内部トラフィックフィルタ設定済み（推奨）

---

**最終更新**: 2025-12-31
**対象サイト**: nankan-review（https://nankan.keiba-review.jp）
**実装状況**: ✅ 完全設定済み（測定ID: G-CYJ4BWEWEG）
**作成者**: Claude Code
