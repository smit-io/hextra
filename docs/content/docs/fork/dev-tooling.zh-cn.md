---
title: 开发工具
weight: 6
---

本 fork 在上游 npm 脚本之上提供了一套完整的开发工作流：自带文档的 **Makefile**、基于 Docker Compose 的 **devcontainer**（内置常驻预览服务器），以及用于**与上游同步**的辅助工具。

<!--more-->

## Makefile

运行 `make help` 查看完整的带注释列表。按工作流划分的重要目标如下：

### 开发

| 目标 | 作用 |
|---|---|
| `make dev` | 启动带完整主题管线的开发服务器（每次重新构建时写入 `hugo_stats.json`） |
| `make serve` | 启动不带主题管线的开发服务器——只编辑内容时启动更快 |
| `make stats` | 重新生成 `docs/hugo_stats.json`（Tailwind 用于摇树优化的类清单） |
| `make css` | 编译生产环境 CSS——会先重新生成 stats，因此结果始终正确 |
| `make css-watch` | 文件变化时重新编译 CSS；与 `make dev` 并行运行 |

### 撰写内容

| 目标 | 作用 |
|---|---|
| `make new-blog NAME=my-post` | 以草稿形式创建博客文章（`docs/content/blog/my-post.md`），带标签、摘要标记和注释掉的 author/cover/pinned 字段 |
| `make new-doc NAME=guide/my-page` | 创建带标题和标签的文档页；`weight` 保持注释状态以便手动排序 |
| `make new-doc-auto NAME=guide/my-page` | 类似 `new-doc`，但 `weight` 会自动设为该章节最后一页的下一个值 |
| `make new-page NAME=showcase/thing` | 通过默认原型在 `docs/content/` 下创建任意页面 |

### 构建与预览

| 目标 | 作用 |
|---|---|
| `make build` | 完整的生产构建，输出到 `docs/public`（先编译 CSS），不含草稿——即最终发布的内容 |
| `make preview` | **包含草稿**的生产构建，由常驻预览容器在 [localhost:8043](http://localhost:8043) 提供服务 |

### 测试

| 目标 | 作用 |
|---|---|
| `make test` | 针对全新的无草稿生产构建运行完整 Playwright 测试套件 |
| `make test-a11y` | 仅运行无障碍测试（WCAG 2.2 AA） |
| `make test-mobile` / `test-build` | 移动端菜单和构建输出测试套件 |
| `make test-preview` | 重新构建预览（含草稿），然后针对运行中的预览容器执行测试套件——你测试的正是 8043 持续提供的内容 |

### 日常维护

| 目标 | 作用 |
|---|---|
| `make fmt` | 用 Prettier 格式化模板、CSS 和 JS |
| `make doctor` | 诊断工具链问题（Hugo/Node 版本、过期二进制） |
| `make reset` | 清除并重新安装 `node_modules`——修复宿主机/devcontainer 之间的二进制冲突 |
| `make clean` / `clean-stats` / `clean-all` | 删除构建输出、stats 变动或全部内容 |

{{< callout type="info" >}}
依赖链正是关键所在：`make css` 依赖 `stats`，`make build` 依赖 `css`。上游的原生 npm 脚本要求你记住“先重新生成 stats，再构建 CSS”这套两步流程（[原因](https://github.com/smit-io/hextra/blob/main/CLAUDE.md)）；Makefile 将其固化了下来。
{{< /callout >}}

此外还有一个 `npm run watch:css` 脚本（fork 独有），与 `make css-watch` 等效，供偏好 npm 的用户使用。

## 内容脚手架

`new-*` 目标封装了 `hugo new`，因此 front matter 来自 `docs/archetypes/` 中的原型（`blog.md`、`docs.md`、`docs-weighted.md`、`default.md`），并且会拒绝覆盖已存在的文件。`NAME` 带不带 `.md` 扩展名均可，嵌套路径也没问题（`NAME=guide/deep/page`）。

值得了解的细节：

- **博客文章初始为草稿**（`draft: true`）：在 `1313` 和 `8043` 上可见，在移除该标志之前不会包含在 `make build` 中。
- **`new-doc-auto` 会计算 `weight`**：创建时扫描目标文件夹的现有页面，取最大值加一。草稿页面不计入，间隔式的 weight 约定（10、20、30……）会得到 31 而不是 40。
- **仅限英文** —— 翻译版本（`.fa.md`、`.ja.md`、`.zh-cn.md`）需手动复制到旁边，与现有内容布局保持一致。

## Devcontainer

上游使用普通的 devcontainer 镜像。本 fork 通过 **Docker Compose**（`.devcontainer/docker-compose.yml`）运行 devcontainer，包含两个服务：

- **`dev`** —— 编辑器附加到的 Go devcontainer 镜像，仓库挂载在 `/workspaces/hextra`。Devcontainer features 会安装 Hugo Extended（固定版本）和 Node 22；`postCreateCommand` 运行 `npm install`，容器首次打开即可直接构建。一组精选的 VS Code 扩展（Tailwind、Hugo、Prettier、Git Graph 等）已预先配置好。
- **`preview`** —— 一个极小（约 258 kB）的静态文件服务器（`pierrezemb/gostatic`），以只读方式提供 `docs/public` 的内容，并设置 `Cache-Control: no-store`，让你永远不会调试到过期页面。它随开发容器一起启动并保持运行：重新执行 `make build`（或 `make preview`）即可更新所服务的站点，无需重启容器。

`devcontainer-lock.json` 已纳入版本控制以保证工具版本可复现。`.vscode/hextra.code-snippets` 在容器内和普通宿主机检出中都会被自动加载——参见 [VS Code 代码片段](vscode-snippets)。

一个命名卷会在容器内遮蔽 `node_modules`，让容器保留自己的 Linux 原生 npm 二进制文件（例如 `lightningcss`），而宿主机保留 macOS 的版本——在任意一侧运行 `npm install` 都不会再破坏另一侧。

### 端口

两个端口都会自动转发到宿主机（`devcontainer.json` 中的 `forwardPorts`）：

| 端口 | 服务 | 提供的内容 |
|---|---|---|
| `1313` | Hugo 开发服务器（`make dev` / `make serve`） | 实时重载的开发构建 |
| `8043` | 常驻 `preview` 容器 | 来自 `docs/public` 的最近一次**生产**构建 |

这一区分很重要：`1313` 提供快速的实时重建，而 `8043` 展示生产构建——经过压缩、垃圾回收和摇树优化的 CSS。两者都包含草稿（`make preview` 会传入 `-D`，以便以生产形态检查未发布的文章）；只有 `make build` 的输出不含草稿。发布前请检查 `8043`。

{{< callout type="warning" >}}
`make test` 和 `make build` 会将配置中的 `baseURL` 写入 `docs/public`，因此执行其中任何一个之后，`8043` 上的预览所提供的构建的绝对 URL 会指向别处。重新运行 `make preview` 即可恢复——或者使用 `make test-preview`，它直接测试预览构建本身，并保持 `8043` 正确。在 devcontainer 内，`test-preview` 通过 `http://preview:8043`（compose 服务名）访问容器；在宿主机检出中，可通过 `PREVIEW_TEST_URL=http://localhost:8043` 覆盖。
{{< /callout >}}

### 典型工作流

{{% steps %}}

### 在容器中打开

VS Code → "Reopen in Container"。首次打开会自动安装 Hugo、Node 和 npm 依赖。

### 开发

运行 `make dev` 并在 [localhost:1313](http://localhost:1313) 上迭代。编辑样式时并行运行 `make css-watch`。

### 验证生产构建

`make preview` 执行生产构建，结果立即在 [localhost:8043](http://localhost:8043) 上生效——无需重启服务器，预览容器直接提供刷新后的文件。

{{% /steps %}}

## 与上游同步

本 fork 添加了两个 Makefile 目标用于跟踪 [imfing/hextra](https://github.com/imfing/hextra)：

### `make sync-setup`

一次性配置：添加 `upstream` 远程仓库、拉取标签，并创建 `upstream-main` 分支作为 `upstream/main` 的**仅快进镜像**。永远不要向它提交。

### `make sync-status`

显示当前的偏移情况——落后/领先上游的提交数、最新的上游标签——并打印**fork 专属文件**列表，这些文件预计在每次合并时都会冲突：

- `assets/css/styles.css` —— 强调色/浅色/深色调色板
- `assets/css/fonts.css` 和 `layouts/_partials/google-fonts.html` —— fork 独有的 Google Fonts
- `assets/css/components/*.css` 和 `layouts/_partials/*.html` —— 强调色主题化
- `static/icons/` —— favicon 目录重组
- `.devcontainer/`、`Makefile` —— fork 独有的工具

### 同步工作流

{{% steps %}}

### 每次只合并一个发布标签

逐个合并 `v0.x.y` 标签，而不是直接跳到 `upstream/main`——冲突保持在小范围内，且每次合并都可以测试。

### 冲突解决优先采用 fork 的令牌

当上游新增组件时，在合并过程中同时为它们应用强调色/调色板令牌（参见 fork 的历史记录："Apply accent theming to upstream's new components"）。

### 构建产物用重新生成代替合并

`assets/css/compiled/main.css` 和 `docs/hugo_stats.json` 是生成文件。永远不要手动解决其中的冲突——任选一侧，然后运行 `make css` 重新生成。

{{% /steps %}}
