
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Vector2 } from "fluidengine/v0/lib";
import { Acceleration } from "../../components/AccelerationComponent";
import { MovementControl } from "../../components/MovementControlComponent";
import { Position } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";


const hPI = Math.PI / 2;
const THRUST_FORCE = 1.5

const THRUST_ACCELERATION = THRUST_FORCE;
const ANGULAR_ACCELERATION = THRUST_FORCE * 18 / 10;
const ROLL_ACCELERATION = THRUST_FORCE * 3 / 4;

const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    movementControl: MovementControl
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Movement Control");

export class MovementControlSystem extends FluidSystem<Schema> {
    constructor() { super("Movement Control System", nodeMeta); }

    public updateNode(node: ECSNode<Schema>): void {
        const { acceleration: accelComp, movementControl: input } = node;
        const { x: iX, y: iY } = input.accelerationInput;
        const rot = node.position.rotation;

        accelComp.angular = ANGULAR_ACCELERATION * input.yawInput;

        let accel = { x: 0, y: 0 };

        if (iY) {
            accel.x = iY * THRUST_ACCELERATION * Math.cos(rot);
            accel.y = iY * THRUST_ACCELERATION * Math.sin(rot);
        }

        if (iX) {
            // if roll input is detected
            // add the roll acceleration vector to the current acceleration vector
            // roll acceleration vector direction is 90 degrees left or right of current entity rotation angle
            accel = Vector2.add(accel, Vector2.scale(Vector2.fromAngle(rot + iX * hPI), ROLL_ACCELERATION));
        }

        accelComp.acceleration = accel;
    }
}