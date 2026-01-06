/**
 * 根本原因分析: ReviewsとSitesのリンク状態を確認
 *
 * 確認内容:
 * 1. Reviewsテーブルに Site フィールド（Link）が存在するか
 * 2. 既存のレビューがSiteにリンクされているか
 * 3. Sitesテーブルの Reviews フィールドにデータが入っているか
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

async function analyzeReviewSiteLinks() {
  console.log('🔍 Reviews-Sites リンク状態を分析中...\n');

  try {
    // 1. nankanカテゴリのサイトを取得
    console.log('📊 Step 1: Sitesテーブルを確認\n');
    const sites = await base('Sites')
      .select({
        filterByFormula: "AND({IsApproved} = TRUE(), {Category} = 'nankan')",
        fields: ['Name', 'Slug', 'Reviews', 'Average Rating']
      })
      .all();

    console.log(`✅ nankanサイト数: ${sites.length}件\n`);

    const sitesWithReviews = sites.filter(site => {
      const reviews = site.get('Reviews');
      return reviews && reviews.length > 0;
    });

    const sitesWithoutReviews = sites.filter(site => {
      const reviews = site.get('Reviews');
      return !reviews || reviews.length === 0;
    });

    console.log(`✅ Reviewsリンクあり: ${sitesWithReviews.length}件`);
    console.log(`❌ Reviewsリンクなし: ${sitesWithoutReviews.length}件\n`);

    if (sitesWithReviews.length > 0) {
      console.log('📋 Reviewsリンクがあるサイト:');
      sitesWithReviews.forEach(site => {
        const reviews = site.get('Reviews') || [];
        const avgRating = site.get('Average Rating');
        console.log(`  - ${site.get('Name')}: ${reviews.length}件の口コミ, 平均評価 ${avgRating?.toFixed(2) || 'N/A'}`);
      });
      console.log('');
    }

    if (sitesWithoutReviews.length > 0) {
      console.log('⚠️  Reviewsリンクがないサイト:');
      sitesWithoutReviews.forEach(site => {
        console.log(`  - ${site.get('Name')} (slug: ${site.get('Slug')})`);
      });
      console.log('');
    }

    // 2. nankanカテゴリのレビューを確認
    console.log('📊 Step 2: Reviewsテーブルを確認\n');
    const reviews = await base('Reviews')
      .select({
        filterByFormula: "{Category} = 'nankan'",
        fields: ['SiteName', 'Site', 'Rating', 'Status'],
        maxRecords: 100
      })
      .all();

    console.log(`✅ nankanレビュー総数: ${reviews.length}件\n`);

    const reviewsWithSiteLink = reviews.filter(review => {
      const siteLinks = review.get('Site');
      return siteLinks && siteLinks.length > 0;
    });

    const reviewsWithoutSiteLink = reviews.filter(review => {
      const siteLinks = review.get('Site');
      return !siteLinks || siteLinks.length === 0;
    });

    console.log(`✅ Siteリンクあり: ${reviewsWithSiteLink.length}件`);
    console.log(`❌ Siteリンクなし: ${reviewsWithoutSiteLink.length}件\n`);

    if (reviewsWithoutSiteLink.length > 0) {
      console.log('⚠️  Siteリンクがないレビューのサンプル（最初の10件）:');
      reviewsWithoutSiteLink.slice(0, 10).forEach(review => {
        console.log(`  - ${review.get('SiteName')}: ⭐${review.get('Rating')}`);
      });
      console.log('');
    }

    // 3. 根本原因の特定
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 根本原因分析\n');

    if (reviewsWithoutSiteLink.length > 0) {
      console.log('❌ 問題発見: ReviewsテーブルのSiteフィールドが空');
      console.log(`   → ${reviewsWithoutSiteLink.length}件のレビューがサイトにリンクされていません\n`);
      console.log('📝 解決策:');
      console.log('   1. ReviewsテーブルのSiteフィールドに、適切なSiteレコードをリンク');
      console.log('   2. SiteNameフィールドからSlugを推測して自動リンク');
      console.log('   3. スクリプト: populate-review-site-links.cjs を実行\n');
      console.log('💡 なぜこれが重要か:');
      console.log('   - SitesテーブルのReviewsフィールドは双方向リンク');
      console.log('   - ReviewsにSiteリンクがないと、SitesのReviewsフィールドも空になる');
      console.log('   - Average RatingのRollupもデータなしになる');
      console.log('   - 結果: フロントエンドで「0件の口コミ」と表示される\n');
    } else {
      console.log('✅ データリンクは正常です');
      console.log('   → 他の原因を調査する必要があります\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

analyzeReviewSiteLinks();
