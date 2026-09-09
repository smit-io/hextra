---
title: Gist
---

A built-in component to embed a [GitHub gist](https://gist.github.com).

The gist is fetched from the GitHub API when the site is built and rendered
with the theme's own code block, so it looks like the rest of your code and the
page loads no third-party script.

## Example

{{< gist id="6cad326836d38bd3a7ae" >}}

A single file from a multi-file gist:

{{< gist id="2052694" file="README.md" >}}

## Usage

```
{{</* gist id="6cad326836d38bd3a7ae" */>}}
{{</* gist id="2052694" file="README.md" */>}}
```

The positional form Blowfish uses also works:

```
{{</* gist "octocat" "6cad326836d38bd3a7ae" "hello_world.rb" */>}}
```

### Parameters

| Parameter | Description |
|---|---|
| `id` | Required. The gist id — the hex string at the end of its URL. |
| `file` | Render only this file from the gist. Without it, every file is shown. |
| `user` | The gist owner. Accepted for compatibility with Blowfish; the API does not need it. |

## Differences from GitHub's embed

GitHub's own embed script uses `document.write`, ships GitHub's stylesheet, and
renders nothing when scripting is off. Fetching at build time instead means:

- Chroma highlighting matching the rest of the site, in both light and dark mode
- The filename header and copy button of a normal code block
- No request to GitHub when a reader loads the page

{{< callout type="warning" >}}
  Every build makes one unauthenticated GitHub API request per gist, and that
  API allows 60 requests an hour per IP. A build with many gists, or a busy
  shared CI runner, can be rate-limited. A failed fetch degrades to a plain
  link and logs a warning rather than failing the build.
{{< /callout >}}

Very large files are truncated by the GitHub API. When that happens the visible
content is partial and the build logs a warning.
