export interface NvtCfgFmKey {
    key_sort: string;
    key_headless: string;
    key_empty: string;
    key_retitled: string;
}

export interface NvtCfgFmFbk {
    fbk_weight_folder: number;
    fbk_weight_index: number;
    fbk_weight_md: number;
    fbk_weight_other: number;
    fbk_headless: boolean;
    fbk_retitled: boolean;
}

export interface NvtCfg extends NvtCfgFmKey, NvtCfgFmFbk {
    filename_index: string;
    all_features: boolean;
}

export type NvtSet = Omit<NvtCfg, "key_empty" | "key_headless" | "key_retitled" | "fbk_headless">;
export type NvtSetText = Omit<NvtSet, "all_features" | "fbk_retitled">;
export type NvtSetToggle = Pick<NvtSet, "all_features" | "fbk_retitled">;

type Desc = {
    name: string;
    desc: string;
};

export type NvtSetDesc = Record<keyof NvtSet, Desc>;
