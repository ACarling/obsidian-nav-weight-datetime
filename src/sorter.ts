import { FileExplorerView, TFolder, TFile, FolderItem, TAbstractFile, Item } from "obsidian";
import { CfgFmFbk, CfgFmFbkIdx, CfgFmFbkMd, CfgFmFbkWt, CfgFmKey, CfgFmKeyIdx, CfgFmKeyMd, NwtCfg, RawData } from "setting";
import Utils from "utils";


type KF = {
    fmKey: keyof CfgFmKey;
    fmFbk: keyof CfgFmFbk
}

type FmKF = {
    weight: KF
    empty?: KF
    headless: KF
    retitled?: KF
}

type ParsedData = Record<keyof FmKF, CfgFmFbk[keyof CfgFmFbk]>

type FmData = {
    weight: number;
    headless?: boolean
    retitled?: boolean
}

type FmDataByFolder = Record<string, Record<string, FmData>>

export default class Sorter {

    private allFmDataByFolder: FmDataByFolder
    private fileExpView: FileExplorerView
    private userConfig: NwtCfg
    private fmKFIdx: FmKF
    private fmKFMd: FmKF
    private headlessIcon: HTMLDivElement
    private retitledIcon: HTMLDivElement

    constructor(fileExpView: FileExplorerView, userConfig: NwtCfg) {
        this.fileExpView = fileExpView
        this.userConfig = userConfig

        this.fmKFIdx = {
            weight: {
                fmKey: 'key_sort',
                fmFbk: 'fbk_weight_folder',
            },
            empty: {
                fmKey: 'key_headless_index',
                fmFbk: 'fbk_headless',
            },
            headless: {
                fmKey: 'key_headless_md',
                fmFbk: 'fbk_headless',
            },
            retitled: {
                fmKey: 'key_retitled',
                fmFbk: 'fbk_retitled',
            }
        }
        this.fmKFMd = {
            weight: {
                fmKey: 'key_sort',
                fmFbk: 'fbk_weight_md',
            },
            headless: {
                fmKey: 'key_headless_md',
                fmFbk: 'fbk_headless',
            }
        }


        this.headlessIcon = createDiv()
        this.headlessIcon.addClass('nav-file-tag')
        this.headlessIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-leaf"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
        this.retitledIcon = createDiv()
        this.retitledIcon.addClass('nav-file-tag')
        this.retitledIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-symlink"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"/><path d="m8 16 3-3-3-3"/></svg>'
    }

    // modified from js source code
    sort() {

        if (false === (this.fileExpView.ready && this.fileExpView.containerEl.isShown())) return

        // init
        this.allFmDataByFolder = {}

        const vault = this.fileExpView.app.vault

        // source code from js
        const itemsByPath = this.fileExpView.fileItems
        const tree = this.fileExpView.tree
        const navContainer = this.fileExpView.navFileContainerEl
        const scrollTop = navContainer.scrollTop

        const folderItems: FolderItem[] = []

        const rootPath = vault.getRoot().path
        this.allFmDataByFolder[rootPath] = {}
        for (const path in itemsByPath) {
            const item = itemsByPath[path]
            const folder = item?.file
            // expect a folder
            const isFolderItem = itemsByPath.hasOwnProperty(path)
                && Boolean(item?.vChildren)
                && folder instanceof TFolder
            if (false === isFolderItem) continue;

            folderItems.push(item as FolderItem)
            this.allFmDataByFolder[folder.path] = {};
        }

        // gen all weights
        this.cacheChildrenFm(vault.getRoot())
        for (const folderItem of folderItems) {
            // definitely a folder
            this.cacheChildrenFm(folderItem.file)
        }

        console.log(this.allFmDataByFolder)

        // sort all by weight
        tree.infinityScroll.rootEl.vChildren.setChildren(this.getSortedChildrenItems(vault.getRoot()))
        for (const folderItem of folderItems) {
            folderItem.vChildren.setChildren(this.getSortedChildrenItems(folderItem.file))
        }

        navContainer.scrollTop = scrollTop
        tree.infinityScroll.compute()

        // deleted !isShown source code, do nothing
    }


    private cacheChildrenFm(folder: TFolder) {
        const fmDataInFolder = this.allFmDataByFolder[folder.path]

        // iterate files in folder
        for (const child of folder.children) {
            const fmData = this.cacheChildFmAndGetWt(child);

            // don't override folder's fmData written by index.md
            if (fmDataInFolder[child.path] !== undefined) continue;

            fmDataInFolder[child.path] = fmData;
        }

    }

    private cacheChildFmAndGetWt(fileOr: TAbstractFile): FmData {
        let fmData = {} as FmData

        // folder
        if (fileOr instanceof TFolder) {
            fmData.weight = this.userConfig['fbk_weight_folder'];
        }
        // others
        else if (!(fileOr instanceof TFile) || (fileOr.extension !== 'md')) {
            fmData.weight = this.userConfig['fbk_weight_other'];
        }
        // index.md
        else if (fileOr.name === 'index.md') {
            fmData = this.cacheIdxFmAndGetWt(fileOr, fmData);
        }
        // normal .md
        else {
            fmData = this.cacheMdFmAndGetWt(fileOr as TFile, fmData);
        }

        return fmData;
    }

    private cacheMdFmAndGetWt(md: TFile, fmData: FmData): FmData {
        const parsedData = this.getParsedFmOrDflt(md, false);
        fmData.weight = parsedData.weight as number;
        fmData.headless = parsedData.headless as boolean;
        return fmData;
    }

    private cacheIdxFmAndGetWt(index: TFile, fmData: FmData): FmData {
        const parent = index.parent;
        const parsedData = this.getParsedFmOrDflt(index, true);
        if (parent && parent.parent) {
            const parentFmData = {} as FmData;
            parentFmData.weight = parsedData.weight as number;
            parentFmData.headless = parsedData.headless as boolean;
            parentFmData.retitled = parsedData.retitled as boolean;
            // parent.parent
            this.allFmDataByFolder[parent.parent.path][parent.path] = parentFmData;
        }
        // for index.md itself
        fmData.weight = this.userConfig.fbk_weight_index;
        fmData.headless = parsedData.empty as boolean;
        return fmData;
    }

    private getParsedFmOrDflt(mdFile: TFile, isIndex: boolean): ParsedData {

        const fmKF: FmKF = isIndex ? this.fmKFIdx : this.fmKFMd

        const fm = this.fileExpView.app.metadataCache.getFileCache(mdFile)?.frontmatter;

        const parsedData = {} as ParsedData
        for (const key in fmKF) {
            const k = key as keyof FmKF
            const kf = fmKF[k] as KF

            const fmKey = this.userConfig[kf.fmKey]
            const fmFbk = this.userConfig[kf.fmFbk]

            const rawData = fm?.[fmKey];

            parsedData[k] = Utils.getRawAsDataOrDflt(rawData, fmFbk) as CfgFmFbk[keyof CfgFmFbk];
        }

        return parsedData;
    }

    // each file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
    // empty markdown: cachedMetadata = {} ( {} = true )






    private getSortedChildrenItems(folder: TFolder) {
        const fmDataInFolder = this.allFmDataByFolder[folder.path]
        const children = folder.children.slice();
        children.sort((a, b) => { return fmDataInFolder[a.path].weight - fmDataInFolder[b.path].weight; });

        const sortedItems: Item[] = []
        for (const child of children) {
            const item = this.fileExpView.fileItems[child.path]
            if (!item) continue;
            sortedItems.push(item)

            this.setIconByFm(child.path, item, true, Boolean(fmDataInFolder[child.path].headless))
            this.setIconByFm(child.path, item, false, Boolean(fmDataInFolder[child.path].retitled))
        }
        return sortedItems
    }

    private setIconByFm(path: string, item: Item, headlessOrRetitled: boolean, value: boolean) {
        const selfEl = item.selfEl
        // console.log(selfEl)
        if (!selfEl) return;

        const icon = headlessOrRetitled ? this.headlessIcon : this.retitledIcon
        const key = headlessOrRetitled ? 'headless' : 'retitled'

        const isValueTrueInEl = selfEl.getAttribute(key) === 'true'

        // console.log(file.path, isItemHeadless, isElHeadless)
        if (value === isValueTrueInEl) return;
        if (value) { selfEl.appendChild(icon); selfEl.setAttribute(key, 'true'); }
        else { selfEl.removeChild(icon); selfEl.setAttribute(key, 'false') }

    }
}