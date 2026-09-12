---
linkTitle: Fork 特性
title: Fork 特性
weight: 10
---

这个 [Hextra](https://github.com/imfing/hextra) 的 fork 在上游主题的基础上增加了一系列功能。本章节记录了 fork 独有的所有内容、每个功能的内部工作原理以及配置方法。

<!--more-->

## 与上游有何不同？

| 功能       | 上游                                                  | 本 fork                                                                             |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 排版字体   | 固定的系统字体栈                                      | 可分别为标题、正文和代码配置的 [Google Fonts](google-fonts)                         |
| 主题色     | 单一 HSL 主色（`--primary-hue/saturation/lightness`） | 完整的 11 级 `oklch` [强调色调色板](accent-color)                                   |
| 中性色     | 扁平的 `bg-white` / `#111` 背景                       | 专用的 11 级 `oklch` [浅色与深色调色板](color-palettes)                             |
| 代码块     | 无边框、`rounded-xl`、微弱的高亮                      | [带边框的代码块](code-blocks)、`rounded-sm`、强调色行高亮、文件类型图标             |
| 博客       | 单栏列表                                              | 带身份栏、文章卡片、分享按钮和小部件的[三栏布局](blog)                              |
| Favicon    | 散落在 `static/` 中的文件                             | 统一整理到 `static/icons/` 下，并支持[深色模式 favicon](favicons)                   |
| 开发工作流 | 仅有 npm 脚本                                         | [Makefile、devcontainer 和上游同步辅助工具](dev-tooling)                            |
| 内容创作   | 需要翻阅文档才能想起每个参数                          | 覆盖 shortcode、front matter 和代码围栏的 [89 个 VS Code 代码片段](vscode-snippets) |

{{< cards >}}
{{< card link="google-fonts" title="Google Fonts" icon="sparkles" subtitle="可配置的标题、正文和代码字体，支持可变字体 axes" >}}
{{< card link="accent-color" title="强调色" icon="color-swatch" subtitle="贯穿所有组件的 11 级 oklch 强调色调色板" >}}
{{< card link="color-palettes" title="调色板" icon="adjustments" subtitle="取代扁平背景的中性浅色与深色调色板" >}}
{{< card link="code-blocks" title="代码块" icon="code" subtitle="边框、更小的圆角、强调色行高亮和文件类型图标" >}}
{{< card link="blog" title="博客布局" icon="newspaper" subtitle="身份栏、文章卡片、分享按钮和侧边栏小部件" >}}
{{< card link="favicons" title="Favicon" icon="photograph" subtitle="规范的图标目录和自动深色模式 favicon" >}}
{{< card link="dev-tooling" title="开发工具" icon="terminal" subtitle="Makefile、devcontainer 和上游同步工作流" >}}
{{< card link="vscode-snippets" title="VS Code 代码片段" icon="cursor-click" subtitle="为每个 shortcode、front matter 键和代码围栏属性提供 Tab 补全" >}}
{{< /cards >}}

{{< callout type="info" >}}
本 fork 与上游保持紧密同步——上游的发布版本会定期合并进来，并在每次合并后重新构建编译后的 CSS。同步工作流请参阅[开发工具](dev-tooling#syncing-with-upstream)。
{{< /callout >}}
