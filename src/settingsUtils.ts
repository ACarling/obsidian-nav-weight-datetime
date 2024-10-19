import NavWeightPlugin from "main";
import { Setting } from "obsidian";
import { SettingValueType, DEFAULT_SETTINGS as defaultSettings, SETTING_TAB_TEXTS as settingTabTexts, SettingPairs, SettingTabTextPairs } from "settings";



export default class SettingsUtils {

    static getNumberOrNull(input: string) {
        const numberPattern = /^-?\d+(\.\d+)?$/;
        return numberPattern.test(input) ? parseFloat(input) : null;
    }

    static getStringOrNull(input: string) {
        return input.trim() === input ? input : null;
    }

    static getInputOrDflt(input: string, keyOfSetting: keyof SettingPairs): SettingValueType {
        const dflt = defaultSettings[keyOfSetting]

        if (typeof defaultSettings[keyOfSetting] === 'string')
            return this.getStringOrNull(input) || dflt;
        else
            return this.getNumberOrNull(input) || dflt;
    }

    static verifyData(data: SettingPairs) {
        for (const key in defaultSettings) {
            const k = key as keyof SettingPairs;
            (data[k] as SettingValueType) = this.getInputOrDflt(String(data[k]), k)
        }
        return data;
    }

    static addTabText(plugin: NavWeightPlugin, containerEl: HTMLElement, keyOfSetting: keyof SettingPairs) {
        const texts = settingTabTexts[keyOfSetting as keyof SettingTabTextPairs];
        const curr = plugin.settings[keyOfSetting];
        const dflt = defaultSettings[keyOfSetting];

        new Setting(containerEl)
            .setName(texts.name)
            .setDesc(texts.desc)
            .addText(text => text
                .setPlaceholder(String(dflt))
                .setValue(String(curr))
                .onChange(async (input) => {
                    // check is valid
                    (plugin.settings[keyOfSetting] as SettingValueType) = this.getInputOrDflt(input, keyOfSetting);
                    await plugin.saveSettings();
                }));
    }

}