/**
 * Netlifyサイト一覧取得スクリプト
 */

const https = require('https');

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL;

if (!NETLIFY_TOKEN) {
  console.error('❌ エラー: NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL が設定されていません');
  process.exit(1);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Netlifyサイト一覧を取得中...\n');

  try {
    const sites = await makeRequest('https://api.netlify.com/api/v1/sites');

    console.log(`📊 合計 ${sites.length} サイト\n`);

    sites.forEach((site, idx) => {
      console.log(`【サイト ${idx + 1}】`);
      console.log(`  名前: ${site.name}`);
      console.log(`  ID: ${site.id}`);
      console.log(`  URL: ${site.url}`);
      console.log(`  カスタムドメイン: ${site.custom_domain || 'なし'}`);
      console.log(`  作成日: ${site.created_at}`);
      console.log(`  更新日: ${site.updated_at}`);
      console.log(`  ステータス: ${site.state}`);

      // frabjous-taiyaki-460401 かどうか確認
      if (site.name === 'frabjous-taiyaki-460401' || site.id.includes('frabjous')) {
        console.log(`  ⚠️ これは古いkeiba-reviewサイトの可能性があります`);
      }

      console.log();
    });

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
