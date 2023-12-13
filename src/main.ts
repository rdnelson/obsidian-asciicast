import { Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { AsciicastPostProcessor } from './asciicast-postprocessor';
import { AsciiCastView } from './AsciiCastView';

// @ts-ignore
import asciinemaJs from "asciinema-player/dist/bundle/asciinema-player.min";
// @ts-ignore
import asciinemaLoaderJs from "./asciicast-loader.txt";

export default class AsciiCastPlugin extends Plugin {
	async onload() {
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
		});
	}
}
