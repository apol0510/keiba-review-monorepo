# APIエンドポイント設計ガイドライン

## 📋 概要

このドキュメントは、keiba-review-monorepo内でのAPIエンドポイントの設計・実装における再発防止策とベストプラクティスをまとめたものです。

## 🚨 発生した問題（2026-01-21）

### 症状
- 口コミの「いいねボタン」が押せない
- フロントエンドでエラーが発生していない

### 根本原因

**問題1: APIエンドポイントの重複**
- Netlify Functions: `/.netlify/functions/helpful`
- Astro API Route: `/api/reviews/helpful`
- 両方が存在し、フロントエンドはNetlify Functionsを呼び出していた

**問題2: レスポンス構造の不整合**
```typescript
// Netlify Functions (helpful.ts)
{ success: true, count: newCount }  // ✅ 期待される構造

// Astro API Route (src/pages/api/reviews/helpful.ts)
{ success: true, newCount: currentCount + 1 }  // ❌ フィールド名が異なる
```

**問題3: フロントエンドとの不整合**
```typescript
// HelpfulButtonAstro.astro:129
const newCount = data.count;  // 'count' フィールドを期待

// しかし、Astro API Routeは 'newCount' を返していた
```

### 影響範囲
- keiba-review-all
- nankan-review

## ✅ 実施した修正（2026-01-21）

### 1. 不要なAPIルートの削除

```bash
# keiba-review-all
rm packages/keiba-review-all/src/pages/api/reviews/helpful.ts

# nankan-reviewには存在しなかった
```

### 2. Netlify Functionsへの統一

**採用理由:**
- サーバーレス関数として独立している
- Netlifyのビルドプロセスと統合されている
- CORSヘッダーの管理が容易
- 既存のフロントエンドコードと互換性がある

### 3. レスポンス構造の統一

**標準レスポンス構造:**
```typescript
// 成功時
{
  success: true,
  count: number  // ✅ 'count' フィールド名で統一
}

// エラー時
{
  error: string,
  details?: string
}
```

## 🎯 再発防止策

### 1. APIエンドポイント設計原則

#### 原則1: 1機能 = 1エンドポイント

❌ **悪い例:**
```
/.netlify/functions/helpful  ← 実装されている
/api/reviews/helpful         ← 同じ機能で重複
```

✅ **良い例:**
```
/.netlify/functions/helpful  ← 1つのみ実装
```

#### 原則2: レスポンス構造の統一

**必須:**
- フィールド名は全エンドポイントで統一する
- TypeScript型定義を必ず作成する
- フロントエンドとバックエンドで同じ型を使用する

**実装例:**
```typescript
// packages/shared/types/api.ts
export interface HelpfulCountResponse {
  success: true;
  count: number;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

// Netlify Function
import type { HelpfulCountResponse } from '@keiba-review/shared/types/api';

return {
  statusCode: 200,
  headers,
  body: JSON.stringify({
    success: true,
    count: newCount
  } as HelpfulCountResponse)
};

// フロントエンド
const response = await fetch('/.netlify/functions/helpful', { ... });
const data: HelpfulCountResponse = await response.json();
console.log(data.count);  // 型安全
```

### 2. APIエンドポイント選択ガイド

| ケース | 推奨 | 理由 |
|--------|------|------|
| データベース操作（CUD） | Netlify Functions | サーバーレス、セキュリティ、CORS管理 |
| 外部API呼び出し | Netlify Functions | APIキーの秘匿化 |
| 簡単なGET（静的） | Astro API Route | Astroのビルドプロセスと統合 |
| フォーム送信 | Netlify Functions | reCAPTCHA検証、メール送信など |
| 認証・認可 | Netlify Functions | JWT生成、セッション管理 |

### 3. 実装チェックリスト

新しいAPIエンドポイントを実装する際は、以下を確認してください：

- [ ] **重複チェック**: 同じ機能のエンドポイントが既に存在しないか
- [ ] **型定義作成**: `packages/shared/types/api.ts` に型定義を追加
- [ ] **レスポンス構造統一**: 既存のエンドポイントと一貫性を保つ
- [ ] **エラーハンドリング**: 標準エラーレスポンスを返す
- [ ] **CORS設定**: 必要に応じてCORSヘッダーを設定
- [ ] **環境変数**: 必要な環境変数がドキュメント化されている
- [ ] **テスト**: 手動またはE2Eテストで動作確認
- [ ] **ドキュメント更新**: `CLAUDE.md` にAPIエンドポイントを記載

### 4. コードレビューポイント

**レビュー時に確認すべき項目:**

1. **エンドポイントの重複**
   ```bash
   # 既存のエンドポイントを検索
   find packages -name "*helpful*" -type f
   grep -r "/.netlify/functions/helpful" packages/*/src
   ```

2. **レスポンス構造の一貫性**
   ```typescript
   // 全てのレスポンスで同じフィールド名を使用しているか？
   { count: number }  // ✅ 統一
   { newCount: number }  // ❌ 不統一
   ```

3. **型定義の使用**
   ```typescript
   // 型定義を使用しているか？
   const data: HelpfulCountResponse = await response.json();  // ✅
   const data = await response.json();  // ❌ 型安全ではない
   ```

## 📚 参考資料

### 内部ドキュメント
- [CLAUDE.md](../CLAUDE.md) - Monorepo全体のドキュメント
- [keiba-review-all/CLAUDE.md](../packages/keiba-review-all/CLAUDE.md) - API一覧
- [nankan-review/CLAUDE.md](../packages/nankan-review/CLAUDE.md) - API一覧

### 外部リンク
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🔄 今後の改善

### 優先度: 高
- [ ] APIレスポンス型定義を `packages/shared/types/api.ts` に集約
- [ ] 全APIエンドポイントでの型定義使用を徹底
- [ ] APIエンドポイント一覧ドキュメントの作成

### 優先度: 中
- [ ] E2Eテストの追加（Playwright or Cypress）
- [ ] API仕様書の自動生成（OpenAPI/Swagger）
- [ ] レスポンス構造のバリデーション

### 優先度: 低
- [ ] APIバージョニング戦略の策定
- [ ] GraphQL移行の検討

---

**最終更新:** 2026-01-21
**作成者:** Claude Code
**バージョン:** v1.0.0
