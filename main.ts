import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Sorter } from 'src/sorter';
// Remember to rename these classes and interfaces!

export interface NavPluginSettings {
	sortKey: string;
	defaultForFolder: number;
	defaultForIndex: number;
	defaultForMarkdownFile: number;
	defaultForOtherFile: number;
}

const DEFAULT_SETTINGS: NavPluginSettings = {
	sortKey: 'weight',
	defaultForFolder: -20,
	defaultForIndex: -10,
	defaultForMarkdownFile: 0,
	defaultForOtherFile: 10,
}

export default class NavWeight extends Plugin {
	settings: NavPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('info', 'Sort navigation', async () => {

			// 🖕 fuck obsidian 
			// its n.view.getViewType(), not n.type
			const fileExpLeaves = this.app.workspace.getLeavesOfType("file-explorer");
			const fileExpLeaf = fileExpLeaves[0];
			if (!fileExpLeaf) return;

			Sorter.init(fileExpLeaf.view, this.settings)
			Sorter.startSorting();

		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NavWeightSettingTab(this.app, this));

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as NavPluginSettings;
		this.checkSettingsIsValid();
	}

	async saveSettings() {
		this.checkSettingsIsValid();
		await this.saveData(this.settings);
	}

	checkSettingsIsValid() {
		for (const key in DEFAULT_SETTINGS) {
			const k = key as keyof NavPluginSettings;
			const settingType = typeof this.settings[k]
			const validType = typeof DEFAULT_SETTINGS[k]

			let isValid = true;
			if (settingType !== validType) {
				isValid = false;
			} else if ((settingType === 'number') && Number.isNaN(this.settings[k])) {
				isValid = false;
			} else if ((settingType === 'string') && (this.settings[k] as string).trim() !== this.settings[k]) {
				isValid = false;
			}
			// override with default value
			if (isValid === false) (this.settings[k] as number | string) = DEFAULT_SETTINGS[k];
		}
	}
}



class NavWeightSettingTab extends PluginSettingTab {
	plugin: NavWeight;

	constructor(app: App, plugin: NavWeight) {
		super(app, plugin);
		this.plugin = plugin;
	}



	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Sort key')
			.setDesc('The key use to sort defined in frontmatter, eg: weight, order')
			.addText(text => text
				.setPlaceholder('weight')
				.setValue(this.plugin.settings.sortKey)
				.onChange(async (value) => {
					this.plugin.settings.sortKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Default value for folder')
			.setDesc('Fallback for missing value, such as value undefined')
			.addText(text => text
				.setPlaceholder('-20')
				.setValue(this.plugin.settings.defaultForFolder.toString())
				.onChange(async (value) => {
					this.plugin.settings.defaultForFolder = parseFloat(value) || this.plugin.settings.defaultForFolder;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Fixed value for index markdown file')
			.setDesc('Fixed value for index, such as index.md readme.md')
			.addText(text => text
				.setPlaceholder('-10')
				.setValue(this.plugin.settings.defaultForIndex.toString())
				.onChange(async (value) => {
					this.plugin.settings.defaultForIndex = parseFloat(value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Default value for normal markdown file')
			.setDesc('Fallback for missing value, such as value undefined')
			.addText(text => text
				.setPlaceholder('0')
				.setValue(this.plugin.settings.defaultForMarkdownFile.toString())
				.onChange(async (value) => {
					this.plugin.settings.defaultForMarkdownFile = parseFloat(value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Default value for unknown file')
			.setDesc('Default value for files except markdown')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.defaultForOtherFile.toString())
				.onChange(async (value) => {
					this.plugin.settings.defaultForOtherFile = parseFloat(value);
					await this.plugin.saveSettings();
				}));

	}
}
