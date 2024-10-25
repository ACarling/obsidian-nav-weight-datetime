import { QUESTION_SVG, SETTINGS_DESC, SORT_SVG, DEFAULT_CONFIG as dfltConfig } from "consts";
import { FileExplorerView, Plugin, setTooltip } from 'obsidian';
import { NaveightSettingTab } from "setting";
import Sorter from 'sorter';
import { NwtCfg, NwtSet } from "types/types";
import Utils from 'utils';

export default class NaveightPlugin extends Plugin {
	userConfig = {} as NwtCfg;

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {

			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			const statusBarEl = this.addStatusBarItem();
			const span = statusBarEl.createSpan({ cls: 'status-bar-item-icon' });
			span.innerHTML = QUESTION_SVG;
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
			ribbonIconEl.innerHTML = SORT_SVG;



			// This adds a settings tab so the user can configure various aspects of the plugin
			this.addSettingTab(new NaveightSettingTab(this.app, this));
		})
	}

	onunload() {
	}

	async loadSettings() {
		const loadedSettings = Object.assign({}, await this.loadData()) as Record<keyof NwtCfg, unknown>;
		const tempSet = {} as NwtCfg;

		for (const key in dfltConfig) {
			const k = key as keyof NwtCfg;
			const dflt = dfltConfig[k]
			const data = Utils.getRawAsDataOrNone(loadedSettings[k], typeof dflt);
			(tempSet[k] as NwtCfg[keyof NwtCfg]) = (data === null || data === undefined) ? dflt : data
		}

		this.userConfig = tempSet;

		// console.log('load', this.userConfig);
	}

	async saveSettings() {
		const savingSettings = {} as NwtSet;

		for (const k in SETTINGS_DESC) {
			const key = k as keyof NwtSet
			(savingSettings[key] as NwtSet[keyof NwtSet]) = this.userConfig[key];
		}

		await this.saveData(savingSettings);
	}
}

