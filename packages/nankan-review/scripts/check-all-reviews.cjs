const Airtable = require('airtable');
require('dotenv').config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

console.log('🔍 Reviewsテーブルの全フィールド確認中...\n');

base('Reviews')
  .select({
    maxRecords: 5
  })
  .firstPage((err, records) => {
    if (err) {
      console.error('❌ エラー:', err);
      return;
    }

    console.log(`📊 サンプル: ${records.length}件\n`);

    records.forEach((record, index) => {
      console.log(`\n--- レコード ${index + 1} ---`);
      console.log('全フィールド:', JSON.stringify(record.fields, null, 2));
    });
  });
