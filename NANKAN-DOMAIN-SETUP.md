# nankan.keiba-review.jp ドメイン設定ガイド

## 概要

nankan-reviewサイトに `nankan.keiba-review.jp` カスタムドメインを設定します。

## 前提条件

- keiba-review.jp ドメインの管理権限
- Netlifyアカウントへのアクセス権限

## 設定手順

### 1. Netlifyでドメインを追加

1. **Netlify管理画面にアクセス**
   - URL: https://app.netlify.com/sites/nankan-review
   - サイトID: `09a04324-f8be-4e2d-b240-c467bfaa8983`

2. **Domain management を開く**
   - 左サイドバーから「Domain management」をクリック

3. **カスタムドメインを追加**
   - 「Add custom domain」ボタンをクリック
   - ドメイン名を入力: `nankan.keiba-review.jp`
   - 「Verify」をクリック
   - 「Add domain」をクリックして確定

4. **DNS設定情報を確認**
   - 追加したドメインをクリック
   - 「Awaiting External DNS」の状態を確認
   - DNS設定に必要な情報（CNAME先）をメモ

### 2. DNS設定

keiba-review.jp のDNSプロバイダー（お名前.com、Cloudflare、Route53など）で設定：

#### CNAMEレコードを追加

```
Type: CNAME
Name: nankan
Value: main--nankan-review.netlify.app
TTL: 3600（または自動）
```

#### 設定例（主要プロバイダー）

**お名前.com:**
1. ドメイン管理画面 → DNSレコード設定
2. 「追加」をクリック
3. ホスト名: `nankan`
4. TYPE: `CNAME`
5. VALUE: `main--nankan-review.netlify.app`
6. 保存

**Cloudflare:**
1. DNS管理画面を開く
2. 「Add record」をクリック
3. Type: `CNAME`
4. Name: `nankan`
5. Target: `main--nankan-review.netlify.app`
6. Proxy status: DNS only（オレンジ雲マークOFF）
7. Save

**Route53 (AWS):**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "nankan.keiba-review.jp",
        "Type": "CNAME",
        "TTL": 3600,
        "ResourceRecords": [{"Value": "main--nankan-review.netlify.app"}]
      }
    }]
  }'
```

### 3. DNS伝播の確認

DNS設定後、伝播を確認します（通常10分〜数時間）：

```bash
# CNAMEレコードを確認
dig nankan.keiba-review.jp CNAME +short

# 期待される出力
main--nankan-review.netlify.app.
```

オンラインツールでも確認可能：
- https://www.whatsmydns.net/
- https://dnschecker.org/

### 4. SSL証明書の発行

DNS伝播後、NetlifyがSSL証明書を自動発行します：

1. Netlify管理画面に戻る
2. 「Domain management」を確認
3. `nankan.keiba-review.jp` の横に緑のチェックマークが表示される
4. 「HTTPS」セクションで証明書のステータスを確認
5. 「Verify DNS configuration」をクリック（必要な場合）
6. SSL証明書が発行されるまで10-60分待つ

### 5. 動作確認

以下のURLにアクセスして確認：

```bash
# HTTP（リダイレクトされる）
curl -I http://nankan.keiba-review.jp

# HTTPS（最終的なURL）
curl -I https://nankan.keiba-review.jp
```

ブラウザでアクセス：
- https://nankan.keiba-review.jp

**確認項目:**
- ✅ サイトが表示される
- ✅ HTTPSで接続される（鍵マーク表示）
- ✅ SSL証明書が有効
- ✅ リダイレクトが正常（HTTP → HTTPS）

## トラブルシューティング

### DNS設定が反映されない

```bash
# TTLを確認（短いほど早く反映）
dig nankan.keiba-review.jp CNAME

# キャッシュをクリア
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows（コマンドプロンプト管理者権限）
ipconfig /flushdns
```

### SSL証明書が発行されない

1. DNS設定を再確認
2. Netlifyで「Verify DNS configuration」をクリック
3. CAA DNSレコードがブロックしていないか確認
4. Netlify Supportに問い合わせ

### 既存のDNSレコードと競合

- `nankan.keiba-review.jp` のAレコードやAAAAレコードが存在する場合は削除
- CNAMEレコードのみを使用

## 環境変数の更新

ドメイン設定後、環境変数を更新：

```bash
# packages/nankan-review/.env
SITE_URL=https://nankan.keiba-review.jp
```

Netlify環境変数も更新：

```bash
netlify env:set SITE_URL "https://nankan.keiba-review.jp"
```

またはNetlify Webインターフェース：
1. Site settings → Environment variables
2. `SITE_URL` を追加または編集
3. Value: `https://nankan.keiba-review.jp`
4. Save

## ドキュメント更新

ドメイン設定完了後、以下のドキュメントを更新：

1. **README.md**
   - nankan-reviewのURLを更新

2. **CLAUDE.md**
   - Phase 3/4のステータス更新
   - ドメイン設定完了を記載

3. **packages/nankan-review/CLAUDE.md**
   - URLセクションを更新

## 参考リンク

- [Netlify Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- [Netlify SSL/TLS](https://docs.netlify.com/domains-https/https-ssl/)
- [DNS設定確認ツール](https://www.whatsmydns.net/)

---

**作成日:** 2025-12-30
**最終更新:** 2025-12-30
