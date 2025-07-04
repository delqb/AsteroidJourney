
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Transform } from "fluidengine/v0/lib";
import { Position } from "../../components/PositionComponent";
import { Sprite } from "../../components/SpriteComponent";


const schema = {
    position: Position,
    spriteTexture: Sprite
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Sprite Render");

export class SpriteRenderSystem extends FluidSystem<Schema> {

    constructor(private renderContext: CanvasRenderingContext2D) {
        super("Sprite Render System", nodeMeta);
    }

    public updateNodes(nodes: Iterable<ECSNode<Schema>>): void {
        const ctx = this.renderContext;
        for (const node of Array.from(nodes).sort((a, b) => a.spriteTexture.zIndex - b.spriteTexture.zIndex)) {
            const { position, spriteTexture: sprite } = node;
            const { x, y } = position.position;

            this.renderSprite(
                ctx,
                sprite.image,
                x,
                y,
                position.rotation,
                sprite.transform
            );
        }


    }

    private renderSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, rotation: number, transform: Transform | undefined) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        if (transform) {
            const { translate: trans, rotate: rot, scale } = transform;
            if (rot) ctx.rotate(rot);
            if (trans) ctx.translate(trans.x, trans.y);
            if (scale) ctx.scale(scale, scale);
        }

        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }
}