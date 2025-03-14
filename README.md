# Next.js Starterkit

<table><tr><td>
  <img src=".\public\login.png" height="400">
</td></tr></table>


## はじめに

このソフトウェアは、最新の Next.js 15 および NextAuth.js v5 を利用した Next.js スターターキットです。従来のパスワード認証の他にOAuth認証にも対応しています。このスターターキットを使えば、複雑なユーザー認証実装の手間を省き、ウェブアプリケーションの重要な機能の開発にすぐに取り組むことができます。

## 特徴

このスターターキットの特徴は以下の通り：

- メール/パスワード認証  
- OAuth プロバイダー（Google、GitHub）対応  
- パスワードリセット機能  
- メール認証（Email verification）  
- 認証が必要なルートの保護（Protected routes）
- プロフィールページ：ユーザーが名前、ユーザー名、プロフィール画像などの情報を管理可能
- ユーザー権限は ADMIN, USER の２つを用意。権限に応じたアクセス管理が可能。


## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- NextAuth.js v5
- Prisma ORM
- Tailwindcss
- shadcn/ui
  

## 使用方法

 ### 必要条件

*   Node.js（Node.js 18.18 またはそれ以上）  
*   npm、yarn、pnpm、または bun（好きなパッケージマネージャを選択）  
*   データベース（例: PostgreSQL、MySQL、SQLite）が設定され、起動していること  

### インストール

1.  **リポジトリをクローン:**
    ```bash
    git clone https://github.com/tekku-taro/nextjs-starterkit.git
    cd nextjs-starterkit
    ```

2.  **依存関係をインストール:**
    ```bash
    npm install # または yarn install, pnpm install, bun install
    ```

3.  **データベースのセットアップ:**

    * `.env` ファイルを編集し、データベース接続文字列 (`DATABASE_URL`) を設定  
    * 利用するデータベースに合わせて schema.prisma ファイルを修正  
    * Prisma のマイグレーションを実行し、データベーススキーマを作成  
    ```bash
    npx prisma migrate dev --name init
    ```
    * 新しいスキーマを追加した場合、以下のコマンドを実行  
    ```bash
    npx prisma migrate dev --name [マイグレーション名]
    ```
    例:  
    ```bash
    npx prisma migrate dev --name added_job_title
    ```

4.  **環境変数の設定:**
 
    .env ファイルに環境変数を追加

    ```md
    NEXT_PUBLIC_SERVER_URL=[アプリケーションのベースURL（デフォルト値: `http://localhost:3000`）]
    DATABASE_URL=[データベースの接続文字列]

    # NextAuth用
    NEXTAUTH_URL=[ベースURL]
    AUTH_SECRET=[ランダムな文字列]

    # メール認証を使用する場合、SMTP接続情報の設定が必要

    EMAIL_HOST=[SMTPサーバーホスト名]
    EMAIL_PORT=[ポート番号]
    EMAIL_USER=[ユーザー名]
    EMAIL_PASS=[パスワード]
    FROM_EMAIL=[メール送信者名]

    # OAuth 認証用環境変数

    AUTH_GITHUB_ID=[GitHubのクライアントID]
    AUTH_GITHUB_SECRET=[GitHubのクライアントシークレット]
    AUTH_GOOGLE_ID=[GoogleのクライアントID]
    AUTH_GOOGLE_SECRET=[Googleのクライアントシークレット]
    ```


5.  **開発サーバーを起動:**
    ```bash
    npm run dev # または yarn dev, pnpm dev, bun dev
    ```

6.  ブラウザで [http://localhost:3000](http://localhost:3000) を開き、アプリケーションを確認


## ディレクトリ構造

```
📦 プロジェクトルート
├── app/                        
│   ├── (auth)/                 # 認証関連のルートグループ
│   │   ├── login/              # ログインページ関連
│   │   ├── register/           # 登録ページ関連
│   │   ├── reset-password/     # パスワードリセットページ関連
│   │   └── verify-email/       # メール認証ページ関連
│   ├── (root)/                 # 認証後のページルートグループ
│   │   ├── dashboard/          # ダッシュボードページ関連
│   │   └── profile/            # プロフィールページ関連
│   ├── action/                 # サーバーアクション
│   ├── api/                    # APIルート (NextAuthのAPI)
│   ├── layout.tsx              
│   └── ...
├── components/                 
│   ├── auth/                   # 認証関連コンポーネント
│   ├── ui/                     
│   └── ...
├── lib/                        # ユーティリティ関数、設定ファイルなど
│   ├── config.ts               # アプリケーションの設定ファイル
│   ├── email.ts                # Eメール送信関数等
│   └── ...                     # その他のユーティリティ
├── prisma/                     # Prisma ORM の設定ファイル
│   ├── schema.prisma           # データベーススキーマ定義
│   └── ...                     # その他の Prisma 関連ファイル
├── public/                     
│   └── ...
├── .env                        # 環境変数
├── next.config.js              # Next.js の設定ファイル
├── package.json                # npm の設定ファイル
├── tailwind.config.js          # Tailwind CSS の設定ファイル
├── tsconfig.json               # TypeScript の設定ファイル
└── ...                        
```



## メール認証の切り替え

ユーザー登録時にメール認証を行うか否かを以下の `lib/config.ts` ファイル内の `appConfig.emailVerificationRequired` プロパティで切り替えることができます。

```ts
const appConfig = {
  emailVerificationRequired: true,
};

export default appConfig;
```


## Auth Secret の生成方法

本番環境では、強力な AUTH_SECRET を生成することをお勧めします：

```bash
npm exec auth secret # または pnpm exec auth secret, yarn auth secret, bunx auth secret
# または
openssl rand -base64 33
```


## 参考URL

*   [Next.js Documentation](https://nextjs.org/docs)
*   [Auth.js Documentation](https://authjs.dev/)
*   [Prisma Documentation](https://www.prisma.io/docs)


## ライセンス (License)

**Next.js Starterkit** は [MIT license](https://opensource.org/licenses/MIT) のもとでオープンソースソフトウェアとして提供されています。

**Next.js Starterkit** is an open-source software licensed under the [MIT license](https://opensource.org/licenses/MIT).
