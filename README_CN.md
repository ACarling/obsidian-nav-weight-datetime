# Nav Weight

[[中文](./README_CN.md)]

> 一个简单插件，根据 Markdown frontmatter（也称为 metadata 元数据）对 Obsidian 中的文件进行排序。

此插件通过获取在 Markdown frontmatter 中定义的 `weight` 键的值作为权重来对文件进行排序。

市场已有许多插件可用于自定义导航，但我还是更习惯这种方式，所以写了这个插件。

## 使用

确保左侧边栏中的下面这个图标是激活状态。

![arrow-down-0-1.svg](./assets/arrow-down-0-1.svg)

### 数据准备

在 markdown 文件中定义一个 `weight` :

```markdown
---
weight: 1
---
```

> [!NOTE]
> 要对一个文件夹进行排序，你需要在其中包含一个 `index` 索引文件。`index` 的文件名称可以在设置中配置。`index` 中的 `weight` 将被用作文件夹的 `weight`。此外，`index` 本身也有一个**固定的** `weight`，也可以在设置中配置。

### 排序

只要边栏的图标是点亮状态，排序是自动的

### 查看结果

你会在底部状态栏中看到以下图标，将鼠标悬停在图标上以查看提示信息。

![file-check.svg](./assets/file-check.svg)
![file-x.svg](./assets/file-x.svg)
![file-warning.svg](./assets/file-warning.svg)

## 其它功能

> [!TIP]
> 如果你使用 [MkDocs](https://www.mkdocs.org/) 作为文档生成器，那你能在[这里](https://github.com/shu307/mkdocs-nav-weight)找到类似的 MkDocs 插件.

mkdocs-nav-weight 的所有功能都已在此插件中实现，但你需要在设置中**手动启用**。

排序后，你可能会在文件或文件夹名旁看到以下图标，它们分别表示 `headless: true` 或 `empty: true`，以及 `retitled: true`。

![leaf.svg](./assets/leaf.svg) ![text-cursor-input.svg](./assets/text-cursor-input.svg)
