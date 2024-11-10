import { FileExplorerView, FolderItem, Item, setIcon, setTooltip, TAbstractFile, TFile, TFolder } from "obsidian";
import { CfgFmFbk, CfgFmKey, NwtCfg } from "types/types";
import Utils from "utils";

type FmData = Record<string, CfgFmFbk[keyof CfgFmFbk]>;

type FmDataByFolder = Record<string, Record<string, FmData>>;

/** config keys of FmKey and FmFbk */
type cfgKeysOfFmKF = { fmKey: keyof CfgFmKey; fmFbk: keyof CfgFmFbk };

/**  config values of FmKey and FmFbk */
type FmKF = {
    fmKey: CfgFmKey[keyof CfgFmKey];
    fmFbk: CfgFmFbk[keyof CfgFmFbk];
};

const KEYS_INDEX: cfgKeysOfFmKF[] = [
    {
        fmKey: "key_sort",
        fmFbk: "fbk_weight_folder",
    },
    {
        fmKey: "key_headless_index",
        fmFbk: "fbk_headless",
    },
    {
        fmKey: "key_headless_md",
        fmFbk: "fbk_headless",
    },
    {
        fmKey: "key_retitled",
        fmFbk: "fbk_retitled",
    },
];
const KEYS_MARKDOWN: cfgKeysOfFmKF[] = [
    {
        fmKey: "key_sort",
        fmFbk: "fbk_weight_md",
    },
    {
        fmKey: "key_headless_md",
        fmFbk: "fbk_headless",
    },
];

export default class Sorter {
    private fileExpView: FileExplorerView;
    private userConfig: NwtCfg;
    private cachedFmDataByFolder: FmDataByFolder;
    private statusBarEl: HTMLElement;
    private statusBarSpan: HTMLElement;
    private logger: string[];

    private fmKFsIdx: FmKF[];
    private fmKFsMd: FmKF[];

    constructor(
        fileExpView: FileExplorerView,
        userConfig: NwtCfg,
        statusBarEl: HTMLElement,
        statusBarSpan: HTMLElement
    ) {
        this.fileExpView = fileExpView;
        this.userConfig = userConfig;
        this.cachedFmDataByFolder = {};
        this.statusBarEl = statusBarEl;
        this.statusBarSpan = statusBarSpan;
        this.logger = [];

        this.fmKFsIdx = [];
        this.fmKFsMd = [];

        for (const keyPair of KEYS_INDEX) {
            const o: FmKF = {
                fmKey: userConfig[keyPair.fmKey],
                fmFbk: userConfig[keyPair.fmFbk],
            };

            this.fmKFsIdx.push(o);
        }

        for (const keyPair of KEYS_MARKDOWN) {
            const o: FmKF = {
                fmKey: userConfig[keyPair.fmKey],
                fmFbk: userConfig[keyPair.fmFbk],
            };

            this.fmKFsMd.push(o);
        }
    }

    // modified from js source code
    sort() {
        if (false === (this.fileExpView.ready && this.fileExpView.containerEl.isShown())) return;

        const vault = this.fileExpView.app.vault;

        // source code from js
        const itemsByPath = this.fileExpView.fileItems;
        const tree = this.fileExpView.tree;
        const navContainer = this.fileExpView.navFileContainerEl;
        const scrollTop = navContainer.scrollTop;

        // init FmData
        const folderItems: FolderItem[] = [];

        const rootPath = vault.getRoot().path;
        this.cachedFmDataByFolder[rootPath] = {};
        for (const path in itemsByPath) {
            const item = itemsByPath[path];
            const absFile = item?.file;
            // expect a folder
            const isFolderItem =
                itemsByPath.hasOwnProperty(path) && Boolean(item?.vChildren) && absFile instanceof TFolder;
            if (isFolderItem) {
                folderItems.push(item as FolderItem);
                this.cachedFmDataByFolder[absFile.path] = {};
            }
        }

        // cache FmData
        this.cacheFmDataInFolder(vault.getRoot());
        for (const folderItem of folderItems) {
            // definitely a folder
            this.cacheFmDataInFolder(folderItem.file);
        }

        // console.log(this.cachedFmDataByFolder)

        // use FmData
        tree.infinityScroll.rootEl.vChildren.setChildren(this.getSortedItemsAndSetIcon(vault.getRoot()));
        for (const folderItem of folderItems) {
            folderItem.vChildren.setChildren(this.getSortedItemsAndSetIcon(folderItem.file));
        }

        navContainer.scrollTop = scrollTop;
        tree.infinityScroll.compute();

        // set status bar
        // console.log(this.cachedLogger)

        if (this.logger.length === 0) {
            setIcon(this.statusBarSpan, "file-check");
            setTooltip(this.statusBarEl, "Nav Weight\nAll sorted", {
                placement: "top",
            });
        } else {
            setIcon(this.statusBarSpan, "file-x");
            const tooltip = `Nav Weight\n${this.logger.join("\n")}`;
            setTooltip(this.statusBarEl, tooltip, { placement: "top" });
        }

        // deleted !isShown source code, do nothing
    }

    private cacheFmDataInFolder(folder: TFolder) {
        const fmDataInFolder = this.cachedFmDataByFolder[folder.path];

        // iterate files in folder
        for (const absFile of folder.children) {
            // don't override folder's fmData written by index.md
            if (fmDataInFolder[absFile.path] !== undefined) continue;

            fmDataInFolder[absFile.path] = this.getFmDataAbsFile(absFile);
        }
    }

    private getFmDataAbsFile(absFile: TAbstractFile): FmData {
        // folder
        if (absFile instanceof TFolder) {
            return {
                [this.userConfig.key_sort]: this.userConfig.fbk_weight_folder,
            };
        }
        // others
        if (!(absFile instanceof TFile) || absFile.extension !== "md") {
            return {
                [this.userConfig.key_sort]: this.userConfig.fbk_weight_other,
            };
        }
        // index.md
        if (absFile.name === this.userConfig.filename_index + ".md") {
            return this.getFmDataIdxAndSetPrt(absFile);
        }
        // normal .md
        return this.parseFmData(absFile, this.fmKFsMd);
    }

    private getFmDataIdxAndSetPrt(index: TFile): FmData {
        const parent = index.parent;
        const parsedFm = this.parseFmData(index, this.fmKFsIdx);
        if (parent && parent.parent) {
            // parent.parent
            this.cachedFmDataByFolder[parent.parent.path][parent.path] = parsedFm;
        }
        // for index.md itself
        const fmData = {} as FmData;
        // fixed weight
        fmData[this.userConfig.key_sort] = this.userConfig.fbk_weight_index;
        // headless, but stored as md
        const empty = parsedFm[this.userConfig.key_headless_index];
        if (empty !== undefined) {
            fmData[this.userConfig.key_headless_md] = empty;
        }

        return fmData;
    }

    private parseFmData(mdFile: TFile, fmKFs: FmKF[]): FmData {
        // each file with extension ".md" own its cachedMetadata, even it's not a markdown file !!!
        // empty markdown: cachedMetadata = {} ( {} = true )
        const fm = this.fileExpView.app.metadataCache.getFileCache(mdFile)?.frontmatter;

        const parsedFm = {} as FmData;

        const getParsedFm = (fmKey: CfgFmKey[keyof CfgFmKey], fmFbk: CfgFmFbk[keyof CfgFmFbk]) => {
            const data = Utils.getRawAsDataOrNone(fm?.[fmKey], typeof fmFbk);
            // invalid value
            if (data === null) {
                this.catchLog(mdFile.path, fmKey, fmFbk);
                return fmFbk;
            }
            // no value
            if (data === undefined) {
                return fmFbk;
            }
            return data as CfgFmFbk[keyof CfgFmFbk];
        };

        if (this.userConfig.all_features) {
            for (const fmKF of fmKFs) {
                parsedFm[fmKF.fmKey] = getParsedFm(fmKF.fmKey, fmKF.fmFbk);
            }
        } else {
            const fmKF = fmKFs[0];
            parsedFm[fmKF.fmKey] = getParsedFm(fmKF.fmKey, fmKF.fmFbk);
        }

        return parsedFm;
    }

    private getSortedItemsAndSetIcon(folder: TFolder) {
        const fmDataInFolder = this.cachedFmDataByFolder[folder.path];
        const absFileArray = folder.children.slice();
        // sort file
        absFileArray.sort((a, b) => {
            return (
                (fmDataInFolder[a.path][this.userConfig.key_sort] as number) -
                (fmDataInFolder[b.path][this.userConfig.key_sort] as number)
            );
        });
        // cache item in sortedItems[] by fileItems[file.path]
        const sortedItems: Item[] = [];
        for (const absFile of absFileArray) {
            const item = this.fileExpView.fileItems[absFile.path];
            if (!item) continue;

            sortedItems.push(item);

            // set icon for headless/retitled
            if (!this.userConfig.all_features) continue;

            // all headless stored as key_headless_md
            this.setIconByFm(
                item,
                "leaf",
                "nwt-headless",
                Boolean(fmDataInFolder[absFile.path][this.userConfig.key_headless_md])
            );

            // retitled, only available in folder
            if (absFile instanceof TFolder) {
                this.setIconByFm(
                    item,
                    "text-cursor-input",
                    "nwt-retitled",
                    Boolean(fmDataInFolder[absFile.path][this.userConfig.key_retitled])
                );
            }
        }
        return sortedItems;
    }

    private setIconByFm(item: Item, iconName: string, iconContainerClsName: string, desiringIcon: boolean) {
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
     * limited logger, valid message on index 0-4, "..." on 5
     * @param path
     * @param fmKey
     * @param fmFbk
     */
    private catchLog(path: string, fmKey: CfgFmKey[keyof CfgFmKey], fmFbk: CfgFmFbk[keyof CfgFmFbk]) {
        const len = this.logger.length;
        if (len < 4) {
            this.logger.push(`/${path}\nInvalid value of: [ ${fmKey} ], Fallback to: [ ${fmFbk} ].`);
        } else if (len === 4) {
            this.logger.push("\n...more...\n\n");
        }
    }
}
