---
title: Configuration
weight: 2
tags:
  - Config
---

Hugo reads its configuration from `hugo.yaml` in the root of your Hugo site.
The config file is where you can configure all aspects of your site.
Check out the config file for this site [`exampleSite/hugo.yaml`](https://github.com/imfing/hextra/blob/main/exampleSite/hugo.yaml) on GitHub to get a comprehensive idea of available settings and best practices.

<!--more-->

## Navigation

### Menu

Top right menu is defined under the `menu.main` section in the config file:

```yaml {filename="hugo.yaml"}
menu:
  main:
    - name: Documentation
      pageRef: /docs
      weight: 1
    - name: Blog
      pageRef: /blog
      weight: 2
    - name: About
      pageRef: /about
      weight: 3
    - name: Search
      weight: 4
      params:
        type: search
    - name: GitHub
      weight: 5
      url: "https://github.com/imfing/hextra"
      params:
        icon: github
```

There are different types of menu items:

1. Link to a page in the site with `pageRef`
    ```yaml
    - name: Documentation
      pageRef: /docs
    ```
2. Link to an external URL with `url`
    ```yaml
    - name: GitHub
      url: "https://github.com"
    ```
3. Search bar with `type: search`
    ```yaml
    - name: Search
      params:
        type: search
    ```
4. Icon
    ```yaml
    - name: GitHub
      params:
        icon: github
    ```

These menu items can be sorted by setting the `weight` parameter.

### Logo and Title

To modify the default logo, edit `hugo.yaml` and add the path to your logo file under `static/icons` directory.
Optionally, you can change the link that users are redirected to when clicking on your logo, as well as set the width & height of the logo in pixels.

```yaml {filename="hugo.yaml"}
params:
  navbar:
    displayTitle: true
    displayLogo: true
    logo:
      path: icons/images/logo.svg
      dark: icons/images/logo-dark.svg
      link: /
      width: 40
      height: 20
```

## Sidebar

### Main Sidebar

For the main sidebar, it is automatically generated from the structure of the content directory.
See the [Organize Files](/docs/guide/organize-files) page for more details.

To exclude a single page from the left sidebar, set the `sidebar.exclude` parameter in the front matter of the page:

```yaml {filename="content/docs/guide/configuration.md"}
---
title: Configuration
sidebar:
  exclude: true
---
```

### Extra Links

Sidebar extra links are defined under the `menu.sidebar` section in the config file:

```yaml {filename="hugo.yaml"}
menu:
  sidebar:
    - name: More
      params:
        type: separator
      weight: 1
    - name: "About"
      pageRef: "/about"
      weight: 2
    - name: "Hugo Docs ↗"
      url: "https://gohugo.io/documentation/"
      weight: 3
```

## Right Sidebar

### Table of Contents

Table of contents is automatically generated from the headings in the content file. It can be disabled by setting `toc: false` in the front matter of the page.

```yaml {filename="content/docs/guide/configuration.md"}
---
title: Configuration
toc: false
---
```

### Page Edit Link

To configure the page edit link, we can set the `params.editURL.base` parameter in the config file:

```yaml {filename="hugo.yaml"}
params:
  editURL:
    enable: true
    base: "https://github.com/your-username/your-repo/edit/main"
```

The edit links will be automatically generated for each page based on the provided url as root directory.
If you want to set edit link for a specific page, you can set the `editURL` parameter in the front matter of the page:

```yaml {filename="content/docs/guide/configuration.md"}
---
title: Configuration
editURL: "https://example.com/edit/this/page"
---
```

## Footer

### Copyright

To modify the copyright text displayed in your website's footer, you'll need to create a file named `i18n/en.yaml`.
In this file, specify your new copyright text as shown below:

```yaml {filename="i18n/en.yaml"}
copyright: "© 2024 YOUR TEXT HERE"
```

For your reference, an example [`i18n/en.yaml`](https://github.com/imfing/hextra/blob/main/i18n/en.yaml) file can be found in the GitHub repository. Additionally, you could use Markdown format in the copyright text.

## Others

### Favicon

To customize the [favicon](https://en.wikipedia.org/wiki/Favicon) for your site, place icon files under the `static/icons` folder to override the [default favicons from the theme](https://github.com/imfing/hextra/tree/main/static):

{{< filetree/container >}}
  {{< filetree/folder name="static" >}}
    {{< filetree/folder name="icons" >}}
      {{< filetree/file name="android-chrome-192x192.png" >}}
      {{< filetree/file name="android-chrome-512x512.png" >}}
      {{< filetree/file name="apple-touch-icon.png" >}}
      {{< filetree/file name="favicon-16x16.png" >}}
      {{< filetree/file name="favicon-32x32.png" >}}
      {{< filetree/file name="favicon-dark.svg" >}}
      {{< filetree/file name="favicon.ico" >}}
      {{< filetree/file name="favicon.svg" >}}
      {{< filetree/file name="site.webmanifest" >}}
    {{< /filetree/folder >}}
  {{< /filetree/folder >}}
{{< /filetree/container >}}

Include `favicon.ico`, `favicon.svg` and `favicon-dark.svg` files in your project to ensure your site's favicons display correctly.

While `favicon.ico` is generally for older browsers, `favicon.svg` and `favicon-dark.svg` are supported by modern browsers.
Use tools like [favicon.io](https://favicon.io/) or [favycon](https://github.com/ruisaraiva19/favycon) to generate such icons.

### Theme Configuration

Use the `theme` setting to configure the default theme mode and toggle button, allowing visitors to switch between light or dark mode.

```yaml {filename="hugo.yaml"}
params:
  theme:
    # light | dark | system
    default: system
    displayToggle: true
```

Options for `theme.default`:

- `light` - always use light mode
- `dark` - always use dark mode
- `system` - sync with the operating system setting (default)

The `theme.displayToggle` parameter allows you to display a toggle button for changing themes.
When set to `true`, visitors can switch between light or dark mode, overriding the default setting.

### Page Last Modification

The date of the page's last modification can be displayed by enabling the `params.displayUpdatedDate` flag. To use Git commit date as the source, enable also the `enableGitInfo` flag.

To customize the date format, set the `params.dateFormat` parameter. Its layout matches Hugo's [`time.Format`](https://gohugo.io/functions/time/format/).

```yaml {filename="hugo.yaml"}
# Parse Git commit
enableGitInfo: true

params:
  # Display the last modification date
  displayUpdatedDate: true
  dateFormat: "January 2, 2006"
```

### Tags

To display page tags, set following flags in the config file:

```yaml {filename="hugo.yaml"}
params:
  blog:
    list:
      displayTags: true
  toc:
    displayTags: true
```

### Page Width

The width of the page can be customized by the `params.page.width` parameter in the config file:

```yaml {filename="hugo.yaml"}
params:
  page:
    # full (100%), wide (90rem), normal (1280px)
    width: wide
```

There are three available options: `full`, `wide`, and `normal`. By default, the page width is set to `normal`.

Similarly, the width of the navbar and footer can be customized by the `params.navbar.width` and `params.footer.width` parameters.

### FlexSearch Index

Full-text search powered by [FlexSearch](https://github.com/nextapps-de/flexsearch) is enabled by default.
To customize the search index, set the `params.search.flexsearch.index` parameter in the config file:

```yaml {filename="hugo.yaml"}
params:
  # Search
  search:
    enable: true
    type: flexsearch

    flexsearch:
      # index page by: content | summary | heading | title
      index: content
```

Options for `flexsearch.index`:

- `content` - full content of the page (default)
- `summary` - summary of the page, see [Hugo Content Summaries](https://gohugo.io/content-management/summaries/) for more details
- `heading` - level 1 and level 2 headings
- `title` - only include the page title

To customize the search tokenize, set the `params.search.flexsearch.tokenize` parameter in the config file:

```yaml {filename="hugo.yaml"}
params:
    # ...
    flexsearch:
      # full | forward | reverse | strict 
      tokenize: forward
```

Options for [`flexsearch.tokenize`](https://github.com/nextapps-de/flexsearch/#tokenizer-prefix-search):

- `strict` - index whole words
- `forward` - incrementally index words in forward direction
- `reverse` - incrementally index words in both directions
- `full` - index every possible combination

To exclude a page from the FlexSearch search index, set the `excludeSearch: true` in the front matter of the page:

```yaml {filename="content/docs/guide/configuration.md"}
---
title: Configuration
excludeSearch: true
---
```

### Google Analytics

To enable [Google Analytics](https://marketingplatform.google.com/about/analytics/), set `services.googleAnalytics.ID` flag in `hugo.yaml`:

```yaml {filename="hugo.yaml"}
services:
  googleAnalytics:
    ID: G-MEASUREMENT_ID
```

### Google Search Index

To [block Google Search](https://developers.google.com/search/docs/crawling-indexing/block-indexing) from indexing a page, set `noindex` to true in your page frontmatter:

```yaml
title: Configuration (archive version)
params:
  noindex: true
```

To exclude an entire directory, use the [`cascade`](https://gohugo.io/configuration/cascade/) key in the parent `_index.md` file.

> [!NOTE]
> To block search crawlers, you can make a [`robots.txt` template](https://gohugo.io/templates/robots/).
> However, `robots.txt` instructions do not necessarily keep a page out of Google search results.

### Open Graph

To add [Open Graph](https://ogp.me/) metadata to a page, add values in the frontmatter params.

As a page can have multiple `image` and `video` tags, place their values in an array.
Other Open Graph properties can have only one value.
For example, this page has an `og:image` tag (which configures an image to preview on social shares) and an `og:audio` tag.

```yaml {filename="content/docs/guide/configuration.md"}
title: "Configuration"
params:
  images:
    - "/img/config-image.jpg"
  audio: "config-talk.mp3"
```

### Google Fonts

The Hextra theme supports configurable Google Fonts for heading, body, and code block fonts. This feature allows you to customize the typography of your site using Google Fonts.

#### Basic Configuration

Add the following configuration to your `hugo.yaml` file:

```yaml {filename="hugo.yaml"}
params:
  # Google Fonts Configuration
  fonts:
    # Enable Google Fonts integration
    enable: true
    
    # Heading font configuration
    heading:
      family: "Inter"
      weights: [400, 500, 600, 700]
      display: "swap"
    
    # Body font configuration
    body:
      family: "Inter"
      weights: [400, 500]
      display: "swap"
    
    # Code block font configuration
    code:
      family: "JetBrains Mono"
      weights: [400, 500]
      display: "swap"
    
    # Fallback fonts (used if Google Fonts fail to load)
    fallbacks:
      heading: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      code: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
```

#### Parameters

##### `enable`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable or disable Google Fonts integration

##### `heading`, `body`, `code`
Each font type has the following parameters:

###### `family`
- **Type**: `string`
- **Description**: The Google Font family name (e.g., "Inter", "Roboto", "Open Sans")

###### `weights`
- **Type**: `array`
- **Description**: Array of font weights to load (e.g., `[400, 500, 600, 700]`)
- **Available weights**: 100, 200, 300, 400, 500, 600, 700, 800, 900

###### `display`
- **Type**: `string`
- **Default**: `"swap"`
- **Description**: Font display strategy
- **Available options**: `"auto"`, `"block"`, `"swap"`, `"fallback"`, `"optional"`

##### `fallbacks`
Fallback fonts used when Google Fonts fail to load:

###### `heading`
- **Type**: `string`
- **Description**: Fallback font stack for headings

###### `body`
- **Type**: `string`
- **Description**: Fallback font stack for body text

###### `code`
- **Type**: `string`
- **Description**: Fallback font stack for code elements

#### Popular Font Combinations

##### Modern & Clean
```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
    heading:
      family: "Inter"
      weights: [400, 500, 600, 700]
    body:
      family: "Inter"
      weights: [400, 500]
    code:
      family: "JetBrains Mono"
      weights: [400, 500]
```

##### Classic & Readable
```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
    heading:
      family: "Merriweather"
      weights: [400, 700]
    body:
      family: "Open Sans"
      weights: [400, 600]
    code:
      family: "Source Code Pro"
      weights: [400, 500]
```

##### Professional & Elegant
```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
    heading:
      family: "Playfair Display"
      weights: [400, 700]
    body:
      family: "Lato"
      weights: [400, 700]
    code:
      family: "Fira Code"
      weights: [400, 500]
```

#### Disabling Google Fonts

To disable Google Fonts and use system fonts:

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: false
```

Or simply remove the `fonts` section from your configuration.

#### Performance Considerations

1. **Font Loading**: Google Fonts are loaded asynchronously with `display: swap` by default
2. **Font Weights**: Only load the font weights you actually use to reduce file size
3. **Fallbacks**: Always provide fallback fonts for better user experience
4. **Caching**: Google Fonts are cached by browsers, improving subsequent page loads

#### Browser Support

Google Fonts are supported by all modern browsers. The theme includes fallback fonts for older browsers or when Google Fonts are unavailable.

#### Troubleshooting

##### Fonts Not Loading
1. Check that `fonts.enable` is set to `true`
2. Verify the font family name is correct (check [Google Fonts](https://fonts.google.com/))
3. Ensure the font weights are available for the selected font family

##### Performance Issues
1. Reduce the number of font weights loaded
2. Consider using system fonts for better performance
3. Use `display: "optional"` for non-critical fonts

##### Font Display Issues
1. Check that fallback fonts are properly configured
2. Verify CSS specificity isn't overriding font declarations
3. Test with different browsers to ensure compatibility
