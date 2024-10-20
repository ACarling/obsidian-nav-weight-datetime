import NaveightPlugin from "main";
import { Setting } from "obsidian";
import { DEFAULT_SETTINGS as defaultSettings, NaveightSettings, SettingData, SettingKey } from "setting";
import { SETTING_TAB_INFOS as settingTabInfos } from "settingTab";


export default class SettingsUtils {

    static getNumberOrNull(input: string) {
        const numberPattern = /^-?\d+(\.\d+)?$/;
        return numberPattern.test(input) ? parseFloat(input) : null;
    }

    static getStringOrNull(input: string) {
        return input.trim() === input ? input : null;
    }

    static getInputOrDflt(input: string, key: SettingKey): SettingData {
        const dflt = defaultSettings[key]

        if (typeof defaultSettings[key] === 'string')
            return this.getStringOrNull(input) || dflt;
        else
            return this.getNumberOrNull(input) || dflt;
    }

    static verifyData(data: NaveightSettings) {
        for (const key in defaultSettings) {
            const k = key as SettingKey;
            (data[k] as SettingData) = this.getInputOrDflt(String(data[k]), k)
        }
        return data;
    }

    static addTabText(plugin: NaveightPlugin, containerEl: HTMLElement, settingKey: SettingKey) {
        const texts = settingTabInfos[settingKey];
        const curr = plugin.userSettings[settingKey];
        const dflt = defaultSettings[settingKey];

        new Setting(containerEl)
            .setName(texts.name)
            .setDesc(texts.desc)
            .addText(text => text
                .setPlaceholder(String(dflt))
                .setValue(String(curr))
                .onChange(async (input) => {
                    // check is valid
                    (plugin.userSettings[settingKey] as SettingData) = this.getInputOrDflt(input, settingKey);
                    await plugin.saveSettings();
                }));
    }

}