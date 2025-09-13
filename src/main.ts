
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";

async function main() {
    console.log(`Launcher has started!`);

    try {
        console.log("Bootstrapping Fluid Core...");
        const coreInstance = Fluid.bootstrap();
        console.log(`Fluid Core has been initialized!`, coreInstance);
    } catch (err) {
        console.error("Fluid Core initialization failed:", err);
        return;
    }

    try {
        console.log("Starting Asteroid Journey...");
        await import("./AsteroidJourney").then(m => m.start());
    } catch (err) {
        console.error("Failed to load AsteroidJourney module:", err);
    }
}

main();