import { SETTINGS_DESC, DEFAULT_CONFIG as dfltConfig } from "consts";
import { FileExplorerView, Plugin, setIcon, setTooltip } from "obsidian";
import { NaveightSettingTab } from "setting";
import Sorter from "sorter";
import { NwtCfg, NwtCfgRecord, NwtSet } from "types/types";
import Utils from "utils";

export default class NaveightPlugin extends Plugin {
    userConfig = {} as NwtCfg;

    async onload() {
        await this.loadSettings();

        this.app.workspace.onLayoutReady(() => {
            // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
            const statusBarEl = this.addStatusBarItem();
            const statusBarSpan = statusBarEl.createSpan({
                cls: "status-bar-item-icon",
            });
            setIcon(statusBarSpan, "file-x");
            setTooltip(statusBarEl, "Nav Weight\nUnsorted", {
                placement: "top",
            });

            // This creates an icon in the left ribbon.
            this.addRibbonIcon("arrow-down-01", "Sort navigation", async () => {
                // its n.view.getViewType(), not n.type
                const leaves = this.app.workspace.getLeavesOfType("file-explorer");
                const leaf = leaves[0];
                if (!leaf) return;

                const sorter = new Sorter(leaf.view as FileExplorerView, this.userConfig, statusBarEl, statusBarSpan);
                sorter.sort();
            });

            // This adds a settings tab so the user can configure various aspects of the plugin
            this.addSettingTab(new NaveightSettingTab(this.app, this));
        });
    }

    onunload() {}

    async loadSettings() {
        const loadedSettings = Object.assign({}, await this.loadData()) as NwtCfg;
        const tempSet = {} as NwtCfgRecord;

        for (const key in dfltConfig) {
            const k = key as keyof NwtCfg;
            const dflt = dfltConfig[k];
            const data = Utils.getRawAsDataOrNone(loadedSettings[k], typeof dflt);
            tempSet[k] = data === null || data === undefined ? dflt : data;
        }

        this.userConfig = tempSet as NwtCfg;

        // console.log('load', this.userConfig);
    }

    async saveSettings() {
        const savingSettings = {} as NwtCfgRecord;

        for (const k in SETTINGS_DESC) {
            const key = k as keyof NwtSet;
            savingSettings[key] = this.userConfig[key];
        }

        await this.saveData(savingSettings);
    }
}
