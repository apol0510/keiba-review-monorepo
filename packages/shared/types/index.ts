/**
 * 共通型定義
 *
 * Monorepo全体で使用される型定義
 */

// カテゴリ
export type Category = 'nankan' | 'chuo' | 'chihou';

// サイトステータス
export type SiteStatus = 'active' | 'pending' | 'rejected';

// 口コミステータス
export type ReviewStatus = 'approved' | 'pending' | 'spam';

// サイト品質（5段階）
export type SiteQuality = 'premium' | 'excellent' | 'normal' | 'poor' | 'malicious';

// サイト情報
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
  siteQuality?: SiteQuality;
}

// 口コミ情報
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
  created_at?: string;
  helpfulCount?: number;
  helpful_count?: number;
}

// 口コミ（サイト情報付き）
export interface ReviewWithSite extends Review {
  siteSlug: string;
}

// 統計付きサイト情報
export interface SiteWithStats extends Site {
  review_count: number;
  average_rating: number | null;
  display_priority: number;
  created_at: string;
  screenshot_url?: string;
}

// カテゴリラベルマップ
export const categoryLabels: Record<Category, string> = {
  nankan: '南関競馬',
  chuo: '中央競馬',
  chihou: '地方競馬'
};

// サイト品質ラベルマップ
export const siteQualityLabels: Record<SiteQuality, string> = {
  premium: '🌟 最高品質',
  excellent: '✅ 優良サイト',
  normal: '⚪ 通常サイト',
  poor: '⚠️ 低品質サイト',
  malicious: '❌ 悪質サイト'
};

// 投稿確率設定
export const POSTING_FREQUENCY: Record<SiteQuality, number> = {
  premium: 1.0,      // 100% (毎日)
  excellent: 1.0,    // 100% (毎日)
  normal: 0.4,       // 40% (2-3日に1回)
  poor: 0.3,         // 30% (3-4日に1回)
  malicious: 0.2     // 20% (5日に1回)
};

// サイトタイプ別の口コミ上限
export const MAX_REVIEWS_PER_SITE: Record<SiteQuality, number> = {
  premium: 100,      // 最大100件
  excellent: 80,     // 最大80件
  normal: 30,        // 最大30件
  poor: 40,          // 最大40件
  malicious: 50      // 最大50件
};
