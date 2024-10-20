

export interface NaveightSettings {
    sortKey: string;
    weightForFolder: number;
    weightForIndex: number;
    weightForMarkdownFile: number;
    weightForOtherFile: number;
}
export type SettingKey = keyof NaveightSettings;
export type SettingData = number | string;

export const DEFAULT_SETTINGS: NaveightSettings = {
    sortKey: 'weight',
    weightForFolder: -20,
    weightForIndex: -10,
    weightForMarkdownFile: 0,
    weightForOtherFile: 10,
}

