
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Transform } from "fluidengine/v0/lib";
import { Position } from "../../components/PositionComponent";
import { Sprite, SpriteComponent } from "../../components/SpriteComponent";
import { CanvasRenderer } from "../../client/renderer/Renderer";


const schema = {
    position: Position,
    spriteTexture: Sprite
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Sprite Render");

export class SpriteRenderSystem extends FluidSystem<Schema> {

    constructor(
        private canvasRenderer: CanvasRenderer
    ) {
        super("Sprite Render System", nodeMeta);
    }

    public updateNodes(nodes: Iterable<ECSNode<Schema>>): void {
        for (const node of Array.from(nodes).sort((a, b) => a.spriteTexture.zIndex - b.spriteTexture.zIndex)) {
            const { position, spriteTexture: sprite } = node;
            const { x, y } = position.position;

            this.renderSprite(
                sprite,
                x,
                y,
                position.rotation
            );
        }


    }

    private renderSprite(
        sprite: SpriteComponent,
        x: number,
        y: number,
        rotation: number
    ) {
        const ctx = this.canvasRenderer.renderContext;
        const {
            renderSize,
            transform,
            image
        } = sprite;
        const {
            x: width,
            y: height
        } = renderSize;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        if (transform) {
            const {
                translate,
                rotate,
                scale
            } = transform;

            if (rotate) ctx.rotate(rotate);
            if (translate) ctx.translate(translate.x, translate.y);
            if (scale) ctx.scale(scale, scale);
        }

        ctx.scale(
            width / image.width,
            height / image.height
        );

        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();
    }
}