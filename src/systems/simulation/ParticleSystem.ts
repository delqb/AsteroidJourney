
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { ClientContext } from "../../client/Client";
import { LifeTime } from "../../components/LifetimeComponent";
import { Particle } from "../../components/ParticleComponent";

const schema = {
    particle: Particle,
    lifetime: LifeTime
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Particle Render System");

export class ParticleSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Particle Render System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const gameTime = this.clientContext.engineInstance.getGameTime();
        const { entityId, lifetime } = node;
        let { lifeDuration, spawnTime } = lifetime;
        if (spawnTime <= 0)
            spawnTime = gameTime;
        const deathTime = spawnTime + lifeDuration;
        if (gameTime >= deathTime)
            Fluid.removeEntity(entityId);
    }
}