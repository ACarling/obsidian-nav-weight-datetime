import { DEFAULT_CONFIG, SETTINGS_DESC } from "consts";
import NaveightPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { NwtCfg, NwtSet, NwtSetText, NwtSetToggle } from "types/types";
import Utils from "utils";

export class NaveightSettingTab extends PluginSettingTab {
    plugin: NaveightPlugin;

    constructor(app: App, plugin: NaveightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        this.addTabTextNwt(containerEl, 'filename_index');
        new Setting(containerEl)
            .setHeading()
            .setName('Front matter').setDesc('Setting front matter keys and their default values');

        type ExcludedKey = keyof (Pick<NwtSet, 'filename_index'> & NwtSetToggle)
        const excludedKeys: (ExcludedKey)[] = ['filename_index', 'all_features', 'fbk_retitled']
        for (const key in SETTINGS_DESC) {
            if (excludedKeys.contains(key as ExcludedKey)) {
                continue;
            }
            this.addTabTextNwt(containerEl, key as keyof NwtSetText);
        }

        new Setting(containerEl)
            .setHeading()
            .setName('Additional').setDesc('Additional settings for users that using "mkdocs" with "mkdocs-nav-weight" as publisher');
        this.addTabToggleNwt(containerEl, 'all_features');
        this.addTabToggleNwt(containerEl, 'fbk_retitled');

    }

    addTabTextNwt(containerEl: HTMLElement, key: keyof NwtSetText) {
        const desc = SETTINGS_DESC[key];
        const curr = this.plugin.userConfig[key];
        const dflt = DEFAULT_CONFIG[key];

        new Setting(containerEl)
            .setName(desc.name)
            .setDesc(desc.desc)
            .addText(text => text
                .setPlaceholder(String(dflt))
                .setValue(String(curr))
                .onChange(async (input) => {
                    // check is valid
                    const data = Utils.getStringAsDataOrNull(input, typeof dflt);
                    (this.plugin.userConfig[key] as NwtCfg[keyof NwtCfg]) = data === null ? dflt : data;
                    await this.plugin.saveSettings();
                }));
    }

    addTabToggleNwt(containerEl: HTMLElement, key: keyof Pick<NwtSet, 'all_features' | 'fbk_retitled'>) {
        const desc = SETTINGS_DESC[key];
        const curr = this.plugin.userConfig[key];

        new Setting(containerEl)
            .setName(desc.name)
            .setDesc(desc.desc)
            .addToggle(toggle => toggle
                .setValue(curr)
                .onChange(async (value) => {
                    this.plugin.userConfig[key] = value;
                    await this.plugin.saveSettings();
                }))



    }
}