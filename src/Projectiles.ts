import { ECSEntityId } from "fluidengine/v0/api";
import { Vec2, Vector2 } from "fluidengine/v0/lib";
import { Fluid } from "fluidengine/v0";
import { Acceleration } from "./components/AccelerationComponent";
import { BoundingBox, createBoundingBox } from "./components/BoundingBoxComponent";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { Physics } from "./components/PhysicsComponent";
import { Projectile } from "./components/ProjectileComponent";
import { Velocity } from "./components/VelocityComponent";
import { calculateRectangleMomentOfInertia } from "./Utils";
import { createSpriteEntity, SpriteImages } from "./Sprites";


export interface ProjectileCreationParameters {
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    angularVelocity: number;
    generation: number;
    width: number;
    type: ProjectileType;
    spawnTime: number;
    options?: ProjectileCreationOptions;
}


export interface ProjectileCreationOptions {
}

export interface ProjectileType {
    lifeTime: number;
    damage: number;
    density: number;
    spriteImage: HTMLImageElement;
}

export const artilleryShell: ProjectileType = {
    lifeTime: 5,
    damage: 0.0015,
    density: 1.8,
    spriteImage: SpriteImages.projectile.artilleryShellImage
}

export function spawnProjectile(
    {
        position,
        velocity,
        rotation,
        angularVelocity,
        generation,
        width,
        type,
        spawnTime,
        options = {}
    }: ProjectileCreationParameters,
): ECSEntityId {
    const {
        damage,
        density,
        spriteImage,
        lifeTime
    } = type;

    const {
    } = options;
    const imageAspectRatio = spriteImage.height / spriteImage.width;
    const height = width * imageAspectRatio;
    const area = width * height;
    const mass = density * area;
    const deathTime = spawnTime + lifeTime;

    const entity = createSpriteEntity(
        position,
        rotation,
        spriteImage,
        0,
        {
            x: width,
            y: height
        }
    );
    Fluid.addEntityComponents(entity,
        Projectile.createComponent({
            deathTime: deathTime,
            generation: generation,
            damage
        }),
        Velocity.createComponent({
            velocity: velocity,
            angular: angularVelocity
        }),
        Acceleration.createComponent({
            acceleration: { x: 0, y: 0 },
            angular: 0
        }),
        Physics.createComponent({
            mass,
            centerOfMassOffset: Vector2.zero(),
            area,
            momentOfInertia: calculateRectangleMomentOfInertia(mass, width, height)
        }),
        BoundingBox.createComponent(
            createBoundingBox(
                {
                    width,
                    height
                },
                { transform: { scale: 0.98 } } // smaller bounding box for tighter collision tolerance
            )
        ),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() })
    );
    return entity;
}