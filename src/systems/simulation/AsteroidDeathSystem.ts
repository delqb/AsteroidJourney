
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Vector2 } from "fluidengine/v0/lib";
import { ClientContext } from "../../client/Client";
import { Asteroid } from "../../components/AsteroidComponent";
import { EntityDeath } from "../../components/EntityDeathComponent";
import { Position } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";
import { createAsteroidParticle } from "../../asteroids";

const schema = {
    asteroid: Asteroid,
    position: Position,
    velocity: Velocity,
    entityDeath: EntityDeath,
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Asteroid Death");
const explosionIntensityScale = 0.1;

export class AsteroidDeathSystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext,

    ) {
        super("Asteroid Death System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const {
            asteroid,
            position,
            velocity,
            entityDeath,
            entityId
        } = node;
        const { area } = asteroid;
        const count = area * 10 * 5;
        const increment = 2 * Math.PI / count;
        if (entityDeath.readyToRemove) {
            Fluid.removeEntity(entityId);
            return;
        }
        for (let angle = 0; angle < 2 * Math.PI; angle += increment) {
            let vX = Math.cos(angle) * (0.5 + 0.65 * Math.random());
            let vY = Math.sin(angle) * (0.5 + 0.65 * Math.random());
            createAsteroidParticle(
                Vector2.copy(position.position),
                Vector2.add(velocity.velocity, Vector2.scale({ x: vX, y: vY }, explosionIntensityScale)),
                position.rotation + angle,
                velocity.angular + 1.2 * Math.PI * Math.random(),
                this.clientContext.engineInstance.getGameTime(),
                5,
                Math.sqrt((0.3 + 0.7 * Math.random() / count) * asteroid.area)
            );
        }
        entityDeath.readyToRemove = true;
    }
}