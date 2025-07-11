
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
        const sortedNodes = Array.from(nodes).sort(
            (a, b) => a.spriteTexture.zIndex - b.spriteTexture.zIndex
        );

        for (const { position, spriteTexture: sprite } of sortedNodes) {
            this.renderSprite(
                sprite,
                position.position.x,
                position.position.y,
                position.rotation
            );
        }
    }

    private renderSprite(
        sprite: SpriteComponent,
        x: number,
        y: number,
        rotation: number
    ): void {
        const ctx = this.canvasRenderer.renderContext;
        const { renderSize: { x: width, y: height }, transform, image } = sprite;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        if (transform) {
            if (transform.rotate) ctx.rotate(transform.rotate);
            if (transform.translate) ctx.translate(transform.translate.x, transform.translate.y);
            if (transform.scale) ctx.scale(transform.scale, transform.scale);
        }

        ctx.scale(width / image.width, height / image.height);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();
    }
}