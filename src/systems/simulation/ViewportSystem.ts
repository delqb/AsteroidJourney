
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { MathUtils, Vector2 } from "fluidengine/v0/lib";
import { ClientContext } from "../../client/Client";
import { CameraSpeedFactor } from "../../components/CameraSpeedFactorComponent";
import { Position } from "../../components/PositionComponent";
import { Resolution } from "../../components/ResolutionComponent";
import { TargetPosition } from "../../components/TargetPositionComponent";
import { Viewport } from "../../components/ViewportComponent";

const shortestAngleDiff = MathUtils.shortestAngleDiff;

const schema = {
    position: Position,
    resolution: Resolution,
    targetPosition: TargetPosition,
    speedFactor: CameraSpeedFactor,
    viewport: Viewport
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Viewport");

export class ViewportSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Viewport System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const eng = this.clientContext.engineInstance;
        const DELTA_TIME = eng.getDeltaTime();
        const PPM = eng.PIXELS_PER_METER;
        const { position: positionComp, targetPosition: targetPositionComp, speedFactor: speedFactorComp, resolution: resolutionComp } = node;
        const { position: pos, rotation: rot } = positionComp;
        const { position: tPos, rotation: tRot } = targetPositionComp.position
        const vpRes = resolutionComp.resolution;
        const step = speedFactorComp.speedFactor * DELTA_TIME;

        const centerPos = Vector2.add(pos, { x: vpRes.x / (2 * PPM), y: vpRes.y / (2 * PPM) }); //World coordinates of viewport center
        const diff = Vector2.subtract(tPos, centerPos);
        const dist = Vector2.abs(diff);
        const moveDir = Vector2.normalize(diff);

        if (dist.x > 0 || dist.y > 0) {
            const moveVec = Vector2.multiply(moveDir, dist); // move proportional to how much target exceeded deadzone
            const stepVec = Vector2.scale(moveVec, step);
            positionComp.position = Vector2.add(pos, stepVec);
        }

        if (rot != tRot) {
            const angleDiff = shortestAngleDiff(rot, tRot);
            positionComp.rotation = rot + angleDiff * step;
        }
    }
}