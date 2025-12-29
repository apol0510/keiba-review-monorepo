# Review Engine

口コミ自動投稿エンジン

## 概要

534件の口コミテンプレートを使用して、サイト品質に応じた自動口コミ投稿を実現します。

## テンプレート構成

| ファイル | 件数 | 用途 | 対象サイト品質 |
|---------|------|------|--------------|
| ⭐1（辛口／クレーム寄り）.txt | 70件 | 辛口・クレーム | malicious |
| ⭐2（少し辛口寄り）.txt | 130件 | やや辛口 | poor, malicious |
| ⭐3（ニュートラル）.txt | 70件 | 中立的評価 | normal, poor |
| ⭐3（ややポジティブ）.txt | 90件 | 期待値やや下回る | premium, excellent |
| ⭐4（少しポジティブ寄り）.txt | 74件 | ポジティブ | normal, excellent |
| ⭐5（premium専用・高評価）.txt | 100件 | 最高評価 | premium, excellent |
| **合計** | **534件** | - | - |

## サイト品質別の評価分布

### 🌟 premium（南関アナリティクス専用）
- 評価範囲: ⭐3-5
- 投稿頻度: 毎日100%
- 重み付け: ⭐3(20%), ⭐4(60%), ⭐5(20%)
- 平均評価: 4.0
- 口コミ上限: 100件

### ✅ excellent（優良サイト）
- 評価範囲: ⭐3-5
- 投稿頻度: 毎日100%
- 重み付け: ⭐3(15%), ⭐4(60%), ⭐5(25%)
- 平均評価: 4.1
- 口コミ上限: 80件
- 備考: ⭐3は「ややポジティブ」版を使用

### ⚪ normal（通常サイト）
- 評価範囲: ⭐2-4
- 投稿頻度: 2-3日に1回（40%）
- 平均評価: 約3.0
- 口コミ上限: 30件

### ⚠️ poor（低品質サイト）
- 評価範囲: ⭐1-3
- 投稿頻度: 3-4日に1回（30%）
- 平均評価: 約2.0
- 口コミ上限: 40件

### ❌ malicious（悪質サイト）
- 評価範囲: ⭐1-2
- 投稿頻度: 5日に1回（20%）
- 平均評価: 約1.5
- 口コミ上限: 50件

## 使い方

### テンプレートの読み込み

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

// テンプレート読み込み関数
function loadTemplate(rating: number, type: 'neutral' | 'positive' = 'neutral'): string[] {
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

// ランダムにテンプレートを選択
function getRandomTemplate(rating: number, type?: 'neutral' | 'positive'): string {
  const templates = loadTemplate(rating, type);
  return templates[Math.floor(Math.random() * templates.length)];
}
```

### サイト品質別の評価選択

```typescript
import { SiteQuality } from '@keiba-review/shared/types';

function selectRating(siteQuality: SiteQuality): { rating: number; type?: 'neutral' | 'positive' } {
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
```

## テンプレート形式

各テンプレートファイルは以下の形式で保存されています：

```
タイトル1
本文1
---
タイトル2
本文2
---
...
```

- 各テンプレートは `---` で区切られています
- 1行目がタイトル、2行目以降が本文です
- 本文は20〜500文字の範囲で記述されています

## 注意事項

### NGワード

以下のワードは自動投稿時にフィルタリングされます：

- サポート、対応が遅い、返信がない
- 詐欺、騙された、悪質
- 最悪、ひどい、金返せ

### カテゴリ別禁止ワード

各カテゴリに不適切なワードもフィルタリングされます：

- **中央競馬**: 南関、地方競馬関連のワード
- **南関競馬**: G1、有馬記念などの中央競馬重賞
- **地方競馬**: JRA、G1、南関関連のワード

## ライセンス

All templates are proprietary content for keiba-review projects.
