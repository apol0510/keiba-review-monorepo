#!/usr/bin/env node
/**
 * ワークフロー整合性検証スクリプト
 *
 * 目的: 新サイト追加時に、GitHub Actionsワークフローが正しく更新されているか自動検証
 *
 * チェック項目:
 * 1. packages/配下のサイトが全てauto-post-reviews.ymlに含まれているか
 * 2. 各サイトのビルドとデプロイステップが存在するか
 * 3. netlify.tomlの設定が正しいか
 *
 * 使用方法:
 *   node scripts/validate-workflows.js
 *
 * 終了コード:
 *   0: 検証成功（問題なし）
 *   1: 検証失敗（不整合あり）
 */

const fs = require('fs');
const path = require('path');

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * packages/配下のサイト一覧を取得（sharedを除く）
 */
function getSitePackages() {
  const packagesDir = path.join(__dirname, '..', 'packages');
  const entries = fs.readdirSync(packagesDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory() && entry.name !== 'shared')
    .map(entry => entry.name);
}

/**
 * auto-post-reviews.ymlを読み込む（テキスト解析）
 */
function loadAutoPostReviewsWorkflow() {
  const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'auto-post-reviews.yml');

  if (!fs.existsSync(workflowPath)) {
    error('auto-post-reviews.yml が見つかりません');
    return null;
  }

  return fs.readFileSync(workflowPath, 'utf8');
}

/**
 * ワークフロー内に特定のサイトのビルドとデプロイステップがあるか確認
 */
function hasDeploySteps(workflowContent, siteName) {
  const hasBuildStep = workflowContent.includes(`Build site (${siteName})`);
  const hasDeployStep = workflowContent.includes(`Deploy to Netlify (${siteName})`);

  return { hasBuildStep, hasDeployStep };
}

/**
 * netlify.tomlの設定を検証
 */
function validateNetlifyToml(siteName) {
  const tomlPath = path.join(__dirname, '..', 'packages', siteName, 'netlify.toml');

  if (!fs.existsSync(tomlPath)) {
    error(`${siteName}: netlify.toml が見つかりません`);
    return false;
  }

  const content = fs.readFileSync(tomlPath, 'utf8');

  // 必須設定のチェック
  const hasBase = content.includes(`base = "packages/${siteName}"`);
  const hasPublish = content.includes('publish = "dist"');

  if (!hasBase) {
    error(`${siteName}: netlify.toml に base ディレクティブがありません`);
    return false;
  }

  if (!hasPublish) {
    warning(`${siteName}: netlify.toml に publish ディレクティブがありません`);
  }

  return true;
}

/**
 * メイン検証処理
 */
function main() {
  info('🔍 ワークフロー整合性検証を開始します...\n');

  // 1. サイト一覧を取得
  const sites = getSitePackages();
  info(`📦 検出されたサイト: ${sites.join(', ')}\n`);

  // 2. ワークフローを読み込む
  const workflow = loadAutoPostReviewsWorkflow();
  if (!workflow) {
    process.exit(1);
  }

  // 3. 各サイトについて検証
  let hasErrors = false;

  for (const site of sites) {
    info(`\n🔎 ${site} を検証中...`);

    // 3-1. ビルドとデプロイステップの存在確認
    const { hasBuildStep, hasDeployStep } = hasDeploySteps(workflow, site);

    if (!hasBuildStep) {
      error(`  auto-post-reviews.yml に "${site}" のビルドステップがありません`);
      hasErrors = true;
    } else {
      success(`  ビルドステップ: 存在`);
    }

    if (!hasDeployStep) {
      error(`  auto-post-reviews.yml に "${site}" のデプロイステップがありません`);
      hasErrors = true;
    } else {
      success(`  デプロイステップ: 存在`);
    }

    // 3-2. netlify.tomlの検証
    if (!validateNetlifyToml(site)) {
      hasErrors = true;
    } else {
      success(`  netlify.toml: 正常`);
    }
  }

  // 4. 結果サマリー
  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    error('\n❌ 検証失敗: ワークフローに不整合があります');
    error('\n修正方法:');
    error('1. CLAUDE.md の「新サイト追加チェックリスト」を参照');
    error('2. auto-post-reviews.yml に不足しているステップを追加');
    error('3. このスクリプトを再実行して検証');
    process.exit(1);
  } else {
    success('\n✅ 検証成功: ワークフローは正常です');
    process.exit(0);
  }
}

// 実行
main();
