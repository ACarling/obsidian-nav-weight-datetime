import NaveightPlugin from "main";
import { Setting } from "obsidian";
import { NwtCfg, RawData, DescOfSettings, DEFAULT_CONFIG as dfltConfig, CfgFmFbk } from "setting";
import { DESC_OF_SETTINGS as settingsTexts } from "setting";
import Sorter, { LogMsg } from "sorter";

export default class Utils {
    private static getValidNumberOrNull(num: string): number | null {
        const validNumber = /^[+-]?\d+(\.\d+)?$/;
        return validNumber.test(num) ? parseFloat(num) : null;
    }

    private static getValidStringOrNull(str: string): string | null {
        const validString = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
        return validString.test(str) ? str : null;
    }

    private static getValidBooleanOrNull(bool: string): boolean | null {
        const isTrue = bool === 'true'
        const isFalse = bool === 'false'
        const isValid = isTrue || isFalse

        return isValid ? (isTrue ? true : false) : null;
    }

    // a setting data, string
    private static getStringAsDataOrNull(str: string, expectType: string) {
        switch (expectType) {
            case 'number':
                return this.getValidNumberOrNull(str);
            case 'string':
                return this.getValidStringOrNull(str);
            case 'boolean':
                return this.getValidBooleanOrNull(str);
            default:
                return null;
        }
    }

    // a setting data from setting tab, string. 
    static getStringAsDataOrDflt<T extends CfgFmFbk[keyof CfgFmFbk] | NwtCfg[keyof NwtCfg]>(str: string, dflt: T, sorter?: Sorter, msg?: LogMsg) {
        const data = this.getStringAsDataOrNull(str, typeof dflt);
        if (data !== null) {
            return data as T
        }
        this.tryCatchLogger(sorter, msg);
        return dflt;
    }


    // a setting data loaded data.json/frontmatter, could be anything, so check type first.
    static getRawAsDataOrDflt<T extends CfgFmFbk[keyof CfgFmFbk] | NwtCfg[keyof NwtCfg]>(raw: RawData, dflt: T, sorter?: Sorter, msg?: LogMsg): T {
        const expectType = typeof dflt;

        // console.log(raw, typeof raw);
        switch (typeof raw) {
            case 'string':
                return this.getStringAsDataOrDflt(raw, dflt, sorter, msg);
            case 'number':
                if (expectType === 'number' && Number.isFinite(raw)) {
                    return raw as T;
                }
                this.tryCatchLogger(sorter, msg);
                return dflt;
            case 'boolean':
                if (expectType === 'boolean') {
                    return raw as T;
                }
                this.tryCatchLogger(sorter, msg);
                return dflt;
            case 'undefined':
                return dflt;
            default:
                this.tryCatchLogger(sorter, msg);
                return dflt;
        }
    }


    private static tryCatchLogger(sorter?: Sorter, msg?: LogMsg) {
        if (sorter && msg) {
            sorter.catchLogger(msg);
        }
    }

    static addTabText(plugin: NaveightPlugin, containerEl: HTMLElement, key: keyof DescOfSettings) {
        const info = settingsTexts[key];
        const curr = plugin.userConfig[key];
        const dflt = dfltConfig[key];

        new Setting(containerEl)
            .setName(info.name)
            .setDesc(info.desc)
            .addText(text => text
                .setPlaceholder(String(dflt))
                .setValue(String(curr))
                .onChange(async (input) => {
                    // check is valid
                    (plugin.userConfig[key] as NwtCfg[keyof NwtCfg]) = Utils.getStringAsDataOrDflt(input, dflt);
                    await plugin.saveSettings();
                }));
    }


}