
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";
import { PositionComponent } from "./PositionComponent";

export interface TargetPositionComponent {
    position: PositionComponent;
};

export const TargetPosition = Fluid.defineComponentType<TargetPositionComponent>("Target Position");
