import NaveightPlugin from "main";
import {
    CachedMetadata,
    FileExplorerView,
    FolderItem,
    FrontMatterCache,
    Item,
    MetadataCache,
    setIcon,
    TAbstractFile,
    TFile,
    TFolder,
} from "obsidian";
import Patcher from "patcher";
import { DataType } from "types/types";
import Utils from "utils";

type FmData = {
    weight: number;
    headless?: boolean;
    empty?: boolean;
    retitled?: boolean;
};
type FmDataInFolder = Record<string, FmData>;
type FmDataInVault = Record<string, FmDataInFolder>;

type IndexParsingKeys = {
    [K in keyof Required<FmData>]: string;
};
type MarkdownParsingKeys = Pick<IndexParsingKeys, "weight" | "headless">;

export default class Sorter {
    private readonly fileExplorerView: FileExplorerView;
    private readonly plugin: NaveightPlugin;
    private readonly metadataCache: MetadataCache;

    // ! hard patch
    patcher: Patcher;
    // ! soft patch, set by ribbon button
    isOn: boolean;
    // ! stop caching while get fmData for comparing (OnMetadataCacheChanged)
    private inCaching: boolean;
    // ! set true by settingTab, plugin unload, restore at sorting done (in patcher)
    needCleanupIcons: boolean;

    // caches for sorting
    private fmDataInVault: FmDataInVault;
    private logger: string[];

    // caches for parsing
    private folderFmData: FmData;
    private parentFmData: FmData;
    private indexFmData: FmData;
    private markdownFmData: FmData;
    private otherFmData: FmData;
    private indexParsingKeys: IndexParsingKeys;
    private markdownParsingKeys: MarkdownParsingKeys;
    private indexFilename: string;
    private allFeatures: boolean;

    constructor(fileExpView: FileExplorerView, plugin: NaveightPlugin) {
        this.fileExplorerView = fileExpView;
        this.plugin = plugin;
        this.metadataCache = plugin.app.metadataCache;

        this.patcher = new Patcher(this, plugin, fileExpView);

        this.isOn = true;

        this.inCaching = false;
        this.needCleanupIcons = false;

        this.fmDataInVault = {};
        this.logger = [];
    }

    /**
     * Update caches for parsing and trigger sort all.
     */
    async updateParsingCaches() {
        const userConfig = this.plugin.userConfig;
        const allFeatures = userConfig.all_features;
        this.allFeatures = allFeatures;

        if (allFeatures) {
            this.folderFmData = {
                weight: userConfig.fbk_weight_folder,
                headless: false,
                retitled: false,
            };
            this.parentFmData = {
                weight: userConfig.fbk_weight_folder,
                headless: false,
                empty: false,
                retitled: userConfig.fbk_retitled,
            };
            this.indexFmData = {
                weight: userConfig.fbk_weight_index,
                headless: false,
            };
            this.markdownFmData = {
                weight: userConfig.fbk_weight_md,
                headless: false,
            };
            this.otherFmData = {
                weight: userConfig.fbk_weight_other,
                headless: false,
            };
        } else {
            this.folderFmData = { weight: userConfig.fbk_weight_folder };
            this.parentFmData = { weight: userConfig.fbk_weight_folder };
            this.indexFmData = { weight: userConfig.fbk_weight_index };
            this.markdownFmData = { weight: userConfig.fbk_weight_md };
            this.otherFmData = { weight: userConfig.fbk_weight_other };
        }

        this.indexParsingKeys = {
            weight: userConfig.key_sort,
            headless: "headless",
            empty: "empty",
            retitled: "retitled",
        };
        this.markdownParsingKeys = {
            weight: userConfig.key_sort,
            headless: "headless",
        };
        this.indexFilename = userConfig.filename_index + ".md";
    }

    sortAll() {
        this.fileExplorerView.sort();
    }

    prepareSorting() {
        const fileExplorerView = this.fileExplorerView;

        // ! The caching process should be sync.
        this.inCaching = true;
        const vault = fileExplorerView.app.vault;

        const itemsInVault = Object.assign({}, fileExplorerView.fileItems);
        // console.log(itemsInVault);

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
            if (item.vChildren && item.file instanceof TFolder) {
                // console.log(item);
                folderItems.push(item as FolderItem);
                // ! Create "{}" for each folder path.
                // ! so that "index" can insert the fmData of its parent in parent.parent
                this.fmDataInVault[path] = {};
            }
        });

        // cache FmData in each folder
        this.cacheFmDataInFolder(rootFolder);
        for (const folderItem of folderItems) {
            this.cacheFmDataInFolder(folderItem.file);
        }

        // set status bar
        // console.log(this.cachedLogger)
        const len = this.logger.length;
        if (len === 0) {
            this.plugin.setStatusBar("all sorted", "v");
        } else {
            if (len > 4) {
                this.logger = this.logger.slice(0, 4);
                this.logger.push(`...\n${len - 4} more\n...`);
            }
            this.plugin.setStatusBar(this.logger.join("\n"), "x");
        }
        // ! Caching end
        this.inCaching = false;
    }

    private cacheFmDataInFolder(folder: TFolder) {
        const fmDataInFolder = this.fmDataInVault[folder.path];

        // iterate files in folder
        for (const absFile of folder.children) {
            // ! fmData inserted by a index, skip it
            if (fmDataInFolder[absFile.path] !== undefined) continue;

            fmDataInFolder[absFile.path] = this.getFmDataAbsFile(absFile);
        }
    }

    private getFmDataAbsFile(absFile: TAbstractFile) {
        if (absFile instanceof TFolder) {
            // folder
            return this.folderFmData;
        } else if (absFile instanceof TFile) {
            // file
            return this.getFmDataFile(absFile, this.metadataCache.getFileCache(absFile));
        } else {
            // unknown
            return this.otherFmData;
        }
    }
    // ! any TFile own a cachedMetadata
    // ! file or empty_markdown 's cachedMetadata = {} ( {} = true )
    private getFmDataFile(file: TFile, metadata: CachedMetadata | null | undefined) {
        if (file.extension !== "md") {
            // other files
            return this.otherFmData;
        }
        const frontmatter = metadata?.frontmatter;
        if (file.name === this.indexFilename) {
            // index.md
            return this.getFmDataIndex(file, frontmatter);
        } else {
            // normal.md
            return frontmatter === undefined
                ? Object.assign({}, this.markdownFmData)
                : this.getValidFmData(file.path, this.parseMarkdown(frontmatter), this.markdownFmData);
        }
    }

    private getFmDataIndex(index: TFile, frontmatter?: FrontMatterCache) {
        const parent = index.parent;
        const parentFmData =
            frontmatter === undefined
                ? Object.assign({}, this.parentFmData)
                : this.getValidFmData(index.path, this.parseIndex(frontmatter), this.parentFmData);

        if (parent?.parent) {
            // ! only cache fmData when in caching mode.
            if (this.inCaching) {
                // else, parent = "/", it's a top level index, no need to set root's fmData
                // parent.parent
                this.fmDataInVault[parent.parent.path][parent.path] = parentFmData;
            } else {
                // ! index with parent, compare on its parent
                return parentFmData;
            }
        }

        // for index.md itself
        // ! store "empty" as "headless"
        const emptyPart: Partial<FmData> = { headless: parentFmData.empty };
        return Object.assign({}, this.indexFmData, emptyPart) as FmData;
    }

    private getValidFmData(path: string, rawData: FmData, fallbackData: FmData) {
        const keys = Object.keys(fallbackData) as (keyof FmData)[];
        keys.forEach(<K extends keyof FmData>(key: K) => {
            const fallback = fallbackData[key];
            const raw = Utils.parseRawData(rawData[key], fallback as DataType);
            // ! unset
            if (raw === undefined) {
                rawData[key] = fallback;
                // ! value set but is invalid
            } else if (raw === null) {
                // ! only catch log when in caching mode
                this.inCaching && this.catchLog(path, key, fallback);
                rawData[key] = fallback;
            }
        });

        return rawData;
    }
    private parseIndex(frontmatter: FrontMatterCache): FmData {
        const parsingKeys = this.indexParsingKeys;
        return this.allFeatures
            ? {
                  weight: frontmatter[parsingKeys.weight],
                  headless: frontmatter[parsingKeys.headless],
                  empty: frontmatter[parsingKeys.empty],
                  retitled: frontmatter[parsingKeys.retitled],
              }
            : {
                  weight: frontmatter[parsingKeys.weight],
              };
    }

    private parseMarkdown(frontmatter: FrontMatterCache): FmData {
        const parsingKeys = this.markdownParsingKeys;
        return this.allFeatures
            ? {
                  weight: frontmatter[parsingKeys.weight],
                  headless: frontmatter[parsingKeys.headless],
              }
            : {
                  weight: frontmatter[parsingKeys.weight],
              };
    }

    getItemsAndSetIcons(folder: TFolder, sortedItemsOriginal: Item[]) {
        const fmDataInFolder = this.fmDataInVault[folder.path];
        const needCleanupIcons = this.needCleanupIcons;
        const allFeatures = this.allFeatures;
        return sortedItemsOriginal
            .map((item, index) => {
                return {
                    index,
                    weight: fmDataInFolder[item.file.path].weight,
                    item,
                };
            })
            .sort((a, b) => {
                const diff = a.weight - b.weight;
                return Math.abs(diff) < 1e-5 ? a.index - b.index : diff;
            })
            .map(({ item }): Item => {
                let headless;
                let retitled;
                const absFile = item.file;

                // ! cleanup icons if all_features turn off or plugin disable.
                if (needCleanupIcons) {
                    headless = false;
                    retitled = false;
                } else if (allFeatures) {
                    headless = fmDataInFolder[absFile.path].headless as boolean;
                    retitled = fmDataInFolder[absFile.path].retitled as boolean;
                } else {
                    return item;
                }
                // set icon for headless/retitled
                this.setNavItemIcon(item, "leaf", "nvt-headless", headless);
                if (absFile instanceof TFolder) {
                    this.setNavItemIcon(item, "text-cursor-input", "nvt-retitled", retitled);
                }

                return item;
            });
    }

    private setNavItemIcon(item: Item, icon: string, iconContainerClsName: string, desiringIcon: boolean) {
        const selfEl = item.selfEl;
        if (!selfEl) return;

        const iconContainer = selfEl.getElementsByClassName(iconContainerClsName)[0];
        // same, need no modify
        if (desiringIcon === (iconContainer !== undefined)) return;

        if (desiringIcon) {
            // no icon, but desiringIcon is true, add svg
            setIcon(
                selfEl.createDiv({
                    cls: ["nav-file-tag", iconContainerClsName],
                }),
                icon
            );
        } else {
            // found icon, but desiringIcon is false, remove svg
            iconContainer.remove();
        }
    }

    /**
     * limited logger, valid message on index 0-4
     * @param path
     * @param fmKey
     * @param fmFbk
     */
    private catchLog(path: string, fmKey: keyof FmData, fmFbk: FmData[keyof FmData]) {
        const len = this.logger.length;
        if (len < 4) {
            this.logger.push(`/${path}\n${fmKey}  =>  ${fmFbk}`);
        } else {
            this.logger.push("");
        }
    }

    OnMetadataCacheChanged(file: TFile, text: string, metadata: CachedMetadata) {
        // console.log(moment().format("H:mm:ss"));
        // file without parent, have no idea what it is. ignore it.
        const parent = file.parent;
        if (!parent) return;

        const cachedFmData =
            file.name === this.indexFilename && parent.parent
                ? // index with parent, compare on their parent
                  this.fmDataInVault[parent.parent.path]?.[parent.path]
                : // top level index or normal markdown, compare on their self
                  this.fmDataInVault[parent.path]?.[file.path];

        // ! A new file, will trigger sorting by Obsidian, skip it.
        if (cachedFmData === undefined) return;
        // console.log(this.getFmDataFile(file, metadata), cachedFmData);
        // schedule a sorting if not equal or no cached fmData
        if (!this.getIsEqual(this.getFmDataFile(file, metadata), cachedFmData)) {
            this.sortAll();
        }
    }

    private getIsEqual<T extends FmData>(object1: T, object2: T): boolean {
        const keys1 = Object.keys(object1) as (keyof T)[];
        const keys2 = Object.keys(object2) as (keyof T)[];

        if (keys1.length !== keys2.length) {
            return false;
        }
        for (const key of keys1) {
            if (object1[key] !== object2[key]) {
                return false;
            }
        }
        return true;
    }
}
