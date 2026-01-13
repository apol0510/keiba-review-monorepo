/**
 * Airtable APIから実際に返されるデータを確認
 *
 * getSitesByCategory('nankan') が何を返しているか検証
 */

const Airtable = require('airtable');
require('dotenv').config({ path: 'packages/nankan-review/.env' });

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

async function testAirtableFetch() {
  console.log('🔍 Airtable APIから実際のデータを取得中...\n');

  try {
    // getSitesByCategory('nankan') の実装を再現
    const records = await base('Sites').select({
      filterByFormula: `AND({IsApproved} = TRUE(), {Category} = 'nankan')`,
      sort: [
        { field: 'DisplayPriority', direction: 'desc' },
        { field: 'CreatedAt', direction: 'desc' }
      ]
    }).all();

    console.log(`✅ 取得したレコード数: ${records.length}件\n`);

    // 各レコードの詳細を表示
    records.forEach((record, index) => {
      console.log(`\n━━━ サイト ${index + 1} ━━━`);
      console.log(`Name: ${record.get('Name')}`);
      console.log(`Slug: ${record.get('Slug')}`);

      // Reviews フィールド（Link to another record）
      const reviewsField = record.get('Reviews');
      console.log(`Reviews フィールド: ${reviewsField ? JSON.stringify(reviewsField) : 'null'}`);
      console.log(`Reviews フィールド型: ${typeof reviewsField}`);
      console.log(`Reviews 配列長: ${reviewsField ? reviewsField.length : 0}`);

      // Average Rating フィールド（Rollup）
      const avgRatingField = record.get('Average Rating');
      console.log(`Average Rating: ${avgRatingField}`);
      console.log(`Average Rating 型: ${typeof avgRatingField}`);

      // Screenshot URL
      const screenshotUrl = record.get('ScreenshotURL');
      console.log(`ScreenshotURL: ${screenshotUrl ? screenshotUrl.substring(0, 50) + '...' : 'null'}`);

      // これがコードで使われる値
      const reviewCount = reviewsField ? reviewsField.length : 0;
      const averageRating = avgRatingField;

      console.log(`\n📊 コードで使用される値:`);
      console.log(`  reviewCount: ${reviewCount}`);
      console.log(`  averageRating: ${averageRating}`);

      // 問題の診断
      if (reviewCount === 0 && avgRatingField) {
        console.log(`\n⚠️  警告: Average RatingがあるのにreviewCount=0`);
        console.log(`   → Reviewsフィールドが空の可能性`);
      }

      if (!screenshotUrl) {
        console.log(`\n⚠️  警告: ScreenshotURLが空`);
      }
    });

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('🎯 診断結果\n');

    const sitesWithNoReviews = records.filter(r => {
      const reviews = r.get('Reviews');
      return !reviews || reviews.length === 0;
    });

    const sitesWithNoScreenshot = records.filter(r => {
      const screenshot = r.get('ScreenshotURL');
      return !screenshot;
    });

    if (sitesWithNoReviews.length > 0) {
      console.log(`❌ Reviewsフィールドが空: ${sitesWithNoReviews.length}件`);
      sitesWithNoReviews.forEach(r => {
        const avgRating = r.get('Average Rating');
        console.log(`   - ${r.get('Name')}: Average Rating = ${avgRating}`);
      });
      console.log('');
    } else {
      console.log('✅ 全サイトにReviewsフィールドあり\n');
    }

    if (sitesWithNoScreenshot.length > 0) {
      console.log(`⚠️  ScreenshotURLが空: ${sitesWithNoScreenshot.length}件`);
      sitesWithNoScreenshot.forEach(r => {
        console.log(`   - ${r.get('Name')}`);
      });
      console.log('');
    } else {
      console.log('✅ 全サイトにScreenshotURLあり\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ エラー:', error);
    if (error.statusCode) {
      console.error(`Status: ${error.statusCode}`);
      console.error(`Message: ${error.message}`);
    }
    process.exit(1);
  }
}

testAirtableFetch();
