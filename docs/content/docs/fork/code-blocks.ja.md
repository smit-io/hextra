---
title: コードブロック
weight: 4
---

このフォークでは、コードブロックをよりシャープで「エディタらしい」見た目にリスタイルしています。両モードでの可視ボーダー、より小さい角丸、パレットベースの背景、そしてアクセントカラーの行ハイライトです。すべての変更は `assets/css/highlight.css` にあり、設定は不要です。すべてのフェンス付きコードブロックに適用されます。

<!--more-->

## アップストリームからの変更点

| 項目          | アップストリーム                                   | このフォーク                                                                               |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| ボーダー          | なし                                       | 1px ボーダー：`hextra-light-900`（ライト）、`neutral-700`（ダーク）                            |
| 角丸   | `rounded-xl`                               | `rounded-sm`                                                                             |
| 背景      | 半透明のプライマリ色（`primary-700/5`） | ソリッドなパレット色：`hextra-light-50` / `hextra-dark-50`                                     |
| ファイル名ヘッダー | プライマリ色ベース、`rounded-t-xl`             | ボーダー付きのパレット背景（`hextra-light-200` / `hextra-dark-700`）、`rounded-t-sm` |
| 行ハイライト  | 淡い `primary-800/10` の重ね塗り                | アクセント色の背景 + 2px のアクセント色左ボーダー、モードごとに調整                              |
| コピーボタン     | ライトモードでコントラスト不良                | 修正済み。両モードになじむニュートラルなサーフェス                                             |
| ファイルタイプアイコン | なし                                       | ファイル拡張子から解決されるモノクロアイコン                                                    |

## 行ハイライト

Hugo の標準的な方法で行をハイライトすると、フォークは[アクセントパレット](accent-color)でスタイルを適用します：

````markdown {filename="Markdown"}
```go {hl_lines=[3,4]}
package main

import "fmt"       // highlighted
func main() {}     // highlighted
```
````

これは次のようにレンダリングされます：

```go {hl_lines=[3,4]}
package main

import "fmt"       // highlighted
func main() {}     // highlighted
```

レンダリング：

- **ライトモード**：不透明度 60% の `hextra-accent-200` 背景と 2px の `hextra-accent-500` 左ボーダー
- **ダークモード**：不透明度 60% の `hextra-accent-950` 背景と同じ `hextra-accent-500` ボーダー

これらはアクセントトークンなので、アクセントカラーを変更するとハイライトの色も自動的に変わります。

## 行番号

`linenos=table` を指定したブロックには特別なボーダー処理が入ります。Chroma は行番号付きコードを 2 セルのテーブル（番号 | コード）としてレンダリングするため、素朴なボーダーでは破綻します。フォークはボーダーをセルごとに分割します：

- 最初のセル（`.lntd:first-child pre`）：左 + 上下ボーダー、左側の角丸
- 最後のセル（`.lntd:last-child pre`）：右 + 上下ボーダー、右側の角丸

その結果、テーブル全体を囲む 1 本の連続したボーダーになります。また、コードセル内のハイライト行は左のアクセントボーダーを持ちません（そうしないと番号とコードの間、ブロックの途中にボーダーが現れてしまいます）。

````markdown {filename="Markdown"}
```go {linenos=table,hl_lines=[2]}
package main
func main() {}
```
````

これは次のようにレンダリングされます：

```go {linenos=table,hl_lines=[2]}
package main
func main() {}
```

## ファイル名ヘッダー

````markdown {filename="Markdown"}
```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
```
````

これは次のようにレンダリングされます：

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
```

ファイル名バーは、独自のボーダーとパレット背景（ライトは `hextra-light-200`、ダークは `hextra-dark-700`）を持ち、ブロックの上にぴったり重なって、視覚的にはエディタのタブのように見えます。

## ファイルタイプアイコン

ファイル名が設定されている場合、バーにはファイル拡張子（なければコードフェンスの言語にフォールバック）に対応するモノクロアイコンが表示されます。アイコンはバーのテキストカラーを継承するため、ライト・ダークモードに自動的に適応します：

````markdown {filename="Markdown"}
```js {filename="app.js"}
console.log("Hello!");
```
````

これは次のようにレンダリングされます：

```js {filename="app.js"}
console.log("Hello!");
```

デフォルトでは、言語やツールのアイコンとして [Simple Icons](https://simpleicons.org) を使用し、オフラインでもビルドできるようにテーマ内に同梱しています。`icon` 属性でブロックごとに解決されたアイコンを上書きしたり、独自の `data/codeblock-icons.yaml` を作成して拡張子・言語のマッピングを拡張したり、機能全体を無効化したりできます：

```yaml {filename="hugo.yaml"}
params:
  highlight:
    filenameIcon:
      enable: false
```

完全なリファレンスは[シンタックスハイライト](../guide/syntax-highlighting#file-type-icon)を参照してください。

## すべての組み合わせ

ファイル名、行番号、アクセントハイライトは組み合わせられます：

````markdown {filename="Markdown"}
```python {filename="hello.py",linenos=table,hl_lines=[2,5]}
def say_hello():
    print("Hello!")

def main():
    say_hello()
```
````

これは次のようにレンダリングされます：

```python {filename="hello.py",linenos=table,hl_lines=[2,5]}
def say_hello():
    print("Hello!")

def main():
    say_hello()
```

## コードフォント

[Google Fonts](google-fonts) が有効な場合、コードブロック（およびインラインコード）は `var(--font-code)` を通じて設定済みの `code` フォントを使います。追加の設定は不要です。

## カスタマイズ

すべてはパレットとアクセントトークンで制御されているため、いつもの上書き方法が使えます。`assets/css/custom.css` で変数を設定してください：

```css {filename="assets/css/custom.css"}
:root {
  /* Lighter code block background in dark mode */
  --color-hextra-dark-50: oklch(9% 0 0);
}
```

構造的な変更（角丸や、ボーダーの太さ）が必要な場合は、クラスを直接上書きします：

```css {filename="assets/css/custom.css"}
.hextra-code-block pre:not(.lntable pre) {
  border-radius: 0.5rem; /* back to a rounder look */
}
```
