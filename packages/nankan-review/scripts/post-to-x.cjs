/**
 * X (Twitter) 自動投稿スクリプト - nankan-review専用
 *
 * 南関競馬関連の新規承認された口コミをXに自動投稿します。
 *
 * 環境変数:
 * - AIRTABLE_API_KEY: AirtableのAPIキー
 * - AIRTABLE_BASE_ID: AirtableのBase ID
 * - X_API_KEY: X API Consumer Key (API Key)
 * - X_API_SECRET: X API Consumer Secret (API Secret)
 * - X_ACCESS_TOKEN: X API Access Token
 * - X_ACCESS_SECRET: X API Access Token Secret
 * - SITE_URL: サイトURL（デフォルト: https://nankan.keiba-review.jp）
 */

const Airtable = require('airtable');
const { TwitterApi } = require('twitter-api-v2');

// 環境変数チェック
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const requiredEnvVars = [
  { name: 'AIRTABLE_API_KEY', value: AIRTABLE_API_KEY },
  { name: 'AIRTABLE_BASE_ID', value: AIRTABLE_BASE_ID },
  { name: 'X_API_KEY', value: process.env.X_API_KEY },
  { name: 'X_API_SECRET', value: process.env.X_API_SECRET },
  { name: 'X_ACCESS_TOKEN', value: process.env.X_ACCESS_TOKEN },
  { name: 'X_ACCESS_SECRET', value: process.env.X_ACCESS_SECRET }
];

for (const { name, value } of requiredEnvVars) {
  if (!value) {
    console.error(`❌ エラー: 環境変数 ${name} が設定されていません`);
    process.exit(1);
  }
}

// Airtable設定
const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
  .base(AIRTABLE_BASE_ID);

// X API クライアント（OAuth 1.0a User Context）
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const SITE_URL = process.env.SITE_URL || 'https://nankan.keiba-review.jp';

// 南関競馬場の絵文字マップ
const NANKAN_VENUE_EMOJI = {
  '大井': '🌃',
  '川崎': '⚓',
  '船橋': '⚓',
  '浦和': '🌸'
};

/**
 * 投稿テキスト生成（南関競馬特化版）
 */
function generateTweetText(review) {
  const siteName = review.SiteName;
  const rating = review.Rating;
  const stars = '⭐'.repeat(rating);

  // サイトのSlugを取得
  const siteSlug = review.SiteSlug || siteName.toLowerCase().replace(/\s+/g, '-');
  const url = `${SITE_URL}/sites/${siteSlug}/?utm_source=twitter&utm_medium=social&utm_campaign=auto_post`;

  // 南関競馬の絵文字（デフォルトは夜間レース）
  const emoji = '🌃';

  // ハッシュタグ（南関競馬特化）
  const hashtags = ['#南関競馬', '#競馬予想'];

  // 南関競馬場別のハッシュタグ追加
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

  // コメントを短縮（最大50文字）
  const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;

  // ツイート本文作成（280文字制限）
  // XのURL文字数カウント: URLは長さに関わらず23文字としてカウントされる
  const URL_CHAR_COUNT = 23;

  // 固定部分の文字数を計算
  const fixedPartsLength =
    emoji.length +           // 絵文字（通常2文字）
    1 +                      // スペース
    10 +                     // 【新着口コミ】
    siteName.length +        // サイト名
    1 +                      // スペース
    stars.length +           // 星
    4 +                      // \n\n「」
    shortComment.length +    // コメント
    2 +                      // \n\n
    9 +                      // 👉 詳細はこちら
    1 +                      // \n
    URL_CHAR_COUNT +         // URL（23文字固定）
    2 +                      // \n\n
    hashtags.join(' ').length; // ハッシュタグ

  // 280文字を超える場合はコメントをさらに短縮
  let finalComment = shortComment;
  if (fixedPartsLength > 280) {
    const maxCommentLength = 280 - (fixedPartsLength - shortComment.length) - 3; // ...分を引く
    finalComment = comment.substring(0, Math.max(0, maxCommentLength)) + '...';
  }

  return `${emoji} 【新着口コミ】${siteName} ${stars}\n\n「${finalComment}」\n\n👉 詳細はこちら\n${url}\n\n${hashtags.join(' ')}`;
}

/**
 * Xに投稿
 */
async function postToX(review) {
  try {
    const tweetText = generateTweetText(review);
    console.log(`\n📝 投稿内容:\n${tweetText}\n`);
    console.log(`📊 文字数: ${tweetText.length}/280`);

    const tweet = await twitterClient.v2.tweet(tweetText);
    console.log(`✅ Xに投稿しました: https://twitter.com/user/status/${tweet.data.id}`);

    return tweet.data.id;
  } catch (error) {
    console.error('❌ X投稿エラー:', error);
    throw error;
  }
}

/**
 * AirtableのReviewsレコードにXのツイートIDを記録
 */
async function updateReviewWithTweetId(recordId, tweetId) {
  try {
    const now = new Date().toISOString();
    await base('Reviews').update(recordId, {
      TweetID: tweetId,
      TweetedAt: now
    });
    console.log(`✅ Airtableを更新しました（RecordID: ${recordId}）`);
  } catch (error) {
    console.error('❌ Airtable更新エラー:', error);
    // Airtableの更新に失敗してもツイートは成功しているのでエラーは投げない
  }
}

/**
 * まだXに投稿していない最新口コミを取得
 * FREE API対応: 月500ツイート制限を考慮
 */
async function getUnpostedReviews() {
  // FREE API制限: 1日50ツイート、月500ツイート
  // 安全のため1回の実行で最大3件まで投稿
  const MAX_POSTS_PER_RUN = 3;

  try {
    // 南関競馬の口コミのみを取得（keiba-review-allと同じBaseを使用）
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
 * メイン処理
 */
async function main() {
  console.log('🌃 南関競馬 X自動投稿スクリプト開始...\n');
  console.log(`📅 実行時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`);

  // 未投稿の口コミを取得
  const unpostedReviews = await getUnpostedReviews();

  if (unpostedReviews.length === 0) {
    console.log('ℹ️ 投稿する口コミがありません');
    return;
  }

  console.log(`📋 ${unpostedReviews.length}件の未投稿口コミが見つかりました\n`);

  // 各口コミをXに投稿
  for (const review of unpostedReviews) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🌃 南関口コミ: ${review.SiteName} (⭐${review.Rating})`);
    console.log(`📝 コメント: ${review.Comment.substring(0, 50)}...`);

    try {
      // Xに投稿
      const tweetId = await postToX(review);

      // Airtableを更新
      await updateReviewWithTweetId(review.id, tweetId);

      // レート制限対策（15秒待機）
      if (unpostedReviews.indexOf(review) < unpostedReviews.length - 1) {
        console.log('⏱️  15秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }

    } catch (error) {
      console.error(`❌ 投稿失敗: ${review.SiteName}`);
      console.error(error);
      // エラーが発生しても次の口コミの投稿を続行
      continue;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 南関競馬 X自動投稿スクリプト完了');
  console.log(`📊 投稿数: ${unpostedReviews.length}件`);
}

// スクリプト実行
main().catch(error => {
  console.error('❌ スクリプト実行エラー:', error);
  process.exit(1);
});
