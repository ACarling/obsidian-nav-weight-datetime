import { SettingPairs } from "settings";
import { View, TFolder, TFile, FolderItem } from "obsidian";
import SettingsUtils from "settingsUtils";

export default class Sorter {

    private static fileWeightsByFolder: Record<string, Record<string, number>>
    private static fileExpView: View
    private static settings: SettingPairs

    static startSorting(fileExpView: View, settings: SettingPairs) {
        this.fileExpView = fileExpView
        this.settings = settings

        this.sort()
    }

    // modified from js source code
    private static sort() {

        if (!this.fileExpView.ready || !this.fileExpView.containerEl.isShown()) return

        const vault = this.fileExpView.app.vault

        // source code from js
        const items = this.fileExpView.fileItems
        const tree = this.fileExpView.tree
        const navContainer = this.fileExpView.navFileContainerEl
        const scrollTop = navContainer.scrollTop

        // init all folder
        this.fileWeightsByFolder = {}
        this.fileWeightsByFolder[vault.getRoot().path] = {}
        const folderItemArr: FolderItem[] = []
        for (const k in items) {
            const folderItemOr = items[k]
            const folderOr = folderItemOr.file
            // expect folder
            if (!(items.hasOwnProperty(k) && folderOr && (folderOr instanceof TFolder))) continue;

            folderItemArr.push(folderItemOr as FolderItem)
            this.fileWeightsByFolder[folderOr.path] = {}
        }

        // gen all weights
        this.genWeightsByPath(vault.getRoot())
        for (const folderItem of folderItemArr) {
            // definitely a folder
            this.genWeightsByPath(folderItem.file as TFolder)
        }

        // sort all by weight
        tree.infinityScroll.rootEl.vChildren.setChildren(this.getSortedFolderItems(vault.getRoot()))
        for (const folderItem of folderItemArr) {
            folderItem.vChildren.setChildren(this.getSortedFolderItems(folderItem.file))
        }


        // debug
        // console.log(this.fileWeightsByFolder)

        navContainer.scrollTop = scrollTop
        tree.infinityScroll.compute()

        // deleted !isShown source code, do nothing
    }

    private static getSortedFolderItems = function (folder: TFolder) {
        const weightByPath = this.fileWeightsByFolder[folder.path]
        const children = folder.children.slice();
        children.sort((a, b) => { return weightByPath[a.path] - weightByPath[b.path]; });

        const sortedItems = []
        for (const child of children) {
            sortedItems.push(this.fileExpView.fileItems[child.path])
        }
        return sortedItems
    }

    private static genWeightsByPath(folder: TFolder) {
        const weightByPath = this.fileWeightsByFolder[folder.path]

        // iterate files in folder
        for (const file of folder.children) {
            const weight = (() => {
                if (file instanceof TFolder) return this.settings.weightForFolder    // default for folder
                if (!(file instanceof TFile) || (file.extension !== 'md')) {  // not file or file not .md
                    return this.settings.weightForOtherFile
                }
                if (file.name === 'index.md') {           // index.md, set weight of folder in folder.parent
                    if (file.parent) {
                        // override default weight of folder
                        this.fileWeightsByFolder[file.parent.path][file.path] = this.getWeightOfMd(file)
                    }
                    return this.settings.weightForIndex
                }
                // normal .md
                return this.getWeightOfMd(file)
            })()

            // don't override exist weight(folder)
            if (!weightByPath[file.path]) weightByPath[file.path] = weight
        }
    }

    private static getWeightOfMd(file: TFile) {
        const cachedMetadata = this.fileExpView.app.metadataCache.getFileCache(file)
        // file with .md bu not markdown
        if (!cachedMetadata) {
            return this.settings.weightForOtherFile
        }
        // get weight or default
        const weight = SettingsUtils.getNumberOrNull(cachedMetadata.frontmatter && cachedMetadata.frontmatter[this.settings.sortKey])
        return weight ? weight : this.settings.weightForMarkdownFile
    }

}