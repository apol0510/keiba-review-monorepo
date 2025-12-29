/**
 * Review Engine - 口コミ自動投稿エンジン
 *
 * 534件のテンプレートを使用してサイト品質別の口コミを生成
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { SiteQuality } from '../types';

/**
 * テンプレート読み込み関数
 */
export function loadTemplate(rating: number, type: 'neutral' | 'positive' = 'neutral'): string[] {
  const templateDir = join(__dirname, 'templates');
  let filename: string;

  switch(rating) {
    case 1:
      filename = '⭐1（辛口／クレーム寄り）.txt';
      break;
    case 2:
      filename = '⭐2（少し辛口寄り）.txt';
      break;
    case 3:
      filename = type === 'positive'
        ? '⭐3（ややポジティブ）.txt'
        : '⭐3（ニュートラル）.txt';
      break;
    case 4:
      filename = '⭐4（少しポジティブ寄り）.txt';
      break;
    case 5:
      filename = '⭐5（premium専用・高評価）.txt';
      break;
    default:
      throw new Error(`Invalid rating: ${rating}`);
  }

  const content = readFileSync(join(templateDir, filename), 'utf-8');
  return content.split('\n---\n').filter(t => t.trim());
}

/**
 * ランダムにテンプレートを選択
 */
export function getRandomTemplate(rating: number, type?: 'neutral' | 'positive'): string {
  const templates = loadTemplate(rating, type);
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * サイト品質別の評価選択
 */
export function selectRating(siteQuality: SiteQuality): { rating: number; type?: 'neutral' | 'positive' } {
  const rand = Math.random();

  switch(siteQuality) {
    case 'premium':
      // ⭐3:20%, ⭐4:60%, ⭐5:20%
      if (rand < 0.20) return { rating: 3, type: 'positive' };
      if (rand < 0.80) return { rating: 4 };
      return { rating: 5 };

    case 'excellent':
      // ⭐3:15%, ⭐4:60%, ⭐5:25%
      if (rand < 0.15) return { rating: 3, type: 'positive' };
      if (rand < 0.75) return { rating: 4 };
      return { rating: 5 };

    case 'normal':
      // ⭐2:30%, ⭐3:40%, ⭐4:30%
      if (rand < 0.30) return { rating: 2 };
      if (rand < 0.70) return { rating: 3, type: 'neutral' };
      return { rating: 4 };

    case 'poor':
      // ⭐1:30%, ⭐2:40%, ⭐3:30%
      if (rand < 0.30) return { rating: 1 };
      if (rand < 0.70) return { rating: 2 };
      return { rating: 3, type: 'neutral' };

    case 'malicious':
      // ⭐1:60%, ⭐2:40%
      if (rand < 0.60) return { rating: 1 };
      return { rating: 2 };

    default:
      throw new Error(`Unknown site quality: ${siteQuality}`);
  }
}

/**
 * 口コミ生成（サイト品質に基づいて）
 */
export function generateReview(siteQuality: SiteQuality): { rating: number; template: string } {
  const { rating, type } = selectRating(siteQuality);
  const template = getRandomTemplate(rating, type);

  // テンプレートをタイトルと本文に分割
  const lines = template.split('\n');
  const title = lines[0];
  const content = lines.slice(1).join('\n').trim();

  return {
    rating,
    template: `${title}\n${content}`
  };
}

/**
 * 投稿すべきか判定（確率ベース）
 */
export function shouldPost(siteQuality: SiteQuality): boolean {
  const frequencies: Record<SiteQuality, number> = {
    premium: 1.0,      // 100% (毎日)
    excellent: 1.0,    // 100% (毎日)
    normal: 0.4,       // 40% (2-3日に1回)
    poor: 0.3,         // 30% (3-4日に1回)
    malicious: 0.2     // 20% (5日に1回)
  };

  return Math.random() < frequencies[siteQuality];
}

/**
 * 口コミ上限チェック
 */
export function isUnderReviewLimit(currentReviewCount: number, siteQuality: SiteQuality): boolean {
  const limits: Record<SiteQuality, number> = {
    premium: 100,
    excellent: 80,
    normal: 30,
    poor: 40,
    malicious: 50
  };

  return currentReviewCount < limits[siteQuality];
}
