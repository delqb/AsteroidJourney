
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ECSNode } from "fluidengine/v0/api";
import { Fluid, FluidEngine, FluidSystem } from "fluidengine/v0/internal";
import { Position } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";


const PI = Math.PI, PI2 = 2 * PI;

const schema = {
    position: Position,
    velocity: Velocity
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Position");

export class PositionSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Position System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const DELTA_TIME = this.engineInstance.deltaTime;
        const { position: posComp, velocity: velComp } = node;
        const { position: pos } = posComp;
        const { velocity: vel, angular: angVel } = velComp;
        let rot = posComp.rotation;

        pos.x += vel.x * DELTA_TIME;
        pos.y += vel.y * DELTA_TIME;
        rot += angVel * DELTA_TIME;

        if (rot >= PI)
            rot -= PI2;
        if (rot < -PI)
            rot += PI2;

        posComp.rotation = rot;
    }
}