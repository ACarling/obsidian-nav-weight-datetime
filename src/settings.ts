import { App, PluginSettingTab, Setting } from "obsidian";
import NavWeightPlugin from "main";
import SettingsUtils from "settingsUtils";

//#region TYPES
interface SettingTabText {
    name: string;
    desc: string;
}

export interface SettingTabTextPairs {
    sortKey: SettingTabText;
    weightForFolder: SettingTabText;
    weightForIndex: SettingTabText;
    weightForMarkdownFile: SettingTabText;
    weightForOtherFile: SettingTabText;
}

export interface SettingPairs {
    sortKey: string;
    weightForFolder: number;
    weightForIndex: number;
    weightForMarkdownFile: number;
    weightForOtherFile: number;
}

export type SettingValueType = number | string

//#endregion

//#region CONSTANT
export const DEFAULT_SETTINGS: SettingPairs = {
    sortKey: 'weight',
    weightForFolder: -20,
    weightForIndex: -10,
    weightForMarkdownFile: 0,
    weightForOtherFile: 10,
}

export const SETTING_TAB_TEXTS: SettingTabTextPairs = {
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
}

//#endregion

export class NavWeightSettingTab extends PluginSettingTab {
    plugin: NavWeightPlugin;

    constructor(app: App, plugin: NavWeightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setHeading()
            .setName('Frontmatter')
        for (const key in DEFAULT_SETTINGS) {
            SettingsUtils.addTabText(this.plugin, containerEl, key as keyof SettingPairs)
        }

    }
}