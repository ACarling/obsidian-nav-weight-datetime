import { DEFAULT_CONFIG, SETTINGS_DESC } from "consts";
import NaveightPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { NvtSet, NvtSetText, NvtSetToggle } from "types/types";

export class NaveightSettingTab extends PluginSettingTab {
    plugin: NaveightPlugin;
    modifiedConfig: Partial<NvtSet>;

    constructor(app: App, plugin: NaveightPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    hide(): void {
        super.hide();
        this.plugin.saveSettings(this.modifiedConfig, true);
    }
    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        this.addTabText(containerEl, "filename_index");
        new Setting(containerEl)
            .setHeading()
            .setName("Front matter")
            .setDesc("Setting front matter keys and their default values.");

        type ExcludedKey = keyof (Pick<NvtSet, "filename_index"> & NvtSetToggle);
        const excludedKeys: ExcludedKey[] = ["filename_index", "all_features", "fbk_retitled"];
        for (const key in SETTINGS_DESC) {
            if (excludedKeys.contains(key as ExcludedKey)) {
                continue;
            }
            this.addTabText(containerEl, key as keyof NvtSetText);
        }

        new Setting(containerEl)
            .setHeading()
            .setName("Additional")
            .setDesc('Additional settings for users that using "mkdocs" with "mkdocs-nav-weight" as publisher.');

        this.addTabToggle(containerEl, "all_features");
        this.addTabToggle(containerEl, "fbk_retitled");
    }

    addTabText<K extends keyof NvtSetText>(containerEl: HTMLElement, key: K) {
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
                    .onChange(async (input) => {
                        // check is valid
                        const data = await this.plugin.getDataOrNull(input, dflt);
                        this.modifiedConfig[key] = data ?? dflt;
                    })
            );
    }

    addTabToggle(containerEl: HTMLElement, key: keyof Pick<NvtSet, "all_features" | "fbk_retitled">) {
        const desc = SETTINGS_DESC[key];
        const curr = this.plugin.userConfig[key];

        new Setting(containerEl)
            .setName(desc.name)
            .setDesc(desc.desc)
            .addToggle((toggle) =>
                toggle.setValue(curr).onChange(async (value) => {
                    this.modifiedConfig[key] = value;
                })
            );
    }
}
