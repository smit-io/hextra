---
title: 開発ツール
weight: 6
---

このフォークは、アップストリームの npm スクリプトの上に開発ワークフローを提供します。自己文書化された **Makefile**、常時稼働のプレビューサーバーを備えた Docker Compose ベースの **devcontainer**、そして**アップストリームとの同期**用ヘルパーです。

<!--more-->

## Makefile

`make help` を実行すると、注釈付きの完全な一覧が表示されます。ワークフロー別の主要ターゲット：

### 開発

| ターゲット | 内容 |
|---|---|
| `make dev` | 完全なテーマパイプライン付きの開発サーバー（リビルドのたびに `hugo_stats.json` を書き出す） |
| `make serve` | テーマパイプラインなしの開発サーバー — コンテンツ編集だけのときは起動が高速 |
| `make stats` | `docs/hugo_stats.json`（Tailwind がツリーシェイクの基準にするクラス一覧）を再生成 |
| `make css` | 本番用 CSS をコンパイル — 先に stats を再生成するため常に正しい結果になる |
| `make css-watch` | 変更のたびに CSS を再コンパイル。`make dev` と並行して実行する |

### コンテンツ執筆

| ターゲット | 内容 |
|---|---|
| `make new-blog NAME=my-post` | ブログ記事（`docs/content/blog/my-post.md`）をドラフトとして雛形生成。タグ・抜粋マーカー・コメントアウトされた author/cover/pinned フィールド付き |
| `make new-doc NAME=guide/my-page` | タイトルとタグ付きのドキュメントページを雛形生成。`weight` は手動配置用にコメントのまま |
| `make new-doc-auto NAME=guide/my-page` | `new-doc` と同様だが、`weight` がセクション最後のページの次に自動設定される |
| `make new-page NAME=showcase/thing` | デフォルトのアーキタイプで `docs/content/` 配下に任意のページを雛形生成 |

### ビルドとプレビュー

| ターゲット | 内容 |
|---|---|
| `make build` | `docs/public` への完全な本番ビルド（先に CSS をコンパイル）。ドラフトは除外 — これが公開されるもの |
| `make preview` | **ドラフトを含む**本番ビルド。常時稼働のプレビューコンテナが [localhost:8043](http://localhost:8043) で配信 |

### テスト

| ターゲット | 内容 |
|---|---|
| `make test` | ドラフトを含まない新規本番ビルドに対する Playwright スイート一式 |
| `make test-a11y` | アクセシビリティテストのみ（WCAG 2.2 AA） |
| `make test-mobile` / `test-build` | モバイルメニューおよびビルド出力のスイート |
| `make test-preview` | プレビュー（ドラフト込み）を再ビルドし、稼働中のプレビューコンテナに対してスイートを実行 — テストした内容がそのまま 8043 で配信され続ける |

### メンテナンス

| ターゲット | 内容 |
|---|---|
| `make fmt` | テンプレート・CSS・JS に Prettier を実行 |
| `make doctor` | ツールチェーンの問題を診断（Hugo/Node のバージョン、古いバイナリ） |
| `make reset` | `node_modules` を削除して再インストール — ホストと devcontainer のバイナリ衝突を解消 |
| `make clean` / `clean-stats` / `clean-all` | ビルド出力、stats の差分、またはすべてを削除 |

{{< callout type="info" >}}
ポイントは依存関係の連鎖です。`make css` は `stats` に依存し、`make build` は `css` に依存します。アップストリームの素の npm スクリプトでは「stats を再生成してから CSS をビルドする」という 2 段階の手順を覚えておく必要があります（[理由](https://github.com/smit-io/hextra/blob/main/CLAUDE.md)）が、Makefile はそれをコードとして表現しています。
{{< /callout >}}

npm 派の人向けに、`make css-watch` と同等の `npm run watch:css` スクリプト（フォーク限定）もあります。

## コンテンツの雛形生成

`new-*` ターゲットは `hugo new` のラッパーなので、フロントマターは `docs/archetypes/` のアーキタイプ（`blog.md`、`docs.md`、`docs-weighted.md`、`default.md`）に由来し、既存ファイルは上書きされず拒否されます。`NAME` は `.md` 拡張子の有無を問わず、ネストしたパスも使えます（`NAME=guide/deep/page`）。

知っておくと便利な詳細：

- **ブログ記事はドラフトとして始まります**（`draft: true`）。`1313` と `8043` では表示されますが、フラグを外すまで `make build` からは除外されます。
- **`new-doc-auto` は `weight` を計算します**。作成時に対象フォルダの既存ページを走査し、最大値の次を設定します。ドラフトの兄弟ページはカウントされず、間隔を空けた weight 慣例（10、20、30…）では 40 ではなく 31 になります。
- **英語のみ** — 翻訳版（`.fa.md`、`.ja.md`、`.zh-cn.md`）は既存のコンテンツ構成に合わせ、隣に手動でコピーします。

## Devcontainer

アップストリームはプレーンな devcontainer イメージを使います。このフォークは devcontainer を **Docker Compose**（`.devcontainer/docker-compose.yml`）で 2 つのサービスとして動かします：

- **`dev`** — エディタが接続する Go の devcontainer イメージで、リポジトリは `/workspaces/hextra` にマウントされます。devcontainer features が Hugo Extended（バージョン固定）と Node 22 をインストールし、`postCreateCommand` が `npm install` を実行するので、初回オープン時からビルド可能な状態になります。厳選された VS Code 拡張機能一式（Tailwind、Hugo、Prettier、Git Graph など）が事前設定されています。
- **`preview`** — `docs/public` を読み取り専用で配信する小さな（約 258 kB）静的ファイルサーバー（`pierrezemb/gostatic`）。`Cache-Control: no-store` を付けるので、古いページをデバッグしてしまうことがありません。dev コンテナと一緒に起動して稼働し続けます。`make build`（または `make preview`）を再実行すると、コンテナの再起動なしに配信サイトが更新されます。

再現可能なツールバージョンのために `devcontainer-lock.json` が追跡されています。`.vscode/hextra.code-snippets` はコンテナ内でもプレーンなホストのチェックアウトでも自動的に読み込まれます — [VS Code スニペット](vscode-snippets)を参照してください。

名前付きボリュームがコンテナ内の `node_modules` をマスクするため、コンテナは Linux ネイティブの npm バイナリ（例：`lightningcss`）を、ホストは macOS のバイナリをそれぞれ保持します。片方で `npm install` を実行してももう片方が壊れることはありません。

### ポート

両方のポートがホストに自動転送されます（`devcontainer.json` の `forwardPorts`）：

| ポート | サービス | 得られるもの |
|---|---|---|
| `1313` | Hugo 開発サーバー（`make dev` / `make serve`） | ライブリロード付きの開発ビルド |
| `8043` | 常時稼働の `preview` コンテナ | `docs/public` にある最新の**本番**ビルド |

この分離が重要です。`1313` は高速なライブリビルドを提供し、`8043` は本番ビルド — ミニファイされ、ガベージコレクトされ、ツリーシェイクされた CSS — を表示します。どちらもドラフトを含みます（`make preview` は `-D` を渡すため、未公開の記事を本番の形で確認できます）。ドラフトを含まないのは `make build` の出力だけです。リリース前には `8043` を確認してください。

{{< callout type="warning" >}}
`make test` と `make build` は設定の `baseURL` を `docs/public` に焼き込むため、いずれかを実行した後の `8043` のプレビューは、絶対 URL が別の場所を指すビルドを配信することになります。`make preview` を再実行して復元するか、プレビュービルド自体をテストして `8043` を正しい状態に保つ `make test-preview` を使ってください。devcontainer 内では、`test-preview` は `http://preview:8043`（compose のサービス名）でコンテナに到達します。ホストのチェックアウトでは `PREVIEW_TEST_URL=http://localhost:8043` で上書きしてください。
{{< /callout >}}

### 典型的なワークフロー

{{% steps %}}

### コンテナで開く

VS Code → "Reopen in Container"。初回オープン時に Hugo、Node、npm 依存関係が自動でインストールされます。

### 開発する

`make dev` を実行し、[localhost:1313](http://localhost:1313) で反復します。スタイルを編集するときは `make css-watch` を並行して実行します。

### 本番ビルドを検証する

`make preview` が本番向けにビルドし、結果は即座に [localhost:8043](http://localhost:8043) で確認できます。サーバーの再起動は不要で、プレビューコンテナが更新されたファイルをそのまま配信します。

{{% /steps %}}

## アップストリームとの同期

このフォークは、[imfing/hextra](https://github.com/imfing/hextra) を追跡するための Makefile ターゲットを 2 つ追加しています：

### `make sync-setup`

一度きりのセットアップです。`upstream` リモートを追加し、タグをフェッチし、`upstream/main` の **fast-forward 専用ミラー**として `upstream-main` ブランチを作成します。このブランチには絶対にコミットしないでください。

### `make sync-status`

現在の乖離 — アップストリームに対して遅れている／進んでいるコミット数、アップストリームの最新タグ — を表示し、マージのたびにコンフリクトが予想される**フォーク所有ファイル**の一覧を出力します：

- `assets/css/styles.css` — アクセント／ライト／ダークパレット
- `assets/css/fonts.css` と `layouts/_partials/google-fonts.html` — フォーク限定の Google Fonts
- `assets/css/components/*.css` と `layouts/_partials/*.html` — アクセントテーマ適用
- `static/icons/` — ファビコンの再編成
- `.devcontainer/`、`Makefile` — フォーク限定のツール

### 同期ワークフロー

{{% steps %}}

### リリースタグを 1 つずつマージする

`upstream/main` に一気にジャンプするのではなく、`v0.x.y` タグを個別にマージします。コンフリクトが小さく保たれ、各マージをテストできます。

### コンフリクトはフォークのトークン側に解決する

アップストリームが新しいコンポーネントを追加した場合は、マージの一環としてそれらにアクセント／パレットトークンを適用します（フォークの履歴の "Apply accent theming to upstream's new components" を参照）。

### ビルド成果物はマージせず再生成する

`assets/css/compiled/main.css` と `docs/hugo_stats.json` は生成ファイルです。これらのコンフリクトを手作業で解決してはいけません。どちらか一方を採用し、`make css` を実行して再生成してください。

{{% /steps %}}
