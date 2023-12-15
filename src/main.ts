import { App, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { AsciicastPostProcessor } from './asciicast-postprocessor';
import { AsciiCastView } from './AsciiCastView';

// @ts-ignore
import asciinemaJs from "asciinema-player/dist/bundle/asciinema-player.min";
// @ts-ignore
import asciinemaLoaderJs from "./asciicast-loader.txt";
import { castViewPlugin } from './CastViewPlugin';
import { locator } from './locator';

export default class AsciiCastPlugin extends Plugin {
	async onload() {
		this.registerView("asciicasts", (l: WorkspaceLeaf) => new AsciiCastView(l));
		this.registerExtensions(["cast"], "asciicasts");

		locator.initialize(this.app);
		const processor = new AsciicastPostProcessor();
		this.registerMarkdownPostProcessor((el, ctx) => { processor.process(el, ctx) });

		this.registerEvent(this.app.vault.on("create", (f) => locator.addFile(f)));
		this.registerEvent(this.app.vault.on("rename", (f, p) => locator.renameFile(f, p)));
		this.registerEvent(this.app.vault.on("delete", (f) => locator.deleteFile(f)));

		// @ts-ignore
		const exportApi = this.app.plugins?.plugins?.["webpage-html-export"]?.api;

		this.registerEditorExtension(this.inlinePlugin(this.app));

		if (exportApi)
		{
			exportApi.addStaticJs("asciinema.min.js", asciinemaJs);
			exportApi.addStaticJs("asciinema-loader.js", asciinemaLoaderJs);
			exportApi.addPostProcessingStage("asciicast", (html: HTMLElement) => this.postProcess(html));
		}
	}

	async onunload()
	{
		// @ts-ignore
		const exportApi = this.app.plugins?.plugins?.["webpage-html-export"]?.api;


		if (exportApi)
		{
			exportApi.removeStaticJs("asciinema.min.js", asciinemaJs);
			exportApi.removeStaticJs("asciinema-loader.js", asciinemaLoaderJs);
			exportApi.removePostProcessingStage("asciicast");
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

			castDiv.replaceChildren();
			castDiv.createDiv();
		});
	}

	inlinePlugin(app: App): Extension {
		return Prec.highest(castViewPlugin);
	}
}

