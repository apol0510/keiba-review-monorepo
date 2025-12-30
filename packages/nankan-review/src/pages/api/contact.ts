import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, subject, message, site } = data;

    // バリデーション
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: '必須項目が入力されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'メールアドレスの形式が正しくありません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SendGridでメール送信（環境変数が設定されている場合）
    const sendgridApiKey = import.meta.env.SENDGRID_API_KEY;
    const adminEmail = import.meta.env.ADMIN_EMAIL;

    if (sendgridApiKey && adminEmail) {
      const subjectMap: Record<string, string> = {
        site_request: '南関予想サイトの掲載リクエスト',
        review_report: '口コミに関する報告・削除依頼',
        bug_report: '不具合・エラーの報告',
        partnership: '広告・提携に関するお問い合わせ',
        other: 'その他のお問い合わせ',
      };

      const emailContent = `
【南関競馬予想サイト口コミ - お問い合わせ】

お名前: ${name}
メールアドレス: ${email}
お問い合わせ種別: ${subjectMap[subject] || subject}
サイト: ${site || 'nankan-review'}

【お問い合わせ内容】
${message}

---
このメールは南関競馬予想サイト口コミ（nankan.keiba-review.jp）から送信されました。
      `.trim();

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: adminEmail }] }],
          from: { email: adminEmail, name: '南関競馬予想サイト口コミ' },
          reply_to: { email, name },
          subject: `【南関口コミ】${subjectMap[subject] || subject} - ${name}様`,
          content: [{ type: 'text/plain', value: emailContent }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[nankan-review] SendGrid error:', errorText);
        return new Response(JSON.stringify({ error: 'メール送信に失敗しました' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('[nankan-review] Contact email sent:', { name, email, subject });
    } else {
      // SendGridが設定されていない場合はログに出力（開発環境用）
      console.log('[nankan-review] Contact form submission (no SendGrid):', {
        name,
        email,
        subject,
        message,
        site: site || 'nankan-review',
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[nankan-review] Contact API error:', error);
    return new Response(
      JSON.stringify({
        error: 'サーバーエラーが発生しました。時間をおいて再度お試しください。',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
