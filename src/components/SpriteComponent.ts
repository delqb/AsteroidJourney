
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Transform, Vec2 } from "fluidengine/v0/lib";


export interface SpriteComponent {
    image: HTMLImageElement;
    renderSize: Vec2;
    transform?: Transform;
    zIndex: number;
    alpha?: number;
};

export const Sprite = Fluid.defineComponentType<SpriteComponent>("Sprite");