// @ts-ignore
import * as AsciinemaPlayer from 'asciinema-player';

import { App, MarkdownPostProcessorContext, TAbstractFile, TFile, normalizePath, EventRef } from 'obsidian';

export class AsciicastPostProcessor
{
    private readonly _app: App;
    private readonly _filesByName: Map<string, string[]>;

    constructor(app: App)
    {
        this._app = app;
        this._filesByName = new Map<string, string[]>();

        app.vault.getFiles().forEach((f) =>
        {
            this.addFile(f);
        });
    }

    public async process(el: HTMLElement, ctx: MarkdownPostProcessorContext)
    {
        const cls = this;

        el.querySelectorAll("img").forEach((img: HTMLImageElement) =>
        {
            if (!img.src.startsWith("cast:"))
            {
                return;
            }

            const castPath = normalizePath(img.src.substring(5));
            const currentPath = ctx.sourcePath;
            let castFile = cls._app.vault.getAbstractFileByPath(castPath);

            if (!castFile)
            {
                const paths = cls._filesByName.get(castPath);

                if (!paths?.length)
                {
                    // No file with that name
                    return;
                }

                const chosenPath = cls.getBestMatch(currentPath, castPath, paths);
                castFile = cls._app.vault.getAbstractFileByPath(chosenPath);
            }

            if (!castFile || !(castFile instanceof TFile))
            {
                return;
            }

            const resource = cls._app.vault.getResourcePath(castFile);

            const player = document.createElement("div");
            player.dataset["castpath"] = castFile.path; 
            AsciinemaPlayer.create(resource, player);
            img.replaceWith(player);
        })
    }

    private getBestMatch(currentPath: string, askedPath: string, paths: string[]): string {
        if (paths.length === 1)
        {
            return paths[0];
        }

        const currentSegments = currentPath.split("/");
        if (currentSegments.length > 1)
        {
            for (let i = currentSegments.length - 1; i >= 0; i--)
            {
                const dir = currentSegments.slice(0, i).join("/");
                const testPath = dir + "/" + askedPath;
                if (paths.contains(testPath))
                {
                    return testPath;
                }
            }
        }

        return paths[0];
    }

    public addFile(file: TAbstractFile)
    {
        if (this._filesByName.has(file.name))
        {
            this._filesByName.get(file.name)?.push(file.path);
        }
        else
        {
            this._filesByName.set(file.name, [file.path]);
        }
    }

	public deleteFile(file: TAbstractFile)
    {
        const files = this._filesByName.get(file.name);
        if (!files)
        {
            return;
        }

        if (files.length === 1)
        {
            this._filesByName.delete(file.name);
        }
        else
        {
            files.remove(file.path);
        }
	}

	public renameFile(file: TAbstractFile, oldPath: string)
    {
        const oldName = oldPath.split('/').last()!;
        const oldFiles = this._filesByName.get(oldName);
        if (oldFiles)
        {
            if (oldFiles.length > 1)
            {
                oldFiles.remove(oldPath);
            }
            else
            {
                this._filesByName.delete(oldName);
            }
        }

        this.addFile(file);
	}
}