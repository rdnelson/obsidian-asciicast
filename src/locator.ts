import { App, TAbstractFile, TFile, normalizePath } from 'obsidian';

class CastLocator
{
    private _app: App | null = null;
    private _filesByName: Map<string, string[]> | null = null;

    initialize(app: App)
    {
        this._app = app;
        this._filesByName = new Map<string, string[]>();

        app.vault.getFiles().forEach((f) =>
        {
            this.addFile(f);
        });
    }

    locateCast(currentPath: string, castPath: string): string | null
    {
        if (this._app === null || this._filesByName === null)
        {
            return null;
        }

        currentPath = normalizePath(currentPath);
        castPath = normalizePath(castPath);

        let castFile = this._app.vault.getAbstractFileByPath(castPath);

        if (!castFile)
        {
            const paths = this._filesByName.get(castPath);

            if (!paths?.length)
            {
                // No file with that name
                return null;
            }

            const chosenPath = this._getBestMatch(currentPath, castPath, paths);
            castFile = this._app.vault.getAbstractFileByPath(chosenPath);
        }

        if (!castFile || !(castFile instanceof TFile))
        {
            return null;
        }

        return this._app.vault.getResourcePath(castFile);
    }

    public addFile(file: TAbstractFile)
    {
        if (this._app === null || this._filesByName === null)
        {
            return null;
        }

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
        if (this._app === null || this._filesByName === null)
        {
            return null;
        }

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
        if (this._app === null || this._filesByName === null)
        {
            return null;
        }

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

    private _getBestMatch(currentPath: string, askedPath: string, paths: string[]): string
    {
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
}

export const locator = new CastLocator();