import { DEFAULT_CONFIG as dfltConfig } from "consts";
import { FileExplorerView, Notice, Plugin, setIcon, setTooltip } from "obsidian";
import { NaveightSettingTab } from "settingTab";
import Sorter from "sorter";
import { NvtCfg } from "types/types";
import Utils from "utils";

export default class NaveightPlugin extends Plugin {
    userConfig: NvtCfg;
    statusBarEl: HTMLElement;
    statusBarSpan: HTMLElement;
    sorter: Sorter;
    settingKeys: (keyof NvtCfg)[];

    async onload() {
        await this.loadSettings();

        this.app.workspace.onLayoutReady(async () => {
            // ! Step.1: adds a status bar item.
            this.statusBarEl = this.addStatusBarItem();
            this.statusBarSpan = this.statusBarEl.createSpan({
                cls: "status-bar-item-icon",
            });
            // ! Step.2: get file explorer view
            // it's n.view.getViewType(), not n.type
            const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
            // console.log(leaf);
            if (!leaf) {
                this.setStatusBar("error: can not find file explorer leaf", "!");
                return;
            }
            // ! Step.3: init sorter
            this.sorter = new Sorter(leaf.view as FileExplorerView, this);
            this.sorter.updateParsingCaches();
            this.sorter.sortAll();
            // ! Step.4: add ribbon icon and setting tab
            // sorter needed, caches needed
            const ribbonIcon = this.addRibbonIcon("arrow-down-01", "Nav Weight: click to disable", () => {
                const lastStatus = this.sorter.isOn;
                if (lastStatus) {
                    this.sorter.needCleanupIcons = true;
                    // next status is disable
                    setTooltip(ribbonIcon, "Nav Weight: click to enable");
                    ribbonIcon.classList.add("nvt-ribbon-disable");
                } else {
                    setTooltip(ribbonIcon, "Nav Weight: click to disable");
                    ribbonIcon.classList.remove("nvt-ribbon-disable");
                }
                this.sorter.sortAll();
                this.sorter.isOn = !lastStatus;
                this.sorter.sortAll();
            });
            this.addSettingTab(new NaveightSettingTab(this.app, this));
            // ! Step.5: register auto-sort events

            // Obsidian calls this at most every 2 seconds.
            this.registerEvent(this.app.metadataCache.on("changed", this.sorter.OnMetadataCacheChanged, this.sorter));

            // console.log(leaf.view);
        });
    }

    onunload() {
        this.sorter.needCleanupIcons = true;
        // cleanup icons
        this.sorter.sortAll();
        // unPatch
        this.sorter.patcher.unPatch();
        // restore original sorting
        this.sorter.sortAll();
    }

    async loadSettings() {
        // build setting keys
        this.settingKeys = Object.keys(dfltConfig) as (keyof NvtCfg)[];

        const loadedRaw = Object.assign({}, await this.loadData()) as NvtCfg;
        const loadedSet: Partial<NvtCfg> = {};

        this.settingKeys.forEach(<K extends keyof NvtCfg>(key: K) => {
            const dflt = dfltConfig[key];
            loadedSet[key] = Utils.parseRawData(loadedRaw[key], dflt) ?? dflt;
        });

        await this.saveSettings(loadedSet, true);
    }

    async saveSettings(partialConfig: Partial<NvtCfg>, firstSave: boolean) {
        if (firstSave) {
            this.userConfig = Object.assign({}, dfltConfig, partialConfig);
        } else {
            this.userConfig = Object.assign({}, this.userConfig, partialConfig);
            // ! apply new settings to caches and trigger a sorting
            this.sorter.updateParsingCaches();
            this.sorter.sortAll();
        }
        const savingSet: Partial<NvtCfg> = {};

        this.settingKeys.forEach(<K extends keyof NvtCfg>(key: K) => {
            savingSet[key] = this.userConfig[key];
        });

        await this.saveData(savingSet);
    }

    setStatusBar(tooltip: string, status: "v" | "x" | "!") {
        const tt = `Nav Weight\n${tooltip}`;
        // this.latestTooltip = tooltip;
        let icon;
        switch (status) {
            case "v":
                icon = "file-check";
                break;
            case "x":
                icon = "file-x";
                break;
            default:
                icon = "file-warning";
                new Notice(tt, 5000);
        }

        setIcon(this.statusBarSpan, icon);
        setTooltip(this.statusBarEl, tt, {
            placement: "top",
        });
    }
}
