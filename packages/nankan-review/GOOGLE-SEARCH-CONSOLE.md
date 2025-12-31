# Google Search Console 登録ガイド

nankan-review サイトを Google Search Console (GSC) に登録するための手順書です。

## 📋 前提条件

- ✅ サイトが本番環境にデプロイ済み（https://nankan.keiba-review.jp）
- ✅ Googleアカウントを所有している
- ✅ サイトマップとrobots.txtが正しく設定されている

## 🚀 GSC登録手順

### Step 1: Google Search Consoleにアクセス

1. https://search.google.com/search-console にアクセス
2. Googleアカウントでログイン

### Step 2: プロパティを追加

1. 左上の「プロパティを追加」をクリック
2. プロパティタイプを選択：
   - **URLプレフィックス**: `https://nankan.keiba-review.jp` を入力
   - （推奨）ドメイン全体を管理する場合は「ドメイン」を選択して `nankan.keiba-review.jp` を入力

### Step 3: 所有権の確認

以下のいずれかの方法で所有権を確認します：

#### 方法1: HTMLファイルアップロード（推奨）

1. GSCから提供されるHTMLファイル（例: `google1234567890abcdef.html`）をダウンロード
2. ファイルを `packages/nankan-review/public/` に配置
3. デプロイ
4. GSCで「確認」ボタンをクリック
5. アクセス可能確認: `https://nankan.keiba-review.jp/google1234567890abcdef.html`

#### 方法2: HTMLタグ

1. GSCから提供されるメタタグをコピー
   ```html
   <meta name="google-site-verification" content="abc123..." />
   ```
2. `packages/nankan-review/src/layouts/BaseLayout.astro` の `<head>` 内に追加
3. デプロイ
4. GSCで「確認」ボタンをクリック

#### 方法3: Google Analytics（既にGA4設定済みの場合）

1. GSCで「Google Analytics」を選択
2. 同じGoogleアカウントでGA4を設定している場合、自動的に確認される
3. GA4プロパティID（G-XXXXXXXXXX）が一致していることを確認

#### 方法4: DNS TXTレコード（ドメイン所有者の場合）

1. GSCから提供されるTXTレコードをコピー
2. DNSプロバイダー（Netlify DNS等）でTXTレコードを追加
   - ホスト名: `@` または `nankan.keiba-review.jp`
   - タイプ: `TXT`
   - 値: `google-site-verification=abc123...`
3. DNS変更が反映されるまで待つ（最大48時間、通常は数分〜数時間）
4. GSCで「確認」ボタンをクリック

### Step 4: サイトマップの送信

所有権確認後、サイトマップを送信します：

1. 左メニューから「サイトマップ」を選択
2. 「新しいサイトマップの追加」に `sitemap.xml` を入力
3. 「送信」ボタンをクリック
4. ステータスが「成功しました」になることを確認

**サイトマップURL**: `https://nankan.keiba-review.jp/sitemap.xml`

### Step 5: URL検査ツールで確認

1. 左メニューから「URL検査」を選択
2. トップページURL `https://nankan.keiba-review.jp/` を入力
3. 「インデックス登録をリクエスト」をクリック
4. クロールが完了するまで待つ（数分〜数日）

## 📊 設定後の確認事項

### 1. サイトマップが正しく読み込まれているか確認

```bash
# サイトマップにアクセス
curl https://nankan.keiba-review.jp/sitemap.xml

# robots.txtにアクセス
curl https://nankan.keiba-review.jp/robots.txt
```

期待される出力：
- サイトマップ: XML形式で全ページのURL一覧
- robots.txt: Googlebot許可設定とサイトマップURL

### 2. GSCでインデックス状況を確認

1. 「カバレッジ」レポート（数日後にデータが表示される）
2. 「パフォーマンス」レポート（検索結果での表示回数、クリック数）
3. 「モバイルユーザビリティ」（モバイル対応の確認）

### 3. Search Consoleとの連携確認

- **Google Analytics 4**: GA4とSearch Consoleを連携すると、GA4で検索キーワードデータを確認可能
- **Bing Webmaster Tools**: 同様にBing版のSearch Consoleにも登録推奨

## 🔧 トラブルシューティング

### サイトマップが「取得できませんでした」エラー

**原因**: サイトマップファイルが存在しないか、アクセスできない

**解決方法**:
```bash
# ローカルビルドでサイトマップが生成されているか確認
pnpm --filter=@keiba-review/nankan-review build
ls -la packages/nankan-review/dist/

# Netlifyで環境変数が設定されているか確認
netlify env:list

# SITE_URL環境変数を設定
netlify env:set SITE_URL "https://nankan.keiba-review.jp"

# デプロイ
git push
```

### 所有権確認ファイルが見つからない

**原因**: HTMLファイルが正しくデプロイされていない

**解決方法**:
```bash
# HTMLファイルを public/ に配置
cp google1234567890abcdef.html packages/nankan-review/public/

# ビルドテスト
pnpm --filter=@keiba-review/nankan-review build

# デプロイ後、アクセス確認
curl https://nankan.keiba-review.jp/google1234567890abcdef.html
```

### 「インデックスに登録されましたが、サイトマップに送信していません」

**症状**: ページはインデックスされているが、サイトマップ経由ではない

**解決方法**: 問題ありません。Googleが自動的にクロールしただけです。サイトマップを送信すれば優先的にクロールされるようになります。

### robots.txtでブロックされています

**原因**: robots.txtの設定ミス

**解決方法**:
```bash
# robots.txtの内容を確認
cat packages/nankan-review/public/robots.txt

# 正しい設定:
# User-agent: *
# Allow: /
# Sitemap: https://nankan.keiba-review.jp/sitemap.xml
```

### DNS TXTレコードが確認できない

**原因**: DNS変更が反映されていない

**解決方法**:
```bash
# DNS TXTレコードを確認
nslookup -type=TXT nankan.keiba-review.jp

# または
dig TXT nankan.keiba-review.jp

# 結果に google-site-verification=xxx が含まれていることを確認
```

## 📈 GSC活用のベストプラクティス

### 1. 定期的な確認（週1回推奨）

- カバレッジエラーの確認
- インデックス登録状況
- モバイルユーザビリティ
- Core Web Vitals（ページ表示速度）

### 2. 検索パフォーマンスの分析

- どのキーワードで検索されているか
- クリック率（CTR）の改善
- 表示回数の推移

### 3. 構造化データの確認

- 「拡張」→「リッチリザルト」で構造化データエラーを確認
- nankan-reviewではProductスキーマを実装済み

### 4. サイトリンクの最適化

- 主要ページへの内部リンク強化
- タイトルタグとメタディスクリプションの最適化

## 🔗 関連リンク

- [Google Search Console公式ヘルプ](https://support.google.com/webmasters)
- [サイトマップについて](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [構造化データテストツール](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)

## ✅ チェックリスト

GSC登録完了後、以下を確認してください：

- [ ] プロパティが追加されている
- [ ] 所有権が確認されている
- [ ] サイトマップが送信されている
- [ ] サイトマップのステータスが「成功しました」
- [ ] トップページがインデックスリクエスト済み
- [ ] robots.txtが正しく設定されている
- [ ] GA4とSearch Consoleが連携されている（オプション）
- [ ] Bing Webmaster Toolsにも登録（推奨）

---

**最終更新**: 2025-12-31
**対象サイト**: nankan-review（https://nankan.keiba-review.jp）
**作成者**: Claude Code
