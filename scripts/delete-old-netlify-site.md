# 古いNetlifyサイト削除手順

## ⚠️ 削除前の確認事項

以下を**必ず**確認してください:

### 1. カスタムドメインの確認

```bash
# keiba-review.jp が新サイトを指しているか確認
curl -I https://keiba-review.jp | grep x-nf-request-id

# 新サイト（keiba-review-monorepo）のデプロイを確認
curl -I https://keiba-review.jp | head -1
# → HTTP/2 200 であれば正常
```

### 2. 古いサイトのバックアップ（任意）

もし古いサイトに独自のコンテンツがある場合:

```bash
# 古いリポジトリはアーカイブ済みなのでバックアップ不要
# コードは keiba-review-monorepo に移行済み
```

### 3. 削除の影響範囲

- ✅ keiba-review.jp: 新サイトに移行済み（影響なし）
- ✅ コード: keiba-review-monorepo に移行済み（影響なし）
- ⚠️ 古いサブドメイン: もし設定されていれば影響あり

## 🗑️ 削除手順

### オプション1: Netlify Web UIから削除

1. https://app.netlify.com/projects/frabjous-taiyaki-460401 にアクセス
2. Site settings → General → Danger zone
3. "Delete this site" をクリック
4. サイト名 `frabjous-taiyaki-460401` を入力して確認
5. "Delete" をクリック

### オプション2: Netlify CLIから削除

```bash
# Netlify CLIで削除（推奨）
netlify sites:delete --site-id <SITE_ID>

# サイトIDの確認方法:
# https://app.netlify.com/projects/frabjous-taiyaki-460401
# URLの最後の部分がサイトID
```

### オプション3: Netlify APIから削除

```bash
# curlで削除（上級者向け）
curl -X DELETE \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  https://api.netlify.com/api/v1/sites/<SITE_ID>
```

## ✅ 削除後の確認

1. **keiba-review.jp が正常に動作しているか:**
   ```bash
   curl -I https://keiba-review.jp
   # → HTTP/2 200 であれば正常
   ```

2. **nankan.keiba-review.jp が正常に動作しているか:**
   ```bash
   curl -I https://nankan.keiba-review.jp
   # → HTTP/2 200 であれば正常
   ```

3. **Netlifyサイト一覧を確認:**
   ```bash
   # 残っているサイトを確認
   # frabjous-taiyaki-460401 がリストから消えていればOK
   ```

## 📊 削除のメリット

1. **管理の簡素化**
   - 古いサイトと新サイトの混乱を回避
   - メンテナンス対象が減る

2. **リソースの最適化**
   - Netlify無料枠の節約（100GBビルド時間/月）
   - ビルド履歴のストレージ節約

3. **セキュリティ**
   - 古いデプロイに脆弱性がある場合のリスク排除
   - 管理対象の削減

## ⚠️ 注意事項

- **削除は不可逆的**: 削除後は復元できません
- **ドメイン確認必須**: keiba-review.jp が新サイトを指していることを確認
- **バックアップ**: 必要に応じて事前にバックアップを取得

## 🔗 関連リソース

- 新しいサイト（keiba-review-all）: Netlify dashboard
- 新しいリポジトリ: https://github.com/apol0510/keiba-review-monorepo
- 古いリポジトリ（アーカイブ済み）: https://github.com/apol0510/keiba-review
