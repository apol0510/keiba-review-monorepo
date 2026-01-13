#!/usr/bin/env node

/**
 * Bluesky自動投稿スクリプト
 *
 * 競馬予想サイト口コミプラットフォーム（keiba-review Monorepo）の統合プロモーション投稿を
 * Blueskyに自動投稿します。
 *
 * 対象サイト:
 *   - keiba-review.jp（総合口コミサイト）
 *   - nankan.keiba-review.jp（南関特化）
 *   - 将来: chuo-keiba-review（中央特化）、chihou-keiba-review（地方特化）など
 *
 * 使用方法:
 *   node scripts/post-to-bluesky.js
 *
 * 環境変数:
 *   BLUESKY_IDENTIFIER - Blueskyハンドル（例: keiba-review.bsky.social）
 *   BLUESKY_PASSWORD   - Blueskyパスワード
 */

import { BskyAgent } from '@atproto/api'

// 環境変数チェック
const { BLUESKY_IDENTIFIER, BLUESKY_PASSWORD } = process.env

if (!BLUESKY_IDENTIFIER || !BLUESKY_PASSWORD) {
  console.error('❌ エラー: BLUESKY_IDENTIFIER と BLUESKY_PASSWORD を設定してください')
  process.exit(1)
}

// 投稿テンプレート（UTMパラメータ付き）
// 全サイト対応: keiba-review.jp（総合）+ nankan.keiba-review.jp（南関特化）
const POST_TEMPLATES = [
  // === 総合プラットフォーム紹介 ===

  // 1. keiba-review総合紹介
  `【競馬予想サイト口コミ】keiba-reviewで優良サイトを探そう！

✅ 中央・地方・南関全対応
✅ リアルな口コミ多数
✅ カテゴリ別ランキング
✅ AI予想も比較

https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 2. 全カテゴリ横断訴求
  `【全カテゴリ対応】あなたに最適な競馬予想サイトは？

🏇 中央競馬（JRA）
🌃 地方競馬
🤖 AI予想
💰 無料予想

全て比較できます👇
https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 3. nankan-analytics導線（メインゴール）
  `【AI競馬予想】南関アナリティクスの口コミをチェック！

⭐ 高評価多数
⭐ 大井・川崎・船橋・浦和対応
⭐ AI予想の精度が高い

詳細はこちら👇
https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // === nankan-review（南関特化）紹介 ===

  // 4. nankan-review基本紹介
  `【南関競馬特化】nankan-reviewで南関予想サイトを比較！

🌃 大井・川崎・船橋・浦和
🏇 南関特化の専門サイト
📊 競馬場ガイド充実
⭐ 口コミ多数

https://nankan.keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 5. 南関競馬の魅力
  `【南関競馬の魅力】仕事帰りに楽しめるナイター競馬

✨ 平日夜間開催
✨ 都心からアクセス良好
✨ 少額から楽しめる

予想サイトを探すならこちら👇
https://nankan.keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // === 競馬場ガイド（nankan-review） ===

  // 6. 大井競馬場
  `【大井競馬場ガイド】東京の夜を彩るナイター競馬

🌃 トゥインクルレース
🏇 アクセス抜群（大井競馬場前駅）
📊 コース特徴・攻略法

https://nankan.keiba-review.jp/venue/ohi?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 7. 川崎競馬場
  `【川崎競馬場ガイド】神奈川の地方競馬

🌃 川崎ナイター競馬
🏇 JRA騎手も参戦
📊 コース攻略法

https://nankan.keiba-review.jp/venue/kawasaki?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 8. 船橋競馬場
  `【船橋競馬場ガイド】千葉の地方競馬

🌃 船橋ナイター競馬
🏇 千葉テレビ中継あり
📊 コース特徴・攻略法

https://nankan.keiba-review.jp/venue/funabashi?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 9. 浦和競馬場
  `【浦和競馬場ガイド】埼玉の地方競馬

🌃 浦和ナイター競馬
🏇 ジャパンカップダート開催
📊 コース攻略法

https://nankan.keiba-review.jp/venue/urawa?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // === ランキング・FAQ ===

  // 10. 総合ランキング
  `【競馬予想サイトランキング】カテゴリ別人気TOP5！

🏇 中央競馬
🌃 南関競馬
🤖 AI予想

口コミ評価でランキング👇
https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 11. 南関ランキング
  `【南関競馬予想サイトランキング】人気TOP5を発表！

🥇 1位は？
🥈 2位は？
🥉 3位は？

https://nankan.keiba-review.jp/ranking?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 12. FAQ紹介
  `【初心者向け】競馬予想サイトのよくある質問

💡 無料で使える？
💡 的中率は？
💡 どのサイトがおすすめ？

https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // === 口コミ投稿促進 ===

  // 13. 総合口コミ募集
  `【口コミ募集中】競馬予想サイトの体験談をシェアしよう！

📝 中央・地方・南関すべてOK
📝 的中実績・失敗談も歓迎
📝 あなたの口コミが誰かの役に立つ

https://keiba-review.jp/submit?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 14. 南関口コミ募集
  `【南関特化】予想サイトの体験談募集中！

📝 使ってみた感想
📝 的中実績
📝 おすすめポイント

https://nankan.keiba-review.jp/submit?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // === 将来の拡張を見越した投稿 ===

  // 15. 中央競馬（将来のchuo-keiba-review）
  `【中央競馬】JRA予想サイトの口コミも充実！

🏇 G1レース予想
🏇 重賞予想
🏇 平場予想

中央競馬の予想サイトを探すなら👇
https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,

  // 16. 地方競馬（将来のchihou-keiba-review）
  `【地方競馬】全国の地方競馬予想サイトを比較！

🌃 南関4場
🏇 その他地方競馬
📊 地方競馬ならではの狙い目

https://keiba-review.jp?utm_source=bluesky&utm_medium=social&utm_campaign=auto_post`,
]

// メイン処理
async function main() {
  try {
    console.log('🚀 Bluesky自動投稿を開始します...')

    // Bluesky Agentを初期化
    const agent = new BskyAgent({ service: 'https://bsky.social' })

    // ログイン
    console.log(`🔐 ログイン中: ${BLUESKY_IDENTIFIER}`)
    await agent.login({
      identifier: BLUESKY_IDENTIFIER,
      password: BLUESKY_PASSWORD,
    })
    console.log('✅ ログイン成功')

    // ランダムに投稿を選択
    const randomIndex = Math.floor(Math.random() * POST_TEMPLATES.length)
    const postText = POST_TEMPLATES[randomIndex]

    console.log(`\n📝 投稿内容（テンプレート#${randomIndex + 1}）:`)
    console.log('---')
    console.log(postText)
    console.log('---\n')

    // 投稿
    console.log('📤 投稿中...')
    const result = await agent.post({
      text: postText,
      createdAt: new Date().toISOString(),
    })

    console.log('✅ 投稿成功！')
    console.log(`🔗 投稿URL: https://bsky.app/profile/${BLUESKY_IDENTIFIER}/post/${result.uri.split('/').pop()}`)
    console.log(`📊 URI: ${result.uri}`)

    // 統計情報
    console.log('\n📊 統計情報:')
    console.log(`- 投稿テンプレート総数: ${POST_TEMPLATES.length}件`)
    console.log(`- 今回使用: テンプレート#${randomIndex + 1}`)
    console.log(`- 文字数: ${postText.length}文字`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message)

    if (error.message.includes('AuthenticationRequired')) {
      console.error('\n💡 ヒント: BLUESKY_IDENTIFIER と BLUESKY_PASSWORD を確認してください')
    } else if (error.message.includes('RateLimitExceeded')) {
      console.error('\n💡 ヒント: レート制限に達しました。しばらく待ってから再試行してください')
    }

    process.exit(1)
  }
}

// スクリプト実行
main()
