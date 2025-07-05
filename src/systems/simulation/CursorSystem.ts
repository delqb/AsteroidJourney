
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ECSNode } from "fluidengine/v0/api";
import { FluidEngine, FluidSystem } from "fluidengine/v0/internal";
import { Vector2 } from "fluidengine/v0/lib";
import { CursorTranslate } from "../../components/CursorTranslateComponent";
import { Position } from "../../components/PositionComponent";
import { ScreenPoint } from "../../components/ScreenPointComponent";
import { Fluid } from "fluidengine/dev";


const schema = {
    position: Position,
    screenPoint: ScreenPoint,
    cursorTranslate: CursorTranslate
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Cursor Update");

export class CursorSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Cursor System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        node.position.position =
            Vector2.add(
                node.cursorTranslate.cursorTranslate,
                Vector2.scale(node.screenPoint.point, 1 / this.engineInstance.PIXELS_PER_METER)
            );
    }
}