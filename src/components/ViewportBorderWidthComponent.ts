
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";


export interface ViewportBorderWidthComponent {
    borderWidth: number;
};

export const ViewportBorderWidth = Fluid.defineComponentType<ViewportBorderWidthComponent>("Viewport Border Width");