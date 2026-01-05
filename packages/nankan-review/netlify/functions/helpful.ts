import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Airtable from 'airtable';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONSリクエスト（preflight）への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POSTメソッドのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // リクエストボディをパース
    const { reviewId } = JSON.parse(event.body || '{}');

    if (!reviewId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'reviewId is required' }),
      };
    }

    // Airtable設定
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      console.error('Airtable credentials not found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const base = new Airtable({ apiKey }).base(baseId);

    // レコードを取得
    const record = await base('Reviews').find(reviewId);

    if (!record) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Review not found' }),
      };
    }

    // HelpfulCountを取得（存在しない場合は0）
    const currentCount = (record.fields.HelpfulCount as number) || 0;
    const newCount = currentCount + 1;

    // HelpfulCountを更新
    await base('Reviews').update(reviewId, {
      HelpfulCount: newCount,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: newCount
      }),
    };
  } catch (error) {
    console.error('Error updating helpful count:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update helpful count',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
