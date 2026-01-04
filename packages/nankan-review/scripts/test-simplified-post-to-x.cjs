/**
 * 簡潔化されたpost-to-x.cjsのテストスクリプト（nankan-review版）
 *
 * populate-review-fields.cjsで全ての口コミにSiteName、SiteSlug、Categoryが
 * 設定されたことを確認します。
 */

require('dotenv').config({ path: '../keiba-review-all/.env' });
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: 環境変数が設定されていません');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * 簡潔化版のgetUnpostedReviewsをテスト（nankan-review版）
 */
async function testGetUnpostedReviews() {
  console.log('🧪 nankan-review: getUnpostedReviews()のテスト開始...\n');

  const MAX_POSTS_PER_RUN = 3;

  const records = await base('Reviews')
    .select({
      filterByFormula: "AND({Status} = '承認済み', OR({TweetID} = '', {TweetID} = BLANK()), {Category} = '南関')",
      sort: [{ field: 'CreatedAt', direction: 'desc' }],
      maxRecords: MAX_POSTS_PER_RUN
    })
    .all();

  // 簡潔化版: 直接フィールドを取得（Promise.all不要）
  const reviews = records.map(record => ({
    id: record.id,
    SiteName: record.get('SiteName'),
    SiteSlug: record.get('SiteSlug'),
    Rating: record.get('Rating'),
    Comment: record.get('Comment'),
    CreatedAt: record.get('CreatedAt')
  }));

  console.log(`✅ ${reviews.length}件の未投稿口コミを取得（南関カテゴリのみ）\n`);

  reviews.forEach((review, idx) => {
    console.log(`【口コミ ${idx + 1}】`);
    console.log(`  ID: ${review.id}`);
    console.log(`  SiteName: ${review.SiteName || '❌ 未設定'}`);
    console.log(`  SiteSlug: ${review.SiteSlug || '❌ 未設定'}`);
    console.log(`  Category: 南関（フィルタ済み）`);
    console.log(`  Rating: ${'⭐'.repeat(review.Rating)}`);
    console.log(`  Comment: ${review.Comment?.substring(0, 30)}...`);
    console.log();
  });

  // 全てのフィールドが設定されているか確認
  const allFieldsPopulated = reviews.every(r => r.SiteName && r.SiteSlug);

  if (allFieldsPopulated) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ テスト成功');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 結果:');
    console.log('  全ての口コミでSiteName、SiteSlugが設定されています');
    console.log('  Runtime Site取得は不要です（簡潔化成功）');
    console.log();
  } else {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ テスト失敗');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('一部の口コミでフィールドが未設定です');
    process.exit(1);
  }
}

// テスト実行
testGetUnpostedReviews().catch(error => {
  console.error('❌ テストエラー:', error);
  process.exit(1);
});
