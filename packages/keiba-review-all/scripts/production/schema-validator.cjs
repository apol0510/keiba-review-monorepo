/**
 * Airtableスキーマバリデーター
 *
 * 必須フィールドとSelect Options の存在チェック
 *
 * v2 変更点:
 * - Airtable Metadata API を使用してフィールド定義を直接取得
 * - record.fields のキー有無に依存せず、テーブル定義として存在するかを検証
 * - Description や IsApproved のような疎なフィールドでも誤検知しない
 *
 * 注: このスクリプトは GitHub Actions で実行されることを想定
 *     環境変数は workflow の env: で設定される
 */

const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

/**
 * 必須フィールド定義
 *
 * 注: Description や IsApproved は空のレコードが多いが、
 *     Metadata API でテーブル定義を確認するため誤検知しない
 */
const REQUIRED_FIELDS = {
  Sites: [
    'Name',
    'URL',
    'Slug',
    'Category',
    'SiteQuality',
    // 'Description',   // オプショナル: テーブル定義には存在するが全レコードに値があるわけではない
                        // コード内で || '' フォールバック処理済み、UI表示も条件付き
    'IsApproved',       // Airtable実体に存在（56%のレコードに値、コードで頻繁に使用）
    'CreatedAt',
    'DisplayPriority'
  ],
  Reviews: [
    'UserName',
    'Rating',
    'Title',
    'Content',
    'CreatedAt',
    'IsApproved',
    'Site',
    'UserEmail'
  ]
};

/**
 * 必須Select Options定義
 */
const REQUIRED_SELECT_OPTIONS = {
  Sites: {
    Category: ['nankan', 'chuo', 'chihou', 'other'],
    SiteQuality: ['premium', 'excellent', 'normal', 'poor', 'malicious']
  }
  // Reviews.IsApproved は boolean なので Select Options 検証不要
};

/**
 * Airtable Metadata API でテーブルのフィールド定義を取得
 *
 * @param {string} tableName - テーブル名
 * @returns {Promise<Set<string>>} - フィールド名の Set
 */
async function getTableFieldsFromMetadata(tableName) {
  const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

  const response = await fetch(metadataUrl, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Metadata API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const table = data.tables.find(t => t.name === tableName);

  if (!table) {
    throw new Error(`テーブル "${tableName}" が見つかりません`);
  }

  // フィールド名の Set を返す
  return new Set(table.fields.map(f => f.name));
}

/**
 * フィールドの存在チェック（Metadata API 使用）
 *
 * record.fields のキー有無ではなく、テーブル定義として存在するかを検証
 * これにより、Description や IsApproved のような疎なフィールドでも誤検知しない
 */
async function validateFields(tableName, requiredFields) {
  const errors = [];

  try {
    // Metadata API でフィールド定義を取得
    const tableFields = await getTableFieldsFromMetadata(tableName);

    console.log(`  📋 ${tableName}: ${tableFields.size} フィールドが定義されています`);

    for (const requiredField of requiredFields) {
      if (!tableFields.has(requiredField)) {
        errors.push(`  ❌ ${tableName}: フィールド "${requiredField}" が見つかりません`);
      }
    }

    if (errors.length === 0) {
      console.log(`  ✅ ${tableName}: 全ての必須フィールドが存在します`);
    }
  } catch (error) {
    errors.push(`  ❌ ${tableName}: Metadata API エラー (${error.message})`);
  }

  return errors;
}

/**
 * Select Optionsのチェック（警告のみ）
 *
 * データに選択肢が使用されているかをチェック
 * フィールド定義の存在確認は validateFields で実施済み
 */
async function validateSelectOptions(tableName, fieldOptions) {
  const warnings = [];

  try {
    const records = await base(tableName).select().all();

    for (const [fieldName, requiredOptions] of Object.entries(fieldOptions)) {
      const foundOptions = new Set();

      for (const record of records) {
        const value = record.fields[fieldName];
        if (value) foundOptions.add(value);
      }

      for (const requiredOption of requiredOptions) {
        if (!foundOptions.has(requiredOption)) {
          warnings.push(`  ⚠️  ${tableName}.${fieldName}: 選択肢 "${requiredOption}" がデータに存在しません`);
        }
      }

      if (warnings.length === 0) {
        console.log(`  ✅ ${tableName}.${fieldName}: 全ての選択肢が存在します`);
      }
    }
  } catch (error) {
    warnings.push(`  ⚠️  ${tableName}: Select Optionsの検証に失敗 (${error.message})`);
  }

  return warnings;
}

/**
 * メイン処理
 */
(async () => {
  console.log('🔍 Airtableスキーマバリデーション開始\n');
  console.log('検証方式: Metadata API（フィールド定義を直接取得）\n');

  const errors = [];
  const warnings = [];

  // フィールド検証（エラー）
  console.log('📋 フィールド検証:');
  for (const [tableName, fields] of Object.entries(REQUIRED_FIELDS)) {
    const fieldErrors = await validateFields(tableName, fields);
    errors.push(...fieldErrors);
  }
  console.log('');

  // Select Options検証（警告）
  console.log('🔘 Select Options検証:');
  for (const [tableName, fieldOptions] of Object.entries(REQUIRED_SELECT_OPTIONS)) {
    const selectWarnings = await validateSelectOptions(tableName, fieldOptions);
    warnings.push(...selectWarnings);
  }
  console.log('');

  // 結果サマリー
  if (errors.length > 0) {
    console.log('❌ エラー:');
    errors.forEach(error => console.log(error));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告（データに選択肢が存在しない）:');
    warnings.forEach(warning => console.log(warning));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ スキーマバリデーション失敗\n');
    process.exit(1); // エラーがある場合のみ失敗
  } else if (warnings.length > 0) {
    console.log('⚠️  スキーマバリデーション完了（警告あり）\n');
    process.exit(0); // 警告のみなら成功
  } else {
    console.log('✅ スキーマバリデーション完了: 問題なし\n');
    process.exit(0);
  }
})();
