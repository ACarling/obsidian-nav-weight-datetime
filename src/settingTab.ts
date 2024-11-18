import { DEFAULT_CONFIG, SETTINGS_DESC } from "consts";
import NaveightPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { NvtCfg, NvtSetDesc } from "types/types";
import Utils from "utils";

export class NaveightSettingTab extends PluginSettingTab {
    plugin: NaveightPlugin;
    modifiedConfig: NvtCfg;
    cachedAllFeatures: boolean;

    constructor(app: App, plugin: NaveightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    hide(): void {
        // console.log("hide", this.modifiedConfig);
        if (this.modifiedConfig.all_features === false && this.cachedAllFeatures === true) {
            this.plugin.sorter.needCleanupIcons = true;
        }
        // ! The settings must be saved after setting needCleanupIcons.
        // ! Otherwise, the automatic sorting will not use the needCleanupIcons tag.
        if (Object.keys(this.modifiedConfig).length !== 0) {
            this.plugin.saveSettings(this.modifiedConfig, false);
        }
        super.hide();
    }

    display(): void {
        this.modifiedConfig = {} as NvtCfg;
        this.cachedAllFeatures = this.plugin.userConfig.all_features;

        const { containerEl } = this;
        containerEl.empty();

        const options: (keyof NvtSetDesc)[] = [
            "filename_index",
            "heading_fm",
            "key_sort",
            "fbk_weight_folder",
            "fbk_weight_index",
            "fbk_weight_md",
            "fbk_weight_other",
            "heading_add",
            "all_features",
            "fbk_retitled",
        ];

        for (const key of options) {
            switch (SETTINGS_DESC[key].type) {
                case "text":
                    this.addTabText(containerEl, key as keyof NvtCfg);
                    break;
                case "toggle":
                    this.addTabToggle(containerEl, key as keyof NvtCfg);
                    break;
                default:
                    this.addTabHeading(containerEl, key as keyof NvtCfg);
            }
        }
    }

    addTabText<K extends keyof NvtCfg>(containerEl: HTMLElement, key: K) {
        const desc = SETTINGS_DESC[key];
        const curr = this.plugin.userConfig[key];
        const dflt = DEFAULT_CONFIG[key];

        new Setting(containerEl)
            .setName(desc.name)
            .setDesc(desc.desc)
            .addText((text) =>
                text
                    .setPlaceholder(String(dflt))
                    .setValue(String(curr))
                    .onChange((input) => {
                        // check is valid
                        const data = Utils.parseStringData(input, dflt);
                        this.modifiedConfig[key] = data ?? dflt;
                    })
            );
    }

    addTabToggle<K extends keyof NvtCfg>(containerEl: HTMLElement, key: K) {
        const desc = SETTINGS_DESC[key];
        const curr = this.plugin.userConfig[key] as boolean;

        new Setting(containerEl)
            .setName(desc.name)
            .setDesc(desc.desc)
            .addToggle((toggle) =>
                toggle.setValue(curr).onChange((value) => {
                    this.modifiedConfig[key] = value as NvtCfg[K];
                })
            );
    }

    addTabHeading<K extends keyof NvtCfg>(containerEl: HTMLElement, key: K) {
        const { name, desc } = SETTINGS_DESC[key];
        new Setting(containerEl).setHeading().setName(name).setDesc(desc);
    }
}
