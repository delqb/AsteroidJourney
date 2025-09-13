
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";


export interface ViewportBorderWidthComponent {
    borderWidth: number;
};

export const ViewportBorderWidth = Fluid.defineComponentType<ViewportBorderWidthComponent>("Viewport Border Width");