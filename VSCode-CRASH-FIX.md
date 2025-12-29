# VSCode クラッシュ対策ガイド

VSCodeが予期せず終了する問題の対策方法をまとめました。

## ✅ 既に実施済みの対策

### 1. .vscode/settings.json 設定
- node_modules等の大量ファイルを除外
- ファイル監視の最適化
- TypeScriptサーバーのメモリ上限を4GBに設定
- Git自動更新を無効化

## 🔧 追加で試せる対策

### 2. VSCodeの設定を確認

```bash
# VSCodeの設定ファイルを開く
# macOS: Cmd + Shift + P → "Preferences: Open Settings (JSON)"
```

以下を追加:
```json
{
  "window.zoomLevel": 0,
  "window.restoreWindows": "none",
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false
}
```

### 3. 拡張機能の整理

**必須拡張機能のみ有効にする:**
1. Astro (astro-build.astro-vscode)
2. ESLint (dbaeumer.vscode-eslint)
3. Prettier (esbenp.prettier-vscode)
4. Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

**無効化推奨:**
- GitHub Copilot（メモリを大量消費）
- その他のAI補完ツール
- 使っていない言語サポート拡張

### 4. VSCodeのキャッシュをクリア

```bash
# macOS
rm -rf ~/Library/Application\ Support/Code/Cache
rm -rf ~/Library/Application\ Support/Code/CachedData
rm -rf ~/Library/Application\ Support/Code/Code\ Cache

# VSCodeを再起動
```

### 5. メモリ確保

```bash
# macOSのメモリ使用状況を確認
top -o mem

# 他のアプリを閉じてメモリを確保
```

### 6. VSCodeを最新版に更新

```bash
# Homebrewでインストールしている場合
brew update && brew upgrade --cask visual-studio-code
```

### 7. ワークスペースを分割

大きなMonorepoの場合、パッケージごとにVSCodeを開く:

```bash
# 方法1: 特定のパッケージだけ開く
code packages/nankan-review

# 方法2: マルチルートワークスペースを使う
# .code-workspace ファイルを作成（下記参照）
```

### 8. マルチルートワークスペース設定

`keiba-review-monorepo.code-workspace` を作成:

```json
{
  "folders": [
    {
      "name": "root",
      "path": "."
    },
    {
      "name": "shared",
      "path": "packages/shared"
    },
    {
      "name": "keiba-review-all",
      "path": "packages/keiba-review-all"
    },
    {
      "name": "nankan-review",
      "path": "packages/nankan-review"
    }
  ],
  "settings": {
    "typescript.tsserver.maxTsServerMemory": 4096
  }
}
```

## 🚨 緊急対応

### クラッシュが頻発する場合

1. **node_modulesを一時的に削除**
   ```bash
   # Monorepoルートで
   rm -rf node_modules
   rm -rf packages/*/node_modules

   # 必要になったら再インストール
   pnpm install
   ```

2. **VSCodeをセーフモードで起動**
   ```bash
   code --disable-extensions
   ```

3. **別のエディタを使う**
   - Cursor (VSCodeフォーク、より安定)
   - WebStorm (有料だが高性能)
   - Zed (軽量・高速)

## 📊 メモリ使用量の目安

| プロセス | 推奨メモリ |
|---------|----------|
| VSCode本体 | 500MB - 1GB |
| TypeScriptサーバー | 1GB - 2GB |
| 拡張機能 | 500MB - 1GB |
| **合計** | **2GB - 4GB** |

### システム要件
- 最低8GB RAM推奨
- 16GB以上が理想

## 💡 ベストプラクティス

1. **一度に1つのパッケージだけ開く**
2. **不要な拡張機能を無効化**
3. **定期的にVSCodeを再起動**
4. **大きなファイル（スクリーンショット等）はnode_modulesに入れない**
5. **Git操作は別ターミナルで実行**

## 🔍 ログの確認

クラッシュの原因を特定するには:

```bash
# macOS
~/Library/Application\ Support/Code/logs/

# クラッシュレポート
~/Library/Logs/DiagnosticReports/Code*
```

## 📞 サポート

上記の対策でも解決しない場合:
- [VSCode Issues](https://github.com/microsoft/vscode/issues)
- [Astro Discord](https://astro.build/chat)

---

最終更新: 2025-12-29
