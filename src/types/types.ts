export interface CfgFmKey {
    key_sort: string;
    key_headless_index: string;
    key_headless_md: string;
    key_retitled: string;
}

export interface CfgFmFbk {
    fbk_weight_folder: number;
    fbk_weight_index: number;
    fbk_weight_md: number;
    fbk_weight_other: number;
    fbk_headless: boolean;
    fbk_retitled: boolean;
}

export interface NwtCfg extends CfgFmKey, CfgFmFbk {
    filename_index: string;
    all_features: boolean;
}

export type NwtCfgRecord = Record<keyof NwtCfg, NwtCfg[keyof NwtCfg]>;

export type NwtSet = Omit<NwtCfg, "key_headless_index" | "key_headless_md" | "key_retitled" | "fbk_headless">;
export type NwtSetText = Omit<NwtSet, "all_features" | "fbk_retitled">;
export type NwtSetToggle = Pick<NwtSet, "all_features" | "fbk_retitled">;

type Desc = {
    name: string;
    desc: string;
};

export type SettingsDesc = Record<keyof NwtSet, Desc>;
