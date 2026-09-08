---
title: 调色板
weight: 3
---

除了[强调色](accent-color)之外，本 fork 还将上游的扁平背景（浅色模式的 `bg-white`、深色模式的 `#111`）替换为专用的**中性调色板**——浅色和深色模式各有十一级色阶，均以 `oklch` 定义。

<!--more-->

## 调色板

所有调色板都位于 `assets/css/styles.css`，并作为 Tailwind v4 颜色令牌暴露出来，因此可以在主题中的任何地方作为工具类使用（`hx:bg-hextra-light-200`、`hx:dark:border-hextra-dark-900`、……）。

### 浅色模式 —— `hextra-light-*`

一条从近白色到中灰的紧凑灰阶梯度：

| 令牌               | 值                 | 十六进制  |
| ------------------ | ------------------ | --------- |
| `hextra-light-50`  | `oklch(98.8% 0 0)` | `#fcfcfc` |
| `hextra-light-100` | `oklch(97.3% 0 0)` | `#f8f8f8` |
| `hextra-light-200` | `oklch(93.7% 0 0)` | `#efefef` |
| `hextra-light-300` | `oklch(90.6% 0 0)` | `#e7e7e7` |
| `hextra-light-400` | `oklch(87.1% 0 0)` | `#dedede` |
| `hextra-light-500` | `oklch(83.5% 0 0)` | `#d5d5d5` |
| `hextra-light-600` | `oklch(80.4% 0 0)` | `#cdcdcd` |
| `hextra-light-700` | `oklch(76.9% 0 0)` | `#c4c4c4` |
| `hextra-light-800` | `oklch(73.3% 0 0)` | `#bbbbbb` |
| `hextra-light-900` | `oklch(70.2% 0 0)` | `#b3b3b3` |
| `hextra-light-950` | `oklch(66.7% 0 0)` | `#aaaaaa` |

### 深色模式 —— `hextra-dark-*`

一条从近黑色向上延伸的深灰梯度：

| 令牌              | 值                 | 十六进制  |
| ----------------- | ------------------ | --------- |
| `hextra-dark-50`  | `oklch(3.1% 0 0)`  | `#080808` |
| `hextra-dark-100` | `oklch(6.7% 0 0)`  | `#111111` |
| `hextra-dark-200` | `oklch(9.0% 0 0)`  | `#171717` |
| `hextra-dark-300` | `oklch(11.0% 0 0)` | `#1c1c1c` |
| `hextra-dark-400` | `oklch(13.3% 0 0)` | `#222222` |
| `hextra-dark-500` | `oklch(15.7% 0 0)` | `#282828` |
| `hextra-dark-600` | `oklch(17.6% 0 0)` | `#2d2d2d` |
| `hextra-dark-700` | `oklch(20.0% 0 0)` | `#333333` |
| `hextra-dark-800` | `oklch(22.4% 0 0)` | `#393939` |
| `hextra-dark-900` | `oklch(24.3% 0 0)` | `#3e3e3e` |
| `hextra-dark-950` | `oklch(26.7% 0 0)` | `#444444` |

### 额外梯度 —— `hextra-white-*` 和 `hextra-black-*`

另外还定义了两条覆盖全范围的灰阶梯度（`#ffffff` → `#292929` 和 `#f6f6f6` → `#000000`），供需要比紧凑的 `light`/`dark` 梯度更高对比度中性色的场景使用。

## 使用位置

- **页面背景** —— `body` 在浅色模式使用 `hextra-light-100`，在深色模式使用 `hextra-dark-600`（而非上游的纯白 / `#111`）。深色模式刻意*不*使用纯黑：内容表面（代码块的 `hextra-dark-50`、标题栏的 `hextra-dark-700`）会明显地衬托在页面背景之上或之下。
- **代码块** —— 背景、边框和文件名标题栏；参见[代码块](code-blocks)。
- **分节边框** —— 例如深色模式下 `h2` 的下划线边框使用 `hextra-dark-900`。
- **组件外观** —— 搜索、侧边栏、步骤、警告框、画廊、导航栏和 jupyter 组件都已从 `primary` 染色的灰色迁移到调色板令牌。
- **提示框与徽章** —— 提示框和 GitHub 风格的警告框按类型（info、warning、error……）使用一套饱和的、受 GitHub 启发的调色板，徽章则使用同一思路的高对比度变体。二者都为浅色和深色模式分别调校，而不是在不同透明度下复用同一种染色。

## 自定义

调色板变量遵循与强调色相同的模式——在 `assets/css/custom.css` 中覆盖它们：

```css {filename="assets/css/custom.css"}
:root {
  /* Warmer light background */
  --color-hextra-light-100: oklch(97.3% 0.005 85);

  /* Slightly blue-tinted dark background */
  --color-hextra-dark-600: oklch(17.6% 0.01 250);
}
```

只需覆盖你想改变的色阶；其余的会保持默认值。

{{< callout type="warning" >}}
请保持梯度的*顺序*不变（每级色阶都比相邻级更深/更浅，与默认值一致）。组件假定梯度是单调的——颠倒色阶会导致边框不可见或文字对比度过低。
{{< /callout >}}

## 为什么用 `oklch`？

`oklch` 是一个感知均匀的色彩空间：亮度通道上相等的步长在视觉上看起来也是相等的，而十六进制/HSL 无法保证这一点。对于灰阶梯度来说，这意味着 `100` 和 `200` 之间的视觉距离与 `800` 和 `900` 之间的相同。它也让染色变得轻而易举——给任何色阶加上少量的色度和一个色相值，无需重新调整其亮度。每级色阶在 `styles.css` 中都以注释形式附有等效的十六进制值以供参考。
