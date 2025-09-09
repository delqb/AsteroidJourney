import { Fluid } from "fluidengine";

export interface ThrusterComponent {
    maxForce: number;
}

export const Thruster = Fluid.defineComponentType<ThrusterComponent>("Thruster");