import { FileExplorerView, TFolder, TFile, FolderItem, CachedMetadata } from "obsidian";
import { NaveightSettings } from "setting";
import SettingsUtils from "settingUtils";


export default class Sorter {

    private static fileWeightsByFolder: Record<string, Record<string, number>>
    private static fileExpView: FileExplorerView
    private static userSettings: NaveightSettings

    static startSorting(fileExpView: FileExplorerView, userSettings: NaveightSettings) {
        this.fileExpView = fileExpView
        this.userSettings = userSettings

        this.sort()
    }

    // modified from js source code
    private static sort() {

        if (!this.fileExpView.ready || !this.fileExpView.containerEl.isShown()) return

        const vault = this.fileExpView.app.vault

        // source code from js
        const itemMap = this.fileExpView.fileItems
        const tree = this.fileExpView.tree
        const navContainer = this.fileExpView.navFileContainerEl
        const scrollTop = navContainer.scrollTop

        // init all folder
        this.fileWeightsByFolder = {}
        this.fileWeightsByFolder[vault.getRoot().path] = {}
        const folderItemArr: FolderItem[] = []
        for (const k in itemMap) {
            const item = itemMap[k]
            const folderOr = item.file
            // expect folder
            if (!(itemMap.hasOwnProperty(k) && folderOr && (folderOr instanceof TFolder))) continue;

            folderItemArr.push(item as FolderItem)
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
                if (file instanceof TFolder) return this.userSettings.weightForFolder    // default for folder
                if (!(file instanceof TFile) || (file.extension !== 'md')) {  // not file or file not .md
                    return this.userSettings.weightForOtherFile
                }
                if (file.name === 'index.md') {           // index.md, set weight of folder in folder.parent
                    if (file.parent) {
                        // override default weight of folder
                        this.fileWeightsByFolder[file.parent.path][file.path] = this.getWeightOfMd(file)
                    }
                    return this.userSettings.weightForIndex
                }
                // normal .md
                return this.getWeightOfMd(file)
            })()

            // don't override exist weight(folder)
            if (!weightByPath[file.path]) weightByPath[file.path] = weight
        }
    }

    private static getWeightOfMd(mdFile: TFile) {

        // any file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
        // empty markdown: cachedMetadata = {} ( {} = true )

        const cachedMetadata = this.fileExpView.app.metadataCache.getFileCache(mdFile) as CachedMetadata
        const frontmatter = cachedMetadata.frontmatter
        if (!frontmatter)
            return this.userSettings.weightForMarkdownFile

        const rawWeight = frontmatter[this.userSettings.sortKey]
        return SettingsUtils.getInputOrDflt(String(rawWeight), 'weightForMarkdownFile') as number

    }

}