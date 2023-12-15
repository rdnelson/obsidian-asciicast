
import { syntaxTree } from "@codemirror/language";
import { SyntaxNodeRef } from "@lezer/common";
import { EditorSelection, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { locator } from "./locator";

// @ts-ignore
import * as AsciinemaPlayer from "asciinema-player";

export class CastWidget extends WidgetType {
    private readonly _currentPath: string;
    private readonly _cast: string;
    constructor(currentPath: string, cast: string)
    {
        super();
        this._currentPath = currentPath;
        this._cast = cast;
    }

    toDOM(view: EditorView): HTMLElement {
        const div = view.contentDOM.createDiv();

        div.dataset["castpath"] = this._cast;
        const resource = locator.locateCast(this._currentPath, this._cast);
        AsciinemaPlayer.create(resource, div);

        return div;
    }
}


export class CastViewPlugin implements PluginValue
{
    decorations: DecorationSet;

    constructor(view: EditorView)
    {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate)
    {
        if (update.docChanged || update.viewportChanged || update.selectionSet)
        {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    destroy() 
    {
    }

    private buildDecorations(view: EditorView): DecorationSet
    {
        const builder = new RangeSetBuilder<Decoration>();
        let start: number | null = null
        let middle: number | null;
        const cls = this;
        for (let { from, to } of view.visibleRanges)
        {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node: SyntaxNodeRef) {
                    if (node.type.name.contains("hmd-barelink"))
                    {
                        if (node.type.name.contains("formatting-link"))
                        {
                            if (start === null && view.state.sliceDoc(node.from - 1, node.to) === "![")
                            {
                                // beginning of a possible cast
                                start = node.from - 1;
                                middle = null;
                            }
                            else if (start !== null && middle !== null && view.state.sliceDoc(node.from, node.to) === "]")
                            {
                                console.log(`Found a cast from ${start}-${node.to}: "${view.state.sliceDoc(start, node.to)}"`);
                                if (!cls.isRangeSelected(start, node.to, view.state.selection))
                                {
                                    const currentPath = cls.getFileValue(view.state);
                                    console.log(`would replace with ${currentPath}`);
                                    console.log(view.state);
                                    builder.add(
                                        start,
                                        node.to,
                                        Decoration.replace({
                                            widget: new CastWidget(currentPath!, view.state.sliceDoc(start+7, node.to - 1).trim())
                                        })
                                    );
                                }
                            }
                            else
                            {
                                start = null;
                                middle = null;
                            }
                        }
                        else if (start !== null && view.state.sliceDoc(node.from, node.to).startsWith("cast:"))
                        {
                            middle = node.from;
                        }
                        else
                        {
                            start = null;
                            middle = null;
                        }
                    }
                    else
                    {
                        start = null;
                        middle = null;
                    }

                    console.log(`${node.type.name}: ${node.from}-${node.to} - "${view.state.sliceDoc(node.from, node.to)}"`);
                },
            });
        }


        return builder.finish();
    }

    private isRangeSelected(from: number, to: number, selections: EditorSelection)
    {
        for (const range of selections.ranges)
        {
            if (range.from <= to && range.to >= from)
            {
                return true;
            }
        }

        return false;
    }

    private getFileValue(state: any): string | null
    {
        for (const value of state?.values)
        {
            if (value?.file?.path)
            {
                return value?.file?.path;
            }
        }

        return null;
    }
}

const pluginSpec: PluginSpec<CastViewPlugin> = {
    decorations: (value: CastViewPlugin) => value.decorations,
};

export const castViewPlugin = ViewPlugin.fromClass(
    CastViewPlugin,
    pluginSpec
);