
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Acceleration } from "../../components/AccelerationComponent";
import { MovementControl } from "../../components/MovementControlComponent";
import { Position } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";
import { Thruster } from "../../components/ThrusterComponent";
import { Physics } from "../../components/PhysicsComponent";
import { Vec2 } from "fluidengine/v0/lib";

function clamp(value: number, min: number, max: number) {
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}

/**
 * See a graph of this function here:
 * https://www.desmos.com/calculator/yri1amjgs8
 */
function computeAcceleration(
    inputMultiplier: number,      // A value between -1 and 1
    speed: number,
    maxAcceleration: number,
    maxSpeed: number,
    accelerationCurveControlFactor: number
): number {
    if (inputMultiplier === 0) return 0;
    inputMultiplier = clamp(inputMultiplier, -1, 1);
    // Scale max speed to multiplier
    maxSpeed = Math.abs(inputMultiplier) * maxSpeed;
    speed = clamp(speed, -maxSpeed, maxSpeed);
    // Limits determined using the graph
    accelerationCurveControlFactor = clamp(accelerationCurveControlFactor, -0.9, 10);
    // The speed the input aims towards
    const targetSpeed = inputMultiplier * maxSpeed;
    // The difference from current speed to target speed
    const speedDelta = targetSpeed - speed;
    // Obtain a value between -1 and 1 based on speed delta
    const normalizedDelta = speedDelta / (2 * maxSpeed);
    // Linear curve
    const accelLin = normalizedDelta * maxAcceleration;
    // Curve control base cannot be zero as the curve control factor might be negative, leading to division by zero
    const curveControlBase = Math.abs(speedDelta) == 0 ? 1 : Math.abs(normalizedDelta);
    const accel = curveControlBase ** accelerationCurveControlFactor * accelLin;
    return clamp(accel, -maxAcceleration, maxAcceleration);
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

export interface MotionParameters {
    maxSpeed: number;
    maxAngularSpeed: number;
    thrusterAngularAccelerationCoefficient: number;
    thrusterStrafeAccelerationCoefficient: number;
    thrusterAccelerationCurveControlFactor?: number;
    angularAccelerationCurveControlFactor?: number;
}

export const DefaultMovementControlParameters: MotionParameters = {
    maxSpeed: 2,
    maxAngularSpeed: 1.25,
    thrusterAngularAccelerationCoefficient: 0.75,
    thrusterStrafeAccelerationCoefficient: 0.8,
    thrusterAccelerationCurveControlFactor: -0.6,
    angularAccelerationCurveControlFactor: -0.6
}

const inputComponentMultiplierLookup = [
    // x = -1
    [
        // -1, -1
        Math.SQRT1_2,
        // -1, 0
        1,
        // -1, 1
        Math.SQRT1_2
    ],
    // x = 0
    [
        // 0, -1
        1,
        // 0, 0
        0,
        // 0, 1
        1
    ],
    // x = 1
    [
        // 1, -1
        Math.SQRT1_2,
        // 1, 0
        1,
        // 1, 1
        Math.SQRT1_2
    ]
]

interface Matrix2 {
    i: Vec2;
    j: Vec2;
}

function applyLinearTransformationMatrixToVector(
    matrix_i_x: number,
    matrix_i_y: number,
    matrix_j_x: number,
    matrix_j_y: number,
    vector_x: number,
    vector_y: number,
    out: Vec2 = { x: 0, y: 0 },
    { decimalPlaces = 5 } = {}
): Vec2 {
    out.x = Math.round((vector_x * matrix_i_x + vector_y * matrix_j_x) * 10 ** decimalPlaces) / 10 ** decimalPlaces;
    out.y = Math.round((vector_x * matrix_i_y + vector_y * matrix_j_y) * 10 ** decimalPlaces) / 10 ** decimalPlaces;
    return out;
}

/**
 * Applies a linear transformation matrix to the given vector
 * to transform it from local Cartesian space to game world space 
 * using sine and cosine for rotation.
 */
function transformRealLocalVectorToWorldSpace(
    vector_x: number,
    vector_y: number,
    sin: number,
    cos: number,
    out: Vec2
): Vec2 {
    return applyLinearTransformationMatrixToVector(
        -sin,
        cos,
        cos,
        sin,
        vector_x,
        vector_y,
        out
    )
}


export class MovementControlSystem extends FluidSystem<Schema> {
    constructor(
        public motionParameters: MotionParameters = DefaultMovementControlParameters
    ) {
        super("Movement Control System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const {
            maxSpeed,
            maxAngularSpeed,
            thrusterAngularAccelerationCoefficient,
            thrusterStrafeAccelerationCoefficient,
            thrusterAccelerationCurveControlFactor,
            angularAccelerationCurveControlFactor
        } = this.motionParameters;
        const {
            velocity: velocityComponent,
            acceleration: accelerationComponent,
            movementControl: controlInput,
            physics,
            thruster
        } = node;
        const acceleration = accelerationComponent.acceleration;
        const angularSpeed = velocityComponent.angular;
        const yawControlFlag = controlInput.yawInput || (-angularSpeed / maxAngularSpeed);
        const inputComponentScale = inputComponentMultiplierLookup[controlInput.accelerationInput.x + 1][controlInput.accelerationInput.y + 1];

        const thrusterMaxAcceleration = thruster.maxForce / physics.mass;
        const rotation = node.position.rotation;
        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        accelerationComponent.angular = computeAcceleration(
            yawControlFlag,
            angularSpeed,
            thrusterAngularAccelerationCoefficient * thrusterMaxAcceleration,
            maxAngularSpeed,
            angularAccelerationCurveControlFactor
        );

        // Mutates acceleration input in-place
        transformRealLocalVectorToWorldSpace(
            controlInput.accelerationInput.x * inputComponentScale,
            controlInput.accelerationInput.y * inputComponentScale,
            sin,
            cos,
            controlInput.accelerationInput
        );

        const {
            x: accelerationDirectionX,
            y: accelerationDirectionY
        } = controlInput.accelerationInput;
        const accelerationInputFlag = accelerationDirectionX || accelerationDirectionY ? 1 : 0;
        const speedAlongAccelerationDirection = velocityComponent.velocity.x * accelerationDirectionX + velocityComponent.velocity.y * accelerationDirectionY;
        const accelerationMagnitude = computeAcceleration(
            accelerationInputFlag,
            speedAlongAccelerationDirection,
            thrusterMaxAcceleration,
            maxSpeed,
            thrusterAccelerationCurveControlFactor
        );

        const accelerationX = accelerationMagnitude * accelerationDirectionX;
        const accelerationY = accelerationMagnitude * accelerationDirectionY;

        // Acceleration along ship's forward/backward axis
        const forwardAcceleration = accelerationX * cos + accelerationY * sin;
        const forwardAccelerationX = forwardAcceleration * cos;
        const forwardAccelerationY = forwardAcceleration * sin;

        // Acceleration along ship's left/right axis
        const sideAcceleration = thrusterStrafeAccelerationCoefficient * (accelerationX * -sin + accelerationY * cos);
        const sideAccelerationX = sideAcceleration * -sin;
        const sideAccelerationY = sideAcceleration * cos;

        acceleration.x = forwardAccelerationX + sideAccelerationX;
        acceleration.y = forwardAccelerationY + sideAccelerationY;

        controlInput.yawInput = 0;
        controlInput.accelerationInput.x = 0;
        controlInput.accelerationInput.y = 0;
    }
}