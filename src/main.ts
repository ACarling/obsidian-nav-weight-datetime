import { Plugin } from 'obsidian';
import { SettingPairs, NavWeightSettingTab } from 'settings';
import Sorter from 'sorter';
import SettingsUtils from 'settingsUtils';
// Remember to rename these classes and interfaces!



export default class NavWeightPlugin extends Plugin {
	settings: SettingPairs;

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			// This creates an icon in the left ribbon.
			const ribbonIconEl = this.addRibbonIcon('arrow-down-narrow-wide', 'Sort navigation', async () => {

				// 🖕 fuck obsidian 
				// its n.view.getViewType(), not n.type
				const fileExpLeaves = this.app.workspace.getLeavesOfType("file-explorer");
				const fileExpLeaf = fileExpLeaves[0];
				if (!fileExpLeaf) return;

				Sorter.startSorting(fileExpLeaf.view, this.settings)

			});
			// Perform additional things with the ribbon
			ribbonIconEl.addClass('nav-weight-ribbon-class');

			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			const statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText('Nav Weight ✅');
			// statusBarItemEl.

			// This adds a settings tab so the user can configure various aspects of the plugin
			this.addSettingTab(new NavWeightSettingTab(this.app, this));
		})
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = SettingsUtils.verifyData(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




