# AI-Manager ダッシュボード

Sales Bond が開発するAIエージェント・Webアプリを一括管理するための統合管理ダッシュボード（MVP）。

要件の全体像は [`docs/unified-dashboard-requirements.md`](./docs/unified-dashboard-requirements.md) を参照してください。

## MVPで実装済みの機能

1. **インベントリ一覧** — 各ツールの愛称・アイコン、種別、目的、開発状態、起動方式、使用サービス・API、コードの場所、最終デプロイ日を登録・編集
2. **稼働状況表示** — ステータス（稼働中／警告／停止／エラー）の色分け表示、直近の実行結果、次回実行予定、直近のエラーログ。各ツールが `POST /api/status-report` に状態を報告する共通APIを実装
3. **Slackアラート通知** — 3回連続失敗、24時間以上未報告を検知してSlack Incoming Webhookへ通知（Vercel Cronで定期チェック）
4. **認証・権限** — 招待制のユーザー登録、管理者／閲覧者ロール
5. **操作ログ** — 誰が何をしたかの監査ログ（第3線）

Phase 2以降（今回はスコープ外）: コスト管理、詳細な監査ログ・月次レビュー機能、ドキュメント・仕様書リンク集約。

## 技術スタック

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL
- Auth.js (NextAuth v5, Credentials provider + JWTセッション)
- Slack Incoming Webhook
- ホスティング想定: Vercel + マネージドPostgres（Neon / Vercel Postgres 等）

## セットアップ（ローカル開発）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` を作成し、以下を設定してください（開発用の例）。

```bash
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/ai_manager"
AUTH_SECRET="<openssl rand -base64 32 などで生成したランダムな文字列>"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
CRON_SECRET="<任意のランダムな文字列。Vercel Cronからの呼び出しを認証する>"
# ローカル/プロキシ環境でホスト名検証エラーが出る場合のみ設定
AUTH_TRUST_HOST=true
```

### 3. データベースのマイグレーション

```bash
npx prisma migrate deploy   # 本番/初回セットアップ
# または開発中のスキーマ変更時
npx prisma migrate dev
```

### 4. 初期管理者アカウントの作成

このダッシュボードは招待制のため、最初の管理者だけは環境変数からブートストラップします。

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_NAME="管理者" ADMIN_PASSWORD="十分に強いパスワード" npm run db:seed
```

以降のユーザーは、管理者がログイン後「ユーザー管理」画面から招待してください。

### 5. 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてログインします。

## 各ツールからの状態報告API

登録したツールの詳細画面（管理者のみ）から状態報告用のAPIキーを発行できます。ツール側からは以下の形式でPOSTしてください。

```bash
curl -X POST https://<dashboard-domain>/api/status-report \
  -H "Authorization: Bearer <発行されたAPIキー>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "OK",
    "message": "定時送信バッチが正常終了",
    "processedCount": 120,
    "successCount": 118,
    "nextRunAt": "2026-09-03T00:00:00Z"
  }'
```

- `status`: `OK` | `WARNING` | `DOWN` | `ERROR`
- 3回連続で `DOWN`/`ERROR` を報告するとSlackへアラートが送られます
- APIキー自体はハッシュ化して保存し、画面には発行時に一度だけ表示します

## Slackアラート

- 3回連続失敗: 状態報告のたびにサーバー側で判定し、即座に通知
- 24時間以上未報告: `GET /api/cron/check-stale` を `Authorization: Bearer $CRON_SECRET` 付きで定期実行して判定（`vercel.json` にVercel Cronの設定を同梱、毎時実行）

## Vercelへのデプロイ

1. Vercelで新規プロジェクトを作成し、このリポジトリを接続
2. 環境変数 `DATABASE_URL` `AUTH_SECRET` `SLACK_WEBHOOK_URL` `CRON_SECRET` をVercelのプロジェクト設定に登録（Postgresは Neon や Vercel Postgres などのマネージドサービスを利用）
3. デプロイ後、初回のみ `npx prisma migrate deploy` を実行（Vercelのビルドコマンドに組み込むか、ローカルから本番DATABASE_URLに向けて実行）
4. `ADMIN_EMAIL` `ADMIN_NAME` `ADMIN_PASSWORD` を一時的に設定して `npm run db:seed` を実行し、初期管理者を作成（作成後は環境変数から削除して構いません）
5. `vercel.json` の Cron 設定が自動的に有効化され、毎時 `/api/cron/check-stale` が呼び出されます

フォーム営業ツール本体（クラウドVM常時稼働）とは別インフラで問題ありません。
