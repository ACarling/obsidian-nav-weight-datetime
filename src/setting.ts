import NaveightPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import Utils from "utils";

export interface CfgFmKey {
    key_sort: string
    key_headless_index: string
    key_headless_md: string
    key_retitled: string
}

export interface CfgFmFbk {
    fbk_weight_folder: number
    fbk_weight_index: number
    fbk_weight_md: number
    fbk_weight_other: number
    fbk_headless: boolean
    fbk_retitled: boolean
}

export type RawData = NwtCfg[keyof NwtCfg] | null;

export interface NwtCfg extends CfgFmKey, CfgFmFbk {
    filename_index: string
}


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
    fbk_retitled: false,
    filename_index: 'index'
}

type NwtSet = Pick<CfgFmKey, 'key_sort'> & Omit<NwtCfg, keyof CfgFmKey | 'fbk_headless'>
interface Desc {
    name: string
    desc: string
}
export type DescOfSettings = Record<keyof NwtSet, Desc>

export const DESC_OF_SETTINGS: DescOfSettings = {
    key_sort: {
        name: 'Sort key',
        desc: 'The key defined in the frontmatter and use its value as a weight to sort the ".md" files, eg: "weight", "order"'
    },
    fbk_weight_folder: {
        name: 'Default weight for folder',
        desc: 'Fallback for folder, if it does not possess a child index, or the value in index is invalid. '
    },
    fbk_weight_index: {
        name: 'Fixed value for "index.md" file',
        desc: 'Fixed value sharing by each index'
    },
    fbk_weight_md: {
        name: 'Default value for normal ".md" file',
        desc: 'Fallback for normal ".md" file'
    },
    fbk_weight_other: {
        name: 'Fixed value for unknown file',
        desc: 'Fixed value for files except ".md"'
    },
    fbk_retitled: {
        name: 'Default value for key "retitled"',
        desc: 'Controlling the default behavior of folder naming'
    },
    filename_index: {
        name: 'File name of index',
        desc: 'Do not include the file extension, such as "index", "readme"'
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

        Utils.addTabText(this.plugin, containerEl, 'filename_index');
        new Setting(containerEl)
            .setHeading()
            .setName('Front matter').setDesc('Setting front matter keys and their default values');

        const fmSetKeys: (keyof DescOfSettings)[] = ['key_sort', 'fbk_weight_folder', 'fbk_weight_index', 'fbk_weight_md', 'fbk_weight_other']
        for (const key of fmSetKeys) {
            Utils.addTabText(this.plugin, containerEl, key);
        }
        new Setting(containerEl)
        .setHeading()
        .setName('Additional').setDesc('Additional settings for users that using "mkdocs" with "mkdocs-nav-weight" as publisher');
        Utils.addTabText(this.plugin, containerEl, 'fbk_retitled');

    }
}