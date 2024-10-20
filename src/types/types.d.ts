import 'obsidian';

declare module 'obsidian' {
  interface FileExplorerView extends View{
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





