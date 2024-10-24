import { FileExplorerView, TFolder, TFile, FolderItem, TAbstractFile, Item, setTooltip } from "obsidian";
import { CfgFmFbk, CfgFmKey, NwtCfg } from "setting";
import Utils from "utils";


export type LogMsg = {
    path: string
    fmKey: CfgFmKey[keyof CfgFmKey]
    fmFbk: CfgFmFbk[keyof CfgFmFbk]
}


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

type ParsedFm = Record<keyof FmKF, CfgFmFbk[keyof CfgFmFbk]>

type FmData = {
    weight: number;
    headless?: boolean
    retitled?: boolean
}

type FmDataByFolder = Record<string, Record<string, FmData>>


const headlessSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-minus-2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/></svg>'
const retitledSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-pen-line"><path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><path d="M8 18h1"/></svg>'
export const questionSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-question"><path d="M12 17h.01"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/></svg>'
const checkSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-check"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>'


const fmKFIdx: FmKF = {
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
const fmKFMd: FmKF = {
    weight: {
        fmKey: 'key_sort',
        fmFbk: 'fbk_weight_md',
    },
    headless: {
        fmKey: 'key_headless_md',
        fmFbk: 'fbk_headless',
    }
}


export default class Sorter {

    private fileExpView: FileExplorerView
    private userConfig: NwtCfg
    private cachedFmDataByFolder: FmDataByFolder
    private statusBarEl: HTMLElement
    private cachedLogger: string[]


    constructor(fileExpView: FileExplorerView, userConfig: NwtCfg, statusBarEl: HTMLElement) {
        this.fileExpView = fileExpView
        this.userConfig = userConfig
        this.cachedFmDataByFolder = {}
        this.statusBarEl = statusBarEl
        this.cachedLogger = []
    }

    // modified from js source code
    sort() {

        if (false === (this.fileExpView.ready && this.fileExpView.containerEl.isShown())) return

        // init cache
        this.cachedFmDataByFolder = {}
        this.cachedLogger = []

        const vault = this.fileExpView.app.vault

        // source code from js
        const itemsByPath = this.fileExpView.fileItems
        const tree = this.fileExpView.tree
        const navContainer = this.fileExpView.navFileContainerEl
        const scrollTop = navContainer.scrollTop

        // init FmData
        const folderItems: FolderItem[] = []

        const rootPath = vault.getRoot().path
        this.cachedFmDataByFolder[rootPath] = {}
        for (const path in itemsByPath) {
            const item = itemsByPath[path]
            const folder = item?.file
            // expect a folder
            const isFolderItem = itemsByPath.hasOwnProperty(path)
                && Boolean(item?.vChildren)
                && folder instanceof TFolder
            if (false === isFolderItem) continue;

            folderItems.push(item as FolderItem)
            this.cachedFmDataByFolder[folder.path] = {};
        }

        // cache FmData
        this.cacheFmDataChildren(vault.getRoot())
        for (const folderItem of folderItems) {
            // definitely a folder
            this.cacheFmDataChildren(folderItem.file)
        }

        // console.log(this.cachedFmDataByFolder)

        // use FmData
        tree.infinityScroll.rootEl.vChildren.setChildren(this.getSortedItemsAndSetIcon(vault.getRoot()))
        for (const folderItem of folderItems) {
            folderItem.vChildren.setChildren(this.getSortedItemsAndSetIcon(folderItem.file))
        }

        navContainer.scrollTop = scrollTop
        tree.infinityScroll.compute()

        // set status bar
        // console.log(this.cachedLogger)

        const span = this.statusBarEl.getElementsByClassName('status-bar-item-icon')[0];

        if (this.cachedLogger.length === 0) {
            span.innerHTML = checkSVG;
            setTooltip(this.statusBarEl, 'Nav Weight: All sorted', { placement: 'top' })
            return;
        }
        span.innerHTML = questionSVG;
        const title = 'Nav Weight:\n' + this.cachedLogger.join('\n')
        setTooltip(this.statusBarEl, title, { placement: 'top' })

        // deleted !isShown source code, do nothing
    }


    private cacheFmDataChildren(folder: TFolder) {
        const fmDataInFolder = this.cachedFmDataByFolder[folder.path]

        // iterate files in folder
        for (const child of folder.children) {
            const fmData = this.getFmDataChild(child);

            // don't override folder's fmData written by index.md
            if (fmDataInFolder[child.path] !== undefined) continue;

            fmDataInFolder[child.path] = fmData;
        }

    }

    private getFmDataChild(fileOr: TAbstractFile): FmData {
        let fmData = {} as FmData

        // folder
        if (fileOr instanceof TFolder) {
            fmData.weight = this.userConfig.fbk_weight_folder;
        }
        // others
        else if (!(fileOr instanceof TFile) || (fileOr.extension !== 'md')) {
            fmData.weight = this.userConfig.fbk_weight_other;
        }
        // index.md
        else if (fileOr.name === (this.userConfig.filename_index + '.md')) {
            fmData = this.getFmDataIdxAndSetPrt(fileOr, fmData);
        }
        // normal .md
        else {
            fmData = this.getFmDataMd(fileOr as TFile, fmData);
        }

        return fmData;
    }

    private getFmDataMd(md: TFile, fmData: FmData): FmData {
        const parsedFm = this.getParsedFmOrDflt(md, false);
        fmData.weight = parsedFm.weight as number;
        fmData.headless = parsedFm.headless as boolean;
        return fmData;
    }

    private getFmDataIdxAndSetPrt(index: TFile, fmData: FmData): FmData {
        const parent = index.parent;
        const parsedFm = this.getParsedFmOrDflt(index, true);
        if (parent && parent.parent) {
            const parentFmData = {} as FmData;
            parentFmData.weight = parsedFm.weight as number;
            parentFmData.headless = parsedFm.headless as boolean;
            parentFmData.retitled = parsedFm.retitled as boolean;
            // parent.parent
            this.cachedFmDataByFolder[parent.parent.path][parent.path] = parentFmData;
        }
        // for index.md itself
        fmData.weight = this.userConfig.fbk_weight_index;
        fmData.headless = parsedFm.empty as boolean;
        return fmData;
    }

    private getParsedFmOrDflt(mdFile: TFile, isIndex: boolean): ParsedFm {

        const fmKF: FmKF = isIndex ? fmKFIdx : fmKFMd

        // each file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
        // empty markdown: cachedMetadata = {} ( {} = true )
        const fm = this.fileExpView.app.metadataCache.getFileCache(mdFile)?.frontmatter;

        const parsedFm = {} as ParsedFm
        for (const key in fmKF) {
            const k = key as keyof FmKF
            const kf = fmKF[k] as KF

            const fmKey = this.userConfig[kf.fmKey]
            const fmFbk = this.userConfig[kf.fmFbk]

            const rawData = fm?.[fmKey];

            const msg = {
                path: mdFile.path,
                fmKey: fmKey,
                fmFbk: fmFbk
            }
            parsedFm[k] = Utils.getRawAsDataOrDflt(rawData, fmFbk, this, msg);
        }

        return parsedFm;
    }

    private getSortedItemsAndSetIcon(folder: TFolder) {
        const fmDataInFolder = this.cachedFmDataByFolder[folder.path]
        const children = folder.children.slice();
        // sort file
        children.sort((a, b) => { return fmDataInFolder[a.path].weight - fmDataInFolder[b.path].weight; });
        // cache item in sortedItems[] by fileItems[file.path]
        const sortedItems: Item[] = []
        for (const child of children) {
            const item = this.fileExpView.fileItems[child.path]
            if (!item) continue;
            sortedItems.push(item)
            // set icon use fmData
            this.setIconByFm(item, true, Boolean(fmDataInFolder[child.path].headless))
            this.setIconByFm(item, false, Boolean(fmDataInFolder[child.path].retitled))
        }
        return sortedItems
    }

    private setIconByFm(item: Item, headlessOrRetitled: boolean, fmValue: boolean) {
        const selfEl = item.selfEl
        if (!selfEl) return;

        const svg = headlessOrRetitled ? headlessSVG : retitledSVG
        const className = headlessOrRetitled ? 'nwt-headless' : 'nwt-retitled'

        const svgEl = selfEl.getElementsByClassName(className)[0]
        // console.log(svgEl)
        const hasEl = Boolean(svgEl)
        // Expected and actual are consistent, no modification needed
        if (fmValue === hasEl) return;
        // hasEl is false, but fmValue is true, add svg
        if (hasEl) {
            selfEl.removeChild(svgEl);
            selfEl.setAttribute(className, 'false')
        }
        // hseEl is true, but fmValue is false, remove svg 
        else {
            const div = selfEl.createDiv({ cls: ['nav-file-tag', className] })
            div.innerHTML = svg
        }

    }

    catchLogger(msg: LogMsg) {
        this.cachedLogger.push(`File [${msg.path}]: invalid value of [${msg.fmKey}], fallback to [${msg.fmFbk}]`);
    }

}
