# GitHub Secrets セットアップガイド

X自動投稿に必要なGitHub Secretsを設定します。

## 📋 必要なSecrets

### keiba-review-all用（4個）
- KEIBA_REVIEW_ALL_X_API_KEY
- KEIBA_REVIEW_ALL_X_API_SECRET  
- KEIBA_REVIEW_ALL_X_ACCESS_TOKEN
- KEIBA_REVIEW_ALL_X_ACCESS_SECRET

### nankan-review用（4個）
注: keiba-review-allと同じAirtable Baseを使用（Categoryでフィルタ）

- NANKAN_REVIEW_X_API_KEY
- NANKAN_REVIEW_X_API_SECRET
- NANKAN_REVIEW_X_ACCESS_TOKEN
- NANKAN_REVIEW_X_ACCESS_SECRET

## 🚀 設定方法（GitHub CLI）

```bash
# keiba-review-all用
gh secret set KEIBA_REVIEW_ALL_X_API_KEY
gh secret set KEIBA_REVIEW_ALL_X_API_SECRET
gh secret set KEIBA_REVIEW_ALL_X_ACCESS_TOKEN
gh secret set KEIBA_REVIEW_ALL_X_ACCESS_SECRET

# nankan-review用（keiba-review-allと同じAirtable Baseを使用）
gh secret set NANKAN_REVIEW_X_API_KEY
gh secret set NANKAN_REVIEW_X_API_SECRET
gh secret set NANKAN_REVIEW_X_ACCESS_TOKEN
gh secret set NANKAN_REVIEW_X_ACCESS_SECRET

# 確認
gh secret list
```

---
作成日: 2026-01-03
