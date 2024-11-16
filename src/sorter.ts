import NaveightPlugin from "main";
import { FileExplorerView, FolderItem, Item, MetadataCache, setIcon, TAbstractFile, TFile, TFolder } from "obsidian";
import { NvtCfgFmFbk, NvtCfgFmKey } from "types/types";

type FmData = {
    weight: number;
    headless: boolean;
    empty?: boolean;
    retitled?: boolean;
};
type FmDataInFolder = Record<string, FmData>;
type FmDataInVault = Record<string, FmDataInFolder>;

/** config keys of FmKey and FmFbk */
type KeysForParsingData = { storeKey: keyof FmData; fmKey: keyof NvtCfgFmKey; fmFbk: keyof NvtCfgFmFbk };

/**  config values of FmKey and FmFbk */
type ParsingData = {
    storeKey: keyof FmData;
    fmKey: NvtCfgFmKey[keyof NvtCfgFmKey];
    fmFbk: NvtCfgFmFbk[keyof NvtCfgFmFbk];
};

const KEYS_INDEX: KeysForParsingData[] = [
    {
        storeKey: "weight",
        fmKey: "key_sort",
        fmFbk: "fbk_weight_folder",
    },
    {
        storeKey: "headless",
        fmKey: "key_headless",
        fmFbk: "fbk_headless",
    },
    {
        storeKey: "empty",
        fmKey: "key_empty",
        fmFbk: "fbk_headless",
    },
    {
        storeKey: "retitled",
        fmKey: "key_retitled",
        fmFbk: "fbk_retitled",
    },
];
const KEYS_MARKDOWN: KeysForParsingData[] = [
    {
        storeKey: "weight",
        fmKey: "key_sort",
        fmFbk: "fbk_weight_md",
    },
    {
        storeKey: "headless",
        fmKey: "key_headless",
        fmFbk: "fbk_headless",
    },
];

export default class Sorter {
    private readonly fileExpView: FileExplorerView;
    private readonly plugin: NaveightPlugin;
    private readonly metadataCache: MetadataCache;

    private timeOutCount: number;
    // caches for sorting
    private fmDataInVault: FmDataInVault;
    private logger: string[];

    // caches for parsing
    private folderFmData: FmData;
    private indexBaseFmData: FmData;
    private otherFmData: FmData;
    private indexParsingDatas: ParsingData[];
    private markdownParsingDatas: ParsingData[];
    private indexFilename: string;

    constructor(fileExpView: FileExplorerView, plugin: NaveightPlugin) {
        this.fileExpView = fileExpView;
        this.plugin = plugin;
        this.metadataCache = plugin.app.metadataCache;

        this.timeOutCount = 0;

        this.fmDataInVault = {};
        this.logger = [];

        this.updateCachesForParsing();
    }

    // Called after each setting change.
    updateCachesForParsing() {
        const indexParsingDatas: ParsingData[] = [];
        const markdownParsingDatas: ParsingData[] = [];
        const userConfig = this.plugin.userConfig;

        for (const { storeKey, fmKey, fmFbk } of KEYS_INDEX) {
            indexParsingDatas.push({
                storeKey,
                fmKey: userConfig[fmKey],
                fmFbk: userConfig[fmFbk],
            });
        }

        for (const { storeKey, fmKey, fmFbk } of KEYS_MARKDOWN) {
            markdownParsingDatas.push({
                storeKey,
                fmKey: userConfig[fmKey],
                fmFbk: userConfig[fmFbk],
            });
        }

        this.folderFmData = {
            weight: userConfig.fbk_weight_folder,
            headless: false,
            retitled: false,
        };
        this.indexBaseFmData = {
            weight: userConfig.fbk_weight_index,
            headless: false,
        };
        this.otherFmData = {
            weight: userConfig.fbk_weight_other,
            headless: false,
        };
        this.indexParsingDatas = indexParsingDatas;
        this.markdownParsingDatas = markdownParsingDatas;
        this.indexFilename = userConfig.filename_index + ".md";
    }

    async sortAll() {
        if (!(this.fileExpView.ready && this.fileExpView.containerEl.isShown())) {
            if (this.timeOutCount < 3) {
                setTimeout(() => {
                    this.sortAll();
                }, 500);
                this.timeOutCount += 1;
            } else {
                this.timeOutCount = 0;
            }
            return;
        }

        const vault = this.fileExpView.app.vault;

        const itemsInVault = Object.assign({}, this.fileExpView.fileItems);

        // init sort caches
        const folderItems: FolderItem[] = [];
        this.fmDataInVault = {};
        this.logger = [];

        const rootFolder = vault.getRoot();
        this.fmDataInVault[rootFolder.path] = {};
        const paths = Object.keys(itemsInVault);
        paths.forEach((path) => {
            const item = itemsInVault[path];
            // expect a folder
            if (item && item.vChildren && item.file instanceof TFolder) {
                folderItems.push(item as FolderItem);
                // Create "{}" for each folder path.
                // so that "index" can insert the fmData of its parent.
                this.fmDataInVault[path] = {};
            }
        });

        // cache FmData in each folder
        await this.cacheFmDataInFolder(rootFolder);
        for (const folderItem of folderItems) {
            await this.cacheFmDataInFolder(folderItem.file);
        }

        const allFeatures = this.plugin.userConfig.all_features;

        //#region source code from js
        const tree = this.fileExpView.tree;
        const navContainer = this.fileExpView.navFileContainerEl;
        const scrollTop = navContainer.scrollTop;

        tree.infinityScroll.rootEl.vChildren.setChildren(
            await this.getSortedItemsAndSetIcon(rootFolder, itemsInVault, allFeatures)
        );
        for (const folderItem of folderItems) {
            folderItem.vChildren.setChildren(
                await this.getSortedItemsAndSetIcon(folderItem.file, itemsInVault, allFeatures)
            );
        }

        navContainer.scrollTop = scrollTop;
        tree.infinityScroll.compute();
        //#endregion

        // set status bar
        // console.log(this.cachedLogger)
        const len = this.logger.length;
        if (len === 0) {
            this.plugin.setStatusBar("all sorted", true);
        } else {
            if (len > 4) {
                this.logger = this.logger.slice(0, 4);
                this.logger.push(`... ${len - 4} more...`);
            }
            await this.plugin.setStatusBar(this.logger.join("\n"), false);
        }

        // deleted !isShown source code, do nothing
    }

    private async cacheFmDataInFolder(folder: TFolder) {
        const fmDataInFolder = this.fmDataInVault[folder.path];

        // iterate files in folder
        for (const absFile of folder.children) {
            // a folder fmData inserted by index.md, skip it
            if (fmDataInFolder[absFile.path] !== undefined) continue;

            fmDataInFolder[absFile.path] = await this.getFmDataAbsFile(absFile);
        }
    }

    private async getFmDataAbsFile(absFile: TAbstractFile) {
        // folder
        if (absFile instanceof TFolder) {
            return this.folderFmData;
        }
        // others
        if (!(absFile instanceof TFile) || absFile.extension !== "md") {
            return this.otherFmData;
        }
        // index.md
        if (absFile.name === this.indexFilename) {
            return await this.getFmDataIndex(absFile);
        }
        // normal .md
        return await this.parseFmData(absFile, this.markdownParsingDatas);
    }

    private async getFmDataIndex(index: TFile) {
        const parent = index.parent;
        const parentFmData = await this.parseFmData(index, this.indexParsingDatas);
        if (parent && parent.parent) {
            // else, parent = "/", it's a top level index, no need to set root's fmData
            // parent.parent
            this.fmDataInVault[parent.parent.path][parent.path] = parentFmData;
        }

        // for index.md itself
        const emptyPart: Partial<FmData> = { headless: parentFmData.empty };
        return Object.assign(this.indexBaseFmData, emptyPart) as FmData;
    }

    private async parseFmData(mdFile: TFile, parsingDatas: ParsingData[]) {
        // each file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
        // empty markdown: cachedMetadata = {} ( {} = true )
        const fm = this.metadataCache.getFileCache(mdFile)?.frontmatter;

        const parsedFm = {} as FmData;

        const getData = async <K extends keyof FmData>(
            storeKey: K,
            fmKey: string,
            fmFbk: NvtCfgFmFbk[keyof NvtCfgFmFbk]
        ) => {
            const raw = await this.plugin.getRawOrNone(fm?.[fmKey], fmFbk);
            switch (raw) {
                case undefined: // can't find the fmKey in frontmatter
                    parsedFm[storeKey] = fmFbk as FmData[K];
                    break;
                case null: // the value of the fmKey is invalid
                    this.catchLog(mdFile.path, fmKey, fmFbk);
                    parsedFm[storeKey] = fmFbk as FmData[K];
                    break;
                default: // valid value
                    parsedFm[storeKey] = raw as FmData[K];
            }
        };

        parsingDatas.forEach(({ storeKey, fmKey, fmFbk }) => getData(storeKey, fmKey, fmFbk));

        return parsedFm;
    }

    private async getSortedItemsAndSetIcon(folder: TFolder, itemsInVault: Record<string, Item>, allFeatures: boolean) {
        const fmDataInFolder = this.fmDataInVault[folder.path];
        const absFileArray = folder.children.slice();
        // sort file
        absFileArray.sort((a, b) => {
            return fmDataInFolder[a.path].weight - fmDataInFolder[b.path].weight;
        });
        // cache item in sortedItems[] by fileItems[file.path]
        const sortedItems: Item[] = [];
        for (const absFile of absFileArray) {
            const item = itemsInVault[absFile.path];
            if (!item) continue;

            sortedItems.push(item);

            // set icon for headless/retitled
            if (!allFeatures) continue;

            // all headless stored as key_headless_md
            await this.setNavItemIcon(item, "leaf", "nvt-headless", fmDataInFolder[absFile.path].headless);
            const retitled = fmDataInFolder[absFile.path].retitled;
            // only the folder(within a index, has a parent) own retitled
            if (retitled === undefined) continue;
            // retitled, only available in folder
            await this.setNavItemIcon(item, "text-cursor-input", "nvt-retitled", retitled);
        }
        return sortedItems;
    }

    private async setNavItemIcon(item: Item, iconName: string, iconContainerClsName: string, desiringIcon: boolean) {
        const selfEl = item.selfEl;
        if (!selfEl) return;

        const iconContainer = selfEl.getElementsByClassName(iconContainerClsName)[0];
        const hasIcon = Boolean(iconContainer);
        // same, no modify
        if (desiringIcon === hasIcon) return;

        // hasIcon is false, but desiringIcon is true, add svg
        if (hasIcon) {
            iconContainer.remove();
        }
        // hasIcon is true, but desiringIcon is false, remove svg
        else {
            const container = selfEl.createDiv({
                cls: ["nav-file-tag", iconContainerClsName],
            });
            setIcon(container, iconName);
        }
    }

    /**
     * limited logger, valid message on index 0-4
     * @param path
     * @param fmKey
     * @param fmFbk
     */
    private catchLog(path: string, fmKey: NvtCfgFmKey[keyof NvtCfgFmKey], fmFbk: NvtCfgFmFbk[keyof NvtCfgFmFbk]) {
        const len = this.logger.length;
        if (len < 4) {
            this.logger.push(`/${path}\nInvalid value of: [ ${fmKey} ], Fallback to: [ ${fmFbk} ].`);
        } else {
            this.logger.push("");
        }
    }
}
