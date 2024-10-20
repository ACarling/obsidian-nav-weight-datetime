import NaveightPlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";
import { DEFAULT_SETTINGS, SettingKey } from "setting";
import SettingsUtils from "settingUtils";


export interface SettingTabInfo {
    name: string;
    desc: string;
}
export type SettingTabInfos = Record<SettingKey, SettingTabInfo>;


export const SETTING_TAB_INFOS: SettingTabInfos = {
    sortKey: {
        name: 'Sort key',
        desc: 'The key use to sort defined in frontmatter, eg: weight, order'
    },
    weightForFolder: {
        name: 'Default value for folder',
        desc: 'Fallback for missing value, such as value undefined'
    },
    weightForIndex: {
        name: 'Fixed value for index markdown file',
        desc: 'Fixed value for index, such as index.md readme.md'
    },
    weightForMarkdownFile: {
        name: 'Default value for normal markdown file',
        desc: 'Fallback for missing value, such as value undefined'
    },
    weightForOtherFile: {
        name: 'Default value for unknown file',
        desc: 'Default value for files except markdown'
    }
};

export class NavWeightSettingTab extends PluginSettingTab {
    plugin: NaveightPlugin;

    constructor(app: App, plugin: NaveightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setHeading()
            .setName('Frontmatter');
        for (const key in DEFAULT_SETTINGS) {
            SettingsUtils.addTabText(this.plugin, containerEl, key as SettingKey);
        }

    }
}

