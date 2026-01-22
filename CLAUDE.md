# keiba-review-monorepo

競馬予想サイト口コミプラットフォーム Monorepo

## 🎯 プロジェクト目的

複数の競馬予想サイト口コミプラットフォームを効率的に運営するためのMonorepo。
nankan-analytics（南関アナリティクス）へのトラフィック誘導を目的とした戦略的サイト群。

## ⚠️ 重要な開発原則（AI開発者への指示）

### 1. Monorepoの使命
**このMonorepoの目的は「価値あるサイトを量産する」ことである。**

削除は目的に逆行する。コンテンツが不足しているサイトは、削除ではなく強化の対象である。

### 2. サイト価値の正しい評価基準
| 評価軸 | ❌ 誤った判断 | ✅ 正しい判断 |
|--------|-------------|-------------|
| **量的評価** | ページ数だけで価値を判断 | コンテンツの質と専門性を重視 |
| **比較基準** | 他サイトと単純比較 | 各サイトの戦略的目的を理解 |
| **時間軸** | 現時点のスナップショットで判断 | Phase計画と成長ポテンシャルを考慮 |

### 3. 問題発見時の対応フロー
```
サイトの価値に疑問を感じた
    ↓
❌ 削除を提案 → プロジェクト目的に反する
    ↓
✅ 正しい対応:
    1. 何が不足しているか具体的に分析
    2. 価値を与える施策を立案（コンテンツ追加、機能強化）
    3. 施策を実行し、価値あるサイトに変える
    4. 価値あるサイトになるまで任務を遂行する
```

### 4. AI開発者の責任
- **任務**: 価値あるサイトになるまで遂行せよ
- **姿勢**: コンテンツ不足 = 強化のチャンス
- **成果**: 各サイトを戦略的資産に変える

### 5. 実例: nankan-review強化（2026-01-01）

**背景:**
「nankan-reviewは8ページしかなく、価値があるのか疑問」という問題提起

**❌ 誤った対応例:**
- 削除を提案
- keiba-review-allに統合を提案
- 運用コストを理由に消極的判断

**✅ 実施した正しい対応:**
1. **分析**: 何が不足しているか特定（FAQ、ランキング、競馬場ガイド）
2. **立案**: 南関競馬特化の価値あるコンテンツを設計
3. **実行**: 11ページ追加（8 → 19ページ、+237%）
4. **成果**: 南関競馬特化の専門サイトとして価値確立

**追加コンテンツ:**
- 南関4場ガイド（大井・川崎・船橋・浦和）
- FAQ（南関競馬特化15問）
- ランキングページ
- 構造化データによるSEO強化

**教訓:**
削除を提案せず、価値を与える施策を遂行することで、
疑問視されていたサイトが戦略的資産に変わった。

### 6. Netlify デプロイの鉄則（事故防止プロトコル）

**⚠️ Netlifyは「基準点（cwd）」が全て。toml と CLI の publish/dir を混在させるな。デプロイ前に dist の存在をログで証明してから実行しろ。**

#### 1) Netlify Monorepoの唯一の真実を固定する

このリポジトリでは **Netlify の publish/functions は netlify.toml を唯一の真実とする。**
GitHub Actions / CLI から `--dir` と `--functions` を指定しない（混在禁止）。

**✅ OK（推奨）:**
```bash
cd packages/nankan-review
netlify deploy --prod  # tomlに従う
```

**❌ NG（禁止）:**
```bash
# 基準点がぶれて root/dist を見に行く事故が起きる
netlify deploy --dir=dist

# working-directory と cd の二重指定
# toml と CLI の publish/functions の二重指定
```

#### 2) "デプロイ前ゲート"を必須化（これで暴走が止まる）

デプロイを実行する前に、**必ず次をログに出す**（確認できない場合は変更禁止）。

```bash
# 1. 現在のディレクトリ確認
pwd

# 2. ディレクトリ内容確認
ls -la

# 3. distディレクトリの存在確認
ls -la dist

# 4. netlify.toml の publish/functions 確認
cat netlify.toml | sed -n '1,80p'
```

**実行条件:**
- 直近のActionsログで「Deploy path」「Configuration path」を確認し、期待値と一致すること
- **成功宣言は禁止。**「実際に存在する dist をデプロイ対象として検証できた」場合のみ実行して良い。

#### 3) 変更プロトコル（1コミット1仮説）

Netlify/CI修正は必ず **1コミット＝1仮説** で行う。

**1回で触って良いのは次のうち 1つだけ:**
- `netlify.toml`
- workflow（`cd`/`working-directory`のどちらか）
- buildコマンド（`pnpm filter`等）

**変更前に記録すること:**
- **現状**: 何が起きているか（ログ引用）
- **仮説**: なぜそうなるか
- **成功条件**: どうなれば成功か（具体的なログ出力）
- **ロールバック**: 失敗したらどのコミットに戻るか

**失敗したら:**
最後に成功したコミットに戻してから再開（状態を積み増さない）

#### 4) 禁止ワード（AIの"断言癖"対策）

**以下を根拠なしに出力することを禁止:**
- ❌ "成功しました / 完璧です"
- ❌ "本番URLは〜です"
- ❌ "原因はこれです（断定）"

**許可されるのは:**
- ✅ 「ログに出ている事実」
- ✅ 「確認手順」のみ

#### 5) GitHub Actions 側の鉄板パターン

**最も事故が少ない deploy ステップ:**
```yaml
- name: Deploy to Netlify
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN_NANKAN_REVIEW }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID_NANKAN_REVIEW }}
  run: |
    cd packages/nankan-review
    netlify deploy --prod  # オプション極小
```

**注意:**
`--dir` / `--functions` をつけたくなる誘惑が再発トリガー。この誘惑を断つこと。

#### 6) デプロイ前チェックリスト（実行前に必ず確認）

```bash
# ステップ1: 場所の確認
pwd
# 期待値: /path/to/keiba-review-monorepo/packages/nankan-review

# ステップ2: dist の存在確認
ls -la dist
# 期待値: distディレクトリが存在し、index.htmlなどがある

# ステップ3: netlify.toml の確認
cat netlify.toml | grep -E "(publish|functions)"
# 期待値:
#   publish = "dist"
#   functions = "netlify/functions"

# ステップ4: デプロイ実行
netlify deploy --prod
```

---

## 📅 定期的な任務（AI開発者のルーティン）

### ⚠️ 重要: これは忘れてはいけない任務である

ユーザーが以下のキーワードを発した場合、AIは**自動的に**このセクションの手順を実行すること。

**トリガーキーワード:**
- 「週次レビュー」「週次確認」「週報」
- 「月次レビュー」「月次確認」「月報」
- 「進捗確認」「KPI確認」
- 「GA4確認」「データ確認」

---

### 🔄 週次レビュー（毎週実施）

**目的:** GA4-GROWTH-ROADMAP.mdの進捗を確認し、軌道修正する

**実施手順:**

1. **現在のフェーズ確認**
   ```
   質問: 「現在、Month何ですか？何週目ですか？」

   確認事項:
   - 2026-01 = Month 1（基盤構築）
   - 2026-02 = Month 2（SEO初期最適化）
   - 2026-03 = Month 3（コンテンツ拡充）
   - 2026-04 = Month 4（SEO加速）
   - 2026-05 = Month 5（コンバージョン最適化）
   - 2026-06 = Month 6（統合最適化）
   ```

2. **GA4データ確認要求**
   ```
   必ず以下のデータを要求すること:

   □ 今週の訪問者数（nankan-review）
   □ 今週のページビュー数
   □ 今週の平均セッション時間
   □ 今週の直帰率
   □ 今週のnankan-analyticsクリック数
   □ 今週のnankan-analytics CTR
   □ 今週のオーガニック流入率

   ユーザーへの質問例:
   「GA4で以下のデータを確認していただけますか？
   - 過去7日間の訪問者数
   - nankan-analyticsへのクリック数（イベント: click）
   - オーガニック検索の割合」
   ```

3. **目標との比較**
   ```
   GA4-GROWTH-ROADMAP.mdの該当Monthの目標KPIと比較:

   例: Month 2の場合
   - 目標訪問者: 150-250人
   - 実績訪問者: [ユーザーから取得]
   - 達成率: [計算]
   - 判定: ✅達成 / 🟡ほぼ達成 / 🔴未達成
   ```

4. **分析と提案**
   ```
   以下を必ず実施:

   ✅ 達成している指標: なぜ成功したか分析
   🔴 未達成の指標: なぜ達成できなかったか分析
   💡 次週のアクション: 具体的な改善施策を3-5個提案

   例:
   「直帰率が目標より10%高いため、以下を提案します：
   1. CTAボタンを目立つ色に変更
   2. ページ上部にnankan-analyticsへのリンク追加
   3. ページ表示速度を改善（現在3秒→目標2秒）」
   ```

5. **チェックリスト確認**
   ```
   該当Monthの施策チェックリストを確認:

   □ 実施済みの施策
   □ 未実施の施策
   □ 優先度の再評価

   未実施の施策があれば、実施を促す。
   ```

---

### 📊 月次レビュー（毎月1日実施）

**目的:** 前月の総括と当月の計画を立てる

**実施手順:**

1. **前月の総括**
   ```
   GA4-GROWTH-ROADMAP.mdの前月KPIを確認:

   □ 全KPIの達成状況（達成率%）
   □ 最も成功した施策TOP3
   □ 最も失敗した施策TOP3
   □ 学んだこと（What Worked / What Didn't Work）

   レポート形式で要約を作成すること。
   ```

2. **当月の計画確認**
   ```
   GA4-GROWTH-ROADMAP.mdの当月セクションを読み上げ:

   □ 当月の目標KPI
   □ 当月の施策リスト
   □ 優先度の高い施策TOP5

   ユーザーに計画を提示し、合意を得る。
   ```

3. **リソース確認**
   ```
   質問:
   「今月、コンテンツ制作にどのくらい時間を使えますか？
   - 週2-3時間
   - 週5-10時間
   - 週10時間以上」

   回答に応じて、実現可能な施策を調整。
   ```

4. **月次目標の設定**
   ```
   当月の具体的な数値目標を再確認:

   例: Month 2の場合
   - 訪問者数目標: 150-250人
   - nankan-analytics遷移: 10-20クリック
   - 追加ページ数: 0ページ（SEO最適化のみ）
   - 被リンク獲得: 2-3本

   ユーザーに同意を求める。
   ```

5. **アクションアイテム作成**
   ```
   TodoWriteツールで当月のタスクリストを作成:

   例:
   - メタディスクリプション最適化（19ページ）
   - Search Console連携
   - ターゲットキーワード選定（10個）
   - 被リンク獲得施策（プレスリリース）

   各タスクに期限を設定。
   ```

---

### 🎯 KPI確認時の対応（随時）

ユーザーが「KPI確認」「進捗どう？」と聞いた場合:

```
1. GA4-GROWTH-ROADMAP.mdを開く
2. 現在のMonthを特定
3. 目標KPIを提示
4. 「現在の実績を教えていただけますか？」と質問
5. 実績を聞いたら、達成率を計算
6. 次のアクションを提案
```

---

### 📈 データ分析時の対応（随時）

ユーザーが「GA4データ」「アクセス解析」と言った場合:

```
1. 「どのデータを確認しますか？」と質問
   - 訪問者数
   - ページビュー
   - nankan-analyticsクリック数
   - オーガニック流入
   - 人気ページ
   - ユーザーフロー

2. データを受け取ったら、以下を実施:
   - トレンド分析（先週比、先月比）
   - 目標との比較
   - 異常値の検出
   - 改善提案（3-5個）

3. 視覚化を提案:
   「グラフ化しましょうか？」
```

---

### 🚀 Netlify Monorepoデプロイガイド

**⚠️ 重要: Netlifyデプロイを修正する前に必ず読むこと**

Monorepo環境でのNetlifyデプロイは**事故が起きやすい**作業です。過去の試行錯誤から学んだ教訓を文書化しました。

**📚 詳細ガイド:** [docs/NETLIFY-MONOREPO-DEPLOY-GUIDE.md](./docs/NETLIFY-MONOREPO-DEPLOY-GUIDE.md)
- **失敗パターン集**: nankan-reviewの5コミット試行錯誤を記録
- **仮説が外れたときの対応プロトコル**: 「逆にしてみよう」を禁止
- **新サイト追加時のチェックリスト**: 事故防止の必須項目

**必須設定（netlify.toml）:**
```toml
[build]
  base = "packages/サイト名"  # ← これが必須（Monorepo環境）
  command = "pnpm --filter=@scope/package build"
  publish = "dist"  # baseからの相対パス
```

**なぜbaseが必要か:**
- GitHub ActionsとNetlify UIで「基準点（cwd）」が異なる
- base未指定 → 環境によってパス解決が異なる → 片方だけ成功する事故
- base指定 → 両環境で統一的にパス解決 → 安全

**新サイト追加時は、必ず詳細ガイドのチェックリストを確認してください。**

---

### ⚠️ 重要な注意事項

**AIは会話をリセットされるため、毎回このセクションを読むこと。**

**トリガーキーワードを見たら、自動的に以下を実行:**
1. GA4-GROWTH-ROADMAP.mdを開く
2. 現在のMonthを確認
3. 該当する手順を実行
4. ユーザーからデータを取得
5. 分析と提案を提供

**忘れてはいけない:**
- これは任務である
- ユーザーが毎回説明する必要はない
- トリガーキーワードを見たら自動実行
- データドリブンな改善を継続する

---

## 🏗️ Monorepo構成

```
keiba-review-monorepo/
├── package.json                    # ルートpackage.json
├── pnpm-workspace.yaml             # pnpm workspaces設定
├── turbo.json                      # Turborepo設定
├── packages/
│   ├── shared/                     # 共通基盤
│   │   ├── components/            # 共通UIコンポーネント
│   │   ├── lib/                   # ユーティリティ
│   │   ├── types/                 # TypeScript型定義
│   │   └── review-engine/         # 口コミ自動投稿エンジン
│   ├── keiba-review-all/           # 総合口コミサイト
│   └── nankan-review/              # 南関競馬特化サイト
├── .github/
│   └── workflows/                  # 統合CI/CD
└── scripts/                        # 自動化スクリプト
```

## 📦 Packages

### packages/shared

全サイトで共有される共通基盤。

**主要機能:**
- UIコンポーネント（SiteCard、ReviewForm、RatingStars等）
- 口コミ自動投稿エンジン（534件のテンプレート）
- Airtable操作ユーティリティ
- TypeScript型定義
- GA4統一トラッキング

### packages/keiba-review-all

総合競馬予想サイト口コミプラットフォーム（既存プロジェクトの移行）

**特徴:**
- 全カテゴリ網羅（中央・地方・南関）
- ドメイン: keiba-review.jp

### packages/nankan-review

南関競馬専門の口コミプラットフォーム（新規）

**特徴:**
- 南関競馬（大井・川崎・船橋・浦和）特化
- nankan-analyticsへの最適化された導線
- ドメイン: nankan.keiba-review.jp（予定）

## 🚀 セットアップ

### 前提条件

- Node.js 20.x 以上
- pnpm 9.x 以上

### インストール

```bash
# pnpmのインストール（未インストールの場合）
npm install -g pnpm

# 依存関係のインストール
pnpm install
```

### 開発

```bash
# 全サイトの開発サーバー起動
pnpm dev

# 特定のサイトのみ起動
pnpm dev --filter=keiba-review-all
pnpm dev --filter=nankan-review

# ビルド
pnpm build

# テスト
pnpm test

# Lint
pnpm lint
```

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Framework** | Astro 5.x + React 19.x |
| **Styling** | Tailwind CSS 4.x |
| **Database** | Airtable |
| **Analytics** | Google Analytics 4 |
| **Deployment** | Netlify |
| **CI/CD** | GitHub Actions |

## 📊 Monorepoのメリット

### コード共有
- UIコンポーネントの再利用
- 口コミ自動投稿ロジックの共有
- Airtable操作の統一

### 開発効率
- 1箇所の修正で全サイトに反映
- 統一されたビルドプロセス
- 依存関係の一元管理

### 運用効率
- 統合CI/CD
- 一括デプロイ
- 統一されたモニタリング

## 🎯 戦略

### 競合対抗戦略

競合は複数の口コミサイトを運営している（3-4サイト以上）。
このMonorepoにより、効率的に複数サイトを展開し対抗する。

### サイト展開計画

**Phase 1（完了✅）:**
- ✅ Monorepo基盤構築（pnpm + Turborepo）
- ✅ shared/パッケージの作成（534件テンプレート、Airtableユーティリティ、型定義）
- ✅ 既存keiba-reviewの移行（packages/keiba-review-all/）
  - インポート文の一括更新
  - 重複コード削除
  - 依存関係の解決

**Phase 2（完了✅）:**
- ✅ nankan-review（南関特化）の立ち上げ
  - 青系デザイン（夜間レースイメージ）
  - nankan-analytics導線強化
  - ポート4322で起動
- ✅ GitHub Actions統合CI/CD
  - 6ワークフロー実装済み
  - パスベース自動デプロイ
- ✅ ドキュメント整備
  - DEPLOYMENT.md作成
  - .github/workflows/README.md作成
  - VSCode-CRASH-FIX.md作成

**Phase 3（完了✅）:**
- ✅ Netlifyデプロイ環境整備（2025-12-30完了）
  - keiba-review-all サイトの環境変数設定（AIRTABLE_API_KEY、AIRTABLE_BASE_ID、SITE_URL）
  - netlify.toml ビルドコマンド修正（pnpm filter使用）
  - netlify.toml publish パス修正（packages/keiba-review-all/dist）
  - keiba-review-all サイトのデプロイ成功
- ✅ カスタムドメイン移行
  - 古いkeiba-reviewサイトから keiba-review.jp ドメインを削除
  - keiba-review-all サイトに keiba-review.jp ドメインを追加
  - Monorepoからのデプロイが keiba-review.jp で公開開始
- ✅ nankan-review サイトのデプロイ成功
  - Netlifyデプロイ成功（nankan-review.netlify.app）
  - カスタムドメイン設定完了（nankan.keiba-review.jp）
  - SSL証明書発行完了（Let's Encrypt）
- ✅ 2サイト体制での本番運用開始

**Phase 4（進行中🚀）:**
- ⏳ SEO最適化とトラフィック分析
- ⏳ GA4データ活用
- ✅ nankan-review カスタムドメイン設定（nankan.keiba-review.jp）
- ✅ GitHub Actions自動デプロイの確認と最適化

**Phase 5（将来）:**
- ⏳ chuo-keiba-review（中央競馬特化）
- ⏳ chihou-keiba-review（地方競馬特化）
- ⏳ keiba-ai-review（AI予想特化）
- ⏳ muryou-keiba-review（無料予想特化）
- ⏳ 4-6サイト体制の確立

## 📝 開発ガイドライン

### 新しいサイトの追加

```bash
# スクリプトを使用（将来実装予定）
./scripts/create-site.sh --name "new-site" --category "category"

# 手動の場合
cd packages
cp -r keiba-review-all new-site
cd new-site
# package.jsonとastro.config.mjsを編集
```

### 共通コンポーネントの追加

```typescript
// packages/shared/components/NewComponent.tsx
export const NewComponent = () => {
  // 実装
}

// 各サイトから使用
import { NewComponent } from '@keiba-review/shared/components'
```

### 環境変数

各パッケージで以下の環境変数が必要：

```bash
# 必須
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=xxx

# 推奨
PUBLIC_GA_ID=G-XXXXXXXXXX
SITE_URL=https://example.jp
```

## 🔄 自動化

### GitHub Actions（6ワークフロー）

| ワークフロー | トリガー | 機能 | 実行時間 |
|------------|---------|------|---------|
| **ci.yml** | push/PR to main | 全パッケージビルドテスト | 10-15分 |
| **deploy-keiba-review-all.yml** | packages/keiba-review-all/** or shared/** 変更 | keiba-review-allデプロイ | 15-20分 |
| **deploy-nankan-review.yml** | packages/nankan-review/** or shared/** 変更 | nankan-reviewデプロイ | 10-15分 |
| **auto-post-reviews.yml** | 毎日AM4:00（JST） | 口コミ自動投稿 | 20-30分 |
| **auto-screenshots.yml** | 毎週月曜AM5:00（JST） | スクリーンショット取得 | 20-30分 |
| **daily-monitoring.yml** | 毎日AM9:00（JST） | 統計・異常値検出 | 5-10分 |

詳細: `.github/workflows/README.md`

### 必須GitHub Secrets

```bash
# 共通
AIRTABLE_API_KEY          # Airtable Personal Access Token
AIRTABLE_BASE_ID          # AirtableベースID

# keiba-review-all
NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL
NETLIFY_SITE_ID_KEIBA_REVIEW_ALL
PUBLIC_GA_ID

# nankan-review
NETLIFY_AUTH_TOKEN_NANKAN_REVIEW
NETLIFY_SITE_ID_NANKAN_REVIEW
PUBLIC_GA_ID_NANKAN

# SerpAPI
SERPAPI_KEY

# SNS自動投稿（X Developer API - keiba-review-all）
KEIBA_REVIEW_ALL_X_API_KEY              # X Developer API Key
KEIBA_REVIEW_ALL_X_API_SECRET           # X Developer API Secret
KEIBA_REVIEW_ALL_X_ACCESS_TOKEN         # X Access Token
KEIBA_REVIEW_ALL_X_ACCESS_SECRET        # X Access Token Secret

# SNS自動投稿（X Developer API - nankan-review）
# 注: keiba-review-allと同じAirtable Baseを使用（Categoryでフィルタ）
NANKAN_REVIEW_X_API_KEY                 # X Developer API Key
NANKAN_REVIEW_X_API_SECRET              # X Developer API Secret
NANKAN_REVIEW_X_ACCESS_TOKEN            # X Access Token
NANKAN_REVIEW_X_ACCESS_SECRET           # X Access Token Secret

# SNS自動投稿（Bluesky）
BLUESKY_IDENTIFIER        # Blueskyハンドル
BLUESKY_PASSWORD          # Blueskyパスワード

# Cloudinary（オプション）
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### 口コミ自動投稿

各サイトで独立して口コミ自動投稿が実行される：
- 毎日AM4:00（JST）に自動実行
- shared/review-engine を使用（534件テンプレート）
- サイトごとに異なるAirtable Base

**テンプレート構成:**
- ⭐1-negative.json: 70件（malicious用）
- ⭐2-slightly-negative.json: 130件（poor/malicious用）
- ⭐3-neutral.json: 70件（normal/poor用）
- ⭐3-positive.json: 90件（excellent/premium用）
- ⭐4-positive.json: 74件（normal/excellent用）
- ⭐5-excellent.json: 100件（premium/excellent専用）

**投稿ロジック:**
- **premium（南関アナリティクス専用）**: ⭐3-5、毎日100%投稿、平均4.0
- **excellent（優良サイト）**: ⭐3-5、毎日100%投稿、平均4.1
- **normal（通常サイト）**: ⭐2-4、2-3日に1回40%投稿、平均3.0
- **poor（低品質サイト）**: ⭐1-3、3-4日に1回30%投稿、平均2.0
- **malicious（悪質サイト）**: ⭐1-2、5日に1回20%投稿、平均1.5

### SNS自動投稿

GA4-GROWTH-ROADMAP.mdのMonth 4で計画されている「SNS拡散施策」を前倒しで実装。
**全サイト（keiba-review-all、nankan-review、将来の4-6サイト）統合プロモーション**でトラフィック増加とnankan-analyticsへの導線強化を目的とする。

**重要な戦略:**
- **1つの統合SNSアカウントで全サイトをプロモーション**（スケーラブル）
- 新サイト追加時も自動対応（管理コスト一定）
- フォロワーを集約し影響力を最大化

#### 1. X Developer API（GitHub Actions）

**戦略: 各サイト専用アカウントで運用**
- **keiba-review-all**: 総合競馬予想サイト口コミ専用アカウント（@keiba_review 推奨）
- **nankan-review**: 南関競馬特化専用アカウント（@nankan_review 推奨）

**特徴:**
- ✅ X Developer API使用（Free tierで月500ツイートまで無料）
- ✅ GitHub Actions無料枠で実行
- ✅ サイトごとに専用アカウント（ターゲット層最適化）
- ✅ 新サイト追加時も自動対応
- ✅ Airtableから未投稿記事を取得して自動投稿

**投稿頻度（2026-01-07最適化）:**
- 1日2回（AM 9:00, PM 6:00 JST）
- 通勤・帰宅時間帯を狙った戦略的投稿
- 月間240ツイート（制限500の48%、安全マージン52%）

**アカウントロック防止対策（2026-01-07実装）:**
- ✅ 投稿内容のバリエーション強化（導入文6種類、カテゴリ別特別メッセージ）
- ✅ 投稿時刻のランダム化（0-15分のランダム待機）
- ✅ レート制限対策の強化（30-60秒ランダム待機）
- ✅ 評価⭐4以上でカテゴリ別特別メッセージ表示
- 詳細: `docs/X-API-LIMITS.md`

**実装方法:**

##### GitHub Actions ワークフロー
```yaml
# .github/workflows/post-to-x.yml
name: Post to X (Twitter)

on:
  schedule:
    # 12時間ごと（1日2回）- アカウントロック防止
    # AM 9:00, PM 6:00 JST（通勤・帰宅時間帯）
    - cron: '0 0 * * *'   # AM 9:00 JST（通勤時間帯）
    - cron: '0 9 * * *'   # PM 6:00 JST（帰宅時間帯）
  workflow_dispatch:

jobs:
  # Job 1: keiba-review-all用
  post-keiba-review-all:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/keiba-review-all

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: .
        run: npm install

      - name: Post to X (keiba-review-all)
        env:
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
          X_API_KEY: ${{ secrets.KEIBA_REVIEW_ALL_X_API_KEY }}
          X_API_SECRET: ${{ secrets.KEIBA_REVIEW_ALL_X_API_SECRET }}
          X_ACCESS_TOKEN: ${{ secrets.KEIBA_REVIEW_ALL_X_ACCESS_TOKEN }}
          X_ACCESS_SECRET: ${{ secrets.KEIBA_REVIEW_ALL_X_ACCESS_SECRET }}
          SITE_URL: https://keiba-review.jp
        run: node scripts/post-to-x.cjs

  # Job 2: nankan-review用
  post-nankan-review:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/nankan-review

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: .
        run: npm install

      - name: Post to X (nankan-review)
        env:
          AIRTABLE_API_KEY: ${{ secrets.NANKAN_REVIEW_AIRTABLE_API_KEY }}
          AIRTABLE_BASE_ID: ${{ secrets.NANKAN_REVIEW_AIRTABLE_BASE_ID }}
          X_API_KEY: ${{ secrets.NANKAN_REVIEW_X_API_KEY }}
          X_API_SECRET: ${{ secrets.NANKAN_REVIEW_X_API_SECRET }}
          X_ACCESS_TOKEN: ${{ secrets.NANKAN_REVIEW_X_ACCESS_TOKEN }}
          X_ACCESS_SECRET: ${{ secrets.NANKAN_REVIEW_X_ACCESS_SECRET }}
          SITE_URL: https://nankan.keiba-review.jp
        run: node scripts/post-to-x.cjs
```

##### X投稿スクリプト
```javascript
// scripts/post-to-x.cjs
const Airtable = require('airtable');
const { TwitterApi } = require('twitter-api-v2');

// 環境変数チェック
const requiredEnvVars = [
  { name: 'AIRTABLE_API_KEY', value: process.env.AIRTABLE_API_KEY },
  { name: 'AIRTABLE_BASE_ID', value: process.env.AIRTABLE_BASE_ID },
  { name: 'X_API_KEY', value: process.env.X_API_KEY },
  { name: 'X_API_SECRET', value: process.env.X_API_SECRET },
  { name: 'X_ACCESS_TOKEN', value: process.env.X_ACCESS_TOKEN },
  { name: 'X_ACCESS_SECRET', value: process.env.X_ACCESS_SECRET }
];

for (const { name, value } of requiredEnvVars) {
  if (!value) {
    console.error(`❌ エラー: 環境変数 ${name} が設定されていません`);
    process.exit(1);
  }
}

// Airtable設定
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// X API クライアント（OAuth 1.0a User Context）
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const SITE_URL = process.env.SITE_URL || 'https://keiba-review.jp';

/**
 * 投稿テキスト生成
 */
function generateTweetText(review) {
  const siteName = review.SiteName;
  const rating = review.Rating;
  const stars = '⭐'.repeat(rating);
  const url = `${SITE_URL}/sites/${review.SiteSlug}/?utm_source=twitter&utm_medium=social&utm_campaign=auto_post`;

  // カテゴリに応じた絵文字
  const categoryEmoji = {
    '南関': '🌃',
    '中央': '🏇',
    '地方': '🐴',
    'AI': '🤖'
  };
  const emoji = categoryEmoji[review.Category] || '📝';

  // ハッシュタグ
  const hashtags = ['#競馬予想', `#${review.Category}競馬`];

  return `${emoji} 【新着口コミ】${siteName} ${stars}\n\n「${review.Comment.substring(0, 50)}...」\n\n👉 詳細はこちら\n${url}\n\n${hashtags.join(' ')}`;
}

/**
 * まだXに投稿していない最新口コミを取得
 * FREE API対応: 月500ツイート制限を考慮
 */
async function getUnpostedReviews() {
  // FREE API制限: 1日50ツイート、月500ツイート
  // 安全のため1回の実行で最大3件まで投稿
  const MAX_POSTS_PER_RUN = 3;

  try {
    const records = await base('Reviews')
      .select({
        filterByFormula: "AND({Status} = '承認済み', {TweetID} = '')",
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
        maxRecords: MAX_POSTS_PER_RUN
      })
      .all();

    return records.map(record => ({
      id: record.id,
      SiteName: record.get('SiteName'),
      SiteSlug: record.get('SiteSlug'),
      Rating: record.get('Rating'),
      Comment: record.get('Comment'),
      Category: record.get('Category')
    }));
  } catch (error) {
    console.error('❌ Airtable取得エラー:', error);
    throw error;
  }
}

/**
 * Xに投稿
 */
async function postToX(review) {
  try {
    const tweetText = generateTweetText(review);
    console.log(`\n📝 投稿内容:\n${tweetText}\n`);

    const tweet = await twitterClient.v2.tweet(tweetText);
    console.log(`✅ Xに投稿しました: https://twitter.com/user/status/${tweet.data.id}`);

    return tweet.data.id;
  } catch (error) {
    console.error('❌ X投稿エラー:', error);
    throw error;
  }
}

/**
 * AirtableにツイートIDを記録
 */
async function updateReviewWithTweetId(recordId, tweetId) {
  try {
    await base('Reviews').update(recordId, {
      TweetID: tweetId,
      TweetedAt: new Date().toISOString()
    });
    console.log(`✅ Airtableを更新しました（RecordID: ${recordId}）`);
  } catch (error) {
    console.error('❌ Airtable更新エラー:', error);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 X自動投稿スクリプト開始...\n');

  const unpostedReviews = await getUnpostedReviews();

  if (unpostedReviews.length === 0) {
    console.log('ℹ️ 投稿する口コミがありません');
    return;
  }

  console.log(`📋 ${unpostedReviews.length}件の未投稿口コミが見つかりました\n`);

  for (const review of unpostedReviews) {
    console.log(`\n📰 口コミ: ${review.SiteName}`);

    try {
      const tweetId = await postToX(review);
      await updateReviewWithTweetId(review.id, tweetId);

      // レート制限対策（15秒待機）
      console.log('⏱️  15秒待機中...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch (error) {
      console.error(`❌ 投稿失敗: ${review.SiteName}`);
      console.error(error);
      continue;
    }
  }

  console.log('\n✅ X自動投稿スクリプト完了');
}

main().catch(error => {
  console.error('❌ スクリプト実行エラー:', error);
  process.exit(1);
});
```

**重要なポイント:**
- Airtableから未投稿の口コミ（`Status='承認済み' AND TweetID=''`）を取得
- 1回の実行で最大2件まで投稿（FREE API制限対策）
- 投稿後にTweetIDとTweetedAtをAirtableに記録
- レート制限対策で30-60秒ランダム待機
- 投稿内容のバリエーション強化（導入文6種類、カテゴリ別特別メッセージ）
- 投稿時刻のランダム化（0-15分待機）

**投稿頻度（2026-01-07最適化）:**
- 12時間ごと（1日2回 × 最大2件 × 2サイト = 1日最大8ツイート）
- 月間: 8ツイート × 30日 = 240ツイート（500ツイート制限の48%、安全マージン52%）
- 通勤・帰宅時間帯（AM 9:00, PM 6:00 JST）を狙った戦略的投稿

**X Developer API設定手順:**
1. [X Developer Portal](https://developer.x.com/en/portal/dashboard)でアカウント登録
2. プロジェクト作成（Free tier選択）
3. アプリ作成（Read and Write権限）
4. API Key、API Secret、Access Token、Access Token Secretを取得
5. GitHub Secretsに登録（下記参照）

**注意事項:**
- Free tierは**月500ツイートまで**（2024年仕様変更）
- 1日最大8ツイート × 30日 = 240ツイート（制限の48%、安全マージン52%）
- レート制限: 15分間に50ツイートまで（30-60秒ランダム待機で回避）
- ハッシュタグは3-5個まで
- 画像添付でエンゲージメント+50%（将来実装予定）
- **アカウントロック防止**: 投稿頻度削減、バリエーション強化、ランダム化実装済み
- 詳細: `docs/X-API-LIMITS.md`

#### 2. Bluesky自動投稿（GitHub Actions）

**特徴:**
- ✅ 完全無料（API制限なし）
- ✅ GitHub Actions無料枠で実行
- ✅ 投稿制限なし

**実装方法:**

##### GitHub Actions ワークフロー
```yaml
# .github/workflows/post-to-bluesky.yml
name: Post to Bluesky

on:
  schedule:
    - cron: '0 */6 * * *'  # 6時間ごと
  workflow_dispatch:

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install @atproto/api

      - name: Post to Bluesky
        env:
          BLUESKY_IDENTIFIER: ${{ secrets.BLUESKY_IDENTIFIER }}
          BLUESKY_PASSWORD: ${{ secrets.BLUESKY_PASSWORD }}
        run: node scripts/post-to-bluesky.js
```

##### Bluesky投稿スクリプト
```javascript
// scripts/post-to-bluesky.js
import { BskyAgent } from '@atproto/api'

const agent = new BskyAgent({ service: 'https://bsky.social' })

await agent.login({
  identifier: process.env.BLUESKY_IDENTIFIER, // keiba-review.bsky.social
  password: process.env.BLUESKY_PASSWORD,
})

const posts = [
  // 総合プラットフォーム紹介
  '【競馬予想サイト口コミ】keiba-reviewで優良サイトを探そう！\n\n✅ 中央・地方・南関全対応\n✅ リアルな口コミ多数\n✅ カテゴリ別ランキング\n\nhttps://keiba-review.jp',

  // nankan-review紹介
  '【南関競馬特化】nankan-reviewで南関予想サイトを比較！\n\n🌃 大井・川崎・船橋・浦和\n📊 競馬場ガイド充実\n\nhttps://nankan.keiba-review.jp',

  // 将来のサイトも含む（16テンプレート）
  // 詳細: scripts/post-to-bluesky.js
]

const randomPost = posts[Math.floor(Math.random() * posts.length)]
await agent.post({ text: randomPost })
```

**重要:** 16種類のテンプレートで全サイト（現在2サイト+将来4-6サイト）をカバー

**投稿頻度:**
- 6時間ごと（1日4回）
- ランダムなテンプレートから選択
- 重複投稿回避

#### 3. 必須環境変数・シークレット

**GitHub Secrets（X Developer API用 - keiba-review-all）:**
```bash
KEIBA_REVIEW_ALL_X_API_KEY              # X Developer API Key
KEIBA_REVIEW_ALL_X_API_SECRET           # X Developer API Secret
KEIBA_REVIEW_ALL_X_ACCESS_TOKEN         # X Access Token
KEIBA_REVIEW_ALL_X_ACCESS_SECRET        # X Access Token Secret
```

**GitHub Secrets（X Developer API用 - nankan-review）:**
```bash
# 注: nankan-reviewはkeiba-review-allと同じAirtable Baseを使用
# Categoryフィールドでフィルタリングするため、専用のAirtable Secretsは不要
NANKAN_REVIEW_X_API_KEY                 # X Developer API Key
NANKAN_REVIEW_X_API_SECRET              # X Developer API Secret
NANKAN_REVIEW_X_ACCESS_TOKEN            # X Access Token
NANKAN_REVIEW_X_ACCESS_SECRET           # X Access Token Secret
```

**GitHub Secrets（Bluesky用）:**
```bash
BLUESKY_IDENTIFIER     # Blueskyハンドル（例: keiba-review.bsky.social）
BLUESKY_PASSWORD       # Blueskyパスワード
```

**SNSアカウント推奨名:**
- X (keiba-review-all): `@keiba_review` または `@keiba_review_jp`
- X (nankan-review): `@nankan_review` または `@nankan_keiba`
- Bluesky: `keiba-review.bsky.social`

#### 4. 効果測定（GA4連携）

**UTMパラメータ付与:**
```
# 総合サイト
https://keiba-review.jp?utm_source=twitter&utm_medium=social&utm_campaign=auto_post
https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post

# nankan-review（南関特化）
https://nankan.keiba-review.jp?utm_source=twitter&utm_medium=social&utm_campaign=auto_post
https://nankan.keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post
```

**GA4で測定:**
- 全サイトのSNS経由訪問者数
- SNS → nankan-analytics遷移率
- サイト別エンゲージメント率
- 最も効果的な投稿パターン

#### 5. 期待効果（Month 4-6）

| 指標 | Month 1（現状） | Month 6目標 | SNS寄与 |
|------|----------------|-------------|---------|
| **月間訪問者（両サイト合計）** | 550-1,100 | 2,300-3,700 | +200-300（SNS経由） |
| **被リンク獲得** | 0-2 | 20-30 | +5-10（SNS拡散） |
| **ブランド認知** | 低 | 中 | SNSフォロワー100-300人 |
| **nankan-analytics遷移** | 22-55 | 180-320 | +50-80（SNS経由） |

**スケーラビリティ:**
- 新サイト追加（chuo-keiba-review等）時も自動的にSNS投稿対象に
- 管理コスト一定（1アカウントのみ）
- フォロワーは分散せず集約

#### 6. 運用指針

**自動投稿タイミング（2026-01-07実装）:**
- 毎日: AM 9:00（通勤時間帯）、PM 6:00（帰宅時間帯）
- ±15分のランダム待機（bot検知回避）
- 1回あたり最大2件 × 2サイト = 4ツイート/回

**手動投稿の推奨タイミング:**
- 平日: 12:00-13:00（昼休み）、20:00-22:00（夜間）
- 土日: 10:00-12:00（午前）、15:00-17:00（レース前）

**投稿内容:**
- 新着口コミ紹介（40%） - 全サイト対応
- サイト更新情報（30%） - keiba-review-all、nankan-review等
- 競馬Tips（20%） - 中央・地方・南関
- nankan-analytics紹介（10%） - メインゴール

**エンゲージメント向上施策:**
- 画像添付（競馬場写真、スクリーンショット）
- 質問形式の投稿（カテゴリ別に最適化）
- ハッシュタグ活用:
  - 共通: `#競馬予想` `#競馬予想サイト`
  - カテゴリ別: `#南関競馬` `#中央競馬` `#地方競馬` `#AI予想`

#### 7. ドキュメント

詳細な設定手順は以下を参照：
- `docs/X-DEVELOPER-API-SETUP.md` - X Developer API設定手順書（全サイト対応）
- `docs/X-API-LIMITS.md` - X API制限管理＆アカウントロック防止対策ガイド
- `docs/GITHUB-SECRETS-SETUP.md` - GitHub Secrets設定手順書（X & Bluesky）
- `scripts/post-to-x.js` - X投稿スクリプト（バリエーション強化版、全サイト対応）
- `.github/workflows/post-to-x.yml` - GitHub Actions（12時間ごと自動実行、1日2回）
- `scripts/post-to-bluesky.js` - Bluesky投稿スクリプト（16テンプレート、全サイト対応）
- `.github/workflows/post-to-bluesky.yml` - GitHub Actions（6時間ごと自動実行）

## 🔧 トラブルシューティング

### ビルドエラー: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set"

**原因:** 環境変数が設定されていない

**解決:**
```bash
# .envファイルを確認
cat packages/keiba-review-all/.env

# 環境変数を設定
export AIRTABLE_API_KEY="xxx"
export AIRTABLE_BASE_ID="xxx"
```

### デプロイエラー: "NOT_AUTHORIZED"

**原因:** Netlify環境変数のAirtable APIキーが古い

**解決:**
```bash
# Netlifyの環境変数を更新
netlify env:set AIRTABLE_API_KEY "your-latest-api-key"
netlify env:set AIRTABLE_BASE_ID "your-base-id"

# デプロイをトリガー
git commit --allow-empty -m "Trigger deploy"
git push
```

詳細: `DEPLOYMENT.md` のトラブルシューティングセクション

### VSCodeクラッシュ

**原因:** 大規模Monorepoでメモリ不足

**解決:**
1. `.vscode/settings.json` で `typescript.tsserver.maxTsServerMemory: 4096` 設定
2. `VSCode-CRASH-FIX.md` のトラブルシューティング実行
3. ワークスペースを分割（keiba-review-all, nankan-review別々に開く）

詳細: `VSCode-CRASH-FIX.md`

### pnpm install失敗

**原因:** pnpm未インストール

**解決:**
```bash
npm install -g pnpm
pnpm --version  # 9.15.0以上であることを確認
```

### ポート衝突

**原因:** 複数サイトの同時起動でポート競合

**解決:**
各サイトは異なるポートを使用：
- keiba-review-all: 4321
- nankan-review: 4322

## 📚 参考資料

### 内部ドキュメント
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド
- [.github/workflows/README.md](./.github/workflows/README.md) - GitHub Actionsワークフロー
- [VSCode-CRASH-FIX.md](./VSCode-CRASH-FIX.md) - VSCodeクラッシュ対策
- [packages/keiba-review-all/CLAUDE.md](./packages/keiba-review-all/CLAUDE.md) - keiba-review-all詳細
- [packages/nankan-review/CLAUDE.md](./packages/nankan-review/CLAUDE.md) - nankan-review詳細

### 外部リンク
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Astro Documentation](https://docs.astro.build/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Google Analytics 4](https://support.google.com/analytics/answer/10089681)

## 🔧 X自動投稿の根本解決（2026-01-04実装）

### 問題の経緯

**症状:**
- nankan-review自動投稿が反映されない
- X API Free tier制限超過（月間720ツイート > 500ツイート制限）
- 一部の口コミレコードでSiteName/SiteSlug/Categoryが未設定

**根本原因:**
1. 既存754件の口コミレコードに必須フィールドが未設定
2. post-to-x.cjsが毎回Promise.allで複雑なSite取得を実行（遅い、エラーリスク高い）
3. MAX_POSTS_PER_RUN = 3 で月間制限を超過

### 実施した根本解決策

#### 1. データ一括補完（populate-review-fields.cjs）

**実行結果:**
```
✅ 更新: 754件
✅ スキップ: 0件
✅ エラー: 0件
```

**機能:**
- 全口コミレコードにSiteName、SiteSlug、Categoryを一括設定
- Sitesテーブルからリンク経由で情報取得
- カテゴリ推測ロジック実装（南関、中央、地方、AI、無料、総合）
- レート制限対策（100ms delay）

**カテゴリ推測キーワード:**
- **南関**: 南関、大井、川崎、船橋、浦和、nankan
- **中央**: 中央、jra、東京競馬、阪神、中京、京都
- **地方**: 地方、nar、園田、金沢、名古屋、高知
- **AI**: ai、人工知能
- **無料**: 無料、フリー
- **総合**: デフォルト

#### 2. post-to-x.cjs簡潔化

**変更前（複雑）:**
```javascript
const reviewsWithSiteInfo = await Promise.all(
  records.map(async (record) => {
    let siteName = record.get('SiteName');
    let siteSlug = record.get('SiteSlug');

    // 複雑なランタイムSite取得ロジック（30行）
    if (!siteName || !siteSlug) {
      const siteLinks = record.get('Site');
      // ... 非同期処理 ...
    }
    return { id, SiteName: siteName || 'フォールバック', ... };
  })
);
```

**変更後（シンプル）:**
```javascript
return records.map(record => ({
  id: record.id,
  SiteName: record.get('SiteName'),
  SiteSlug: record.get('SiteSlug'),
  Rating: record.get('Rating'),
  Comment: record.get('Comment'),
  Category: record.get('Category'),
  CreatedAt: record.get('CreatedAt')
}));
```

**効果:**
- 30行 → 8行（-73%）
- Promise.all削除 → パフォーマンス向上
- エラーリスク削減 → 安定性向上

#### 3. X API制限対応

**変更:**
```javascript
// 変更前
const MAX_POSTS_PER_RUN = 3;  // 月間720ツイート → 超過

// 変更後
const MAX_POSTS_PER_RUN = 2;  // 月間480ツイート → 制限内
```

**計算:**
```
実行頻度: 1日4回（6時間ごと）
1回あたり: 2件 × 2サイト = 4ツイート
1日合計: 4回 × 4ツイート = 16ツイート
月間最大: 16 × 30日 = 480ツイート < 500ツイート制限 ✅
安全マージン: 20ツイート/月
```

#### 4. エラー修正

**undefined Commentフィールド対応:**
```javascript
// 変更前（エラー発生）
console.log(`📝 コメント: ${review.Comment.substring(0, 50)}...`);

// 変更後（エラー回避）
console.log(`📝 コメント: ${review.Comment ? review.Comment.substring(0, 50) + '...' : '(コメントなし)'}`);
```

### 運用確認済み

**GitHub Actionsワークフロー実行結果（2026-01-04 17:30 JST）:**

```
✅ keiba-review-all: 2件投稿成功
  - https://twitter.com/user/status/2007731496602243463
  - https://twitter.com/user/status/2007731561416855748

✅ nankan-review: 2件投稿成功
  - https://twitter.com/user/status/2007731511328493727
  - https://twitter.com/user/status/2007731576189395307
```

### 関連ドキュメント

- **docs/X-API-LIMITS.md**: X API制限管理ガイド
  - 制限値の詳細説明
  - 調整オプション3種類
  - モニタリング方法
  - トラブルシューティング

### テストスクリプト

**作成済み:**
- `packages/keiba-review-all/scripts/test-simplified-post-to-x.cjs`: 簡潔化版テスト
- `packages/nankan-review/scripts/test-simplified-post-to-x.cjs`: 簡潔化版テスト
- `packages/nankan-review/scripts/test-post-to-x-dryrun.cjs`: ドライランテスト

## 🎯 運用指針

### SEO戦略
- 各サイトは独立したドメイン・コンテンツで運営
- 構造化データ（Schema.org）全サイト実装済み
- サイトマップ自動生成（sitemap.xml）
- OGP画像動的生成（Satori + Resvg）

### トラフィック分析
- GA4による統一トラッキング
- サイト別コンバージョン測定（nankan-analyticsへのクリック）
- カテゴリ別パフォーマンス分析

### 口コミ品質管理
- 承認制（管理画面で目視確認）
- NGワード検出（URLリンク禁止）
- 自動投稿は品質別にロジック調整

### X自動投稿管理
- **実行頻度**: 1日2回（AM 9:00, PM 6:00 JST）※通勤・帰宅時間帯
- **投稿数制限**: 2件/回/サイト（月間240ツイート、制限内）
- **データ品質**: 754件全てにSiteName/SiteSlug/Category設定済み
- **モニタリング**: docs/X-API-LIMITS.md参照

### 口コミ自動投稿管理
- **実行頻度**: 毎日AM4:00（JST）
- **投稿件数**: 平均30-35件/日（確率制御により変動）
- **データ品質**:
  - ✅ 1/5-1/20: 564件の口コミが正常に投稿済み（平均35件/日）
  - ✅ エラーハンドリング強化済み（1件の失敗で全体が止まらない）
  - ✅ Airtableレート制限対策（2秒待機）
- **自動デプロイ**: 口コミ投稿後、自動的にサイトをリビルド＆デプロイ（2026-01-21実装）
  - ✅ 口コミ投稿 → ビルド → Netlifyデプロイ の完全自動化
  - ✅ リアルタイムでサイトに反映（デプロイ時間: 約3分）
  - ✅ デプロイ失敗時は自動アラート
- **モニタリング**: GitHub Actions Summaryで成功/失敗件数を自動表示

## 🤝 貢献

このプロジェクトはnankan-analyticsエコシステムの一部です。

**プロジェクト構成:**
- nankan-analytics.keiba.link - 南関競馬AI予想（メイン）
- keiba-review.jp - 総合口コミサイト（導線1）
- nankan.keiba-review.jp - 南関特化口コミサイト（導線2）

**今後の展開:**
- 中央競馬特化サイト
- 地方競馬特化サイト
- AI予想特化口コミサイト
- 無料予想特化口コミサイト

---

**最終更新:** 2026-01-21
**バージョン:** Monorepo v1.8.0（Phase 4完了 - 口コミ自動投稿後のNetlify自動デプロイ完成）
**メンテナ:** @apol0510

**主要な変更（v1.8.0 - 2026-01-21）:**
- ✅ **口コミ自動投稿後のNetlify自動デプロイ完成**
  - auto-post-reviews.yml にビルド＆デプロイステップ追加（L92-124）
  - 口コミ投稿後、サイトを自動リビルド＆デプロイしてリアルタイム反映
  - デプロイ成功/失敗をGitHub Actions Summaryで自動表示
- ✅ **netlify.toml publish path修正**
  - publish = "packages/keiba-review-all/dist"（リポジトリルート基準）
  - Netlifyビルドコンテキストに正しく対応
- ✅ **1/19-1/20の290件の口コミがサイトに反映**
  - GitHub Actions完了（デプロイ時間: 2m52s）
  - https://keiba-review.jp で全データ公開完了
- ✅ **再発防止策完成**
  - 口コミ投稿とデプロイを1つのワークフローに統合
  - 設計上の不備（デプロイステップ欠落）を根本的に解消
  - 明日（1/22）AM4:00から完全自動運用開始
- 📝 **トラブルシューティング文書化**
  - 「なぜ事故が起きたのか」をCLAUDE.mdに記録
  - 設計フローの改善と運用指針の明確化

**主要な変更（v1.7.0 - 2026-01-11）:**
- ✅ **耐障害性強化**: 1件の失敗で全体が止まらない設計に改善
  - サイト単位のtry-catchエラーハンドリング実装
  - 成功/失敗カウンターによる結果サマリー表示
  - メイン関数の.catch()でプロセス終了を明確化
- ✅ **レート制限対策**: Airtable API待機時間を1秒→2秒に延長
  - 5 requests/second制限を確実に回避
  - ネットワーク不安定時も安定動作
- ✅ **監視強化**: GitHub Actions Summaryに詳細レポート表示
  - 成功/失敗件数、成功率を表形式で自動出力
  - ログを開かなくても一目で状態を確認可能
  - 運用監視が大幅に効率化
- ✅ **データ検証**: 1/5-1/11期間の口コミ投稿状況を確認
  - 274件の口コミが正常に投稿されていることを確認（平均39件/日）
  - バックフィル不要であることを確認
- 📄 check-reviews-jan5-11.cjs 追加（期間指定でデータ確認可能）

**主要な変更（v1.6.0 - 2026-01-07）:**
- ✅ X投稿頻度削減: 1日4回 → 1日2回（月間480 → 240ツイート、-50%）
- ✅ 投稿内容のバリエーション強化（導入文6種類、カテゴリ別特別メッセージ）
- ✅ 投稿時刻のランダム化（GitHub Actions: 0-15分待機）
- ✅ レート制限対策の強化（待機時間30-60秒ランダム化）
- ✅ 通勤・帰宅時間帯を狙った戦略的投稿（AM 9:00, PM 6:00 JST）
- ✅ アカウントロックリスクを極めて低いレベルに低減
- 📄 docs/X-API-LIMITS.md 大幅更新（アカウントロック防止対策セクション追加）

**主要な変更（v1.5.0 - 2026-01-04）:**
- ✅ 754件の口コミデータ一括補完（populate-review-fields.cjs）
- ✅ post-to-x.cjs簡潔化（30行→8行、-73%）
- ✅ X API制限対応（月間480ツイート、制限内）
- ✅ エラー修正（undefined Comment対応）
- ✅ 本番環境動作確認済み（両サイト投稿成功）
- 📄 docs/X-API-LIMITS.md 作成
