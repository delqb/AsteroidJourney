
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { EntityDeath } from "../../components/EntityDeathComponent";

const schema = {
    entityDeath: EntityDeath
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Entity Death");

export class EntityDeathSystem extends FluidSystem<Schema> {
    updateNode(node: ECSNode<Schema>): void {
        if (node.entityDeath.readyToRemove)
            Fluid.removeEntity(node.entityId);
    }
}