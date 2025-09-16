
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { MathUtils, Vector2 } from "fluidengine";
import { ClientContext } from "../../../client/Client";
import { Acceleration } from "../../../components/AccelerationComponent";
import { Position } from "../../../components/PositionComponent";
import { Stats } from "../../../components/StatsComponent";
import { Velocity } from "../../../components/VelocityComponent";
import { drawComplexText } from "../../../Utils";


const round = MathUtils.round;
const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    stats: Stats
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Debug Info Display");

export class DebugInfoDisplaySystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext
    ) {
        super("Debug Info Display System", nodeMeta);
    }
    stats = {
        isAnimating: (node: ECSNode<Schema>) => this.clientContext.engineInstance.getAnimationState(),
        fps: (node: ECSNode<Schema>) => round(this.clientContext.engineInstance.getFPS()),
        position: (node: ECSNode<Schema>) => {
            const pC = node.position;
            const { position: p, rotation: r } = pC;
            return `([${round(p.x)}, ${round(p.y)}] m) (${round(r)} rad)`
        },
        velocity: (node: ECSNode<Schema>) => {
            const vC = node.velocity;
            const { velocity: v, angular: a } = vC;
            return `(${round(Vector2.magnitude(v))} m/s) (${round(a)} rad/s) ([${round(v.x)}, ${round(v.y)}] m/s)`
        },
        acceleration: (node: ECSNode<Schema>) => {
            const aC = node.acceleration;
            const { acceleration: accel, angular: angl } = aC;
            return `(${round(Vector2.magnitude(accel))} m/s^2) (${round(angl)} rad/s^2) ([${round(accel.x)}, ${round(accel.y)}] m/s^2)`
        },
        zoom: () => {
            return `%${round(this.clientContext.getZoomLevel())}`;
        },
        time: () => {
            return `x${round(this.clientContext.getSimulationSpeed(), 5)}`;
        }
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
    }

    public updateNode(node: ECSNode<Schema>) {
        const cc = this.clientContext, stats = this.stats;
        if (!cc.displayDebugInfo)
            return;

        drawComplexText(cc.renderer.renderContext, 10, 10,
            Object.keys(stats).map(
                (key) => DebugInfoDisplaySystem.formatStats(key, stats[key](node))
            )
            , 2);
    }
}