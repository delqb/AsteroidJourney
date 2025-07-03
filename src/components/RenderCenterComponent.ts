
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";

export interface RenderCenterComponent {
    renderDistance: number;
};

export const RenderCenter = Fluid.defineComponentType<RenderCenterComponent>("Render Center");
