---
title: Borderless Table
---

A Markdown table rendered as a quiet reference block instead of a ruled grid.

Reference material — the parameters a shortcode takes, the keys a front matter
block accepts, the options under a configuration section — reads badly in a
full grid. Every cell gets a box, and the code spans inside the cells get
another one, so the borders compete with the content they are meant to
organise. This shortcode keeps the table and drops the rules: one underline
beneath the header, hairlines between rows, nothing around the cells.

## Example

{{< borderless-table >}}
| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `series` | `[]string` | - | The series a post belongs to. |
| `seriesOrder` | `int` | - | Position within the series. Falls back to `weight`, then date. |
| `seriesOpened` | `bool` | `false` | Start the series list expanded on this post. |
{{< /borderless-table >}}

The same table without the shortcode, for comparison:

| Name           | Type       | Default | Description                                                    |
| -------------- | ---------- | ------- | -------------------------------------------------------------- |
| `series`       | `[]string` | -       | The series a post belongs to.                                  |
| `seriesOrder`  | `int`      | -       | Position within the series. Falls back to `weight`, then date. |
| `seriesOpened` | `bool`     | `false` | Start the series list expanded on this post.                   |

## Usage

Write an ordinary Markdown table and wrap it in the shortcode.

```
{{</* borderless-table */>}}
| Name | Type | Default |
| ---- | ---- | ------- |
| `series` | `[]string` | - |
| `seriesOrder` | `int` | - |
{{</* /borderless-table */>}}
```

The body is normal Markdown, so `code`, links and emphasis inside the cells
all work. Nothing else on the page changes: Markdown tables outside the
shortcode keep the default bordered styling.

## Put the identifying column first

Below the `lg` breakpoint the header row is dropped and each cell becomes its
own line, so a four-column reference reads as a stack instead of scrolling
sideways. The first cell of each row is set in bold and acts as the heading of
its group, which only works if that column is the one that identifies the row —
the parameter name, the key, the option.

## When not to use it

Reach for a plain Markdown table when the data is a grid rather than a
reference: comparisons, matrices, anything where the reader scans down a
column and needs the cell boundaries to keep their place. The borders are
doing real work there.
