
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { ClientContext } from "../../client/Client";
import { Acceleration } from "../../components/AccelerationComponent";
import { Position } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";


const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Kinematic");

export class KinematicSystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext,
    ) {
        super("Kinematic System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const DELTA_TIME = this.clientContext.engineInstance.getDeltaTime();
        const { velocity: velocityComp, acceleration: accelerationComp } = node;
        const a = accelerationComp.acceleration,
            v = velocityComp.velocity;

        v.x += a.x * DELTA_TIME;
        v.y += a.y * DELTA_TIME;
        velocityComp.angular += accelerationComp.angular * DELTA_TIME;
    }
}