
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ECSEntityId, ECSNode } from "fluidengine/v0/api";
import { FluidEngine, FluidSystem } from "fluidengine/v0/internal";
import { FireControl } from "../../components/FireControlComponent";
import { Position } from "../../components/PositionComponent";
import { ProjectileSource } from "../../components/ProjectileSourceComponent";
import { Velocity } from "../../components/VelocityComponent";
import { Fluid } from "fluidengine/dev";
import { ProjectileCreationParameters } from "../../Projectiles";


const schema = {
    position: Position,
    velocity: Velocity,
    projectileSource: ProjectileSource,
    fireControl: FireControl,
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Firing");

export type ProjectileSpawnFunction = (params: ProjectileCreationParameters) => ECSEntityId | undefined;

export class FiringSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine, public spawnProjectile: ProjectileSpawnFunction) {
        super("Firing System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const GAME_TIME = this.engineInstance.getGameTime();
        const {
            fireControl,
            projectileSource,
            position: sourcePositionComponent,
            velocity: sourceVelocityComponent
        } = node;

        const {
            position: sourcePositionVector,
            rotation: sourceRotation
        } = sourcePositionComponent;

        const {
            velocity: sourceVelocity,
            angular: sourceAngularVelocity
        } = sourceVelocityComponent;

        const {
            muzzleSpeed,
            projectileWidth,
            projectileType,
            fireRate,
            transform: sourceTransform
        } = projectileSource;

        if (!fireControl.fireIntent)
            return;

        if (GAME_TIME - projectileSource.lastFireTime < 1 / fireRate)
            return;

        let projectileRotation = sourceRotation;
        if (sourceTransform?.rotate !== undefined)
            projectileRotation += sourceTransform.rotate;

        const projectileDirectionX = Math.cos(projectileRotation);
        const projectileDirectionY = Math.sin(projectileRotation);
        const projectileInitialStep = sourceTransform?.scale || 0;
        const projectileMuzzleOffsetX = projectileDirectionX * projectileInitialStep;
        const projectileMuzzleOffsetY = projectileDirectionY * projectileInitialStep;


        let projectilePositionX = sourcePositionVector.x;
        let projectilePositionY = sourcePositionVector.y;

        const sourceTranslate = sourceTransform?.translate;
        if (sourceTranslate) {
            projectilePositionX += sourceTranslate.x;
            projectilePositionY += sourceTranslate.y;
        }

        const projectilePosition = {
            x: projectilePositionX + projectileMuzzleOffsetX,
            y: projectilePositionY + projectileMuzzleOffsetY
        };

        const muzzleTangentVectorX = -projectileMuzzleOffsetY;
        const muzzleTangentVectorY = projectileMuzzleOffsetX;
        const tangentialVelocityX = sourceAngularVelocity * muzzleTangentVectorX;
        const tangentialVelocityY = sourceAngularVelocity * muzzleTangentVectorY;

        const projectileVelocity = {
            x:
                sourceVelocity.x +
                tangentialVelocityX +
                projectileDirectionX * muzzleSpeed,
            y:
                sourceVelocity.y +
                tangentialVelocityY +
                projectileDirectionY * muzzleSpeed
        };

        const spID = this.spawnProjectile({
            position: projectilePosition,
            velocity: projectileVelocity,
            rotation: sourceRotation,
            angularVelocity: 0,
            type: projectileType,
            width: projectileWidth,
            spawnTime: GAME_TIME,
            generation: 1
        })

        if (!spID)
            console.warn("Failed to spawn projectile!");

        projectileSource.lastFireTime = GAME_TIME;
    }
}

