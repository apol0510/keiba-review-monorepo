# @keiba-review/shared

競馬予想サイト口コミプラットフォームの共通パッケージ

## 概要

このパッケージは、keiba-review Monorepo内の全サイトで共有される共通機能を提供します。

## 含まれるモジュール

### 📦 lib - ユーティリティライブラリ

- **airtable.ts** - Airtable操作の統一インターフェース
  - サイト情報取得（全件、承認済み、カテゴリ別、Slug別）
  - 口コミ情報取得（サイト別、承認済み、承認待ち）
  - CRUD操作（作成、承認、削除）
  - 統計情報取得
  - メモリキャッシュ（30分TTL）

- **validation.ts** - フォームバリデーション
  - Zodスキーマ定義
  - NGワード検出
  - 口コミ投稿スキーマ
  - サイト登録リクエストスキーマ

### 🎨 ui - UIコンポーネント

共通UIコンポーネント（Astro + React）

*予定:*
- SiteCard.astro - サイトカード
- ReviewForm.tsx - 口コミ投稿フォーム
- StarRating.astro - 星評価表示
- その他共通コンポーネント

### 🏷️ types - TypeScript型定義

```typescript
import type { Site, Review, Category, SiteQuality } from '@keiba-review/shared/types';
```

- カテゴリ: `nankan` | `chuo` | `chihou`
- サイト品質: `premium` | `excellent` | `normal` | `poor` | `malicious`
- サイトステータス: `active` | `pending` | `rejected`
- 口コミステータス: `approved` | `pending` | `spam`

### 🤖 review-engine - 口コミ自動投稿エンジン

534件のテンプレートを使用した口コミ自動生成

```typescript
import { generateReview, shouldPost, isUnderReviewLimit } from '@keiba-review/shared/review-engine';

// サイト品質に基づいて口コミ生成
const { rating, template } = generateReview('excellent');

// 投稿すべきか判定
if (shouldPost('excellent')) {
  // 口コミを投稿
}

// 口コミ上限チェック
if (isUnderReviewLimit(currentCount, 'excellent')) {
  // まだ投稿可能
}
```

## インストール

```bash
# Monorepoルートで
pnpm install
```

## 使い方

### Astroプロジェクトから使用

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // ...
  vite: {
    resolve: {
      alias: {
        '@keiba-review/shared': '../shared'
      }
    }
  }
});
```

```typescript
// src/pages/index.astro
import { getApprovedSites } from '@keiba-review/shared/lib';

const sites = await getApprovedSites();
```

### コンポーネントでの使用

```astro
---
// src/components/SiteList.astro
import { getSitesWithStats } from '@keiba-review/shared/lib';
import { categoryLabels } from '@keiba-review/shared/types';

const sites = await getSitesWithStats();
---

<div>
  {sites.map(site => (
    <div>
      <h2>{site.name}</h2>
      <p>{categoryLabels[site.category]}</p>
      <p>⭐ {site.average_rating?.toFixed(1)} ({site.review_count}件)</p>
    </div>
  ))}
</div>
```

## 開発

```bash
# TypeScriptビルド
pnpm build

# Watch mode
pnpm dev
```

## ライセンス

Proprietary - keiba-review Monorepo
