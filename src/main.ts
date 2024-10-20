import { FileExplorerView, Plugin } from 'obsidian';
import { NavWeightSettingTab } from "settingTab";
import Sorter from 'sorter';
import SettingsUtils from 'settingUtils';
import { NaveightSettings } from 'setting';


export default class NaveightPlugin extends Plugin {
	userSettings: NaveightSettings;

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

				Sorter.startSorting(leaf.view as FileExplorerView, this.userSettings)

			});
			// Perform additional things with the ribbon
			ribbonIconEl.addClass('nav-weight-ribbon-class');

			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			// const statusBarItemEl = this.addStatusBarItem();
			// statusBarItemEl.setText('Nav Weight ✅');
			// statusBarItemEl.

			// This adds a settings tab so the user can configure various aspects of the plugin
			this.addSettingTab(new NavWeightSettingTab(this.app, this));
		})
	}

	onunload() {
	}

	async loadSettings() {
		this.userSettings = SettingsUtils.verifyData(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.userSettings);
	}
}




