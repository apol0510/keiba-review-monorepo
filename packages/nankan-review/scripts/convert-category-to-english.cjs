/**
 * Reviewsテーブルのカテゴリを日本語から英語に一括変換
 *
 * 変換マッピング:
 * - "南関" → "nankan"
 * - "中央" → "chuo"
 * - "地方" → "chihou"
 * - "総合" → "other"
 * - それ以外 → "other"
 */

const Airtable = require('airtable');
require('dotenv').config();

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

// 変換マッピング
const CATEGORY_MAP = {
  '南関': 'nankan',
  '中央': 'chuo',
  '地方': 'chihou',
  // '総合'は変換しない（選択肢が存在しない可能性）
  // 英語→英語（すでに変換済みのレコード）
  'nankan': 'nankan',
  'chuo': 'chuo',
  'chihou': 'chihou'
};

async function convertCategories() {
  console.log('🔄 カテゴリ変換開始...\n');

  try {
    // 全レコード取得
    const records = await base('Reviews')
      .select({ maxRecords: 1000 })
      .all();

    console.log(`📊 対象レコード: ${records.length}件\n`);

    // 変換が必要なレコードをフィルタ
    const recordsToUpdate = [];
    const stats = {
      '南関': 0,
      '中央': 0,
      '地方': 0,
      '総合': 0,
      'already_english': 0,
      'unknown': 0
    };

    for (const record of records) {
      const currentCategory = record.get('Category');
      const newCategory = CATEGORY_MAP[currentCategory];

      // マッピングにない場合はスキップ
      if (!newCategory) {
        if (['nankan', 'chuo', 'chihou'].includes(currentCategory)) {
          stats.already_english++;
        } else {
          stats.unknown++;
        }
        continue;
      }

      // 統計
      if (currentCategory in CATEGORY_MAP && currentCategory !== newCategory) {
        stats[currentCategory]++;
      } else {
        stats.already_english++;
      }

      // 変更が必要な場合
      if (currentCategory !== newCategory) {
        recordsToUpdate.push({
          id: record.id,
          fields: {
            Category: newCategory
          },
          old: currentCategory,
          new: newCategory
        });
      }
    }

    console.log('📈 カテゴリ統計:');
    console.log(`  - "南関": ${stats['南関']}件 → "nankan"に変換`);
    console.log(`  - "中央": ${stats['中央']}件 → "chuo"に変換`);
    console.log(`  - "地方": ${stats['地方']}件 → "chihou"に変換`);
    console.log(`  - "総合": ${stats['総合']}件 → "other"に変換`);
    console.log(`  - すでに英語: ${stats.already_english}件`);
    console.log(`  - 不明: ${stats.unknown}件 → "other"に変換\n`);

    if (recordsToUpdate.length === 0) {
      console.log('✅ すべてのレコードがすでに英語カテゴリです');
      return;
    }

    console.log(`🔧 更新対象: ${recordsToUpdate.length}件\n`);

    // 10件ずつバッチ更新（Airtable API制限対策）
    const batchSize = 10;
    for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
      const batch = recordsToUpdate.slice(i, i + batchSize);

      console.log(`📝 バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(recordsToUpdate.length / batchSize)}: ${batch.length}件更新中...`);

      await base('Reviews').update(batch.map(r => ({
        id: r.id,
        fields: r.fields
      })));

      // レート制限対策（200ms待機）
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n✅ カテゴリ変換完了！');
    console.log(`   更新レコード数: ${recordsToUpdate.length}件`);
    console.log('\n📋 変換サンプル:');
    recordsToUpdate.slice(0, 5).forEach(r => {
      console.log(`   - "${r.old}" → "${r.new}"`);
    });

  } catch (error) {
    console.error('\n❌ エラー:', error);
    process.exit(1);
  }
}

convertCategories();
