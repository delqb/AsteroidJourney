import { ClientContext } from "@asteroid/Client";
import { PositionComponent, ResolutionComponent, TargetPositionComponent, CameraSpeedFactorComponent, ViewportComponent } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";
import { Vector2 } from "@fluidengine/lib/spatial";
import { MathUtils } from "@fluidengine/lib/utils";

const { shortestAngleDiff } = MathUtils;


export type ViewportSystemNode = {
    position: PositionComponent;
    resolution: ResolutionComponent;
    targetPosition: TargetPositionComponent;
    speedFactor: CameraSpeedFactorComponent;
    viewport: ViewportComponent;
}

export class ViewportSystem extends System<ViewportSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ViewportSystemNode> = new Set(['position', 'resolution', 'targetPosition', 'speedFactor', 'viewport']);
    constructor(public clientContext: ClientContext) {
        super();
    }
    public updateNode(node: ViewportSystemNode, entityID: EntityID) {
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