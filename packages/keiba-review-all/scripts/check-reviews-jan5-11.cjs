const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

(async () => {
  const records = await base('Reviews').select({
    filterByFormula: 'AND(IS_AFTER({CreatedAt}, "2026-01-04T15:00:00.000Z"), IS_BEFORE({CreatedAt}, "2026-01-12T15:00:00.000Z"))',
    fields: ['CreatedAt', 'SiteName', 'Rating']
  }).all();

  console.log(`📊 1/5-1/11の口コミ件数: ${records.length}件\n`);

  // 日別に集計
  const byDate = {};
  records.forEach(r => {
    const date = r.fields.CreatedAt?.substring(0, 10) || 'unknown';
    byDate[date] = (byDate[date] || 0) + 1;
  });

  console.log('📅 日別内訳:');
  const sortedDates = Object.keys(byDate).sort();
  sortedDates.forEach(date => {
    console.log(`  ${date}: ${byDate[date]}件`);
  });

  // 1/5-1/11の期待値チェック
  const expectedDates = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11'];
  const missingDates = expectedDates.filter(d => !byDate[d]);

  if (missingDates.length > 0) {
    console.log(`\n⚠️  口コミが0件の日: ${missingDates.join(', ')}`);
  } else {
    console.log(`\n✅ 全日に口コミがあります`);
  }
})().catch(error => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
