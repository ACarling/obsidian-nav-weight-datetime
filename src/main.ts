import { FileExplorerView, Plugin } from 'obsidian';
import { CfgNotSet, NwtCfg, RawData, DEFAULT_CONFIG as dfltConfig, } from 'setting';
import { NaveightSettingTab } from "setting";
import Utils from 'utils';
import Sorter from 'sorter';


export default class NaveightPlugin extends Plugin {
	userConfig: NwtCfg;

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			// This creates an icon in the left ribbon.
			const ribbonIconEl = this.addRibbonIcon('arrow-down-narrow-wide', 'Sort navigation', async () => {

				// 🖕 fuck obsidian 
				// its n.view.getViewType(), not n.type
				const leaves = this.app.workspace.getLeavesOfType("file-explorer");
				const leaf = leaves[0];
				if (!leaf) return;

				const sorter = new Sorter(leaf.view as FileExplorerView, this.userConfig);
				sorter.sort();

			});
			// Perform additional things with the ribbon
			ribbonIconEl.addClass('nav-weight-ribbon-class');

			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			// const statusBarItemEl = this.addStatusBarItem();
			// statusBarItemEl.setText('Nav Weight ✅');
			// statusBarItemEl.

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

		console.log('load', this.userConfig);
	}

	async saveSettings() {
		const excludedKey: keyof CfgNotSet = 'fbk_headless'
		const savingSettings = {} as NwtCfg;

		for (const key in dfltConfig) {
			const k = key as keyof NwtCfg;
			// ignore keys not setting
			if (key === excludedKey) continue;

			(savingSettings[k] as NwtCfg[keyof NwtCfg]) = this.userConfig[k];
		}

		await this.saveData(savingSettings);
	}
}



