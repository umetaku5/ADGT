# AI DAO Governance Tool (ADGT)

DAOのプロポーザルを分析し、投票判断をサポートするAIツールです。

## 機能

- プロポーザルの自動分析
- 日本語/英語対応
- PDFファイルのサポート
- カスタマイズ可能な評価ポリシー

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/umetaku5/ADGT.git
cd ADGT

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localファイルを編集してAPIキーを設定

# 開発サーバーの起動
npm run dev
```

## 環境変数

- `OPENAI_API_KEY`: OpenAI APIキー
- `TALLY_API_KEY`: Tally APIキー

## デプロイ

このプロジェクトはVercelにデプロイすることができます。
デプロイ時は必要な環境変数を設定してください。

## API Reference

APIの詳細な使用方法については[docs/api-references.md](docs/api-references.md)を参照してください。

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
