# Obsidian Nav Weight

> A sample plugin designed to sort files in navigation based on markdown frontmatter (also known as metadata) for Obsidian.

This plugin sorts files by recognizing the `weight` key defined in the markdown frontmatter, using its value as a criterion for ordering.

While there are several plugins available that offer customization of navigation, I created this particular plugin because others tend to be overly complex for a lazy person like me.

## Usage

### Step 1

define some `weight` in your markdown files, like:
``` markdown
---
weight: 1
---
```

### Step 2

click the icon below in the left ribbon.

![](./sort-icon.svg)

### Done!


---
> [!TIP]
> If you are using [mkdocs](https://www.mkdocs.org/) as publisher, you can find the similar plugin mkdocs-nav-weight for mkdocs at [here](https://github.com/shu307/mkdocs-nav-weight).
> 
>  **All features of "mkdocs-nav-weight" have been implemented in this plugin**.