# Month 1 実装ガイド - GA4基盤構築

**対象期間:** 2026-01（現在）
**フェーズ:** 基盤構築
**目標:** GA4設定完了、ベースラインデータ収集開始

---

## 📋 チェックリスト概要

### Week 1（実装週）
- [ ] **GA4アカウント設定** - keiba-review-all用のプロパティ作成
- [ ] **環境変数設定** - ローカル + Netlify
- [ ] **カスタムイベント実装** - nankan-analyticsクリック追跡強化
- [ ] **Search Console連携** - 両サイトで設定

### Week 2-4（検証・ベースライン確立）
- [ ] **データ収集確認** - GA4リアルタイムレポート
- [ ] **コンバージョン設定** - nankan-analyticsクリック = コンバージョン
- [ ] **ベースラインデータ取得** - 週次データ収集開始

---

## 🎯 Task 1: GA4アカウント設定（keiba-review-all）

### 現在の状況

| サイト | GA4設定 | 測定ID | 状態 |
|--------|---------|--------|------|
| nankan-review | ✅ 完了 | G-CYJ4BWEWEG | 稼働中 |
| keiba-review-all | ❌ 未設定 | - | 要設定 |

### 設定手順

#### 1. Google Analytics 4アカウント作成

```bash
# 1. https://analytics.google.com/ にアクセス
# 2. 「管理」→「プロパティを作成」をクリック

プロパティ名: 競馬予想サイト口コミ - 総合
タイムゾーン: 日本
通貨: 日本円（JPY）

# 3. データストリームを作成
ストリーム名: keiba-review.jp
ウェブサイトURL: https://keiba-review.jp
測定ID: G-XXXXXXXXXX（コピーしておく）
```

#### 2. 環境変数の設定

**ローカル環境（.env）:**

```bash
# packages/keiba-review-all/.env に追加
PUBLIC_GA_ID=G-XXXXXXXXXX  # ← 上記で取得した測定ID

# 同時にSITE_URLも本番URLに更新（重要）
SITE_URL=https://keiba-review.jp
```

**Netlify環境変数:**

```bash
# Netlify CLIで設定
cd packages/keiba-review-all
netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"
netlify env:set SITE_URL "https://keiba-review.jp"

# または Netlify Webコンソールで設定
# https://app.netlify.com/sites/[site-name]/settings/deploys#environment-variables
```

#### 3. デプロイ・確認

```bash
# ローカルビルドテスト
cd packages/keiba-review-all
pnpm build

# デプロイ（Netlifyの場合は自動）
git add packages/keiba-review-all/.env
git commit -m "feat(keiba-review-all): Add GA4 tracking"
git push

# リアルタイムレポートで確認
# GA4管理画面 > レポート > リアルタイム
# 自分でサイトにアクセスして、カウントが増えるか確認
```

---

## 🎯 Task 2: カスタムイベント強化（両サイト）

### nankan-review（既に実装済み✅）

以下のイベントが既に実装されています：

```javascript
// 1. External link tracking
gtag('event', 'click', {
  event_category: 'outbound',
  event_label: href,
  link_text: text,
  value: 1
});

// 2. Form submission tracking
gtag('event', 'form_submit', {
  event_category: 'engagement',
  event_label: formId,
  form_action: formAction,
  value: 1
});

// 3. nankan-analytics CTA click tracking（重要🎯）
gtag('event', 'cta_click', {
  event_category: 'conversion',
  event_label: 'nankan_analytics_cta',
  link_text: text,
  link_url: href,
  value: 1
});

// 4. Scroll depth tracking
gtag('event', 'scroll', {
  event_category: 'engagement',
  event_label: `${mark}%`,
  value: mark
});

// 5. Site visit button tracking
gtag('event', 'site_visit_click', {
  event_category: 'conversion',
  event_label: 'site_visit_button',
  link_url: href,
  value: 1
});
```

### keiba-review-all（要強化⚠️）

現在は基本的な外部リンク追跡のみ。nankan-reviewと同じレベルに強化する必要があります。

**実装方法:**

packages/keiba-review-all/src/layouts/BaseLayout.astro のスクリプトセクション（line 227-248）を以下に置き換え：

```javascript
<script is:inline>
  // GA4 Enhanced Event Tracking
  document.addEventListener('DOMContentLoaded', () => {
    // 1. External link tracking (target="_blank")
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.href;
        const text = link.textContent?.trim() || '';

        if (typeof gtag !== 'undefined') {
          gtag('event', 'click', {
            event_category: 'outbound',
            event_label: href,
            link_text: text,
            value: 1
          });
        }
      });
    });

    // 2. Form submission tracking
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        const formId = form.id || 'unknown';
        const formAction = form.action || window.location.pathname;

        if (typeof gtag !== 'undefined') {
          gtag('event', 'form_submit', {
            event_category: 'engagement',
            event_label: formId,
            form_action: formAction,
            value: 1
          });
        }
      });
    });

    // 3. nankan-analytics CTA tracking（重要🎯）
    document.querySelectorAll('a[href*="nankan-analytics"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const text = link.textContent?.trim() || '';
        const href = link.href;

        if (typeof gtag !== 'undefined') {
          gtag('event', 'cta_click', {
            event_category: 'conversion',
            event_label: 'nankan_analytics_cta',
            link_text: text,
            link_url: href,
            value: 1
          });
        }
      });
    });

    // 4. Scroll depth tracking (25%, 50%, 75%, 100%)
    let scrollMarks = { 25: false, 50: false, 75: false, 100: false };

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      [25, 50, 75, 100].forEach((mark) => {
        if (scrollPercent >= mark && !scrollMarks[mark]) {
          scrollMarks[mark] = true;

          if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll', {
              event_category: 'engagement',
              event_label: `${mark}%`,
              value: mark
            });
          }
        }
      });
    });

    // 5. "Site visit" button tracking
    document.querySelectorAll('a').forEach((link) => {
      const text = link.textContent?.trim() || '';
      if (text.includes('サイトを見る') || text.includes('公式サイト')) {
        link.addEventListener('click', (e) => {
          const href = link.href;

          if (typeof gtag !== 'undefined') {
            gtag('event', 'site_visit_click', {
              event_category: 'conversion',
              event_label: 'site_visit_button',
              link_url: href,
              value: 1
            });
          }
        });
      }
    });
  });
</script>
```

---

## 🎯 Task 3: Google Search Console連携

### 必要性
- 検索キーワード分析
- クリック率・表示回数の確認
- インデックス状況の確認
- SEO最適化の基盤

### 設定手順（両サイト共通）

#### 1. Search Console登録

```bash
# 1. https://search.google.com/search-console/ にアクセス
# 2. 「プロパティを追加」をクリック

# nankan-review
プロパティタイプ: URLプレフィックス
URL: https://nankan.keiba-review.jp

# keiba-review-all
プロパティタイプ: URLプレフィックス
URL: https://keiba-review.jp
```

#### 2. 所有権の確認

**方法1: HTMLタグ（既に実装済み✅）**

両サイトのBaseLayout.astroに既に実装済み：

```html
<!-- Google Search Console Verification -->
<meta name="google-site-verification" content="LJ1qNn3SZFuo5zHjLtI58OZSKKXXeVugmiXG2SPGMe8" />
```

**方法2: Google Analytics（推奨✅）**

GA4を設定済みの場合、自動的に所有権が確認されます。

#### 3. GA4との連携

```bash
# 1. GA4管理画面を開く
# https://analytics.google.com/ > 管理

# 2. 「Search Consoleのリンク」をクリック
# プロパティ列 > 「Search Consoleのリンク」

# 3. 「リンク」をクリック
# 対象のSearch Consoleプロパティを選択
# 「確認」→「次へ」→「送信」

# 4. 確認
# GA4 > レポート > 集客 > Search Console
# データが表示されるまで24-48時間かかる
```

#### 4. サイトマップ送信

```bash
# 両サイトともsitemap.xmlは実装済み

# Search Console > サイトマップ
# 新しいサイトマップの追加: sitemap.xml
# 「送信」をクリック

# nankan-review
https://nankan.keiba-review.jp/sitemap.xml

# keiba-review-all
https://keiba-review.jp/sitemap.xml
```

---

## 🎯 Task 4: コンバージョン設定（GA4）

### コンバージョン目標

| イベント名 | 説明 | 重要度 |
|-----------|------|--------|
| `cta_click` | nankan-analyticsへのクリック | 🔴 最重要 |
| `site_visit_click` | 予想サイトへの訪問 | 🟡 重要 |
| `form_submit` | 口コミ投稿 | 🟢 参考 |

### 設定手順

```bash
# 1. GA4管理画面を開く
# 管理 > イベント

# 2. 「cta_click」イベントを見つける
# （イベントが表示されるまで24時間かかる場合があります）

# 3. 「コンバージョンとしてマークを付ける」トグルをON

# 4. 同様に「site_visit_click」もコンバージョンに設定

# 5. 確認
# レポート > ライフサイクル > エンゲージメント > コンバージョン
```

### コンバージョン目標値の設定（推奨）

```bash
# GA4管理画面 > 管理 > コンバージョン

# cta_click（nankan-analyticsクリック）
デフォルト値: 1,000円
説明: 1クリック = 潜在的な有料会員獲得

# site_visit_click（予想サイト訪問）
デフォルト値: 100円
説明: 1訪問 = サイト発見価値

# 計算根拠（MAX-POTENTIAL-ANALYSIS.mdより）:
# - 有料会員1人 = 月額4,500円
# - コンバージョン率 = 3.5%
# - 1クリックの期待値 = 4,500 × 3.5% = 157.5円 ≈ 1,000円（LTV考慮）
```

---

## 🎯 Task 5: ベースラインデータ収集

### データ収集項目

Week 2-4で以下のデータを毎週収集してください：

#### 必須データ（3項目）

```markdown
**1. 訪問者数（Users）**
GA4 > レポート > ライフサイクル > エンゲージメント > 概要
期間: 過去7日間
指標: ユーザー

**2. nankan-analyticsクリック数**
GA4 > レポート > ライフサイクル > エンゲージメント > イベント
イベント名: cta_click
パラメータでフィルタ: event_label = "nankan_analytics_cta"
期間: 過去7日間

**3. オーガニック検索の割合**
GA4 > レポート > ライフサイクル > 集客 > トラフィック獲得
期間: 過去7日間
セッションのデフォルト チャネル グループで「Organic Search」を確認
```

#### 推奨データ（可能なら収集）

```markdown
**4. ページビュー数**
GA4 > レポート > ライフサイクル > エンゲージメント > 概要
指標: 表示回数

**5. 平均セッション時間**
GA4 > レポート > ライフサイクル > エンゲージメント > 概要
指標: 平均エンゲージメント時間

**6. 直帰率**
GA4 > レポート > ライフサイクル > エンゲージメント > 概要
指標: 直帰率

**7. 人気ページTOP5**
GA4 > レポート > ライフサイクル > エンゲージメント > ページとスクリーン
期間: 過去7日間
```

### データ記録フォーマット

```markdown
# Week 1 ベースラインデータ（2026-01-08）

## nankan-review
- 訪問者数: XX人
- nankan-analyticsクリック: XX回
- オーガニック検索: XX%
- ページビュー: XX
- 平均セッション時間: XXs
- 直帰率: XX%

## keiba-review-all
- 訪問者数: XX人
- nankan-analyticsクリック: XX回
- オーガニック検索: XX%
- ページビュー: XX
- 平均セッション時間: XXs
- 直帰率: XX%

## 所感
- [気づいた点や改善案を記録]
```

---

## 📅 Week 2以降のルーティン

### 毎週実施すること（月曜10:00推奨）

```bash
# 1. Claude Codeに「週次レビュー」と言う
# → 自動的にGA4データ要求、分析、提案が開始される

# 2. GA4でデータを確認（上記の必須データ3項目）

# 3. データをClaude Codeに共有

# 4. 提案されたアクションを実行

# 5. 次週に向けた調整
```

### カレンダー登録

```
タイトル: 【週次】keiba-review GA4レビュー
日時: 毎週月曜 10:00
リマインダー: 10分前
場所: Claude Code
説明:
1. Claude Codeに「週次レビュー」と入力
2. GA4データを確認（訪問者、クリック数、オーガニック率）
3. 提案されたアクションを実行
```

---

## 🚨 トラブルシューティング

### GA4でデータが表示されない

**症状:** リアルタイムレポートでカウントが増えない

**確認項目:**
1. 環境変数 `PUBLIC_GA_ID` が設定されているか確認
   ```bash
   # ローカル
   cat packages/keiba-review-all/.env | grep PUBLIC_GA_ID

   # Netlify
   netlify env:list | grep PUBLIC_GA_ID
   ```

2. 測定IDが正しいか確認（`G-`で始まる）

3. デプロイが完了しているか確認
   ```bash
   # Netlifyデプロイ状況確認
   netlify status
   ```

4. ブラウザのコンソールでエラーがないか確認
   ```
   F12 > Console > "gtag" でフィルタ
   ```

### Search Consoleでエラー

**症状:** 「所有権を確認できません」

**解決方法:**
1. HTMLタグが正しく配置されているか確認
   ```bash
   curl https://nankan.keiba-review.jp/ | grep "google-site-verification"
   ```

2. GA4連携を試す（推奨）
   ```
   GA4管理画面 > Search Consoleのリンク
   ```

### カスタムイベントが記録されない

**症状:** GA4でイベントが表示されない

**確認項目:**
1. リアルタイムレポートで即座に確認
   ```
   GA4 > レポート > リアルタイム > イベント
   ```

2. イベント名のスペルミスがないか確認
   ```javascript
   // 正しい
   gtag('event', 'cta_click', {...});

   // 間違い
   gtag('event', 'ctaClick', {...});
   ```

3. ブラウザの広告ブロッカーを無効化

---

## ✅ Month 1完了チェックリスト

### Week 1（実装週）
- [ ] keiba-review-all用GA4プロパティ作成
- [ ] 測定ID（G-XXXXXXXXXX）取得
- [ ] .envファイルに `PUBLIC_GA_ID` 追加
- [ ] Netlify環境変数に `PUBLIC_GA_ID` 設定
- [ ] keiba-review-allのカスタムイベント強化
- [ ] ローカルビルドテスト成功
- [ ] 本番デプロイ成功
- [ ] GA4リアルタイムレポートで確認

### Week 1（Search Console）
- [ ] Search Console登録（両サイト）
- [ ] 所有権確認完了
- [ ] GA4との連携完了
- [ ] サイトマップ送信完了

### Week 2-4（検証・ベースライン）
- [ ] Week 1ベースラインデータ収集
- [ ] Week 2ベースラインデータ収集
- [ ] Week 3ベースラインデータ収集
- [ ] Week 4ベースラインデータ収集
- [ ] コンバージョン設定完了（cta_click）
- [ ] カレンダー登録完了（週次レビュー）

---

## 📊 Month 1終了時の期待値

### 目標KPI（GA4-GROWTH-ROADMAP.mdより）

**nankan-review:**
- 訪問者数: 50-100人/月
- nankan-analyticsクリック: 2-5回/月
- オーガニック流入: 5-10%

**keiba-review-all:**
- 訪問者数: 200-500人/月（既存ベース）
- nankan-analyticsクリック: 10-20回/月
- オーガニック流入: 10-20%

### 達成基準

- ✅ GA4が両サイトで正常に動作している
- ✅ ベースラインデータが4週分収集されている
- ✅ Search Console連携が完了している
- ✅ 週次レビューのルーティンが確立されている

---

## 🔗 参考資料

- [GA4-GROWTH-ROADMAP.md](./GA4-GROWTH-ROADMAP.md) - 6ヶ月計画
- [WEEKLY-REVIEW-CHECKLIST.md](./WEEKLY-REVIEW-CHECKLIST.md) - 週次レビュー手順
- [MAX-POTENTIAL-ANALYSIS.md](./MAX-POTENTIAL-ANALYSIS.md) - 最大効果分析
- [Google Analytics 4 公式ドキュメント](https://support.google.com/analytics/answer/10089681)
- [Search Console ヘルプ](https://support.google.com/webmasters/answer/9128668)

---

**作成日:** 2026-01-01
**対象期間:** 2026-01（Month 1）
**次回更新:** Month 2開始時（2026-02-01）
