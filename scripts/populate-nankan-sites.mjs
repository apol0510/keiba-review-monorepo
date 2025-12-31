#!/usr/bin/env node

/**
 * Airtableにnankanカテゴリのサイトデータを追加するスクリプト
 *
 * 使用方法:
 * node scripts/populate-nankan-sites.mjs
 */

import Airtable from 'airtable';

// 環境変数
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// nankanカテゴリのサイトデータ
const nankanSites = [
  {
    Name: '南関アナリティクス',
    Slug: 'nankan-analytics',
    URL: 'https://nankan-analytics.com',
    Description: '南関競馬専門のAI予想サイト。大井・川崎・船橋・浦和の4場に特化したデータ分析と予想を提供。機械学習による高精度な予想で、ナイター競馬ファンをサポートします。',
    Category: 'nankan',
    IsApproved: true,
    DisplayPriority: 100,
    CreatedAt: new Date().toISOString(),
  },
  {
    Name: '南関競馬 XYZ',
    Slug: 'nankankeiba-xyz',
    URL: 'https://nankankeiba.xyz',
    Description: '南関4場（大井・川崎・船橋・浦和）の予想サイト。無料予想と有料予想を提供し、初心者から上級者まで幅広く対応。',
    Category: 'nankan',
    IsApproved: true,
    DisplayPriority: 80,
    CreatedAt: new Date().toISOString(),
  },
  {
    Name: '競馬な日々',
    Slug: 'apolon-keibanahibi-com',
    URL: 'https://apolon.keibanahibi.com',
    Description: '南関競馬の予想と情報を提供する老舗サイト。毎日の予想コラムと分析記事が人気。',
    Category: 'nankan',
    IsApproved: true,
    DisplayPriority: 70,
    CreatedAt: new Date().toISOString(),
  },
];

async function checkExistingSites() {
  console.log('\n📊 Airtable内の既存サイトを確認中...\n');

  try {
    const allSites = await base('Sites').select({
      maxRecords: 100,
    }).all();

    console.log(`✅ 全サイト数: ${allSites.length}件`);

    // カテゴリ別集計
    const categoryCounts = {};
    allSites.forEach(record => {
      const category = record.fields.Category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    console.log('\nカテゴリ別サイト数:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}件`);
    });

    // nankanカテゴリのサイト表示
    const nankanSites = allSites.filter(r => r.fields.Category === 'nankan');
    if (nankanSites.length > 0) {
      console.log('\n📋 既存のnankanサイト:');
      nankanSites.forEach(record => {
        console.log(`  - ${record.fields.Name} (${record.fields.Slug})`);
      });
    } else {
      console.log('\n⚠️  nankanカテゴリのサイトは0件です');
    }

    return nankanSites;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function createNankanSites() {
  console.log('\n🚀 nankanカテゴリのサイトを作成中...\n');

  const results = [];

  for (const site of nankanSites) {
    try {
      // 既に同じSlugのサイトが存在するか確認
      const existing = await base('Sites').select({
        filterByFormula: `{Slug} = '${site.Slug}'`,
        maxRecords: 1,
      }).firstPage();

      if (existing.length > 0) {
        console.log(`⏭️  スキップ: ${site.Name} (既に存在します)`);
        results.push({ site: site.Name, status: 'skipped', reason: 'already exists' });
        continue;
      }

      // 新規作成
      const record = await base('Sites').create(site);
      console.log(`✅ 作成成功: ${site.Name} (ID: ${record.id})`);
      results.push({ site: site.Name, status: 'created', id: record.id });

    } catch (error) {
      console.error(`❌ 作成失敗: ${site.Name} - ${error.message}`);
      results.push({ site: site.Name, status: 'failed', error: error.message });
    }
  }

  return results;
}

async function main() {
  console.log('🎯 nankanカテゴリのサイトデータ投入スクリプト');
  console.log('='.repeat(60));

  try {
    // Step 1: 既存データ確認
    const existingNankanSites = await checkExistingSites();

    if (existingNankanSites.length >= 3) {
      console.log('\n✅ nankanサイトは既に十分に存在します（3件以上）');
      console.log('スクリプトを終了します。');
      return;
    }

    // Step 2: nankanサイト作成
    const results = await createNankanSites();

    // Step 3: 結果サマリー
    console.log('\n📊 実行結果:');
    console.log('='.repeat(60));

    const created = results.filter(r => r.status === 'created');
    const skipped = results.filter(r => r.status === 'skipped');
    const failed = results.filter(r => r.status === 'failed');

    console.log(`✅ 作成: ${created.length}件`);
    console.log(`⏭️  スキップ: ${skipped.length}件`);
    console.log(`❌ 失敗: ${failed.length}件`);

    if (created.length > 0) {
      console.log('\n🎉 nankanサイトの作成が完了しました！');
      console.log('次のステップ:');
      console.log('  1. pnpm --filter=@keiba-review/nankan-review build');
      console.log('  2. デプロイして確認');
    }

  } catch (error) {
    console.error('\n❌ スクリプト実行エラー:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();
