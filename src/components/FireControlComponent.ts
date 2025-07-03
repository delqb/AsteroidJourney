
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";

export interface FireControlComponent {
    fireIntent: boolean;
};

export const FireControl = Fluid.defineComponentType<FireControlComponent>("Fire Control");
