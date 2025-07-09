import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";

export interface PhysicsComponent {
    mass: number;
    centerOfMassOffset: Vec2;
    area: number;
    momentOfInertia: number;
}

export const Physics = Fluid.defineComponentType<PhysicsComponent>("Physics");