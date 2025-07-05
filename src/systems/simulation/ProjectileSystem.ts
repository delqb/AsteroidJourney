
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ECSNode } from "fluidengine/v0/api";
import { Fluid, FluidEngine, FluidSystem } from "fluidengine/v0/internal";
import { Position } from "../../components/PositionComponent";
import { Projectile } from "../../components/ProjectileComponent";


const schema = {
    projectile: Projectile,
    position: Position
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Projectile");

export class ProjectileSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Projectile System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const eng = this.engineInstance;
        const GAME_TIME = eng.getGameTime();

        if (GAME_TIME >= node.projectile.deathTime) {
            Fluid.removeEntity(node.entityId);
        }
    }
}