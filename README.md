# Obsidian Nav Weight

> A sample plugin designed to sort files in navigation based on markdown frontmatter (also known as metadata) for Obsidian.

This plugin sorts files by recognizing the `weight` key defined in the markdown frontmatter, using its value as a criterion for ordering.

While there are several plugins available that offer customization of navigation, I created this particular plugin because others tend to be overly complex for a lazy person like me.

## Usage

### Step 1

define some `weight`s in your markdown files, like:
``` markdown
---
weight: 1
---
```

### Step 2

click the ![](./arrow-down-narrow-wide.svg) icon in the left ribbon.

**Done!**

---
> [!TIP]
> If you are using [mkdocs](https://www.mkdocs.org/), you can find the similar plugin at [here](https://github.com/shu307/mkdocs-nav-weight) .