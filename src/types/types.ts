export interface NvtCfgFmKey {
    key_sort: string;
}

export interface NvtCfgFmFbk {
    fbk_weight_folder: number;
    fbk_weight_index: number;
    fbk_weight_md: number;
    fbk_weight_other: number;
    fbk_retitled: boolean;
}

export interface NvtCfg extends NvtCfgFmKey, NvtCfgFmFbk {
    filename_index: string;
    all_features: boolean;
}

export type NvtSetText = Omit<NvtCfg, keyof NvtSetToggle>;
export type NvtSetToggle = Pick<NvtCfg, "all_features" | "fbk_retitled">;

type Desc = {
    type: "toggle" | "text" | "heading";
    name: string;
    desc: string;
};

export type NvtSetDesc = Record<"heading_fm" | "heading_add" | keyof NvtCfg, Desc>;
export type DataType = number | boolean | string;
