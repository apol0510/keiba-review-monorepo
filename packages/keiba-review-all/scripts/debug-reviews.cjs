/**
 * X投稿用の口コミデータをデバッグするスクリプト
 */

require('dotenv').config({ path: '.env' });
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: AIRTABLE_API_KEY と AIRTABLE_BASE_ID を設定してください');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function main() {
  console.log('🔍 Reviewsテーブルのデータを確認中...\n');

  try {
    // 全ての口コミを取得
    const allRecords = await base('Reviews')
      .select({
        maxRecords: 100,
        sort: [{ field: 'CreatedAt', direction: 'desc' }]
      })
      .all();

    console.log(`📊 総口コミ数: ${allRecords.length}件\n`);

    // Statusの集計
    const statusCounts = {};
    allRecords.forEach(record => {
      const status = record.get('Status') || '(未設定)';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📈 Status別の口コミ数:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}件`);
    });

    // TweetIDの有無を集計
    const tweetedCount = allRecords.filter(r => r.get('TweetID')).length;
    const untweetedCount = allRecords.length - tweetedCount;

    console.log('\n📈 投稿状況:');
    console.log(`  投稿済み（TweetIDあり）: ${tweetedCount}件`);
    console.log(`  未投稿（TweetIDなし）: ${untweetedCount}件`);

    // Category集計
    const categoryCounts = {};
    allRecords.forEach(record => {
      const category = record.get('Category') || '(未設定)';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    console.log('\n📈 Category別の口コミ数:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`);
    });

    // X投稿対象の口コミを確認（keiba-review-all）
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 keiba-review-all: 投稿対象の口コミ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const keibaReviewAllTargets = allRecords.filter(record => {
      const status = record.get('Status');
      const tweetID = record.get('TweetID');
      return status === '承認済み' && !tweetID;
    });

    if (keibaReviewAllTargets.length === 0) {
      console.log('⚠️ 投稿対象の口コミがありません');
      console.log('   条件: Status="承認済み" AND TweetID=空');
    } else {
      console.log(`✅ ${keibaReviewAllTargets.length}件の投稿対象口コミが見つかりました\n`);
      keibaReviewAllTargets.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ${record.get('SiteName')} (⭐${record.get('Rating')})`);
        console.log(`   Status: ${record.get('Status')}`);
        console.log(`   TweetID: ${record.get('TweetID') || '(なし)'}`);
        console.log(`   Category: ${record.get('Category') || '(なし)'}`);
        console.log(`   Comment: ${(record.get('Comment') || '').substring(0, 50)}...`);
        console.log('');
      });
    }

    // X投稿対象の口コミを確認（nankan-review）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 nankan-review: 投稿対象の口コミ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const nankanTargets = allRecords.filter(record => {
      const status = record.get('Status');
      const tweetID = record.get('TweetID');
      const category = record.get('Category');
      return status === '承認済み' && !tweetID && category === '南関';
    });

    if (nankanTargets.length === 0) {
      console.log('⚠️ 投稿対象の口コミがありません');
      console.log('   条件: Status="承認済み" AND TweetID=空 AND Category="南関"');
    } else {
      console.log(`✅ ${nankanTargets.length}件の投稿対象口コミが見つかりました\n`);
      nankanTargets.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ${record.get('SiteName')} (⭐${record.get('Rating')})`);
        console.log(`   Status: ${record.get('Status')}`);
        console.log(`   TweetID: ${record.get('TweetID') || '(なし)'}`);
        console.log(`   Category: ${record.get('Category') || '(なし)'}`);
        console.log(`   Comment: ${(record.get('Comment') || '').substring(0, 50)}...`);
        console.log('');
      });
    }

    // サンプルレコードのフィールド一覧表示
    if (allRecords.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 サンプルレコードのフィールド一覧');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const sampleRecord = allRecords[0];
      const fields = Object.keys(sampleRecord.fields);
      fields.forEach(field => {
        const value = sampleRecord.get(field);
        const displayValue = typeof value === 'string' && value.length > 50
          ? value.substring(0, 50) + '...'
          : value;
        console.log(`  ${field}: ${displayValue}`);
      });
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

main();
