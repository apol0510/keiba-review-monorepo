/**
 * 既存の口コミデータを一括補完するスクリプト
 *
 * SiteリンクからSiteName、SiteSlug、Categoryを取得して、
 * 各レコードに保存します。
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

/**
 * Categoryを推測（サイト名から）
 */
function inferCategory(siteName) {
  if (!siteName) return null;

  const name = siteName.toLowerCase();

  // 南関キーワード
  if (name.includes('南関') || name.includes('大井') || name.includes('川崎') ||
      name.includes('船橋') || name.includes('浦和') || name.includes('nankan')) {
    return '南関';
  }

  // 中央キーワード
  if (name.includes('中央') || name.includes('jra') || name.includes('東京競馬') ||
      name.includes('阪神') || name.includes('中京') || name.includes('京都')) {
    return '中央';
  }

  // 地方キーワード
  if (name.includes('地方') || name.includes('nar') || name.includes('園田') ||
      name.includes('金沢') || name.includes('名古屋') || name.includes('高知')) {
    return '地方';
  }

  // AIキーワード
  if (name.includes('ai') || name.includes('人工知能')) {
    return 'AI';
  }

  // 無料キーワード
  if (name.includes('無料') || name.includes('フリー')) {
    return '無料';
  }

  return '総合';
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔄 既存口コミデータの一括補完を開始します...\n');

  try {
    // 全ての口コミを取得
    console.log('📋 Reviewsテーブルからレコードを取得中...');
    const allReviews = await base('Reviews')
      .select({
        fields: ['Site', 'SiteName', 'SiteSlug', 'Category', 'Title', 'Content']
      })
      .all();

    console.log(`✅ ${allReviews.length}件のレコードを取得しました\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allReviews.length; i++) {
      const review = allReviews[i];
      const siteLinks = review.get('Site');

      // プログレス表示
      if ((i + 1) % 10 === 0) {
        console.log(`進捗: ${i + 1}/${allReviews.length} (${Math.round((i + 1) / allReviews.length * 100)}%)`);
      }

      // Siteリンクがない場合はスキップ
      if (!siteLinks || siteLinks.length === 0) {
        console.log(`⚠️ スキップ (Siteリンクなし): ${review.id}`);
        skippedCount++;
        continue;
      }

      // 既にすべてのフィールドが埋まっている場合はスキップ
      const hasSiteName = review.get('SiteName');
      const hasSiteSlug = review.get('SiteSlug');
      const hasCategory = review.get('Category');

      if (hasSiteName && hasSiteSlug && hasCategory) {
        skippedCount++;
        continue;
      }

      try {
        // Sitesテーブルから情報を取得
        const siteRecord = await base('Sites').find(siteLinks[0]);
        const siteName = siteRecord.get('Name');
        const siteSlug = siteRecord.get('Slug') || siteName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const category = inferCategory(siteName);

        // 更新するフィールドを準備
        const updateFields = {};

        if (!hasSiteName && siteName) {
          updateFields.SiteName = siteName;
        }

        if (!hasSiteSlug && siteSlug) {
          updateFields.SiteSlug = siteSlug;
        }

        if (!hasCategory && category) {
          updateFields.Category = category;
        }

        // 更新がある場合のみ実行
        if (Object.keys(updateFields).length > 0) {
          await base('Reviews').update(review.id, updateFields);
          updatedCount++;

          if (updatedCount <= 5) {
            console.log(`✅ 更新: ${review.id}`);
            console.log(`   SiteName: ${updateFields.SiteName || '(変更なし)'}`);
            console.log(`   SiteSlug: ${updateFields.SiteSlug || '(変更なし)'}`);
            console.log(`   Category: ${updateFields.Category || '(変更なし)'}`);
          }
        }

        // レート制限対策（100ms待機）
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ エラー (${review.id}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 一括補完完了');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 統計:`);
    console.log(`  更新: ${updatedCount}件`);
    console.log(`  スキップ: ${skippedCount}件`);
    console.log(`  エラー: ${errorCount}件`);
    console.log(`  合計: ${allReviews.length}件`);

  } catch (error) {
    console.error('❌ 致命的エラー:', error);
    process.exit(1);
  }
}

main();
