import NaveightPlugin from "main";
import { FileExplorerView, Item, TFolder } from "obsidian";
import Sorter from "sorter";

export default class Patcher {
    private sorter: Sorter;
    private plugin: NaveightPlugin;
    private fileExplorerView: FileExplorerView;
    private inSorting = false;
    private originalFunc: (folder: TFolder) => Item[];
    private boundOriginalFunc: (folder: TFolder) => Item[];
    private boundPatchedFunc: (folder: TFolder) => Item[];

    constructor(sorter: Sorter, plugin: NaveightPlugin, fileExplorerView: FileExplorerView) {
        this.sorter = sorter;
        this.plugin = plugin;
        this.fileExplorerView = fileExplorerView;

        // console.log(this.getSortedFolderItemsOriginal);
        this.patchOriginal();
    }
    private patchOriginal() {
        try {
            // store original function
            this.originalFunc = this.fileExplorerView.getSortedFolderItems;
            // calling from patched function
            this.boundOriginalFunc = this.originalFunc.bind(this.fileExplorerView);
            // patched function
            const boundPatchedFunc = this.getSortedFolderItemsPatched.bind(this);
            this.boundPatchedFunc = boundPatchedFunc;
            this.fileExplorerView.getSortedFolderItems = boundPatchedFunc;
            // console.log("nav weight: patched");
        } catch (e) {
            const msg =
                "Patching failed.\nOriginal function not found.\nPlease manually restart Obsidian to retry or disable this plugin.";
            this.plugin.setStatusBar(msg, "!");
            throw e;
        }
    }
    unPatch() {
        if (this.originalFunc == undefined) return;
        if (this.fileExplorerView.getSortedFolderItems !== this.boundPatchedFunc) {
            const msg =
                "Unpatch failed.\nMay another plugin patched same function.\nPlease manually restart Obsidian to cleanup.";
            this.plugin.setStatusBar(msg, "!");

            return;
        }
        this.fileExplorerView.getSortedFolderItems = this.originalFunc;
        // console.log("nav weight: unpatched");
    }

    //! This depends on the implementation of the original "sort()" method, which inputs "root" as last.
    //! If the original method is modified, this will fail.
    private getSortedFolderItemsPatched(folder: TFolder) {
        const sorter = this.sorter;
        if (!this.inSorting) {
            this.inSorting = true;
            try {
                sorter.prepareSorting();
            } catch (e) {
                const msg = `Error in preparing sorting caches:\n${e}`;
                this.plugin.setStatusBar(msg, "!");
                throw e;
            }
            // console.log("inSorting, true ==", this.inSorting);
        }
        let sortedItems;
        try {
            if (sorter.isOn) {
                sortedItems = sorter.getItemsAndSetIcons(folder, this.boundOriginalFunc(folder));
            } else {
                sortedItems = this.boundOriginalFunc(folder);
            }
        } catch (e) {
            const msg = `Error in sorting:\n${e}`;
            this.plugin.setStatusBar(msg, "!");
            throw e;
        }

        // ! Last folder item, do some cleanup
        if (folder.isRoot()) {
            this.inSorting = false; // reset sorting flag
            sorter.needCleanupIcons = false;
            // console.log("inCleanup, false ==", this.inSorting);
        }

        return sortedItems;
    }
}
