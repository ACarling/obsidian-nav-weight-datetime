# Obsidian Nav Weight

> A sample plugin designed to sort files in navigation based on markdown frontmatter (also known as metadata) for Obsidian.

This plugin sorts files by recognizing the `weight` key defined in the markdown frontmatter, using its value as a criterion for ordering.

While there are several plugins available that offer customization of navigation, I created this particular plugin because others tend to be overly complex for a lazy person like me.

# Usage

## Step 1

define some `weight`s in your markdown files, like:
``` markdown
---
weight: 1
---
```

# Step 2

click the ![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFycm93LWRvd24tbmFycm93LXdpZGUiPjxwYXRoIGQ9Im0zIDE2IDQgNCA0LTQiLz48cGF0aCBkPSJNNyAyMFY0Ii8+PHBhdGggZD0iTTExIDRoNCIvPjxwYXRoIGQ9Ik0xMSA4aDciLz48cGF0aCBkPSJNMTEgMTJoMTAiLz48L3N2Zz4=) icon in the left ribbon.

**done!**
