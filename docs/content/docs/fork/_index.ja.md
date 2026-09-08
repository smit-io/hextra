---
linkTitle: フォーク機能
title: フォーク機能
weight: 10
---

この [Hextra](https://github.com/imfing/hextra) のフォークは、アップストリームのテーマに独自の機能セットを追加しています。このセクションでは、フォーク固有のすべての機能、それぞれの内部的な仕組み、および設定方法を解説します。

<!--more-->

## アップストリームとの違い

| 機能        | アップストリーム                                                        | このフォーク                                                                               |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| タイポグラフィ     | 固定のシステムフォントスタック                                         | 見出し・本文・コードごとに設定可能な [Google Fonts](google-fonts)                  |
| テーマカラー    | 単一の HSL プライマリカラー（`--primary-hue/saturation/lightness`） | `oklch` で定義された 11 段階の[アクセントパレット](accent-color)                                 |
| ニュートラルカラー | フラットな `bg-white` / `#111` 背景                            | `oklch` で定義された専用の 11 段階[ライト・ダークパレット](color-palettes)                 |
| コードブロック    | ボーダーなし、`rounded-xl`、淡いハイライト                       | [ボーダー付きブロック](code-blocks)、`rounded-sm`、アクセントカラーの行ハイライト、ファイルタイプアイコン |
| ブログ           | 単一カラムのリスト                                              | アイデンティティレール・記事カード・共有ボタン・ウィジェットを備えた[3 カラムレイアウト](blog)  |
| ファビコン       | `static/` 直下のフラットな配置                                    | `static/icons/` 配下に整理され、[ダークモードファビコン](favicons)に対応              |
| 開発ワークフロー   | npm スクリプトのみ                                                | [Makefile、devcontainer、アップストリーム同期ヘルパー](dev-tooling)                        |
| 執筆       | すべてのパラメータを思い出すためにドキュメントを読む必要がある                        | ショートコード・フロントマター・コードフェンス用の [49 個の VS Code スニペット](vscode-snippets)    |

{{< cards >}}
{{< card link="google-fonts" title="Google Fonts" icon="sparkles" subtitle="バリアブルフォントの axes に対応した、見出し・本文・コードごとに設定可能なフォント" >}}
{{< card link="accent-color" title="アクセントカラー" icon="color-swatch" subtitle="すべてのコンポーネントで使われる 11 段階の oklch アクセントパレット" >}}
{{< card link="color-palettes" title="カラーパレット" icon="adjustments" subtitle="フラットな背景を置き換えるニュートラルなライト・ダークパレット" >}}
{{< card link="code-blocks" title="コードブロック" icon="code" subtitle="ボーダー、より小さい角丸、アクセントカラーの行ハイライト、ファイルタイプアイコン" >}}
{{< card link="blog" title="ブログレイアウト" icon="newspaper" subtitle="アイデンティティレール、記事カード、共有ボタン、サイドバーウィジェット" >}}
{{< card link="favicons" title="ファビコン" icon="photograph" subtitle="整理されたアイコンディレクトリと自動ダークモードファビコン" >}}
{{< card link="dev-tooling" title="開発ツール" icon="terminal" subtitle="Makefile、devcontainer、アップストリーム同期ワークフロー" >}}
{{< card link="vscode-snippets" title="VS Code スニペット" icon="cursor-click" subtitle="すべてのショートコード・フロントマターキー・コードフェンス属性の Tab 補完" >}}
{{< /cards >}}

{{< callout type="info" >}}
このフォークはアップストリームを密に追跡しています。アップストリームのリリースは定期的にマージされ、マージのたびにコンパイル済み CSS が再ビルドされます。同期ワークフローについては[開発ツール](dev-tooling#syncing-with-upstream)を参照してください。
{{< /callout >}}
