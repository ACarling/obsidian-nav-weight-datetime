import 'obsidian';

declare module 'obsidian' {
  // derive from View, treat as View
  interface View {
    ready: boolean;
    fileItems: Record<string, Item>;
    tree: {
      infinityScroll: {
        compute(): unknown;
        rootEl: FolderItem;
      }
    };
    navFileContainerEl: HTMLElement
  }

  interface Item {
    file?: TAbstractFile
  }

  interface FolderItem extends Item {
    file: TFolder
    vChildren: {
      setChildren(items: Item[]): unknown;
    }
  }
}





