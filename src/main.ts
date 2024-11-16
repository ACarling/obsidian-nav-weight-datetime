import { SETTINGS_DESC, DEFAULT_CONFIG as dfltConfig } from "consts";
import { FileExplorerView, Plugin, setIcon, setTooltip } from "obsidian";
import { NaveightSettingTab } from "setting";
import Sorter from "sorter";
import { NvtCfg, NvtSet } from "types/types";
import Utils from "utils";

export default class NaveightPlugin extends Plugin {
    userConfig: NvtCfg;
    statusBarEl: HTMLElement;
    statusBarSpan: HTMLElement;
    sorter: Sorter;

    async onload() {
        await this.loadSettings();

        this.app.workspace.onLayoutReady(() => {
            // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
            this.statusBarEl = this.addStatusBarItem();
            this.statusBarSpan = this.statusBarEl.createSpan({
                cls: "status-bar-item-icon",
            });

            const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
            if (!leaf) {
                this.setStatusBar("error: can not find file explorer leaf", false);
                return;
            }
            this.setStatusBar("unsorted", false);

            this.sorter = new Sorter(leaf.view as FileExplorerView, this);
            // auto sortAll
            this.sorter.sortAll();

            // sorter needed
            this.addRibbonIcon("arrow-down-01", "Sort navigation", async () => {
                // its n.view.getViewType(), not n.type
                this.sorter.sortAll();
            });

            // sorter needed, auto sortAll on save
            this.addSettingTab(new NaveightSettingTab(this.app, this));
        });
    }

    onunload() {}

    async loadSettings() {
        const loadedRaw = Object.assign({}, await this.loadData()) as NvtCfg;
        const loadedSet: Partial<NvtSet> = {};

        const cfgKeys = Object.keys(SETTINGS_DESC) as (keyof NvtSet)[];
        cfgKeys.forEach(async <K extends keyof NvtSet>(key: K) => {
            const dflt = dfltConfig[key];
            loadedSet[key] = (await this.getRawOrNone(loadedRaw[key], dflt)) ?? dflt;
        });

        await this.saveSettings(loadedSet, false);
    }

    async saveSettings(partialConfig: Partial<NvtCfg>, existSorter: boolean) {
        this.userConfig = Object.assign({}, dfltConfig, this.userConfig, partialConfig);
        if (existSorter) {
            // apply new settings to caches
            this.sorter.updateCachesForParsing();
            // auto sortAll
            this.sorter.sortAll();
        }
        const savingSet: Partial<NvtSet> = {};

        const setKeys = Object.keys(SETTINGS_DESC) as (keyof NvtSet)[];
        setKeys.forEach(<K extends keyof NvtSet>(key: K) => {
            savingSet[key] = this.userConfig[key];
        });

        await this.saveData(savingSet);
    }

    async setStatusBar(tooltip: string, sorted: boolean) {
        const icon = sorted ? "file-check" : "file-x";

        setIcon(this.statusBarSpan, icon);
        setTooltip(this.statusBarEl, `Nav Weight\n${tooltip}`, {
            placement: "top",
        });
    }

    async getDataOrNull<T>(str: string, dflt: T) {
        switch (typeof dflt) {
            case "number":
                return Utils.parseNumber(str) as T | null;
            case "string":
                return Utils.parseString(str) as T | null;
            case "boolean":
                return Utils.parseBoolean(str) as T | null;

            // ! Impossible to happen.
            default:
                return null;
        }
    }

    async getRawOrNone<T>(raw: unknown, dflt: T) {
        switch (typeof raw) {
            case "string":
                return this.getDataOrNull(raw, dflt);
            case "number":
                if (typeof dflt === "number" && Number.isFinite(raw)) {
                    return raw as T;
                }
                return null;
            case "boolean":
                if (typeof dflt === "boolean") {
                    return raw as T;
                }
                return null;
            case "undefined":
                return undefined;
            default:
                return null;
        }
    }
}
