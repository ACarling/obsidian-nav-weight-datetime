import { FileExplorerView, Plugin, setTooltip } from 'obsidian';
import { DESC_OF_SETTINGS, DescOfSettings, NwtCfg, RawData, DEFAULT_CONFIG as dfltConfig, } from 'setting';
import { NaveightSettingTab } from "setting";
import Utils from 'utils';
import Sorter, { questionSVG } from 'sorter';

const sortIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-arrow-down-0-1"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><rect x="15" y="4" width="4" height="6" ry="2"/><path d="M17 20v-6h-2"/><path d="M15 20h4"/></svg>'

export default class NaveightPlugin extends Plugin {
	userConfig: NwtCfg;

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {

			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			const statusBarEl = this.addStatusBarItem();
			const span = statusBarEl.createSpan({ cls: 'status-bar-item-icon' });
			span.innerHTML = questionSVG;
			setTooltip(statusBarEl, 'Nav Weight: Unsorted', { placement: 'top' })


			// This creates an icon in the left ribbon.
			const ribbonIconEl = this.addRibbonIcon('', 'Sort navigation', async () => {

				// 🖕 fuck obsidian 
				// its n.view.getViewType(), not n.type
				const leaves = this.app.workspace.getLeavesOfType("file-explorer");
				const leaf = leaves[0];
				if (!leaf) return;

				const sorter = new Sorter(leaf.view as FileExplorerView, this.userConfig, statusBarEl);
				sorter.sort();

			});
			// Perform additional things with the ribbon
			ribbonIconEl.innerHTML = sortIcon;



			// This adds a settings tab so the user can configure various aspects of the plugin
			this.addSettingTab(new NaveightSettingTab(this.app, this));
		})
	}

	onunload() {
	}

	async loadSettings() {
		const loadedSettings = Object.assign({}, await this.loadData()) as Record<keyof NwtCfg, RawData>;
		const tempConfig = {} as NwtCfg;


		for (const key in dfltConfig) {
			const k = key as keyof NwtCfg;

			(tempConfig[k] as NwtCfg[keyof NwtCfg]) = Utils.getRawAsDataOrDflt(loadedSettings[k], dfltConfig[k]);
		}

		this.userConfig = tempConfig;

		// console.log('load', this.userConfig);
	}

	async saveSettings() {
		const savingSettings = {} as NwtCfg;

		for (const k in DESC_OF_SETTINGS) {
			const key = k as keyof DescOfSettings
			(savingSettings[key] as NwtCfg[keyof NwtCfg]) = this.userConfig[key];
		}

		await this.saveData(savingSettings);
	}
}



