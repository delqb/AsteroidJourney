
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { Collision } from "../../components/CollisionComponent";
import { EntityDeath } from "../../components/EntityDeathComponent";
import { Health } from "../../components/HealthComponent";
import { Projectile } from "../../components/ProjectileComponent";

const schema = {
    projectile: Projectile,
    collision: Collision
}

type Schema = typeof schema;

const nodeMeta = Fluid.registerNodeSchema(schema, "Projectile Damage");

export class ProjectileDamageSystem extends FluidSystem<Schema> {
    constructor() {
        super("Projectile Damage System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const { collision, entityId, projectile: projectileData } = node;
        const otherEntity = Fluid.getEntityProxy(collision.collidedEntity);

        if (!otherEntity.hasComponent(Health))
            return;

        const healthData = otherEntity.getComponent(Health).data;
        const health = Math.max(0, healthData.currentHealth - projectileData.damage);
        healthData.currentHealth = health;
        if (health === 0)
            if (!otherEntity.hasComponent(EntityDeath))
                otherEntity.addComponent(EntityDeath.createComponent({ readyToRemove: false }));

        Fluid.removeEntity(entityId);
    }
}