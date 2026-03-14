/**
 * GitHub Actions で使用される AIRTABLE_BASE_ID を確認するスクリプト
 *
 * 使用方法:
 * 1. GitHub Actions workflow に一時的に追加
 * 2. 実行後、ログからBASE_IDを確認
 * 3. 確認後、このステップを削除
 */

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('=== Airtable接続情報確認 ===\n');
console.log(`AIRTABLE_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : '未設定'}`);
console.log(`AIRTABLE_BASE_ID: ${baseId || '未設定'}`);
console.log('');

if (!apiKey || !baseId) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

// Metadata API で実際のベース名とテーブル一覧を取得
async function checkBase() {
  try {
    const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

    const response = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`❌ Metadata API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      process.exit(1);
    }

    const data = await response.json();

    console.log(`✅ ベースに接続成功`);
    console.log(`テーブル数: ${data.tables.length}`);
    console.log('');

    data.tables.forEach(table => {
      console.log(`📋 ${table.name} (${table.fields.length} フィールド)`);

      if (table.name === 'Sites') {
        console.log('  Sites テーブルのフィールド一覧:');
        table.fields.forEach(field => {
          const hasDescription = field.name === 'Description';
          const marker = hasDescription ? ' ⭐' : '';
          console.log(`    - ${field.name} (${field.type})${marker}`);
        });
      }
    });

  } catch (error) {
    console.error(`❌ エラー: ${error.message}`);
    process.exit(1);
  }
}

checkBase();
