const Airtable = require('airtable');
require('dotenv').config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

console.log('🔍 Reviewsテーブルのステータス値を確認中...\n');

base('Reviews')
  .select({
    maxRecords: 200,
    fields: ['SiteName', 'Category', 'Rating', 'Status']
  })
  .firstPage((err, records) => {
    if (err) {
      console.error('❌ エラー:', err);
      return;
    }

    console.log(`📊 口コミ総数: ${records.length}件\n`);

    // ステータス値の種類を確認
    const statusValues = new Set();
    records.forEach(r => {
      const status = r.get('Status');
      if (status) statusValues.add(status);
    });

    console.log('📈 ステータスの種類:');
    Array.from(statusValues).forEach(s => {
      const count = records.filter(r => r.get('Status') === s).length;
      console.log(`  - "${s}": ${count}件`);
    });

    console.log('');

    // nankanカテゴリの詳細
    const nankanReviews = records.filter(r => r.get('Category') === 'nankan');
    console.log(`🌃 nankanカテゴリ: ${nankanReviews.length}件`);

    if (nankanReviews.length > 0) {
      const nankanByStatus = {};
      nankanReviews.forEach(r => {
        const status = r.get('Status') || '(未設定)';
        nankanByStatus[status] = (nankanByStatus[status] || 0) + 1;
      });

      console.log('   ステータス別:');
      Object.entries(nankanByStatus).forEach(([s, c]) => {
        console.log(`     - "${s}": ${c}件`);
      });

      console.log('\n   サンプル:');
      nankanReviews.slice(0, 5).forEach(r => {
        console.log(`     - ${r.get('SiteName')}: ⭐${r.get('Rating')} [Status: "${r.get('Status')}"]`);
      });
    }
  });
