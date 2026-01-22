# Netlify Monorepo デプロイガイド

Netlify Monorepo環境での事故を防止するための完全ガイド

**対象:** keiba-review-monorepo の全サイト（keiba-review-all, nankan-review, 将来の新サイト）

---

## 📌 最重要原則

### ⚠️ netlify.tomlに`base`ディレクティブを必ず明記する

Monorepoでは、`base`を指定しないとGitHub ActionsとNetlify UIでパス解決が異なり、片方だけ成功する事故が起きる。

**正しい設定:**
```toml
[build]
  base = "packages/サイト名"  # ← これが必須
  command = "pnpm --filter=@scope/package build"
  publish = "dist"  # baseからの相対パス
  functions = "netlify/functions"  # baseからの相対パス
```

**なぜbaseが必要か:**

| 環境 | base未指定 | base指定 |
|------|----------|---------|
| **GitHub Actions（cd後）** | packages/サイト名 | packages/サイト名 ✅ |
| **Netlify UI** | /opt/build/repo（ルート）❌ | packages/サイト名 ✅ |

**baseを指定しないと:**
- GitHub Actions: `cd packages/サイト名` → 相対パス`dist`が正しく解決される ✅
- Netlify UI: ルートディレクトリから相対パス`dist`を探す → `/opt/build/repo/dist`（存在しない）❌

**baseを指定すると:**
- 両環境で統一的に`packages/サイト名/dist`が解決される ✅

---

## 🚨 典型的な失敗パターン集

### 失敗パターン1: baseディレクティブの欠如

**発生日:** 2026-01-22
**影響サイト:** nankan-review
**試行錯誤回数:** 5コミット（本来は1コミットで解決すべき）

#### 症状
```
GitHub Actions: デプロイ成功 ✅
Netlify UI: "Deploy directory 'dist' does not exist" ❌
```

#### ログ証跡
```
ビルド出力: /opt/build/repo/packages/nankan-review/dist/  ✅ 存在
Netlifyが探すパス: /opt/build/repo/dist  ❌ 存在しない

エラー: Deploy did not succeed: Deploy directory 'dist' does not exist
```

#### 試行錯誤の履歴（失敗例）
```
commit 648e1ff: 相対パス修正（最初の試み）
commit 02c5226: CLI実行場所修正
commit 7984de7: publish = "packages/nankan-review/dist"（絶対パス）
              → ❌ パス二重化（packages/nankan-review/packages/nankan-review/dist）
commit 12f4ead: publish = "dist"（相対パスに戻す）
              → ✅ GitHub Actions成功、❌ Netlify UI失敗
commit 76f7824: base = "packages/nankan-review" 追加
              → ✅ 両環境で成功
```

#### 根本原因
- netlify.tomlに`base`がなかった
- GitHub ActionsとNetlify UIのパス解決の違いを理解していなかった
- 仮説が外れたとき、根本原因を分析せず次の仮説に飛びついた

#### 解決方法
```toml
[build]
  base = "packages/nankan-review"  # これを追加
  publish = "dist"
```

#### 教訓
- **Monorepoでは最初から`base`を明記する**
- 環境差異を理解せず「動いたから正解」と判断しない
- 仮説を立てる前に、Netlifyの公式ドキュメントでパス解決を確認する
- ログを精読して「期待値と実際の値の差」を特定する

---

### 失敗パターン2: パスの二重化（今後の参考用）

#### 症状
```
Deploy path: /repo/packages/サイト名/packages/サイト名/dist
期待: /repo/packages/サイト名/dist
```

#### 原因
GitHub Actionsで`cd packages/サイト名`を実行し、かつnetlify.tomlで`publish = "packages/サイト名/dist"`と絶対パスを指定した場合、以下のように解決される：

```
Netlify base（cd後のcwd）: packages/サイト名
publish: packages/サイト名/dist
→ packages/サイト名 + packages/サイト名/dist
→ packages/サイト名/packages/サイト名/dist（二重化）❌
```

#### 解決方法
netlify.tomlのパスは常に`base`からの相対パスで指定する：
```toml
base = "packages/サイト名"
publish = "dist"  # baseからの相対パス
```

---

## 🛡️ 事故防止プロトコル

### 1) Netlify Monorepoの唯一の真実を固定する

このリポジトリでは **Netlify の publish/functions は netlify.toml を唯一の真実とする。**
GitHub Actions / CLI から `--dir` と `--functions` を指定しない（混在禁止）。

**✅ OK（推奨）:**
```bash
cd packages/サイト名
netlify deploy --prod  # tomlに従う
```

**❌ NG（禁止）:**
```bash
# 基準点がぶれて root/dist を見に行く事故が起きる
netlify deploy --dir=dist

# working-directory と cd の二重指定
# toml と CLI の publish/functions の二重指定
```

### 2) "デプロイ前ゲート"を必須化（これで暴走が止まる）

デプロイを実行する前に、**必ず次をログに出す**（確認できない場合は変更禁止）。

```bash
# 1. 現在のディレクトリ確認
pwd

# 2. ディレクトリ内容確認
ls -la

# 3. distディレクトリの存在確認
ls -la dist

# 4. netlify.toml の base/publish/functions 確認
cat netlify.toml | sed -n '1,80p'
```

**実行条件:**
- 直近のActionsログで「Deploy path」「Configuration path」を確認し、期待値と一致すること
- **成功宣言は禁止。**「実際に存在する dist をデプロイ対象として検証できた」場合のみ実行して良い。

### 3) 変更プロトコル（1コミット1仮説）

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
- **環境差異の確認**: GitHub ActionsとNetlify UIの両方で検証したか？
- **公式ドキュメント参照**: Netlifyのドキュメントで仕様を確認したか？
- **過去の失敗事例**: この失敗パターン集を確認したか？

**失敗したら:**
最後に成功したコミットに戻してから再開（状態を積み増さない）

### 4) 仮説が外れたときの対応プロトコル

**禁止される思考パターン:**
```
仮説A失敗
  ↓
❌ 「じゃあ逆にしてみよう」
❌ 「とりあえず別の方法を試そう」
❌ 試行錯誤で偶然の成功を狙う
```

**推奨される思考パターン:**
```
仮説A失敗
  ↓
✅ 「なぜ仮説Aが外れたのか？」を分析する（必須）
  ↓
✅ 分析の視点:
   - 前提条件が間違っていないか？
   - 見落としている環境差異はないか？
   - 公式ドキュメントを読んだか？
   - ログをよく見たか？（Deploy pathとExpected pathの比較）
  ↓
✅ ログ精読:
   - Deploy path: 実際の値
   - Expected path: 期待値
   - → 差分から原因を推論する
  ↓
✅ 公式ドキュメントで仕様確認
  ↓
✅ 根本原因を特定してから、次の仮説を立てる
  ↓
✅ 確信を持った仮説だけをコミットする
```

**今回の正しいアプローチ（理想）:**
```
commit 7984de7失敗
  ↓
✅ 「なぜパスが二重化したのか？」を分析
  ↓
✅ ログ確認:
    - Deploy path: /repo/packages/nankan-review/packages/nankan-review/dist
    - 期待: /repo/packages/nankan-review/dist
  ↓
✅ 「GitHub ActionsのcdとNetlifyのpublishパスが重複している」と気づく
  ↓
✅ Netlifyドキュメントで`base`ディレクティブを発見
  ↓
✅ 正しい仮説: netlify.tomlに`base`を明記すれば、
   両環境で統一的にパスが解決される
  ↓
✅ 1回で成功 ✅
```

### 5) 禁止ワード（AIの"断言癖"対策）

**以下を根拠なしに出力することを禁止:**
- ❌ "成功しました / 完璧です"
- ❌ "本番URLは〜です"
- ❌ "原因はこれです（断定）"

**許可されるのは:**
- ✅ 「ログに出ている事実」
- ✅ 「確認手順」のみ

**成功宣言の条件（3点セット）:**
1. ログ: Deploy pathが期待値と一致
2. 実URL: curlで200 OKを確認
3. 設定: netlify.tomlが正しいことを確認

この3点が全て揃って初めて「成功しました」と言える。

### 6) GitHub Actions 側の鉄板パターン

**最も事故が少ない deploy ステップ:**
```yaml
- name: Deploy to Netlify
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
  run: |
    cd packages/サイト名
    netlify deploy --prod  # オプション極小
```

**注意:**
`--dir` / `--functions` をつけたくなる誘惑が再発トリガー。この誘惑を断つこと。

---

## ✅ デプロイ前チェックリスト

新サイト追加時、または既存サイトのデプロイ修正時に必ず確認すること：

### netlify.toml 確認
- [ ] `base = "packages/サイト名"` が明記されているか
- [ ] `publish = "dist"` （baseからの相対パス）
- [ ] `functions = "netlify/functions"` （baseからの相対パス）
- [ ] buildコマンドが正しいか（`pnpm --filter=@scope/package build`）

### GitHub Actions workflow 確認
- [ ] `cd packages/サイト名` を実行しているか
- [ ] `netlify deploy --prod` のみ（`--dir` / `--functions` なし）
- [ ] デプロイ前ゲートが実装されているか（pwd, ls -la dist, cat netlify.toml）

### 環境変数確認
- [ ] GitHub Secrets に必要な環境変数が設定されているか
  - `NETLIFY_AUTH_TOKEN`
  - `NETLIFY_SITE_ID`
  - `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`
  - `PUBLIC_GA_ID`, `SITE_URL`

### テストデプロイ
- [ ] GitHub Actionsでデプロイ成功を確認
- [ ] ログで「Deploy path」が正しいことを確認
- [ ] 本番URLでサイトにアクセス可能を確認（curl -I）
- [ ] Netlify UIからの自動デプロイも成功することを確認

---

## 📚 参考資料

### Netlify公式ドキュメント
- [Monorepo build configuration](https://docs.netlify.com/configure-builds/monorepos/)
- [File-based configuration (netlify.toml)](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Build configuration overview](https://docs.netlify.com/configure-builds/overview/)

### 内部ドキュメント
- [packages/nankan-review/CLAUDE.md](../packages/nankan-review/CLAUDE.md) - nankan-review個別ガイド
- [packages/keiba-review-all/CLAUDE.md](../packages/keiba-review-all/CLAUDE.md) - keiba-review-all個別ガイド
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 全体デプロイメントガイド
- [.github/workflows/README.md](../.github/workflows/README.md) - GitHub Actionsワークフロー

---

## 🔄 今後の改善

このドキュメントは、新しい失敗パターンが発見されるたびに更新すること。

**追加すべき情報:**
- 新しい失敗パターンの記録（症状、原因、解決方法、教訓）
- 新サイト追加時の知見
- Netlifyの仕様変更への対応

---

**最終更新:** 2026-01-22
**作成者:** Claude Code（nankan-review デプロイ試行錯誤の教訓を文書化）
**バージョン:** 1.0.0
