// @ts-ignore
import * as AsciinemaPlayer from 'asciinema-player';

import { MarkdownPostProcessorContext, normalizePath } from 'obsidian';
import { locator } from "./locator";

const castPattern = /!\[cast:([^\]]+)\]/g

export class AsciicastPostProcessor
{
    public async process(el: HTMLElement, ctx: MarkdownPostProcessorContext)
    {
        const cls = this;

        el.querySelectorAll("p").forEach((p: HTMLParagraphElement) =>
        {
            if (!p.textContent)
            {
                return;
            }

            for (const match of p.textContent.matchAll(castPattern) ?? [])
            {
                const castPath = normalizePath(match[1]);
                const resource = locator.locateCast(ctx.sourcePath, match[1]);

                if (!resource)
                {
                    continue;
                }

                const player = document.createElement("div");
                player.dataset["castpath"] = castPath; 
                AsciinemaPlayer.create(resource, player);

                const len = match[0].length;

                if (match.index === 0)
                {
                    // Starts the paragraph
                    p.textContent = p.textContent.slice(len).trimStart();
                    p.parentElement?.insertBefore(player, p);
                }
                else if (match.index !== undefined && match.index + len >= p.textContent.length)
                {
                    // Ends the paragraph
                    p.textContent = p.textContent.slice(0, match.index).trimEnd();
                    p.parentElement?.insertAfter(player, p);
                }
                else
                {
                    // Middle of the paragraph
                    const before = document.createElement("p");
                    before.textContent = p.textContent.slice(0, match.index);
                    p.parentElement?.insertBefore(before, p);

                    p.textContent = p.textContent.slice(match.index ?? 0 + len).trimStart();
                    p.parentElement?.insertBefore(player, p);
                }
            }
        })
    }

}