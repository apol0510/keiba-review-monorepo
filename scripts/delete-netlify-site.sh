#!/bin/bash
#
# 古いNetlifyサイト削除スクリプト
#
# 使用方法: ./delete-netlify-site.sh <SITE_ID>
#

set -e

SITE_ID=${1:-""}

if [ -z "$SITE_ID" ]; then
  echo "❌ エラー: サイトIDを指定してください"
  echo ""
  echo "使用方法:"
  echo "  ./delete-netlify-site.sh <SITE_ID>"
  echo ""
  echo "例:"
  echo "  ./delete-netlify-site.sh abc123-def456-ghi789"
  exit 1
fi

echo "⚠️  警告: 以下のサイトを削除します"
echo "  サイトID: $SITE_ID"
echo ""
read -p "本当に削除しますか？ (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ キャンセルしました"
  exit 0
fi

echo ""
echo "🗑️  削除中..."
echo ""

# Netlify CLIを使用して削除
if command -v netlify &> /dev/null; then
  netlify sites:delete --site-id "$SITE_ID" --force
  echo ""
  echo "✅ 削除完了"
else
  echo "❌ エラー: Netlify CLIがインストールされていません"
  echo ""
  echo "インストール方法:"
  echo "  npm install -g netlify-cli"
  exit 1
fi

echo ""
echo "=== 削除後の確認 ==="
echo ""
echo "以下のコマンドで確認してください:"
echo "  curl -I https://keiba-review.jp | head -3"
echo "  curl -I https://nankan.keiba-review.jp | head -3"
