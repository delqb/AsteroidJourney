
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Transform, Vec2 } from "fluidengine";


export interface SpriteComponent {
    image: HTMLImageElement;
    renderSize: Vec2;
    transform?: Transform;
    zIndex: number;
    alpha?: number;
};

export const Sprite = Fluid.defineComponentType<SpriteComponent>("Sprite");