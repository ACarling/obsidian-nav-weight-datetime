import 'obsidian';

declare module 'obsidian' {
  interface FileExplorerView extends View {
    ready: boolean;
    fileItems: Record<string, Item | undefined>;
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
    selfEl?: HTMLElement
    vChildren?: {
      setChildren(items: Item[]): unknown;
    }
  }

  interface FolderItem extends Item {
    file: TFolder
    vChildren: {
      setChildren(items: Item[]): unknown;
    }
  }
}





