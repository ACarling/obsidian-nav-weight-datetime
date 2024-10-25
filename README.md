# Obsidian Nav Weight

> A sample plugin designed to sort files in navigation based on markdown frontmatter (also known as metadata) for Obsidian.

This plugin sorts files by recognizing the `weight` key defined in the markdown frontmatter, using its value as a criterion for ordering.

While there are several plugins available that offer customization of navigation, I created this particular plugin because others tend to be overly complex for a lazy person like me.

## Usage

### Data Preparation 

Define some `weight` in your markdown files, like:
``` markdown
---
weight: 1
---
```

### Sort

Click the following icon in the left ribbon.

![](./assets/sort-icon.svg)

### Result check

You can find one of the following icons in the bottom status bar, move your mouse over the icon to get the tool-tip.

![](./assets/question-icon.svg)
![](./assets/check-icon.svg)


---
> [!TIP]
> If you are using [mkdocs](https://www.mkdocs.org/) as publisher, you can find the similar plugin mkdocs-nav-weight for mkdocs at [here](https://github.com/shu307/mkdocs-nav-weight).
> 
> **All features of "mkdocs-nav-weight" have been implemented in this plugin**.
> 
> After sorting, you may encounter the following icons, which respectively represent `headless: true` and `retitled: true`, displayed alongside the names of files or folders.
>
> ![](./assets/leaf.svg) `headless: true` 
> 
> ![](./assets/text-cursor-input.svg) `retitled: true`
>  