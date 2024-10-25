import { CHECK_SVG, HEADLESS_SVG, QUESTION_SVG, RETITLED_SVG } from "consts";
import { FileExplorerView, FolderItem, Item, setTooltip, TAbstractFile, TFile, TFolder } from "obsidian";
import { CfgFmFbk, CfgFmKey, NwtCfg } from "types/types";
import Utils from "utils";


type FmData = Record<string, CfgFmFbk[keyof CfgFmFbk]>

type FmDataByFolder = Record<string, Record<string, FmData>>

type KeyOfFmKeyFbk = { fmKey: keyof CfgFmKey, fmFbk: keyof CfgFmFbk }
type FmKeyFbk = { fmKey: CfgFmKey[keyof CfgFmKey], fmFbk: CfgFmFbk[keyof CfgFmFbk] }

const KEYS_INDEX: KeyOfFmKeyFbk[] = [
    {
        fmKey: 'key_sort',
        fmFbk: 'fbk_weight_folder',
    },
    {
        fmKey: 'key_headless_index',
        fmFbk: 'fbk_headless',
    },
    {
        fmKey: 'key_headless_md',
        fmFbk: 'fbk_headless',
    },
    {
        fmKey: 'key_retitled',
        fmFbk: 'fbk_retitled',
    }
]
const KEYS_MARKDOWN: KeyOfFmKeyFbk[] = [
    {
        fmKey: 'key_sort',
        fmFbk: 'fbk_weight_md',
    },
    {
        fmKey: 'key_headless_md',
        fmFbk: 'fbk_headless',
    }
]


export default class Sorter {

    private fileExpView: FileExplorerView
    private userConfig: NwtCfg
    private cachedFmDataByFolder: FmDataByFolder
    private statusBarEl: HTMLElement
    private cachedLogger: string[]

    private fmKeyFbkPairsIdx: FmKeyFbk[];
    private fmKeyFbkPairsMd: FmKeyFbk[];

    constructor(fileExpView: FileExplorerView, userConfig: NwtCfg, statusBarEl: HTMLElement) {
        this.fileExpView = fileExpView
        this.userConfig = userConfig
        this.cachedFmDataByFolder = {}
        this.statusBarEl = statusBarEl
        this.cachedLogger = []

        this.fmKeyFbkPairsIdx = []
        this.fmKeyFbkPairsMd = []

        for (const keyPair of KEYS_INDEX) {
            const o: FmKeyFbk = {
                fmKey: userConfig[keyPair.fmKey],
                fmFbk: userConfig[keyPair.fmFbk]
            };

            this.fmKeyFbkPairsIdx.push(o)
        }

        for (const keyPair of KEYS_MARKDOWN) {
            const o: FmKeyFbk = {
                fmKey: userConfig[keyPair.fmKey],
                fmFbk: userConfig[keyPair.fmFbk]
            };

            this.fmKeyFbkPairsMd.push(o)
        }
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
            span.innerHTML = CHECK_SVG;
            setTooltip(this.statusBarEl, 'Nav Weight: All sorted', { placement: 'top' })
            return;
        }
        span.innerHTML = QUESTION_SVG;
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
        // folder
        if (fileOr instanceof TFolder) {
            return { [this.userConfig.key_sort]: this.userConfig.fbk_weight_folder }
        }
        // others
        if (!(fileOr instanceof TFile) || (fileOr.extension !== 'md')) {
            return { [this.userConfig.key_sort]: this.userConfig.fbk_weight_other }
        }
        // index.md
        if (fileOr.name === (this.userConfig.filename_index + '.md')) {
            return this.getFmDataIdxAndSetPrt(fileOr);
        }
        // normal .md
        return this.getParsedFmOrDflt(fileOr, false);

    }

    private getFmDataIdxAndSetPrt(index: TFile): FmData {
        const parent = index.parent;
        const parsedFm = this.getParsedFmOrDflt(index, true);
        if (parent && parent.parent) {
            // parent.parent
            this.cachedFmDataByFolder[parent.parent.path][parent.path] = parsedFm;
        }
        // for index.md itself
        const fmData = {} as FmData;
        // fixed weight
        fmData[this.userConfig.key_sort] = this.userConfig.fbk_weight_index;
        // headless, but stored as md
        const empty = parsedFm[this.userConfig.key_headless_index]
        if (empty !== undefined) {
            fmData[this.userConfig.key_headless_md] = empty;
        }

        return fmData;
    }

    private getParsedFmOrDflt(mdFile: TFile, isIndex: boolean): FmData {


        const fmKFPairs = isIndex ? this.fmKeyFbkPairsIdx : this.fmKeyFbkPairsMd

        // each file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
        // empty markdown: cachedMetadata = {} ( {} = true )
        const fm = this.fileExpView.app.metadataCache.getFileCache(mdFile)?.frontmatter;

        const parsedFm = {} as FmData

        const getParsedFm = (fmKey: CfgFmKey[keyof CfgFmKey], fmFbk: CfgFmFbk[keyof CfgFmFbk]) => {
            const data = Utils.getRawAsDataOrNone(fm?.[fmKey], typeof fmFbk)
            // invalid value
            if (data === null) {
                this.catchLog(mdFile.path, fmKey, fmFbk)
                return fmFbk;
            }
            // no value
            if (data === undefined) {
                return fmFbk;
            }
            return data as CfgFmFbk[keyof CfgFmFbk];
        }

        if (this.userConfig.all_features) {
            for (const fmKF of fmKFPairs) {
                parsedFm[fmKF.fmKey] = getParsedFm(fmKF.fmKey, fmKF.fmFbk)
            }
        } else {
            const fmKF = fmKFPairs[0]
            parsedFm[fmKF.fmKey] = getParsedFm(fmKF.fmKey, fmKF.fmFbk)
        }

        return parsedFm;
    }

    private getSortedItemsAndSetIcon(folder: TFolder) {
        const fmDataInFolder = this.cachedFmDataByFolder[folder.path]
        const children = folder.children.slice();
        // sort file
        children.sort((a, b) => {
            return (fmDataInFolder[a.path][this.userConfig.key_sort] as number)
                - (fmDataInFolder[b.path][this.userConfig.key_sort] as number);
        });
        // cache item in sortedItems[] by fileItems[file.path]
        const sortedItems: Item[] = []
        for (const child of children) {
            const item = this.fileExpView.fileItems[child.path]
            if (!item) continue;
            sortedItems.push(item)

            if (!this.userConfig.all_features) continue;

            // set icon for headless/retitled
            const isFolder = child instanceof TFolder
            // all headless stored as key_headless_md
            this.setIconByFm(item, true, Boolean(fmDataInFolder[child.path][this.userConfig.key_headless_md]))
            // retitled, only available in folder
            if (!isFolder) continue;
            this.setIconByFm(item, false, Boolean(fmDataInFolder[child.path][this.userConfig.key_retitled]))
        }
        return sortedItems
    }

    private setIconByFm(item: Item, headlessOrRetitled: boolean, fmValue: boolean) {
        const selfEl = item.selfEl
        if (!selfEl) return;

        const svg = headlessOrRetitled ? HEADLESS_SVG : RETITLED_SVG
        const className = headlessOrRetitled ? 'nwt-headless' : 'nwt-retitled'

        const svgEl = selfEl.getElementsByClassName(className)[0]
        // console.log(svgEl)
        const hasEl = Boolean(svgEl)
        // same, no modify
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

    private catchLog(path: string, fmKey: CfgFmKey[keyof CfgFmKey], fmFbk: CfgFmFbk[keyof CfgFmFbk]) {
        this.cachedLogger.push(`File [${path}]: invalid value of [${fmKey}], fallback to [${fmFbk}]`);
    }

}
