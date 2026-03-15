/**
 * 毎日の口コミ自動投稿スクリプト v4（5タイプ対応）
 *
 * v4の変更点:
 * 1. SiteQuality を 3タイプ → 5タイプに拡張
 * 2. premium: ⭐3-5（毎日100%、南関アナリティクス専用）
 * 3. excellent: ⭐3-5（毎日100%、平均4.1）⭐3:15%, ⭐4:60%, ⭐5:25%
 * 4. normal: ⭐2-4（2-3日に1回40%）
 * 5. poor: ⭐1-3（3-4日に1回30%）
 * 6. malicious: ⭐1-2（5日に1回20%）
 * 7. 口コミテンプレート500件に倍増対応
 * 8. ⭐3テンプレートを2種類に分離（ニュートラル/ややポジティブ）
 */

const { uploadReview } = require('./upload-adjusted-reviews.cjs');
const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');

// Airtable設定
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

// 最近使用したユーザー名を記録（重複防止）
const recentUsernames = new Set();

/**
 * サイトタイプ別の口コミ上限設定
 *
 * v4.1 変更 (2026-03-13):
 * - 上限到達による投稿停止を防ぐため、全カテゴリで上限を引き上げ
 * - 実測により上限到達が投稿停止の主因（80%）と判明
 */
const MAX_REVIEWS_PER_SITE = {
  premium: 150,    // 🌟 最高品質: 最大150件（南関アナリティクス専用）100→150
  excellent: 120,  // ✅ 優良サイト: 最大120件 80→120
  normal: 50,      // ⚪ 通常サイト: 最大50件 30→50
  poor: 60,        // ⚠️ 低品質サイト: 最大60件 40→60
  malicious: 70    // ❌ 悪質サイト: 最大70件 50→70
};

/**
 * 投稿確率設定（Airtableの SiteQuality に基づく）
 */
const POSTING_FREQUENCY = {
  premium: 1.0,      // 100% (毎日)
  excellent: 1.0,    // 100% (毎日) ※上限で制御
  normal: 0.4,       // 40% (2-3日に1回)
  poor: 0.3,         // 30% (3-4日に1回)
  malicious: 0.2     // 20% (5日に1回)
};

/**
 * 優先投稿サイト（Slug指定）
 *
 * これらのサイトは確率判定をスキップし、上限に達するまで毎日投稿される
 */
const PRIORITY_SITES = [
  'keiba-intelligence-jp'  // 競馬インテリジェンス - ランキング1位を目指すため優先投稿
];

/**
 * カテゴリ別の禁止ワード
 */
const categoryForbiddenWords = {
  chuo: [
    'ナイター競馬', 'ナイター', '南関', 'NANKAN', '南関競馬',
    '大井競馬', '川崎競馬', '船橋競馬', '浦和競馬',
    '大井', '川崎', '船橋', '浦和', 'TCK',
    '地方競馬', '地方', 'NAR', '園田', '金沢', '名古屋', '高知',
    '笠松', '門別', '盛岡', '水沢', 'ばんえい', 'ホッカイドウ競馬'
  ],
  nankan: [
    'G1', 'GⅠ', 'G2', 'GⅡ', 'G3', 'GⅢ',
    '有馬記念', '日本ダービー', '天皇賞', '宝塚記念',
    '菊花賞', '皐月賞', '桜花賞', 'オークス',
    '東京競馬場', '中山競馬場', '阪神競馬場', '京都競馬場',
    '中京競馬場', '新潟競馬場', '福島競馬場', '小倉競馬場'
  ],
  chihou: [
    'JRA', 'G1', 'GⅠ', '有馬記念', '日本ダービー',
    '南関', 'NANKAN', '南関競馬', 'TCK'
  ]
};

/**
 * 自動投稿専用のNGワード
 */
const autoPostForbiddenWords = [
  'サポート', '対応が遅い', '返信がない', '連絡が取れない', '問い合わせ',
  '詐欺', '騙された', '悪質', '詐欺サイト', '詐欺まがい',
  '最悪', 'ひどい', '金返せ', '返金', '被害',
  '訴える', '通報', '警察', '弁護士'
];

/**
 * 口コミに禁止ワードが含まれているかチェック
 */
function containsForbiddenWords(text, category) {
  const forbiddenWords = categoryForbiddenWords[category] || [];
  for (const word of forbiddenWords) {
    if (text.includes(word)) return true;
  }
  return false;
}

/**
 * 自動投稿用の禁止ワードチェック
 */
function containsAutoPostForbiddenWords(text) {
  for (const word of autoPostForbiddenWords) {
    if (text.includes(word)) return true;
  }
  return false;
}

/**
 * テキストファイルから口コミを読み込み
 */
function loadReviewsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ファイルが見つかりません: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const reviews = [];
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(line => line.trim());
    let startIndex = 0;

    if (lines[0] && /^\d+$/.test(lines[0].trim())) startIndex = 1;
    if (lines[startIndex] && lines[startIndex].includes('⭐')) startIndex++;

    if (lines.length > startIndex) {
      const title = lines[startIndex].substring(0, 30);
      const content = lines.slice(startIndex).join('');

      if (title && content && content.length >= 30) {
        reviews.push({ title, content });
      }
    }
  }

  return reviews;
}

/**
 * 全評価の口コミを読み込み
 */
function loadAllReviews() {
  const reviewsDir = path.join(__dirname, '../reviews-data');
  const allReviews = {
    1: loadReviewsFromFile(path.join(reviewsDir, '⭐1（辛口／クレーム寄り）.txt')),
    2: loadReviewsFromFile(path.join(reviewsDir, '⭐2（少し辛口寄り）.txt')),
    3: loadReviewsFromFile(path.join(reviewsDir, '⭐3（ニュートラル）.txt')),
    '3-positive': loadReviewsFromFile(path.join(reviewsDir, '⭐3（ややポジティブ）.txt')), // excellent/premium用
    4: loadReviewsFromFile(path.join(reviewsDir, '⭐4（少しポジティブ寄り）.txt')),
    5: loadReviewsFromFile(path.join(reviewsDir, '⭐5（premium専用・高評価）.txt')),
    '5-keiba-intelligence': loadReviewsFromFile(path.join(reviewsDir, '⭐5（keiba-intelligence専用）.txt'))
  };

  console.log('📚 口コミテンプレート読み込み完了:');
  console.log(`  ⭐1: ${allReviews[1].length}件`);
  console.log(`  ⭐2: ${allReviews[2].length}件`);
  console.log(`  ⭐3（ニュートラル）: ${allReviews[3].length}件`);
  console.log(`  ⭐3（ややポジティブ）: ${allReviews['3-positive'].length}件`);
  console.log(`  ⭐4: ${allReviews[4].length}件`);
  console.log(`  ⭐5: ${allReviews[5].length}件`);
  console.log(`  ⭐5（keiba-intelligence専用）: ${allReviews['5-keiba-intelligence'].length}件`);
  console.log('');

  return allReviews;
}

/**
 * サイトの評価を取得（Airtable SiteQuality フィールドから取得）
 *
 * v4: 5タイプ対応
 */
function getSiteRating(siteQuality) {
  const quality = siteQuality || 'normal';

  // 🌟 premium: ⭐3-5（毎日100%）
  if (quality === 'premium') {
    return {
      type: 'premium',
      starRange: [3, 5],
      starWeights: { 3: 0.25, 4: 0.55, 5: 0.20 }, // ⭐3(25%), ⭐4(55%), ⭐5(20%)
      weighted: true,
      probability: POSTING_FREQUENCY.premium
    };
  }

  // ✅ excellent: ⭐3-5（ほぼ毎日80%）
  if (quality === 'excellent') {
    return {
      type: 'excellent',
      starRange: [3, 5],
      starWeights: { 3: 0.15, 4: 0.60, 5: 0.25 }, // ⭐3(15%), ⭐4(60%), ⭐5(25%)
      weighted: true,
      probability: POSTING_FREQUENCY.excellent
    };
  }

  // ⚠️ poor: ⭐1-3（約7日に1回14%）
  if (quality === 'poor') {
    return {
      type: 'poor',
      starRange: [1, 3],
      weighted: false, // ランダム
      probability: POSTING_FREQUENCY.poor
    };
  }

  // ❌ malicious: ⭐1-2（約10日に1回10%）
  if (quality === 'malicious') {
    return {
      type: 'malicious',
      starRange: [1, 2],
      weighted: false, // ランダム
      probability: POSTING_FREQUENCY.malicious
    };
  }

  // ⚪ normal: ⭐2-4（約5日に1回20%）デフォルト
  return {
    type: 'normal',
    starRange: [2, 4],
    weighted: true,
    probability: POSTING_FREQUENCY.normal
  };
}

/**
 * 使用済み口コミIDを取得（30日以内）
 */
function getUsedReviewIds(usedReviewIdsField) {
  if (!usedReviewIdsField) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const entries = usedReviewIdsField.split(',').map(e => e.trim()).filter(Boolean);
  const validIds = [];

  for (const entry of entries) {
    const [id, dateStr] = entry.split('|');
    if (id && dateStr) {
      const usedDate = new Date(dateStr);
      if (usedDate >= thirtyDaysAgo) {
        validIds.push(id);
      }
    }
  }

  return validIds;
}

/**
 * 使用済み口コミIDを記録
 */
function recordUsedReviewId(usedReviewIdsField, reviewId) {
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `${reviewId}|${today}`;

  const existingIds = getUsedReviewIds(usedReviewIdsField);
  const existingEntries = (usedReviewIdsField || '').split(',').map(e => e.trim()).filter(Boolean);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const validEntries = existingEntries.filter(entry => {
    const [, dateStr] = entry.split('|');
    if (!dateStr) return false;
    const usedDate = new Date(dateStr);
    return usedDate >= thirtyDaysAgo;
  });

  validEntries.push(newEntry);
  return validEntries.join(',');
}

/**
 * 評価を選択（premium用の重み付き選択対応）
 */
function selectStars(starRange, weighted, type, currentAvg, reviewCount, starWeights) {
  // premiumの場合は固定の重み付け
  if (type === 'premium' && starWeights) {
    const rand = Math.random();
    let cumulative = 0;

    for (const [star, weight] of Object.entries(starWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return parseInt(star);
      }
    }
    return 4; // フォールバック
  }

  // その他のタイプの選択ロジック（v3と同じ）
  if (starRange[0] === starRange[1]) {
    return starRange[0];
  }

  if (weighted && type === 'normal') {
    // 通常サイト用の重み付け選択
    const TARGET_MIN = 2.8;
    const TARGET_MAX = 3.2;

    if (reviewCount >= 3) {
      if (currentAvg > TARGET_MAX) {
        return Math.random() < 0.7 ? 2 : 3;
      } else if (currentAvg < TARGET_MIN) {
        return Math.random() < 0.6 ? 3 : 4;
      } else {
        const rand = Math.random();
        if (rand < 0.25) return 2;
        if (rand < 0.85) return 3;
        return 4;
      }
    } else {
      const rand = Math.random();
      if (rand < 0.30) return 2;
      if (rand < 0.85) return 3;
      return 4;
    }
  }

  if (weighted && type === 'excellent' && starWeights) {
    // excellentサイト用の重み付け選択（⭐3-5対応）
    const rand = Math.random();
    let cumulative = 0;

    for (const [star, weight] of Object.entries(starWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return parseInt(star);
      }
    }
    return 4; // フォールバック
  }

  // デフォルト: ランダム選択
  const min = starRange[0];
  const max = starRange[1];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ユーザー名生成
 */
function generateUsername(category) {
  // 番号なしで使えるリアルなユーザー名
  const standAloneNames = [
    '名無しさん@競馬板',
    '匿名',
    '名無しさん',
    '競馬ファン',
    '南関ファン',
    '通りすがり',
    '競馬好き',
    '馬券生活者',
    '週末の戦士',
    '予想屋',
    '競馬研究家'
  ];

  // 番号やsuffixと組み合わせて使うベース名
  const baseNames = [
    '競馬太郎', '馬券師', '予想家', '投資家', 'ギャンブラー',
    'データ分析家', 'AI信者', '馬券研究家', '競馬歴10年',
    '三郎', '花子', '南関好き', '地方競馬ファン'
  ];

  const suffixes = ['', 'マン', '神', '王', 'さん'];

  let username;
  let attempts = 0;

  do {
    // 70%の確率で番号なしのリアルな名前を使用
    if (Math.random() < 0.7) {
      username = standAloneNames[Math.floor(Math.random() * standAloneNames.length)];

      // 重複の場合のみ番号を追加
      if (recentUsernames.has(username)) {
        const number = Math.floor(Math.random() * 100);
        username = `${username}${number + attempts}`;
      }
    } else {
      // 30%の確率で番号付き名前
      const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const number = Math.floor(Math.random() * 100);
      username = `${baseName}${suffix}${number + attempts}`;
    }

    attempts++;
  } while (recentUsernames.has(username) && attempts < 10);

  recentUsernames.add(username);
  if (recentUsernames.size > 100) {
    const firstUsername = Array.from(recentUsernames)[0];
    recentUsernames.delete(firstUsername);
  }

  return username;
}

/**
 * 全レビューから各サイトの最新投稿日を一括取得
 *
 * v4.1 実装 (2026-03-13):
 * - 1回のReviews取得で全サイトの最新投稿日を算出
 * - 並列API呼び出しを避け、レート制限リスクを排除
 */
async function getAllLatestPostDates() {
  console.log('📅 最新投稿日を一括取得中...');

  try {
    // サイトIDごとの最新投稿日をマップに集計
    const latestPostMap = new Map();
    let totalReviews = 0;

    // eachPage() でページングに対応しつつ、全レビューを取得
    await base('Reviews').select({
      filterByFormula: '{IsApproved} = TRUE()',
      fields: ['Site', 'CreatedAt'],
      sort: [{ field: 'CreatedAt', direction: 'desc' }]
    }).eachPage((records, fetchNextPage) => {
      // 各ページのレコードを処理
      for (const review of records) {
        totalReviews++;

        const siteLinks = review.fields.Site;
        if (!siteLinks || !Array.isArray(siteLinks) || siteLinks.length === 0) {
          continue;
        }

        const siteId = siteLinks[0]; // Linkフィールドは配列
        const createdAt = review.fields.CreatedAt;

        if (!createdAt) continue;

        // まだ登録されていないか、より新しい日付の場合のみ更新
        if (!latestPostMap.has(siteId)) {
          latestPostMap.set(siteId, createdAt);
        }
      }

      // 次のページを取得
      fetchNextPage();
    });

    console.log(`  取得: ${totalReviews}件のレビュー\n`);
    console.log(`  集計: ${latestPostMap.size}サイトの最新投稿日\n`);

    return latestPostMap;
  } catch (error) {
    console.error(`  ❌ 最新投稿日の取得に失敗: ${error.message}`);
    return new Map(); // エラー時は空のMapを返す（全サイトが強制投稿対象になる）
  }
}

/**
 * 投稿対象サイトを選択
 * 確率フィルターにより自動的に絞り込まれる
 *
 * v4.1 変更 (2026-03-13):
 * - 最小投稿保証を追加（7日間投稿なしの場合は強制投稿）
 * - 除外理由別のカウンターを追加
 * - 1回のReviews取得で全サイトの最新投稿日を算出（レート制限対策）
 */
async function selectSitesToPost() {
  console.log('📊 投稿対象サイトを選択中...\n');

  // 全サイトの最新投稿日を一括取得（1回のAPI呼び出し）
  const latestPostMap = await getAllLatestPostDates();

  const allSites = await base('Sites').select({
    filterByFormula: '{IsApproved} = TRUE()',
    fields: ['Name', 'Slug', 'Category', 'Reviews', 'SiteQuality', 'UsedReviewIDs']
  }).all();

  const now = new Date();

  const sitesWithReviewCount = allSites.map((siteRecord) => {
    const reviews = siteRecord.fields.Reviews || [];
    const reviewCount = Array.isArray(reviews) ? reviews.length : 0;

    const siteQuality = siteRecord.fields.SiteQuality || 'normal';
    const rating = getSiteRating(siteQuality);

    // 最終投稿からの日数を計算
    let daysSinceLastPost = 9999; // デフォルト: レビューなし（強制投稿対象）

    if (latestPostMap.has(siteRecord.id)) {
      const latestDate = new Date(latestPostMap.get(siteRecord.id));
      daysSinceLastPost = Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));
    }

    return {
      id: siteRecord.id,
      name: siteRecord.fields.Name,
      slug: siteRecord.fields.Slug || '',
      category: siteRecord.fields.Category || 'other',
      reviewCount,
      rating,
      siteQuality,
      usedReviewIds: siteRecord.fields.UsedReviewIDs || '',
      daysSinceLastPost
    };
  });

  // Filter out sites with invalid IDs
  const validSites = sitesWithReviewCount.filter(site => {
    if (!site.id || site.id === null || site.id === 'null') {
      console.log(`  ⚠️  ${site.name}: 無効なレコードIDのためスキップ`);
      return false;
    }
    return true;
  });

  // 除外理由別カウンター
  let maxLimitCount = 0;
  let probabilitySkipCount = 0;
  let forcedPostCount = 0;
  let priorityPostCount = 0;

  const candidates = validSites.filter(site => {
    const maxReviews = MAX_REVIEWS_PER_SITE[site.rating.type] || 30;

    // 上限チェック
    if (site.reviewCount >= maxReviews) {
      console.log(`  ⏭️  ${site.name}: 上限到達 (${site.reviewCount}/${maxReviews})`);
      maxLimitCount++;
      return false;
    }

    // 優先投稿サイトチェック（確率判定をスキップ）
    if (PRIORITY_SITES.includes(site.slug)) {
      console.log(`  🎯 ${site.name}: 優先投稿対象 (${site.siteQuality}, ${site.reviewCount}/${maxReviews}, 前回: ${site.daysSinceLastPost}日前)`);
      priorityPostCount++;
      return true;
    }

    // 最小投稿保証: 7日以上投稿がない場合は強制投稿
    if (site.daysSinceLastPost >= 7) {
      console.log(`  🚨 ${site.name}: ${site.daysSinceLastPost}日間投稿なし → 強制投稿 (${site.siteQuality}, ${site.reviewCount}/${maxReviews})`);
      forcedPostCount++;
      return true;
    }

    // 通常の確率判定
    const shouldPost = Math.random() < site.rating.probability;
    if (!shouldPost) {
      console.log(`  🎲 ${site.name}: 今日は投稿なし (確率: ${(site.rating.probability * 100).toFixed(0)}%, 前回: ${site.daysSinceLastPost}日前)`);
      probabilitySkipCount++;
      return false;
    }

    console.log(`  ✅ ${site.name}: 投稿対象 (${site.siteQuality}, ${site.reviewCount}/${maxReviews}, 前回: ${site.daysSinceLastPost}日前)`);
    return true;
  });

  console.log(`\n📊 選択結果:`);
  console.log(`  投稿対象: ${candidates.length}サイト`);
  console.log(`  除外（上限到達）: ${maxLimitCount}サイト`);
  console.log(`  除外（確率判定）: ${probabilitySkipCount}サイト`);
  console.log(`  優先投稿: ${priorityPostCount}サイト`);
  console.log(`  強制投稿: ${forcedPostCount}サイト\n`);

  // 確率フィルターで既に絞られているので、全候補を返す
  return candidates;
}

/**
 * 口コミを投稿
 */
async function postReview(site, allReviews) {
  const { starRange, weighted, type, starWeights } = site.rating;

  // 既存レビューの平均評価を計算
  const reviews = site.reviews || [];
  const currentAvg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // 星の数を決定
  const stars = selectStars(starRange, weighted, type, currentAvg, site.reviewCount, starWeights);

  // 使用済みIDを確認
  const usedIds = getUsedReviewIds(site.usedReviewIds);

  // 口コミテンプレートキーを決定
  // excellent/premiumで⭐3の場合は「ややポジティブ」版を使用
  let reviewKey = stars;
  if ((type === 'excellent' || type === 'premium') && stars === 3) {
    reviewKey = '3-positive';
  }

  // keiba-intelligence-jpで⭐5の場合は専用テンプレートを使用
  if (site.slug === 'keiba-intelligence-jp' && stars === 5) {
    reviewKey = '5-keiba-intelligence';
  }

  // 口コミをランダム選択（使用済みを除外）
  const reviewCandidates = allReviews[reviewKey] || [];
  const availableReviews = reviewCandidates
    .map((r, index) => ({ ...r, id: `${reviewKey}-${index}` }))
    .filter(r => !usedIds.includes(r.id))
    .filter(r => !containsForbiddenWords(r.title + r.content, site.category))
    .filter(r => !containsAutoPostForbiddenWords(r.title + r.content));

  if (availableReviews.length === 0) {
    const templateType = reviewKey === '3-positive' ? '⭐3（ややポジティブ）' : `⭐${stars}`;
    console.log(`  ⚠️  ${site.name}: 使用可能な${templateType}口コミがありません`);
    return null;
  }

  const selectedReview = availableReviews[Math.floor(Math.random() * availableReviews.length)];

  // ユーザー名生成
  const username = generateUsername(site.category);

  // 口コミを投稿（v3と同じ形式）
  const review = {
    username,
    rating: stars,
    title: selectedReview.title,
    content: selectedReview.content
  };

  const reviewId = await uploadReview(review, site.id, true);

  if (reviewId) {
    // 使用済みIDを記録
    const newUsedReviewIds = recordUsedReviewId(site.usedReviewIds, selectedReview.id);
    await base('Sites').update(site.id, {
      UsedReviewIDs: newUsedReviewIds
    });

    console.log(`  ✅ ${site.name}: ⭐${stars} 投稿成功`);
    console.log(`     タイトル: ${selectedReview.title}`);
  } else {
    console.log(`  ❌ ${site.name}: 投稿失敗`);
  }

  return reviewId;
}

/**
 * メイン処理
 */
(async () => {
  console.log('🚀 口コミ自動投稿スクリプト v4 開始\n');
  console.log('📊 5タイプ対応:');
  console.log('  🌟 premium: ⭐3-5 (毎日100%)');
  console.log('  ✅ excellent: ⭐3-5 (毎日100%, 平均4.1) ⭐3:15% ⭐4:60% ⭐5:25%');
  console.log('  ⚪ normal: ⭐2-4 (2-3日に1回40%)');
  console.log('  ⚠️ poor: ⭐1-3 (3-4日に1回30%)');
  console.log('  ❌ malicious: ⭐1-2 (5日に1回20%)\n');

  const allReviews = loadAllReviews();
  const sitesToPost = await selectSitesToPost(); // 引数削除（全候補を取得）

  if (sitesToPost.length === 0) {
    console.log('📭 本日投稿する対象サイトがありません');
    return;
  }

  console.log('📝 口コミ投稿開始\n');

  let successCount = 0;
  let failedCount = 0;

  for (const site of sitesToPost) {
    try {
      const result = await postReview(site, allReviews);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`  ❌ ${site.name}: エラー発生 - ${error.message}`);
      failedCount++;
    }
    // Airtableレート制限対策: 5 requests/secondを超えないよう2秒待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ 口コミ自動投稿完了\n');
  console.log(`📊 結果サマリー:`);
  console.log(`  成功: ${successCount}件`);
  console.log(`  失敗: ${failedCount}件`);
})().catch(error => {
  console.error('❌ スクリプト実行エラー:', error);
  process.exit(1);
});
