import { Fluid } from "fluidengine";
import { ECSComponentType, ECSEntityId, ECSNode, ECSNodeSchema, ECSSystem } from "fluidengine";
import { MathUtils, Transform, Vec2 } from "fluidengine";
import { Position } from "./components/PositionComponent";
import { Velocity } from "./components/VelocityComponent";
import { BoundingBox } from "./components/BoundingBoxComponent";
import { Health } from "./components/HealthComponent";
import { Physics } from "./components/PhysicsComponent";
import { calculateRectangleMomentOfInertia } from "./Utils";
import { FluidSystem } from "fluidengine/internal";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { EntityDeath } from "./components/EntityDeathComponent";
import { Particle } from "./components/ParticleComponent";
import { LifeTime } from "./components/LifetimeComponent";


/*
Design Notes:

Cell Health:
- Cells will have a health component if they are attached.
- When cell health is depleted, they get detached and the health component is removed, and other changes follow.
- The health of an entity that is made up of many cells is the total remaining health of all cells.
- For now, all cells will have the same health, so the total health of an entity is the average health of cells.
- An entity's health is updated based on the health of attached cells.

Cell Material:
- For now, cells will only be rendered using a solid color.



*/

export interface CellMaterial {
    density: number;
    color: string;
}

export interface CellComponent {
    size: number;
    material: CellMaterial;
}

export interface CellGridComponent {
    attachedCells: Map<symbol, ECSEntityId>;
}

export const Cell = Fluid.defineComponentType<CellComponent>("Cell");
// export const CellAttachment = Fluid.defineComponentType<CellAttachmentComponent>("Cell Attachment");
export const CellGrid = Fluid.defineComponentType<CellGridComponent>("Attached Cell Grid");

// export interface CellCreationParameters {
// parentEntity: ECSEntityId;

// }

export const Metal1Material: CellMaterial = { color: "grey", density: 30 };

export function createSquareFromCells(
    position: Vec2,
    squareSideLength: number,
    sideCellCount: number,
    material: CellMaterial,
    totalHealth: number,
    {
        rotation = 0,
        velocity = { x: 0, y: 0 },
        angularVelocity = 0
    } = {}
): ECSEntityId {
    const totalCellCount = sideCellCount * sideCellCount;
    const halfSquareSize = squareSideLength / 2;
    const cells: Map<symbol, ECSEntityId> = new Map();
    const cellSideLength = squareSideLength / sideCellCount;
    const halfCellSize = cellSideLength / 2;
    const cellHealth = totalHealth / totalCellCount;
    const cellArea = cellSideLength * cellSideLength;
    const cellMass = material.density * cellArea;

    const squareEntity = Fluid.createEntityWithComponents(
        Position.createComponent({ position, rotation }),
        Velocity.createComponent({ velocity, angular: angularVelocity }),
        BoundingBox.createComponent({ center: position, rotation, size: { height: squareSideLength, width: squareSideLength } }),
        Health.createComponent({ currentHealth: totalHealth, maxHealth: totalHealth, visible: true }),
        CellGrid.createComponent({ attachedCells: cells })
    );

    for (let i = 0; i < sideCellCount; i++) {
        for (let j = 0; j < sideCellCount; j++) {
            const x = -halfSquareSize + i * cellSideLength + halfCellSize;
            const y = -halfSquareSize + j * cellSideLength + halfCellSize;
            const translate = { x, y };
            const rotate = rotation;

            const cell = Fluid.createEntityWithComponents(
                Cell.createComponent({ material: material, size: cellSideLength }),
                Child.createComponent({ parent: squareEntity }),
                TransformC.createComponent({ translate, rotate }),
                Health.createComponent({ currentHealth: cellHealth, maxHealth: cellHealth, visible: false }),
                Position.createComponent({ position: { x, y }, rotation }),
                BoundingBox.createComponent({ center: { x, y }, rotation, size: { width: cellSideLength, height: cellSideLength } }),
                Physics.createComponent({
                    area: cellArea,
                    centerOfMassOffset: { x: 0, y: 0 },
                    mass: cellMass,
                    momentOfInertia: calculateRectangleMomentOfInertia(cellMass, cellSideLength, cellSideLength)
                }),
                ChunkOccupancy.createComponent({ chunkKeys: new Set() })
            );

            cells.set(cell.getSymbol(), cell);
        }
    }
    return squareEntity;
}

const cellRenderSchema = {
    cell: Cell,
    position: Position
}
type cellRenderSchemaType = typeof cellRenderSchema;
interface CellRenderSchema extends cellRenderSchemaType {
}
const cellRenderSchemaMeta = Fluid.registerNodeSchema(cellRenderSchema, "Cell Render");

export interface ChildComponent {
    parent: ECSEntityId;
}

export const Child = Fluid.defineComponentType<ChildComponent>("Child");
export const TransformC = Fluid.defineComponentType<Transform>("Transform");

function defineSystem
    <T, S extends ECSNodeSchema>(
        nodeSchema: S,
        systemName: string,
        {
            updateNode = undefined,
            updateNodes = undefined
        } = {
                updateNode: (params: T, node: ECSNode<S>) => { },
                updateNodes: (params: T, nodes: Iterable<ECSNode<S>>) => { }
            }
    ): (parameters: T) => ECSSystem<S> {
    const schemaMeta = Fluid.registerNodeSchema(nodeSchema, `${systemName} Node Schema`);
    class InternalSystem extends FluidSystem<S> {
        constructor(
            private parameters: T,
        ) {
            super(systemName, schemaMeta);
        }
        updateNode(node: ECSNode<S>): void {
            if (updateNode)
                updateNode(this.parameters, node);
        }
        updateNodes(nodes: Iterable<ECSNode<S>>): void {
            if (updateNodes) {
                updateNodes(this.parameters, nodes);
                return;
            } else {
                super.updateNodes(nodes);
            }
        }

    }
    return (parameters: T) => new InternalSystem(parameters);
}

const childTransformSchema = {
    child: Child,
    transform: TransformC,
    position: Position
}
type childTransformSchemaType = typeof childTransformSchema;
interface ChildTransformSchema extends childTransformSchemaType {
}
const childTransformSchemaMeta = Fluid.registerNodeSchema(childTransformSchema, "Child Transform");

export class ChildPositionTransformSystem extends FluidSystem<ChildTransformSchema> {
    constructor(
    ) {
        super("Child Position Transform System", childTransformSchemaMeta);
    }
    updateNode(node: ECSNode<ChildTransformSchema>): void {
        const { child, position, transform } = node;
        const parent = child.parent;
        if (!Fluid.core().getEntityManager().hasEntity(parent))
            return;
        if (!Fluid.entityHasComponent(parent, Position))
            return;

        const parentPosition = Fluid.getEntityComponent(parent, Position);
        const { position: { x: pX, y: pY }, rotation: pRotation } = parentPosition.data;

        if (transform.translate != undefined) {
            const cos = Math.cos(pRotation);
            const sin = Math.sin(pRotation);
            const { x: tX, y: tY } = transform.translate;
            position.position.x = pX + tX * cos - tY * sin;
            position.position.y = pY + tX * sin + tY * cos;
        }

        if (transform.rotate != undefined) {
            position.rotation = pRotation + transform.rotate;
        }
    }
}

export class CellRenderSystem extends FluidSystem<CellRenderSchema> {
    constructor(
        private canvasContext: CanvasRenderingContext2D
    ) {
        super("Cell Render System", cellRenderSchemaMeta);
    }

    updateNode(node: ECSNode<CellRenderSchema>): void {
        const ctx = this.canvasContext;
        const { position, cell } = node;
        const { position: { x, y }, rotation } = position;
        const { material, size } = cell;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.translate(-size / 2, -size / 2)
        ctx.fillStyle = material.color;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
    }
}


interface CellDeathSystemParameters {

}
const cellDeathCompsToRemove: ECSComponentType<any>[] = [Child, EntityDeath, Health, TransformC];
const cellParticleLifeTime = 15;
export const createCellDeathSystem = defineSystem(
    {
        cell: Cell,
        child: Child,
        transform: TransformC,
        death: EntityDeath,
        health: Health
    },
    "Cell Death System",
    {
        updateNode: (params, node) => {
            const { cell, child, death, health, transform, entityId } = node;
            const parentId = child.parent;
            for (let t of cellDeathCompsToRemove) {
                Fluid.removeEntityComponent(entityId, t);
            }
            Fluid.addEntityComponents(entityId,
                Particle.createComponent({}),
                LifeTime.createComponent({ lifeDuration: cellParticleLifeTime, spawnTime: 0 }),
            );
            if (Fluid.entityHasComponent(parentId, Velocity)) {
                const velocity = Fluid.getEntityComponent(parentId, Velocity);
                const { x, y } = velocity.data.velocity;
                Fluid.addEntityComponent(entityId, Velocity.createComponent({
                    velocity: {
                        x: x + MathUtils.boundedRandom(-0.1, 0.1),
                        y: y + MathUtils.boundedRandom(-0.1, 0.1)
                    },
                    angular: velocity.data.angular + MathUtils.boundedRandom(-0.5, 0.5)
                }))
            }
        }
    }
)

export const createCellHiveHealthSystem = defineSystem(
    {
        health: Health,
        cellGrid: CellGrid,
    },
    "Cell Hive Health System",
    {
        updateNode: (params, node) => {
            const { cellGrid, health } = node;

            const cellIdMap = cellGrid.attachedCells;
            let currentHealth = 0;
            for (const cell of cellIdMap.values()) {
                if (!Fluid.core().getEntityManager().hasEntity(cell) || !Fluid.entityHasComponent(cell, Health)) {
                    cellIdMap.delete(cell.getSymbol());
                    continue;
                }
                const cellHealth = Fluid.getEntityComponent(cell, Health).data;
                currentHealth += cellHealth.currentHealth;
            }
            health.currentHealth = currentHealth;
        }
    }
)