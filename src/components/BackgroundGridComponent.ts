
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";


export interface BackgroundGridComponent {
    gridSize: number;
    gridLineWidth: number;
    gridLineColor: string;
};

export const BackgroundGrid = Fluid.defineComponentType<BackgroundGridComponent>("Background Grid");