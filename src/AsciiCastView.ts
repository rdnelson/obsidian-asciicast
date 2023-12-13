import { TextFileView } from "obsidian";
// @ts-ignore
import * as AsciinemaPlayer from "asciinema-player";
import { Base64 } from "js-base64";

export class AsciiCastView extends TextFileView
{
    player: HTMLDivElement | null;

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string, clear: boolean): void {
        if (clear) {
            this.clear();
        }

        this.data = data;

        if (this.player)
        {
            AsciinemaPlayer.create("data:text/plain;base64," + Base64.encode(this.data), this.player);
            this.player.dataset["castpath"] = this.file?.path; 
        }
    }

    clear(): void {
        this.data = "";
    }

    getViewType(): string {
        return "asciicast"; 
    }

    protected async onOpen() {
        this.player = this.contentEl.createDiv();
        this.player.style.maxWidth = "95%";
    }
}