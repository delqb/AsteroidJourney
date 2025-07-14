
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
import { MathUtils } from "fluidengine/v0/lib";
import { DeltaTimeProvider } from "../../Utils";

const round = MathUtils.round;

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
    const curveControlBase = round(Math.abs(speedDelta) == 0 ? 1 : Math.abs(normalizedDelta), 1);
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

export interface MovementControlParameters {
    maxSpeed: number;
    maxAngularSpeed: number;

    axialThrusterPowerCoefficient: number;
    lateralThrusterPowerCoefficient: number;
    angularThrusterPowerCoefficient: number;

    axialStabilizationFactor: number;
    lateralStabilizationFactor: number;
    angularStabilizationFactor: number;

    axialAccelerationCurveControlFactor?: number;
    angularAccelerationCurveControlFactor?: number;
}

export const DefaultMovementControlParameters: MovementControlParameters = {
    maxSpeed: 3 * Math.E,
    maxAngularSpeed: Math.PI,

    axialThrusterPowerCoefficient: 1,
    lateralThrusterPowerCoefficient: 0.8,
    angularThrusterPowerCoefficient: 0.85,

    axialStabilizationFactor: 0.25,
    lateralStabilizationFactor: 0.80,
    angularStabilizationFactor: 0.75,

    axialAccelerationCurveControlFactor: -0.6,
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
    out.x = round(vector_x * matrix_i_x + vector_y * matrix_j_x, decimalPlaces);
    out.y = round(vector_x * matrix_i_y + vector_y * matrix_j_y, decimalPlaces);
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
        public getDeltaTime: DeltaTimeProvider,
        public motionParameters: MovementControlParameters = DefaultMovementControlParameters
    ) {
        super("Movement Control System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const {
            maxSpeed,
            maxAngularSpeed,

            axialThrusterPowerCoefficient,
            lateralThrusterPowerCoefficient,
            angularThrusterPowerCoefficient,

            axialStabilizationFactor,
            lateralStabilizationFactor,
            angularStabilizationFactor,

            axialAccelerationCurveControlFactor,
            angularAccelerationCurveControlFactor
        } = this.motionParameters;
        const {
            velocity: velocityComponent,
            acceleration: accelerationComponent,
            movementControl: controlInput,
            physics,
            thruster
        } = node;

        const velocity = velocityComponent.velocity;
        const acceleration = accelerationComponent.acceleration;
        const accelerationInputFlag = controlInput.accelerationInput.x || controlInput.accelerationInput.y ? 1 : 0;

        const angularSpeed = velocityComponent.angular;
        const yawInputFlag = controlInput.yawInput;
        const inputComponentScale = inputComponentMultiplierLookup[controlInput.accelerationInput.x + 1][controlInput.accelerationInput.y + 1];

        const thrusterMaxAcceleration = thruster.maxForce / physics.mass;
        const rotation = node.position.rotation;
        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        accelerationComponent.angular = 0;
        acceleration.x = 0;
        acceleration.y = 0;

        //
        // Angular acceleration
        // 
        const angularSpeedPercentage = angularSpeed / maxAngularSpeed;
        const yawControl = yawInputFlag || -angularSpeedPercentage;
        // Controls will override angular stabilization
        const angularAccelerationCoefficient = yawInputFlag ? 1 : Math.abs(angularSpeedPercentage) * angularStabilizationFactor;
        const angularAccelerationMagnitude = round(
            computeAcceleration(
                yawControl,
                angularSpeed,
                thrusterMaxAcceleration * angularThrusterPowerCoefficient,
                maxAngularSpeed,
                angularAccelerationCurveControlFactor
            ),
            3);
        accelerationComponent.angular = angularAccelerationMagnitude * angularAccelerationCoefficient;

        //
        // Axial and lateral acceleration
        // 

        const speed = Math.hypot(velocity.x, velocity.y);
        let accelerationControl = 0;
        let accelerationDirectionX = 0;
        let accelerationDirectionY = 0;
        let axialAccelerationCoefficient = 0;
        let lateralAccelerationCoefficient = 0;

        // Auto-stabilization
        if (speed && !accelerationInputFlag) {
            let speedPercentage = speed / maxSpeed;
            accelerationControl = -speedPercentage;
            accelerationDirectionX = velocity.x / speed;
            accelerationDirectionY = velocity.y / speed;
            axialAccelerationCoefficient = speedPercentage * axialStabilizationFactor;
            lateralAccelerationCoefficient = speedPercentage * lateralStabilizationFactor;
        }

        // Control override
        if (accelerationInputFlag) {
            // Mutates acceleration input in-place
            transformRealLocalVectorToWorldSpace(
                controlInput.accelerationInput.x * inputComponentScale,
                controlInput.accelerationInput.y * inputComponentScale,
                sin,
                cos,
                controlInput.accelerationInput
            );

            accelerationControl = accelerationInputFlag;
            accelerationDirectionX = controlInput.accelerationInput.x;
            accelerationDirectionY = controlInput.accelerationInput.y;
            axialAccelerationCoefficient = 1;
            lateralAccelerationCoefficient = 1;
        }

        if (speed || accelerationInputFlag) {
            const speedAlongAccelerationDirection =
                velocity.x * accelerationDirectionX +
                velocity.y * accelerationDirectionY;
            const accelerationMagnitude = round(
                computeAcceleration(
                    accelerationControl,
                    speedAlongAccelerationDirection,
                    thrusterMaxAcceleration,
                    maxSpeed,
                    axialAccelerationCurveControlFactor
                ),
                3);

            const accelerationX = accelerationMagnitude * accelerationDirectionX;
            const accelerationY = accelerationMagnitude * accelerationDirectionY;

            // Acceleration along ship's forward/backward axis
            const axialAcceleration = axialAccelerationCoefficient * axialThrusterPowerCoefficient * (accelerationX * cos + accelerationY * sin);
            const axialAccelerationX = axialAcceleration * cos;
            const axialAccelerationY = axialAcceleration * sin;

            // Acceleration along ship's left/right axis
            const lateralAcceleration = lateralAccelerationCoefficient * lateralThrusterPowerCoefficient * (accelerationX * -sin + accelerationY * cos);
            const lateralAccelerationX = lateralAcceleration * -sin;
            const lateralAccelerationY = lateralAcceleration * cos;

            acceleration.x = round(axialAccelerationX + lateralAccelerationX, 3);
            acceleration.y = round(axialAccelerationY + lateralAccelerationY, 3);
        }

        controlInput.yawInput = 0;
        controlInput.accelerationInput.x = 0;
        controlInput.accelerationInput.y = 0;
    }
}