
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Health } from "../../components/HealthComponent";
import { Position } from "../../components/PositionComponent";

const schema = {
    position: Position,
    health: Health
}

type Schema = typeof schema;

const meta = Fluid.registerNodeSchema(schema, "Health Render");

const width = 0.2;
const height = 0.01;
const hw = width / 2;
const hh = height / 2;
const outlineThickness = 0.005;

const owidth = width + outlineThickness;
const oheight = height + outlineThickness;
const ohw = owidth / 2;
const ohh = oheight / 2;

const yDist = 0.13;

const bkg = "white";
const frg = "green";

const hPI = Math.PI / 2;

export class HealthBarRenderSystem extends FluidSystem<Schema> {
    constructor(
        private renderContext: CanvasRenderingContext2D,
        private getViewportRotation: () => number
    ) {
        super("Health Bar Render System", meta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const ctx = this.renderContext;
        const { position, health } = node;
        const { x, y } = position.position;
        const { currentHealth, maxHealth } = health;
        const healthPercent = currentHealth / maxHealth;
        const fillWidth = healthPercent * width;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.getViewportRotation() + hPI);
        ctx.translate(0, yDist);
        ctx.fillStyle = bkg;
        ctx.fillRect(- ohw, - ohh, owidth, oheight);
        ctx.fillStyle = frg;
        ctx.fillRect(- hw, - hh, fillWidth, height);

        ctx.restore();
    }
}