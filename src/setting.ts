import NaveightPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import Utils from "utils";

export interface CfgFmKey {
    key_sort: string
    key_headless_index: string
    key_headless_md: string
    key_retitled: string
}

export type CfgFmKeyIdx = Omit<CfgFmKey, 'key_headless_md'>
export type CfgFmKeyMd = Omit<CfgFmKey, 'key_retitled' | 'key_headless_index'>
export type CfgFmFbkIdx = Pick<CfgFmFbk, 'fbk_weight_folder' | 'fbk_headless' | 'fbk_retitled'>
export type CfgFmFbkMd = Pick<CfgFmFbk, 'fbk_weight_md' | 'fbk_headless'>

export interface CfgFmFbkWt {
    fbk_weight_folder: number
    fbk_weight_index: number
    fbk_weight_md: number
    fbk_weight_other: number
}

export interface CfgFmFbk extends CfgFmFbkWt {
    fbk_headless: boolean
    fbk_retitled: boolean
}

export type CfgNotSet = Pick<CfgFmFbk, 'fbk_headless'>

export type RawData = NwtCfg[keyof NwtCfg] | null;

export type NwtCfg = CfgFmKey & CfgFmFbk


export const DEFAULT_CONFIG: NwtCfg = {
    key_sort: 'weight',
    key_headless_index: 'empty',
    key_headless_md: 'headless',
    key_retitled: 'retitled',
    fbk_weight_folder: -20,
    fbk_weight_index: -10,
    fbk_weight_md: 0,
    fbk_weight_other: 10,
    fbk_headless: false,
    fbk_retitled: false
}

type NwtSet = keyof Omit<NwtCfg, 'fbk_headless'>
interface Desc {
    name: string
    desc: string
}
export type DescOfSettings = Record<NwtSet, Desc>

export const DESC_OF_SETTINGS: DescOfSettings = {
    key_sort: {
        name: 'Sort key',
        desc: 'The key use to sort defined in frontmatter, eg: weight, order'
    },
    key_headless_index: {
        name: 'Headless for index',
        desc: 'Headless for index, such as index.md readme.md'
    },
    key_headless_md: {
        name: 'Headless for markdown',
        desc: 'Headless for markdown, such as index.md readme.md'
    },
    key_retitled: {
        name: 'Retitled',
        desc: 'Retitled file will be sorted by its title'
    },
    fbk_weight_folder: {
        name: 'Default value for folder',
        desc: 'Fallback for missing value, such as value undefined'
    },
    fbk_weight_index: {
        name: 'Fixed value for index markdown file',
        desc: 'Fixed value for index, such as index.md readme.md'
    },
    fbk_weight_md: {
        name: 'Default value for normal markdown file',
        desc: 'Fallback for missing value, such as value undefined'
    },
    fbk_weight_other: {
        name: 'Default value for unknown file',
        desc: 'Default value for files except markdown'
    },
    fbk_retitled: {
        name: 'Retitled',
        desc: 'Retitled file will be sorted by its title'
    }
};




export class NaveightSettingTab extends PluginSettingTab {
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

        // add SETTING_TAB_INFOS
        for (const key in DESC_OF_SETTINGS) {
            Utils.addTabText(this.plugin, containerEl, key as keyof DescOfSettings);
        }

    }
}