import Airtable from 'airtable';
import * as fs from 'fs';
import * as path from 'path';

// ===== ビルドキャッシュ（JSONファイル永続化）=====
// ビルド時に取得したデータをJSONとして出力し、SSR/runtime でもAPIゼロで動作させる。
// 書き出し先は BUILD_CACHE_DIR 環境変数、または呼び出し元の dist/_data/。

// キャッシュファイルのバージョン。フォーマット変更時にインクリメントする。
const BUILD_CACHE_VERSION = '2';

interface BuildCacheEnvelope<T> {
  version: string;
  generatedAt: string;
  data: T;
}

let _buildCacheDir: string | null = null;

function getBuildCacheDir(): string | null {
  if (typeof window !== 'undefined') return null;
  if (_buildCacheDir !== null) return _buildCacheDir || null;

  const envDir = (typeof process !== 'undefined' && process.env?.BUILD_CACHE_DIR) || '';
  if (envDir) {
    _buildCacheDir = envDir;
    return envDir;
  }

  // 自動検出: cwd から dist/_data/ を探索
  try {
    const cwd = process.cwd();
    const candidate = path.join(cwd, 'dist', '_data');
    if (fs.existsSync(path.join(cwd, 'dist'))) {
      _buildCacheDir = candidate;
      return candidate;
    }
  } catch { /* ignore */ }

  _buildCacheDir = '';
  return null;
}

function writeBuildCacheFile(filename: string, data: any): void {
  const dir = getBuildCacheDir();
  if (!dir) return;

  const envelope: BuildCacheEnvelope<any> = {
    version: BUILD_CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    data,
  };

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const json = JSON.stringify(envelope);
    fs.writeFileSync(path.join(dir, filename), json, 'utf-8');
  } catch (error) {
    // 書き込み失敗はビルド失敗にする（サイレント障害防止）
    throw new Error(`ビルドキャッシュ書き込み失敗 (${filename}): ${error}`);
  }
}

function readBuildCacheFile<T>(filename: string): T | null {
  if (typeof window !== 'undefined') return null;

  const tryRead = (filePath: string): T | null => {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    // envelope 形式かどうか判定
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      const envelope = parsed as BuildCacheEnvelope<T>;
      if (envelope.version !== BUILD_CACHE_VERSION) {
        console.warn(`  ⚠️ キャッシュバージョン不一致 (${filename}): expected=${BUILD_CACHE_VERSION}, got=${envelope.version} → スキップ`);
        return null;
      }
      return envelope.data;
    }

    // レガシー（envelope なし）→ そのまま返す（後方互換）
    return parsed as T;
  };

  try {
    // 1. BUILD_CACHE_DIR
    const envDir = getBuildCacheDir();
    if (envDir) {
      const result = tryRead(path.join(envDir, filename));
      if (result !== null) return result;
    }
    // 2. cwd/dist/_data/（SSR runtime フォールバック）
    const cwd = process.cwd();
    const result = tryRead(path.join(cwd, 'dist', '_data', filename));
    if (result !== null) return result;
  } catch (error) {
    console.warn(`  ⚠️ キャッシュ読み込みエラー (${filename}):`, error);
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Airtable設定（遅延評価でクライアントサイドエラーを回避）
function getAirtableCredentials() {
  const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  // クライアントサイドでは環境変数が存在しないため、エラーを投げない
  if (typeof window !== 'undefined') {
    return { apiKey: '', baseId: '' };
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  }

  return { apiKey: AIRTABLE_API_KEY, baseId: AIRTABLE_BASE_ID };
}

// Airtableクライアント初期化（遅延評価）
let _base: ReturnType<ReturnType<typeof Airtable>['base']> | null = null;

function getBase() {
  if (!_base) {
    const { apiKey, baseId } = getAirtableCredentials();
    if (apiKey && baseId) {
      _base = new Airtable({ apiKey }).base(baseId);
    }
  }
  return _base!;
}

// サーバーサイドでのみbaseを初期化
const base = typeof window === 'undefined' ? getBase() : ({} as any);

// 強力なメモリキャッシュ（30分間有効 - SSGモードでは実質永続）
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30分

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// レート制限対策: API呼び出し間に遅延を追加
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// リトライロジック付きAPI呼び出しラッパー
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // レート制限対策: 200ms待機（5 requests/second）
      if (attempt > 1) {
        const backoffMs = 200 * Math.pow(2, attempt - 1); // 指数バックオフ
        console.log(`  ⏱️  リトライ ${attempt}/${maxRetries}: ${backoffMs}ms待機中...`);
        await delay(backoffMs);
      }

      return await fetchFn();
    } catch (error: any) {
      const is504 = error?.statusCode === 504 || error?.message?.includes('504');

      if (is504 && attempt < maxRetries) {
        console.warn(`  ⚠️  タイムアウト検出（試行 ${attempt}/${maxRetries}）`);
        continue;
      }

      throw error;
    }
  }

  throw new Error(`最大リトライ回数（${maxRetries}）を超えました`);
}

// Airtable設定を取得する関数（互換性のため）
export async function getAirtableConfig() {
  const { apiKey, baseId } = getAirtableCredentials();
  return {
    isDemoMode: false,
    apiKey,
    baseId
  };
}

// 型定義
export type Category = 'nankan' | 'chuo' | 'chihou';
export type SiteStatus = 'active' | 'pending' | 'rejected';
export type ReviewStatus = 'approved' | 'pending' | 'spam';
export type PricingType = 'free' | 'partially_paid' | 'fully_paid';

export interface Site {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  category: Category;
  screenshotUrl?: string;
  isApproved: boolean;
  status?: SiteStatus;
  reviewCount?: number;
  averageRating?: number;
  displayPriority?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  siteId: string;
  siteName?: string;
  username: string;
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  created_at?: string; // snake_caseエイリアス（オプション）
  helpfulCount?: number;
  helpful_count?: number; // snake_caseエイリアス（オプション）
}

export interface ReviewWithSite extends Review {
  siteSlug: string;
}

// サイト取得関数
export async function getAllSites(): Promise<Site[]> {
  const records = await base('Sites').select({
    view: 'Grid view',
    sort: [{ field: 'CreatedAt', direction: 'desc' }]
  }).all();

  return records.map(record => ({
    id: record.id,
    name: record.fields.Name as string,
    slug: record.fields.Slug as string,
    url: record.fields.URL as string,
    description: record.fields.Description as string || '',
    category: record.fields.Category as Category,
    screenshotUrl: record.fields.ScreenshotURL as string,
    isApproved: record.fields.IsApproved as boolean || false,
    status: record.fields.IsApproved ? 'active' : 'pending',
    reviewCount: record.fields.Reviews ? (record.fields.Reviews as string[]).length : 0,
    averageRating: record.fields['Average Rating'] as number,
    createdAt: record.fields.CreatedAt as string
  }));
}

// 承認済みサイト取得
// 優先順位: メモリキャッシュ → JSONビルドキャッシュ → Airtable API
export async function getApprovedSites(): Promise<Site[]> {
  // 1. メモリキャッシュ
  const cacheKey = 'approved_sites';
  const cached = getCached<Site[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. JSONビルドキャッシュ
  const jsonSites = readBuildCacheFile<Site[]>('sites.json');
  if (jsonSites) {
    setCache(cacheKey, jsonSites);
    return jsonSites;
  }

  // 3. APIフォールバック
  const sites = await fetchWithRetry(async () => {
    const records = await base('Sites').select({
      filterByFormula: '{IsApproved} = TRUE()',
      sort: [{ field: 'DisplayPriority', direction: 'desc' }, { field: 'CreatedAt', direction: 'desc' }]
    }).all();

    return records.map(record => ({
      id: record.id,
      name: record.fields.Name as string,
      slug: record.fields.Slug as string,
      url: record.fields.URL as string,
      description: record.fields.Description as string || '',
      category: record.fields.Category as Category,
      screenshotUrl: record.fields.ScreenshotURL as string,
      isApproved: true,
      status: 'active',
      reviewCount: record.fields.Reviews ? (record.fields.Reviews as string[]).length : 0,
      averageRating: record.fields['Average Rating'] as number,
      displayPriority: (record.fields.DisplayPriority as number) || 50,
      createdAt: record.fields.CreatedAt as string
    }));
  });

  // キャッシュに保存
  setCache(cacheKey, sites);
  return sites;
}

// カテゴリ別サイト取得
export async function getSitesByCategory(category: Category): Promise<Site[]> {
  const records = await base('Sites').select({
    filterByFormula: `AND({IsApproved} = TRUE(), {Category} = '${category}')`,
    sort: [{ field: 'DisplayPriority', direction: 'desc' }, { field: 'CreatedAt', direction: 'desc' }]
  }).all();

  return records.map(record => ({
    id: record.id,
    name: record.fields.Name as string,
    slug: record.fields.Slug as string,
    url: record.fields.URL as string,
    description: record.fields.Description as string || '',
    category: record.fields.Category as Category,
    screenshotUrl: record.fields.ScreenshotURL as string,
    isApproved: true,
    status: 'active',
    reviewCount: record.fields.Reviews ? (record.fields.Reviews as string[]).length : 0,
    averageRating: record.fields['Average Rating'] as number,
    displayPriority: (record.fields.DisplayPriority as number) || 50,
    createdAt: record.fields.CreatedAt as string
  }));
}

// Slug指定でサイト取得
// 優先順位: メモリキャッシュ → JSONビルドキャッシュ → Airtable API
export async function getSiteBySlug(slug: string): Promise<Site | null> {
  // 1. メモリキャッシュ
  const cacheKey = `site_${slug}`;
  const cached = getCached<Site>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. JSONビルドキャッシュ（sites.json から slug で検索）
  const jsonSites = readBuildCacheFile<Site[]>('sites.json');
  if (jsonSites) {
    const found = jsonSites.find(s => s.slug === slug) || null;
    if (found) {
      setCache(cacheKey, found);
      return found;
    }
  }

  // 3. APIフォールバック
  const site = await fetchWithRetry(async () => {
    const records = await base('Sites').select({
      filterByFormula: `{Slug} = '${slug}'`,
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    const screenshotUrl = record.fields.ScreenshotURL as string;
    return {
      id: record.id,
      name: record.fields.Name as string,
      slug: record.fields.Slug as string,
      url: record.fields.URL as string,
      description: record.fields.Description as string || '',
      category: record.fields.Category as Category,
      screenshotUrl,
      screenshot_url: screenshotUrl, // snake_caseエイリアス
      isApproved: record.fields.IsApproved as boolean || false,
      status: record.fields.IsApproved ? 'active' : 'pending',
      reviewCount: record.fields.Reviews ? (record.fields.Reviews as string[]).length : 0,
      averageRating: record.fields['Average Rating'] as number,
      createdAt: record.fields.CreatedAt as string
    } as any; // 型エラー回避のためanyを使用
  });

  if (site) {
    setCache(cacheKey, site);
  }

  return site;
}

// 承認待ちサイト取得
export async function getPendingSites(): Promise<Site[]> {
  const records = await base('Sites').select({
    filterByFormula: '{IsApproved} = FALSE()',
    sort: [{ field: 'CreatedAt', direction: 'desc' }]
  }).all();

  return records.map(record => ({
    id: record.id,
    name: record.fields.Name as string,
    slug: record.fields.Slug as string,
    url: record.fields.URL as string,
    description: record.fields.Description as string || '',
    category: record.fields.Category as Category,
    screenshotUrl: record.fields.ScreenshotURL as string,
    isApproved: false,
    status: 'pending',
    reviewCount: 0,
    createdAt: record.fields.CreatedAt as string
  }));
}

// サイト承認
export async function approveSite(siteId: string): Promise<void> {
  await base('Sites').update(siteId, {
    IsApproved: true
  });
}

// サイト削除
export async function deleteSite(siteId: string): Promise<void> {
  await base('Sites').destroy(siteId);
}

// 口コミ取得（サイト別）
export async function getReviewsBySite(siteId: string): Promise<Review[]> {
  // すべてのレビューを取得してから、JavaScriptでフィルタリング
  const allRecords = await base('Reviews').select({
    sort: [{ field: 'CreatedAt', direction: 'desc' }]
  }).all();

  // JavaScriptでsiteIdでフィルタリング
  const records = allRecords.filter(record => {
    const siteLinkField = record.fields.Site;
    const linkedSiteId = Array.isArray(siteLinkField) ? siteLinkField[0] : siteLinkField;
    return linkedSiteId === siteId;
  });

  return records.map(record => ({
    id: record.id,
    siteId: record.fields.Site ? (record.fields.Site as string[])[0] : '',
    siteName: record.fields['Site Name'] as string,
    username: record.fields.UserName as string,
    rating: record.fields.Rating as number,
    title: record.fields.Title as string,
    content: (record.fields.Content || record.fields.Comment) as string, // Content優先、Comment互換
    status: record.fields.IsApproved ? 'approved' : 'pending',
    createdAt: record.fields.CreatedAt as string,
    created_at: record.fields.CreatedAt as string, // snake_caseエイリアス
    helpfulCount: (record.fields.HelpfulCount as number) || 0,
    helpful_count: (record.fields.HelpfulCount as number) || 0 // snake_caseエイリアス
  }));
}

// 承認済み口コミ取得（サイト別）
// 優先順位: メモリキャッシュ → JSONビルドキャッシュ → Airtable API
export async function getApprovedReviewsBySite(siteId: string): Promise<Review[]> {
  // 1. メモリキャッシュ
  const cacheKey = `reviews_${siteId}`;
  const cached = getCached<Review[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. JSONビルドキャッシュ（reviews.json から siteId で検索）
  const jsonReviews = readBuildCacheFile<Record<string, Review[]>>('reviews.json');
  if (jsonReviews && jsonReviews[siteId]) {
    const reviews = jsonReviews[siteId];
    setCache(cacheKey, reviews);
    return reviews;
  }

  // 3. APIフォールバック
  const reviews = await fetchWithRetry(async () => {
    // すべての承認済みレビューを取得してから、JavaScriptでフィルタリング
    // AirtableのSEARCH()が期待通りに動作しないため
    const allRecords = await base('Reviews').select({
      filterByFormula: 'OR({IsApproved} = TRUE(), {Status} = "承認済み")', // IsApproved優先、Status互換
      sort: [{ field: 'CreatedAt', direction: 'desc' }]
    }).all();

    // JavaScriptでsiteIdでフィルタリング
    const records = allRecords.filter(record => {
      const siteLinkField = record.fields.Site;
      const linkedSiteId = Array.isArray(siteLinkField) ? siteLinkField[0] : siteLinkField;
      return linkedSiteId === siteId;
    });

    return records.map(record => ({
      id: record.id,
      siteId: record.fields.Site ? (record.fields.Site as string[])[0] : '',
      siteName: record.fields['Site Name'] as string,
      username: record.fields.UserName as string,
      rating: record.fields.Rating as number,
      title: record.fields.Title as string,
      content: (record.fields.Content || record.fields.Comment) as string, // Content優先、Comment互換
      status: 'approved' as ReviewStatus,
      createdAt: record.fields.CreatedAt as string,
      created_at: record.fields.CreatedAt as string, // snake_caseエイリアス
      helpfulCount: (record.fields.HelpfulCount as number) || 0,
      helpful_count: (record.fields.HelpfulCount as number) || 0 // snake_caseエイリアス
    }));
  });

  // キャッシュに保存
  setCache(cacheKey, reviews);

  return reviews;
}

// getReviewsBySiteId（getApprovedReviewsBySiteのエイリアス - 互換性のため）
export const getReviewsBySiteId = getApprovedReviewsBySite;

// 全ての承認待ち口コミ取得
export async function getPendingReviews(): Promise<Review[]> {
  const records = await base('Reviews').select({
    filterByFormula: 'AND({IsApproved} = FALSE(), OR({Status} = "", {Status} = BLANK()))', // IsApproved=FALSEかつStatus空白
    sort: [{ field: 'CreatedAt', direction: 'desc' }]
  }).all();

  return records.map(record => ({
    id: record.id,
    siteId: record.fields.Site ? (record.fields.Site as string[])[0] : '',
    siteName: record.fields['Site Name'] as string,
    username: record.fields.UserName as string,
    rating: record.fields.Rating as number,
    title: record.fields.Title as string,
    content: (record.fields.Content || record.fields.Comment) as string, // Content優先、Comment互換
    status: 'pending',
    createdAt: record.fields.CreatedAt as string,
    created_at: record.fields.CreatedAt as string, // snake_caseエイリアス
    helpfulCount: (record.fields.HelpfulCount as number) || 0,
    helpful_count: (record.fields.HelpfulCount as number) || 0 // snake_caseエイリアス
  }));
}

// 口コミ作成
export async function createReview(data: {
  siteId: string;
  username: string;
  rating: number;
  title: string;
  content: string;
}): Promise<Review> {
  const record = await base('Reviews').create({
    Site: [data.siteId],
    Username: data.username,
    Rating: data.rating,
    Title: data.title,
    Content: data.content,
    // IsApprovedフィールドを省略してデフォルト値（未承認）を使用
  });

  return {
    id: record.id,
    siteId: data.siteId,
    username: data.username,
    rating: data.rating,
    title: data.title,
    content: data.content,
    status: 'pending',
    createdAt: record.fields.CreatedAt as string,
    created_at: record.fields.CreatedAt as string // snake_caseエイリアス
  };
}

// submitReview（createReviewのエイリアス - 互換性のため）
export const submitReview = createReview;

// 口コミ承認
export async function approveReview(reviewId: string): Promise<void> {
  await base('Reviews').update(reviewId, {
    IsApproved: true
  });
}

// 口コミをスパムとしてマーク
export async function markReviewAsSpam(reviewId: string): Promise<void> {
  // スパムの場合は承認しない（IsApprovedをfalseのまま）
  // または削除する
  await deleteReview(reviewId);
}

// 口コミ削除
export async function deleteReview(reviewId: string): Promise<void> {
  await base('Reviews').destroy(reviewId);
}

// 統計情報取得
export async function getStats() {
  const sites = await getAllSites();
  const approvedSites = sites.filter(s => s.isApproved);

  const allReviews = await base('Reviews').select({
    filterByFormula: 'OR({IsApproved} = TRUE(), {Status} = "承認済み")' // IsApproved優先、Status互換
  }).all();

  return {
    totalSites: approvedSites.length,
    totalReviews: allReviews.length,
    pendingSites: sites.filter(s => !s.isApproved).length,
    pendingReviews: (await getPendingReviews()).length
  };
}

// カテゴリラベル
export const categoryLabels: Record<Category, string> = {
  nankan: '南関競馬',
  chuo: '中央競馬',
  chihou: '地方競馬'
};

// 統計付きサイト情報取得（トップページ用）
export interface SiteWithStats extends Site {
  review_count: number;
  average_rating: number | null;
  display_priority: number;
  created_at: string; // エイリアス（createdAtと同じ）
  screenshot_url?: string; // エイリアス（screenshotUrlと同じ）
}

export async function getSitesWithStats(): Promise<SiteWithStats[]> {
  // 1. メモリキャッシュ
  const cacheKey = 'sites_with_stats';
  const cached = getCached<SiteWithStats[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. JSONビルドキャッシュ（sites_with_stats.json）
  const jsonData = readBuildCacheFile<SiteWithStats[]>('sites_with_stats.json');
  if (jsonData) {
    setCache(cacheKey, jsonData);
    return jsonData;
  }

  // 3. APIフォールバック
  const sitesWithStats = await fetchWithRetry(async () => {
    const sites = await getApprovedSites();

    // 全ての承認済みレビューを一度に取得（効率化）
    const allReviews = await base('Reviews').select({
      filterByFormula: 'OR({IsApproved} = TRUE(), {Status} = "承認済み")' // IsApproved優先、Status互換
    }).all();

    // サイトIDごとにレビューをグループ化
    const reviewsBySite = new Map<string, number[]>();
    allReviews.forEach(record => {
      const siteIds = record.fields.Site as string[] | undefined;
      if (siteIds && siteIds.length > 0) {
        const siteId = siteIds[0];
        const rating = record.fields.Rating as number;
        if (!reviewsBySite.has(siteId)) {
          reviewsBySite.set(siteId, []);
        }
        reviewsBySite.get(siteId)!.push(rating);
      }
    });

    // 統計情報を計算
    return sites.map((site) => {
      const ratings = reviewsBySite.get(site.id) || [];
      const reviewCount = ratings.length;
      const averageRating = reviewCount > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / reviewCount
        : null;

      return {
        ...site,
        review_count: reviewCount,
        average_rating: averageRating,
        display_priority: site.displayPriority || 50, // Airtableから取得した値を使用
        created_at: site.createdAt, // snake_caseエイリアス
        screenshot_url: site.screenshotUrl // snake_caseエイリアス
      };
    });
  });

  // キャッシュに保存
  setCache(cacheKey, sitesWithStats);

  return sitesWithStats;
}

// 最新の口コミ取得
export async function getLatestReviews(limit: number = 10): Promise<ReviewWithSite[]> {
  const records = await base('Reviews').select({
    filterByFormula: 'OR({IsApproved} = TRUE(), {Status} = "承認済み")', // IsApproved優先、Status互換
    sort: [{ field: 'CreatedAt', direction: 'desc' }],
    maxRecords: limit
  }).all();

  // サイト情報も取得するため、siteIdからSlugを引く
  const reviewsWithSite = await Promise.all(
    records.map(async (record) => {
      const siteId = record.fields.Site ? (record.fields.Site as string[])[0] : '';
      let siteSlug = '';

      // siteIdからSlugを取得
      if (siteId) {
        try {
          const siteRecord = await base('Sites').find(siteId);
          siteSlug = siteRecord.fields.Slug as string || '';
        } catch (error) {
          console.error(`Error fetching site for review ${record.id}:`, error);
        }
      }

      return {
        id: record.id,
        siteId,
        siteName: record.fields['Site Name'] as string,
        siteSlug,
        username: record.fields.UserName as string,
        rating: record.fields.Rating as number,
        title: record.fields.Title as string,
        content: (record.fields.Content || record.fields.Comment) as string, // Content優先、Comment互換
        status: 'approved' as ReviewStatus,
        createdAt: record.fields.CreatedAt as string,
        created_at: record.fields.CreatedAt as string, // snake_caseエイリアス
        helpfulCount: (record.fields.HelpfulCount as number) || 0,
        helpful_count: (record.fields.HelpfulCount as number) || 0 // snake_caseエイリアス
      };
    })
  );

  return reviewsWithSite;
}

/**
 * プリフェッチ関数（ビルド時に全データをキャッシュに保存）
 *
 * この関数を最初に呼ぶことで、以降のAPI呼び出しはすべてキャッシュヒットし、
 * Airtableのレート制限を回避できます。
 *
 * v2 (2026-03-23): 口コミデータとサイト個別データもプリフェッチ対象に追加。
 * これにより各ページ生成時のAPIコール（getSiteBySlug, getReviewsBySiteId）が
 * すべてキャッシュヒットし、1ページあたり5-6秒 → 0秒になる。
 */
export async function prefetchAllData(): Promise<void> {
  console.log('🔄 プリフェッチ開始: 全データをキャッシュに保存します...');

  try {
    // 1. 承認済みサイトを取得（slug別キャッシュも同時に構築）
    const sites = await getApprovedSites();
    console.log('  ✅ 承認済みサイト取得完了');

    // 2. 各サイトを slug 別にキャッシュ（getSiteBySlug のキャッシュを事前構築）
    for (const site of sites) {
      const cacheKey = `site_${site.slug}`;
      if (!getCached(cacheKey)) {
        setCache(cacheKey, site);
      }
    }
    console.log(`  ✅ サイト個別キャッシュ構築完了（${sites.length}件）`);

    // 3. サイト統計を取得
    const sitesWithStats = await getSitesWithStats();
    console.log('  ✅ サイト統計取得完了');

    // 4. 全口コミを一括取得し、サイト別にキャッシュへ分配
    const allReviews = await fetchWithRetry(async () => {
      const allRecords = await base('Reviews').select({
        filterByFormula: 'OR({IsApproved} = TRUE(), {Status} = "承認済み")',
        sort: [{ field: 'CreatedAt', direction: 'desc' }]
      }).all();

      return allRecords.map(record => ({
        raw: record,
        siteId: Array.isArray(record.fields.Site) ? (record.fields.Site as string[])[0] : record.fields.Site as string,
      }));
    });

    // サイトIDごとにグループ化
    const reviewsBySiteId = new Map<string, Review[]>();
    for (const { raw, siteId } of allReviews) {
      if (!siteId) continue;
      if (!reviewsBySiteId.has(siteId)) {
        reviewsBySiteId.set(siteId, []);
      }
      reviewsBySiteId.get(siteId)!.push({
        id: raw.id,
        siteId,
        siteName: raw.fields['Site Name'] as string,
        username: raw.fields.UserName as string,
        rating: raw.fields.Rating as number,
        title: raw.fields.Title as string,
        content: (raw.fields.Content || raw.fields.Comment) as string,
        status: 'approved' as ReviewStatus,
        createdAt: raw.fields.CreatedAt as string,
        created_at: raw.fields.CreatedAt as string,
        helpfulCount: (raw.fields.HelpfulCount as number) || 0,
        helpful_count: (raw.fields.HelpfulCount as number) || 0
      });
    }

    // 各サイトの口コミをキャッシュに保存（getApprovedReviewsBySite のキャッシュを事前構築）
    for (const site of sites) {
      const cacheKey = `reviews_${site.id}`;
      const reviews = reviewsBySiteId.get(site.id) || [];
      setCache(cacheKey, reviews);
    }
    console.log(`  ✅ 口コミ一括キャッシュ完了（${allReviews.length}件 → ${sites.length}サイト分）`);

    // 5. データ整合性チェック（破損検知 → ビルド失敗にする）
    const totalReviewCount = allReviews.length;
    if (sites.length === 0) {
      throw new Error('データ整合性エラー: 承認済みサイトが0件です。Airtable APIの障害またはフィルタ条件の誤りの可能性があります。');
    }
    if (totalReviewCount === 0) {
      throw new Error('データ整合性エラー: 承認済み口コミが0件です。Airtable APIの障害またはフィルタ条件の誤りの可能性があります。');
    }
    if (sitesWithStats.length === 0) {
      throw new Error('データ整合性エラー: サイト統計が0件です。');
    }
    console.log('  ✅ データ整合性チェック通過');

    // 6. JSONビルドキャッシュに書き出し（SSR runtime でもAPIゼロで動作するため）
    const reviewsObj: Record<string, Review[]> = {};
    for (const [siteId, reviews] of reviewsBySiteId) {
      reviewsObj[siteId] = reviews;
    }

    writeBuildCacheFile('sites.json', sites);
    writeBuildCacheFile('sites_with_stats.json', sitesWithStats);
    writeBuildCacheFile('reviews.json', reviewsObj);

    // 7. ビルドログ（サイズ・件数を明示出力）
    const cacheDir = getBuildCacheDir();
    if (cacheDir) {
      const sizeSites = fs.statSync(path.join(cacheDir, 'sites.json')).size;
      const sizeStats = fs.statSync(path.join(cacheDir, 'sites_with_stats.json')).size;
      const sizeReviews = fs.statSync(path.join(cacheDir, 'reviews.json')).size;

      console.log('  ✅ JSONビルドキャッシュ書き出し完了');
      console.log('  ┌─────────────────────────────────');
      console.log('  │ [BUILD CACHE]');
      console.log(`  │   sites:   ${sites.length} (${formatBytes(sizeSites)})`);
      console.log(`  │   stats:   ${sitesWithStats.length} (${formatBytes(sizeStats)})`);
      console.log(`  │   reviews: ${totalReviewCount} (${formatBytes(sizeReviews)})`);
      console.log(`  │   dir:     ${cacheDir}`);
      console.log('  └─────────────────────────────────');
    }

    console.log('✅ プリフェッチ完了');
  } catch (error) {
    console.error('❌ プリフェッチエラー:', error);
    throw error;
  }
}

/**
 * ランキングスコアを計算してソート
 *
 * すべてのランキング表示で統一的に使用する共通関数
 *
 * 計算ロジック:
 * - 口コミ3件以上: 平均評価 × log10(口コミ数 + 1) × 100
 * - 口コミ1-2件: 平均評価 × 口コミ数 × 10（参考順位）
 * - 口コミ0件: スコア = 0（最下位）
 *
 * @param sites - ソート対象のサイト配列
 * @returns ランキングスコア順にソートされたサイト配列
 */
export function sortByRankingScore<T extends { review_count?: number; average_rating?: number; created_at?: string }>(
  sites: T[]
): (T & { rankingScore: number; reviewCount: number })[] {
  return sites
    .map(site => {
      const reviewCount = site.review_count || 0;
      const avgRating = site.average_rating || 0;

      // 口コミ数による重み付け
      let rankingScore = 0;

      if (reviewCount >= 3) {
        // 口コミ3件以上: 正式ランキング
        // スコア = 平均評価 × 口コミ数の対数 × 100
        rankingScore = avgRating * Math.log10(reviewCount + 1) * 100;
      } else if (reviewCount > 0) {
        // 口コミ1-2件: 参考順位（スコアを大幅に下げる）
        rankingScore = avgRating * reviewCount * 10;
      }
      // 口コミ0件: スコア = 0（最下位）

      return {
        ...site,
        rankingScore,
        reviewCount
      };
    })
    .sort((a, b) => {
      // ランキングスコア降順
      const scoreDiff = b.rankingScore - a.rankingScore;
      if (scoreDiff !== 0) return scoreDiff;

      // スコアが同じ場合、口コミ数が多い方を優先
      const reviewDiff = b.reviewCount - a.reviewCount;
      if (reviewDiff !== 0) return reviewDiff;

      // それでも同じ場合、作成日時が新しい方を優先
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return 0;
    });
}
