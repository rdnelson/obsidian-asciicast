import { App, Editor, EventRef, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, View, ViewState, Workspace, WorkspaceLeaf } from 'obsidian';
import { AsciicastPostProcessor } from './asciicast-postprocessor';
import { AsciiCastView } from './AsciiCastView';

// @ts-ignore
import asciinemaJs from "asciinema-player/dist/bundle/asciinema-player.min";
// @ts-ignore
import asciinemaLoaderJs from "./asciicast-loader.txt";

// Remember to rename these classes and interfaces!

interface AsciiCastPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: AsciiCastPluginSettings = {
	mySetting: 'default'
}

export default class AsciiCastPlugin extends Plugin {
	settings: AsciiCastPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
		this.registerView("asciicasts", (l: WorkspaceLeaf) => new AsciiCastView(l));
		this.registerExtensions(["cast"], "asciicasts");

		const processor = new AsciicastPostProcessor(this.app);
		this.registerMarkdownPostProcessor((el, ctx) => { processor.process(el, ctx) });

		this.registerEvent(this.app.vault.on("create", (f) => processor.addFile(f)));
		this.registerEvent(this.app.vault.on("rename", (f, p) => processor.renameFile(f, p)));
		this.registerEvent(this.app.vault.on("delete", (f) => processor.deleteFile(f)));

		// @ts-ignore
		const exportApi = this.app.plugins?.plugins?.["webpage-html-export"]?.api;

		if (exportApi)
		{
			exportApi.addStaticJs("asciinema.min.js", asciinemaJs);
			exportApi.addStaticJs("asciinema-loader.js", asciinemaLoaderJs);
			exportApi.addPostProcessingStage("asciicast", (html: HTMLElement) => this.postProcess(html));
		}
	}

	async postProcess(html: HTMLElement)
	{
		const cls = this;
		html.querySelectorAll("div[data-castpath]").forEach(async (castDiv: HTMLDivElement) =>
		{
			const castPath = castDiv.dataset["castpath"];
			if (!castPath)
			{
				return;
			}

			const cast = cls.app.vault.getAbstractFileByPath(castPath);
			if (!cast || !(cast instanceof TFile))
			{
				return;
			}

			castDiv.innerHTML = '';
			castDiv.createDiv();
			/*const initScript = castDiv.createEl("script");
			initScript.innerHTML = `
			var castDiv = document.querySelector("div[data-castpath='${castPath}']>div");\n
			AsciinemaPlayer.create("/${castPath}", castDiv);
			`;*/
		})
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: AsciiCastPlugin;

	constructor(app: App, plugin: AsciiCastPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
