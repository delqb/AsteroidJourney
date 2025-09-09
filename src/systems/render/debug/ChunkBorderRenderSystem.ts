
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { ChunkState, getChunkCornerFromIndex } from "fluidengine";
import { ClientContext } from "../../../client/Client";
import { Chunk } from "../../../components/ChunkComponent";


const schema = {
    chunk: Chunk
}
type Schema = typeof schema;
const meta = Fluid.registerNodeSchema(schema, "Chunk");

const lineWidth = 1 / 1000;
const color = "red";

export class ChunkBorderRenderSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Chunk Border Render System", meta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const clientContext = this.clientContext;
        if (!clientContext.displayChunks)
            return;
        const ctx = this.clientContext.renderer.renderContext;
        const chunk = node.chunk.chunk;
        if (chunk.state !== ChunkState.Loaded) return;
        const { index, size } = chunk;
        const corner = getChunkCornerFromIndex(index[0], index[1], size);

        ctx.save();
        ctx.translate(corner.x, corner.y);
        ctx.lineWidth = lineWidth * 4 / 3;
        ctx.strokeStyle = "white";
        ctx.strokeRect(0, 0, size, size);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.strokeRect(0, 0, size, size);
        ctx.restore();
    }

}