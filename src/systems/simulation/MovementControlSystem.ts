
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
import { Thruster } from "../../components/ThrusterComponent";
import { Physics } from "../../components/PhysicsComponent";
import { maxVelocity } from "../../AsteroidJourney";


const hPI = Math.PI / 2;
const THRUST_FORCE = 1.5

// const THRUST_ACCELERATION = THRUST_FORCE;
const ANGULAR_THRUST = THRUST_FORCE * 18 / 10;
const ROLL_ACCELERATION = THRUST_FORCE * 3 / 4;
const CURVE_CONTROL = 3;

function computeAcceleration(
    currentVelocity: number,
    mass: number,
    thrustForce: number,
    maxVelocity: number,
    curveControlFactor: number
) {
    // https://www.desmos.com/calculator/ig4j1sg3so
    return (thrustForce / mass) * (1 - (currentVelocity / maxVelocity) ** curveControlFactor);
}

const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    thruster: Thruster,
    physics: Physics,
    movementControl: MovementControl
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Movement Control");

export class MovementControlSystem extends FluidSystem<Schema> {
    constructor() { super("Movement Control System", nodeMeta); }

    public updateNode(node: ECSNode<Schema>): void {
        const MAX_ANGULAR_VELOCITY = maxVelocity / 3;
        const { acceleration: accelComp, movementControl: input, velocity, physics, thruster } = node;
        const { x: vX, y: vY } = velocity.velocity;
        const angularVelocity = velocity.angular;
        const mass = physics.mass;
        const speed = Math.hypot(vX, vY);
        const thrustForce = thruster.maxForce;
        const { x: iX, y: iY } = input.accelerationInput;
        const rot = node.position.rotation;

        // accelComp.angular = ANGULAR_THRUST * input.yawInput;
        accelComp.angular = computeAcceleration(Math.abs(angularVelocity), mass, thrustForce * 8 / 10, MAX_ANGULAR_VELOCITY, CURVE_CONTROL) * input.yawInput;

        let accel = { x: 0, y: 0 };



        if (iY) {
            const thrustAcceleration = computeAcceleration(speed, mass, thrustForce, maxVelocity, CURVE_CONTROL);
            // const thrustAcceleration = THRUST_FORCE;
            // console.log(thrustAcceleration)
            // console.log(thrustForce / mass);
            accel.x = iY * thrustAcceleration * Math.cos(rot);
            accel.y = iY * thrustAcceleration * Math.sin(rot);
        }

        if (iX) {
            // if roll input is detected
            // add the roll acceleration vector to the current acceleration vector
            // roll acceleration vector direction is 90 degrees left or right of current entity rotation angle
            // accel = Vector2.add(accel, Vector2.scale(Vector2.fromAngle(rot + iX * hPI), ROLL_ACCELERATION));
        }

        accelComp.acceleration = accel;
    }
}