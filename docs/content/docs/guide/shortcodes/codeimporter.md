---
title: Code Importer
---

A built-in component to embed a code file hosted elsewhere, without copying and
pasting it into your content.

The file is fetched when the site is built, so the page always shows the
current version of the source without any client-side requests.

## Example

{{< codeimporter url="https://raw.githubusercontent.com/smit-io/hextra/main/layouts/_shortcodes/steps.html" type="go-html-template" filename="auto" >}}

Just part of a file:

{{< codeimporter url="https://raw.githubusercontent.com/smit-io/hextra/main/layouts/_shortcodes/pdf.html" type="go-html-template" startLine="1" endLine="9" >}}

## Usage

```
{{</* codeimporter url="https://example.com/main.go" type="go" */>}}
{{</* codeimporter url="https://example.com/main.go" startLine="10" endLine="20" */>}}
```

### Parameters

| Parameter | Description |
|---|---|
| `url` | Required. URL of the file. Must be `http` or `https`. |
| `type` | Language for syntax highlighting. Defaults to the file extension. |
| `startLine` | First line to include, 1-based and inclusive. |
| `endLine` | Last line to include, inclusive. |
| `filename` | Filename header above the block. Pass `auto` to use the URL's last path segment. |

The block is rendered through the same partial as a fenced code block, so it
gets the copy button, filename header and syntax highlighting you would expect.

Line numbers outside the file are clamped to its bounds, and a `startLine`
after `endLine` logs a warning and imports the whole file.

{{< callout type="warning" >}}
  Every build makes a network request per imported file. A fetch that fails
  logs a warning and omits the block rather than failing the build, so an
  offline build still succeeds - but the page will be missing content.
{{< /callout >}}
