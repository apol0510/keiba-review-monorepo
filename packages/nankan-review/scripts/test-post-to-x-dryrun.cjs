/**
 * nankan-review X自動投稿のドライランテスト
 *
 * 実際にXに投稿せず、データ取得と投稿内容生成のみテストします。
 */

require('dotenv').config({ path: '.env' });
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SITE_URL = process.env.SITE_URL || 'https://nankan.keiba-review.jp';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: AIRTABLE_API_KEY と AIRTABLE_BASE_ID を設定してください');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * 投稿テキスト生成（南関競馬特化版）
 */
function generateTweetText(review) {
  const siteName = review.SiteName;
  const rating = review.Rating;
  const stars = '⭐'.repeat(rating);

  const siteSlug = review.SiteSlug || siteName.toLowerCase().replace(/\s+/g, '-');
  const url = `${SITE_URL}/sites/${siteSlug}/?utm_source=twitter&utm_medium=social&utm_campaign=auto_post`;

  const emoji = '🌃';
  const hashtags = ['#南関競馬', '#競馬予想'];

  const comment = review.Comment || '';
  if (comment.includes('大井')) {
    hashtags.push('#大井競馬');
  } else if (comment.includes('川崎')) {
    hashtags.push('#川崎競馬');
  } else if (comment.includes('船橋')) {
    hashtags.push('#船橋競馬');
  } else if (comment.includes('浦和')) {
    hashtags.push('#浦和競馬');
  }

  const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;

  const URL_CHAR_COUNT = 23;

  const fixedPartsLength =
    emoji.length +
    1 +
    10 +
    siteName.length +
    1 +
    stars.length +
    4 +
    shortComment.length +
    2 +
    9 +
    1 +
    URL_CHAR_COUNT +
    2 +
    hashtags.join(' ').length;

  let finalComment = shortComment;
  if (fixedPartsLength > 280) {
    const maxCommentLength = 280 - (fixedPartsLength - shortComment.length) - 3;
    finalComment = comment.substring(0, Math.max(0, maxCommentLength)) + '...';
  }

  return `${emoji} 【新着口コミ】${siteName} ${stars}\n\n「${finalComment}」\n\n👉 詳細はこちら\n${url}\n\n${hashtags.join(' ')}`;
}

/**
 * まだXに投稿していない最新口コミを取得
 */
async function getUnpostedReviews() {
  const MAX_POSTS_PER_RUN = 2;

  try {
    const records = await base('Reviews')
      .select({
        filterByFormula: "AND({Status} = '承認済み', OR({TweetID} = '', {TweetID} = BLANK()), {Category} = '南関')",
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
      CreatedAt: record.get('CreatedAt')
    }));
  } catch (error) {
    console.error('❌ Airtable取得エラー:', error);
    throw error;
  }
}

/**
 * メイン処理（ドライラン）
 */
async function main() {
  console.log('🧪 nankan-review X自動投稿 ドライランテスト開始...\n');
  console.log(`📅 実行時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`);

  const unpostedReviews = await getUnpostedReviews();

  if (unpostedReviews.length === 0) {
    console.log('ℹ️ 投稿する口コミがありません');
    return;
  }

  console.log(`📋 ${unpostedReviews.length}件の未投稿口コミが見つかりました\n`);

  for (const review of unpostedReviews) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🌃 南関口コミ: ${review.SiteName} (⭐${review.Rating})`);
    console.log(`📝 コメント: ${review.Comment?.substring(0, 50)}...`);

    const tweetText = generateTweetText(review);
    console.log(`\n📝 投稿内容:\n${tweetText}\n`);
    console.log(`📊 文字数: ${tweetText.length}/280`);

    if (tweetText.length > 280) {
      console.error('⚠️ 警告: ツイートが280文字を超えています！');
    } else {
      console.log('✅ 文字数チェック: OK');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ドライランテスト完了');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 統計:');
  console.log(`  投稿対象: ${unpostedReviews.length}件`);
  console.log(`  MAX_POSTS_PER_RUN: 2件/回`);
  console.log();
  console.log('💡 GitHub Actionsでの実行時:');
  console.log('  - GitHub Secretsに設定されたX API認証情報を使用');
  console.log('  - 実際にXに投稿される');
  console.log('  - 1日4回 × 2件 = 8ツイート/日（nankan-review）');
  console.log('  - 月間最大: 480ツイート < 500ツイート制限');
}

main().catch(error => {
  console.error('❌ スクリプト実行エラー:', error);
  process.exit(1);
});
