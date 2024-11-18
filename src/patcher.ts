import { FileExplorerView, Item, Notice, TFolder } from "obsidian";
import Sorter from "sorter";

export default class Patcher {
    private static sorter: Sorter;
    private static fileExplorerView: FileExplorerView;
    private static getSortedFolderItemsOriginal: (folder: TFolder) => Item[];
    private static inSorting = false;

    constructor(sorter: Sorter, fileExplorerView: FileExplorerView) {
        Patcher.sorter = sorter;
        Patcher.fileExplorerView = fileExplorerView;
        Patcher.getSortedFolderItemsOriginal = fileExplorerView.getSortedFolderItems;
        this.patchOriginal();
    }
    private patchOriginal() {
        // Object.getPrototypeOf(Patcher.fileExplorerView).sort = Patcher.sortPatched;
        Patcher.fileExplorerView.getSortedFolderItems = Patcher.getSortedFolderItemsPatched;
        // console.log("nav weight: patched");
    }
    unPatch() {
        if (Patcher.fileExplorerView.getSortedFolderItems !== Patcher.getSortedFolderItemsPatched) {
            new Notice(
                "Nav Weight\nUnpatch failed.\nMay another plugin patched same function.\nPlease manually restart Obsidian to cleanup.",
                5000
            );
            return;
        }
        Patcher.fileExplorerView.getSortedFolderItems = Patcher.getSortedFolderItemsOriginal;
        // console.log("nav weight: unpatched");
    }

    //! This depends on the implementation of the original "sort()" method, which inputs "root" as last.
    //! If the original method is modified, this will fail.
    private static getSortedFolderItemsPatched(folder: TFolder) {
        const sorter = Patcher.sorter;
        if (!Patcher.inSorting) {
            Patcher.inSorting = true;
            try {
                sorter.prepareSorting();
            } catch (e) {
                const msg = `Error in preparing sorting caches:\n${e}`;
                this.sorter.plugin.setStatusBar(msg, "!");
            }
            // console.log("inSorting, true ==", Patcher.inSorting);
        }
        let sortedItems;
        try {
            sortedItems = sorter.isOn
                ? sorter.getItemsAndSetIcons(folder)
                : Patcher.getSortedFolderItemsOriginal.call(Patcher.fileExplorerView, folder);
        } catch (e) {
            const msg = `Error in sorting:\n${e}`;
            this.sorter.plugin.setStatusBar(msg, "!");
        }

        // ! Last folder item, do some cleanup
        if (folder.isRoot()) {
            Patcher.inSorting = false; // reset sorting flag
            sorter.needCleanupIcons = false;
            // console.log("inCleanup, false ==", Patcher.inSorting);
        }

        return sortedItems;
    }
}
