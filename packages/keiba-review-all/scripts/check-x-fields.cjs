/**
 * X投稿用フィールドチェックスクリプト
 */

require('dotenv').config({ path: '.env' });
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ エラー: AIRTABLE_API_KEY と AIRTABLE_BASE_ID を設定してください');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function main() {
  console.log('🔍 keiba-review-all Reviewsテーブルのフィールドを確認中...\n');

  try {
    const records = await base('Reviews').select({ maxRecords: 1 }).firstPage();

    if (records.length === 0) {
      console.log('⚠️ レコードが見つかりません');
      return;
    }

    const fields = Object.keys(records[0].fields);
    console.log('📊 Reviewsテーブルのフィールド一覧:');
    fields.forEach(field => console.log('  -', field));

    console.log('\n🔍 X投稿関連フィールドの確認:');
    const requiredFields = {
      'TweetID': fields.includes('TweetID'),
      'TweetedAt': fields.includes('TweetedAt'),
      'SiteSlug': fields.includes('SiteSlug'),
      'Status': fields.includes('Status'),
      'SiteName': fields.includes('SiteName'),
      'Rating': fields.includes('Rating'),
      'Comment': fields.includes('Comment'),
      'Category': fields.includes('Category')
    };

    for (const [fieldName, exists] of Object.entries(requiredFields)) {
      console.log(`  ${fieldName}: ${exists ? '✅ 存在' : '❌ 未作成'}`);
    }

    // 未作成のフィールドがあれば警告
    const missingFields = Object.entries(requiredFields)
      .filter(([_, exists]) => !exists)
      .map(([fieldName, _]) => fieldName);

    if (missingFields.length > 0) {
      console.log('\n⚠️ 以下のフィールドを作成する必要があります:');
      missingFields.forEach(field => {
        console.log(`  - ${field}`);
        if (field === 'TweetID') {
          console.log('    タイプ: Single line text');
        } else if (field === 'TweetedAt') {
          console.log('    タイプ: Date');
        } else if (field === 'SiteSlug') {
          console.log('    タイプ: Single line text');
        }
      });
    } else {
      console.log('\n✅ 全てのフィールドが揃っています！');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

main();
