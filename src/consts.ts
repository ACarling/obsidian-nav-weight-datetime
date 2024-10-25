import { NwtCfg, SettingsDesc } from "types/types";

export const SORT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-arrow-down-0-1"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><rect x="15" y="4" width="4" height="6" ry="2"/><path d="M17 20v-6h-2"/><path d="M15 20h4"/></svg>';
export const HEADLESS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-leaf"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
export const RETITLED_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-text-cursor-input"><path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1"/><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M9 7v10"/></svg>'
export const QUESTION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-question"><path d="M12 17h.01"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/></svg>'
export const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-check"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>'

export const DEFAULT_CONFIG: NwtCfg = {
    key_sort: 'weight',
    key_headless_index: 'empty',
    key_headless_md: 'headless',
    key_retitled: 'retitled',
    fbk_weight_folder: -20,
    fbk_weight_index: -10,
    fbk_weight_md: 0,
    fbk_weight_other: 10,
    fbk_headless: false,
    fbk_retitled: false,
    filename_index: 'index',
    all_features: false
};

export const SETTINGS_DESC: SettingsDesc = {
    key_sort: {
        name: 'Sort key',
        desc: 'The key defined in the frontmatter and use its value as a weight to sort the ".md" files, eg: "weight", "order"'
    },
    fbk_weight_folder: {
        name: 'Default weight for folder',
        desc: 'Fallback for folder, if it does not possess a child index, or the value in index is invalid. '
    },
    fbk_weight_index: {
        name: 'Fixed weight for index',
        desc: 'Fixed value sharing by each index'
    },
    fbk_weight_md: {
        name: 'Default weight for markdown',
        desc: 'Fallback for normal ".md" file'
    },
    fbk_weight_other: {
        name: 'Fixed weight for unknown file',
        desc: 'Fixed value for files except ".md"'
    },
    fbk_retitled: {
        name: 'Default value for key "retitled"',
        desc: 'Controlling the default behavior of folder naming, "ON" is "true", "OFF" is "false"'
    },
    filename_index: {
        name: 'File name of index',
        desc: 'Do not include the file extension, such as "index", "readme"'
    },
    all_features: {
        name: 'Enable features for "mkdocs-nav-weight"',
        desc: 'Enable all features'
    }
};

