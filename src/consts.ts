import { NvtCfg, NvtSetDesc } from "types/types";

export const DEFAULT_CONFIG: NvtCfg = {
    filename_index: "index",
    key_sort: "created",
    fbk_weight_folder: -20000,
    fbk_weight_index: -10000,
    fbk_weight_md: 0,
    fbk_weight_other: 0,
    fbk_retitled: false,
    all_features: false,
};

export const SETTINGS_DESC: NvtSetDesc = {
    filename_index: {
        type: "text",
        name: "File name of index",
        desc: 'Do not include the file extension, such as "index", "readme".',
    },
    heading_fm: {
        type: "heading",
        name: "Markdown Frontmatter",
        desc: "Setting Frontmatter keys and their default values.",
    },
    key_sort: {
        type: "text",
        name: "Sort key",
        desc: 'The key defined in the frontmatter and use its value as a weight to sort the ".md" files, eg: "weight", "order".',
    },
    fbk_weight_folder: {
        type: "text",
        name: "Default weight for folder",
        desc: "Fallback for folder, if it does not possess a child index, or the value in index is invalid. ",
    },
    fbk_weight_index: {
        type: "text",
        name: "Fixed weight for index",
        desc: "Fixed value sharing by each index.",
    },
    fbk_weight_md: {
        type: "text",
        name: "Default weight for markdown",
        desc: 'Fallback for normal ".md" file.',
    },
    fbk_weight_other: {
        type: "text",
        name: "Fixed weight for unknown file",
        desc: 'Fixed value for files except ".md".',
    },
    heading_add: {
        type: "heading",
        name: "Additional",
        desc: 'Additional settings for users that using "mkdocs" with "mkdocs-nav-weight" as publisher.',
    },
    all_features: {
        type: "toggle",
        name: 'Enable features for "mkdocs-nav-weight"',
        desc: "Enable all features.",
    },
    fbk_retitled: {
        type: "toggle",
        name: 'Default value for key "retitled"',
        desc: 'Controlling the default behavior of folder naming, "ON" is "true", "OFF" is "false".',
    },
};
