import { ECSEntityId } from "fluidengine/v0/api";
import { Transform, Vec2, Vector2 } from "fluidengine/v0/lib";
import { createSpriteEntity, SpriteImages } from "./Sprites";
import { Fluid } from "fluidengine/v0";
import { transformScaleLerpId } from "./animation/Interpolators";
import { Asteroid } from "./components/AsteroidComponent";
import { BoundingBox, createBoundingBox } from "./components/BoundingBoxComponent";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { Health } from "./components/HealthComponent";
import { Physics } from "./components/PhysicsComponent";
import { createPropertyAnimationsComponent } from "./components/PropertyAnimationComponent";
import { Sprite } from "./components/SpriteComponent";
import { Velocity } from "./components/VelocityComponent";
import { calculateRectangleMomentOfInertia } from "./Utils";
import { LifeTime } from "./components/LifetimeComponent";
import { Particle } from "./components/ParticleComponent";

export interface AsteroidCreationParameters {
    position: Vec2;
    rotation: number;
    velocity: Vec2;
    angularVelocity: number;
    width: number;
    options?: AsteroidCreationOptions;
}

export interface AsteroidCreationOptions {
    spriteImage?: HTMLImageElement;
    density?: number;
    health?: number;
    deriveHealth?: (mass: number, size: number) => number;
}

export function createAsteroid(
    {
        position,
        rotation,
        velocity,
        angularVelocity,
        width,
        options = {}
    }: AsteroidCreationParameters
): ECSEntityId {
    const {
        spriteImage = SpriteImages.asteroidImage,
        density = 32,
        health: optionalHealth,
        deriveHealth = (mass: number, area: number) => mass * (1 - 1 / (1 + area))
    }: AsteroidCreationOptions = options;
    const aspectRatio = spriteImage.height / spriteImage.width;
    const height = width * aspectRatio;
    const area = width * height;
    const mass = density * area;
    const sizeTransform: Transform = { scale: 1 };
    const health = optionalHealth ? optionalHealth : deriveHealth(mass, area);
    const entity = createSpriteEntity(
        Vector2.copy(position),
        rotation,
        spriteImage,
        3,
        {
            x: width,
            y: height
        }
    );
    Fluid.addEntityComponents(entity,
        Asteroid.createComponent({ area }),
        Velocity.createComponent({
            velocity,
            angular: angularVelocity
        }),
        Physics.createComponent({
            mass,
            centerOfMassOffset: Vector2.zero(),
            area: width * height,
            momentOfInertia: calculateRectangleMomentOfInertia(mass, width, height)
        }),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() }),
        BoundingBox.createComponent(createBoundingBox({ width, height })),
        Health.createComponent({ maxHealth: health, currentHealth: health, visible: true }),
        createPropertyAnimationsComponent(
            [
                [
                    // Sprite animations
                    Sprite,
                    [
                        // damaged animation
                        {
                            propertyName: 'transform',
                            beginningValue: sizeTransform,
                            endingValue: { scale: 1.25 },
                            completed: true,
                            duration: 0.15,
                            elapsed: 0,
                            onComplete(entityId, propertyAnimationComponent) {
                                const transform = propertyAnimationComponent.animations.get(Sprite.getId().getSymbol()).get('transform');
                                transform.completed = true;
                            },
                            interpolationId: transformScaleLerpId
                        }
                    ]
                ]
            ]
        )
    );
    return entity;
}
export function createAsteroidParticle(
    position: Vec2,
    velocity: Vec2,
    rotation: number,
    angularVelocity: number,
    spawnTime: number,
    lifeTime: number,
    size: number
): ECSEntityId {
    const entityId = createSpriteEntity(
        position,
        rotation,
        SpriteImages.asteroidImage,
        3,
        { x: size, y: size }
    );
    Fluid.addEntityComponents(entityId,
        Velocity.createComponent({ velocity: velocity, angular: angularVelocity }),
        LifeTime.createComponent({ lifeDuration: lifeTime, spawnTime }),
        Particle.createComponent({})
    )
    return entityId;
}
