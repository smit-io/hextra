# Google Fonts Support for Hextra

This document explains how to configure Google Fonts for the Hextra Hugo theme.

## Overview

The Hextra theme now supports configurable Google Fonts for:
- **Heading fonts** (h1, h2, h3, h4, h5, h6)
- **Body fonts** (paragraphs, lists, tables, etc.)
- **Code fonts** (code blocks, inline code, keyboard elements)

## Configuration

Add the following configuration to your `hugo.yaml` file:

```yaml
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

## Parameters

### `enable`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable or disable Google Fonts integration

### `heading`, `body`, `code`
Each font type has the following parameters:

#### `family`
- **Type**: `string`
- **Description**: The Google Font family name (e.g., "Inter", "Roboto", "Open Sans")

#### `weights`
- **Type**: `array`
- **Description**: Array of font weights to load (e.g., `[400, 500, 600, 700]`)
- **Available weights**: 100, 200, 300, 400, 500, 600, 700, 800, 900

#### `display`
- **Type**: `string`
- **Default**: `"swap"`
- **Description**: Font display strategy
- **Available options**: `"auto"`, `"block"`, `"swap"`, `"fallback"`, `"optional"`

### `fallbacks`
Fallback fonts used when Google Fonts fail to load:

#### `heading`
- **Type**: `string`
- **Description**: Fallback font stack for headings

#### `body`
- **Type**: `string`
- **Description**: Fallback font stack for body text

#### `code`
- **Type**: `string`
- **Description**: Fallback font stack for code elements

## Popular Font Combinations

### Modern & Clean
```yaml
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

### Classic & Readable
```yaml
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

### Professional & Elegant
```yaml
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

## Disabling Google Fonts

To disable Google Fonts and use system fonts:

```yaml
params:
  fonts:
    enable: false
```

Or simply remove the `fonts` section from your configuration.

## Performance Considerations

1. **Font Loading**: Google Fonts are loaded asynchronously with `display: swap` by default
2. **Font Weights**: Only load the font weights you actually use to reduce file size
3. **Fallbacks**: Always provide fallback fonts for better user experience
4. **Caching**: Google Fonts are cached by browsers, improving subsequent page loads

## Browser Support

Google Fonts are supported by all modern browsers. The theme includes fallback fonts for older browsers or when Google Fonts are unavailable.

## Troubleshooting

### Fonts Not Loading
1. Check that `fonts.enable` is set to `true`
2. Verify the font family name is correct (check [Google Fonts](https://fonts.google.com/))
3. Ensure the font weights are available for the selected font family

### Performance Issues
1. Reduce the number of font weights loaded
2. Consider using system fonts for better performance
3. Use `display: "optional"` for non-critical fonts

### Font Display Issues
1. Check that fallback fonts are properly configured
2. Verify CSS specificity isn't overriding font declarations
3. Test with different browsers to ensure compatibility 