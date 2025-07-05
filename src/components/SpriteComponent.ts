
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Transform } from "fluidengine/v0/lib";


export interface SpriteComponent {
    image: HTMLImageElement;
    transform?: Transform;
    zIndex: number;
    alpha?: number;
};

export const Sprite = Fluid.defineComponentType<SpriteComponent>("Sprite");