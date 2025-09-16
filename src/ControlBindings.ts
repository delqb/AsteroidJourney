import { ECSComponent, FluidEngine } from "fluidengine";
import { MovementControlComponent } from "./components/MovementControlComponent";
import { ClientContext } from "./client/Client";
import { FireControlComponent } from "./components/FireControlComponent";

export function mouseButtonToString(button: number): string {
    return `mouse${button}`;
}

export function createControlBinding(
    controlBindingProperties: ControlBindingProperties = {
        keys: [],
        action: () => { }
    }
): ControlBinding {
    return new ControlBinding(controlBindingProperties);
}

export interface ControlBindingProperties {
    keys: string[];
    name?: string;
    description?: string;
    action?: () => void;
    continuous?: boolean;
    enabled?: boolean;
}

export class ControlBinding {
    public name: string;
    public description: string;
    public keys: string[];
    public action: () => void;
    public continuous: boolean;
    public enabled: boolean;

    constructor(
        private controlBindingProperties: ControlBindingProperties = {
            keys: [],
            action: () => { }
        }) {
        this.name = controlBindingProperties.name || "Unnamed Control Binding";
        this.description = controlBindingProperties.description || "";
        this.action = controlBindingProperties.action || (() => { });
        this.continuous = controlBindingProperties.continuous || false;
        this.enabled = controlBindingProperties.enabled !== undefined ? controlBindingProperties.enabled : true;

        const keys = controlBindingProperties.keys || [];
        this.keys = keys.map(k => k.toLowerCase());
    }
}

export class ControlBinder {
    private bindings: ControlBinding[] = [];
    private keyStates: Map<string, boolean> = new Map();

    constructor() {
    }

    activateControlBindings(continuous: boolean): ControlBinder {
        for (const binding of this.bindings.filter(b => b.continuous === continuous)) {
            if (!binding.enabled) continue;
            if (binding.keys.some(k => this.keyStates.get(k))) {
                binding.action();
            }
        }
        return this;
    }

    registerBinding(binding: ControlBinding): ControlBinder {
        this.bindings.push(binding);
        return this;
    }

    getBindings(): ControlBinding[] {
        return this.bindings;
    }

    getActiveBindings(): ControlBinding[] {
        return this.bindings.filter(b => b.enabled && b.keys.some(k => this.keyStates.get(k)));
    }

    setKeyState(key: string, pressed: boolean): void {
        this.keyStates.set(key, pressed);
    }

    getKeyState(key: string): boolean {
        return this.keyStates.get(key) || false;
    }

    clearKeyStates(): ControlBinder {
        this.keyStates.clear();
        return this;
    }

    registerKeyboardListeners(element: HTMLElement = window.document.body): ControlBinder {
        element.addEventListener("keydown", (event) => {
            event.preventDefault();
            this.setKeyState(event.key.toLowerCase(), true);
            this.activateControlBindings(false);
        });

        element.addEventListener("keyup", (event) => {
            this.setKeyState(event.key.toLowerCase(), false);
        });
        return this;
    }

    registerMouseListeners(element: HTMLElement = window.document.body): ControlBinder {
        element.addEventListener("mousedown", (event: MouseEvent) => {
            this.setKeyState(mouseButtonToString(event.button), true);
            this.activateControlBindings(false);
        });

        element.addEventListener("mouseup", (event: MouseEvent) => {
            this.setKeyState(mouseButtonToString(event.button), false);
        });
        return this;
    }

    registerDefaultListeners(): ControlBinder {
        this.registerKeyboardListeners();
        this.registerMouseListeners();
        return this;
    }
}

export function createDefaultControlBindings(
    engine: FluidEngine,
    clientContext: ClientContext,
    movementControlComponent: ECSComponent<MovementControlComponent>,
    fireControlComponent: ECSComponent<FireControlComponent>
): Record<string, ControlBinding> {
    return {
        // Movement controls
        up: createControlBinding({
            name: "Move Up",
            keys: ["w"],
            action: () => {
                movementControlComponent.data.accelerationInput.y += 1;
            },
            continuous: true
        }),
        down: createControlBinding({
            name: "Move Down",
            keys: ["s"],
            action: () => {
                movementControlComponent.data.accelerationInput.y += -1;
            },
            continuous: true
        }),
        left: createControlBinding({
            name: "Move Left",
            keys: ["a"],
            action: () => {
                movementControlComponent.data.accelerationInput.x += -1;
            },
            continuous: true
        }),
        right: createControlBinding({
            name: "Move Right",
            keys: ["d"],
            action: () => {
                movementControlComponent.data.accelerationInput.x += 1;
            },
            continuous: true
        }),
        yawLeft: createControlBinding({
            name: "Yaw Left",
            keys: ["q"],
            action: () => {
                movementControlComponent.data.yawInput -= 1;
            },
            continuous: true
        }),
        yawRight: createControlBinding({
            name: "Yaw Right",
            keys: ["e"],
            action: () => {
                movementControlComponent.data.yawInput += 1;
            },
            continuous: true
        }),
        // Fire control
        fire_keyboard: createControlBinding({
            name: "Fire",
            keys: [" ", mouseButtonToString(0)],
            action: () => {
                fireControlComponent.data.fireIntent = true;
            },
            continuous: true
        }),
        // Hotkeys
        pause: createControlBinding({
            name: "Pause",
            keys: ["escape"],
            action: () => {
                engine.toggleAnimation();
            }
        }),
        eagle_eye_zoom: createControlBinding({
            name: "Eagle Eye Zoom",
            keys: ["v"],
            action: () => clientContext.setZoomLevel(5)
        }),
        reset_zoom: createControlBinding({
            name: "Reset Zoom",
            keys: ["x"],
            action: () => clientContext.setZoomLevel(30)
        }),
        decrease_zoom: createControlBinding({
            name: "Decrease Zoom",
            keys: ["z"],
            action: () => {
                const decrement = 10;
                const max = 100;
                const min = decrement;
                const next = (clientContext.getZoomLevel() - decrement);
                clientContext.setZoomLevel(next < min ? max : next);
            }
        }),
        increase_zoom: createControlBinding({
            name: "Increase Zoom",
            keys: ["c"],
            action: () => {
                const increment = 10;
                const max = 100;
                const min = increment;
                const next = (clientContext.getZoomLevel() + increment);
                clientContext.setZoomLevel(next > max ? min : next);
            }
        }),
        slow_time: createControlBinding({
            name: "Slow Time",
            keys: ["["],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() / 2)
        }),
        speed_time: createControlBinding({
            name: "Speed Time",
            keys: ["]"],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() * 2)
        }),
        reset_simulation_speed: createControlBinding({
            name: "Reset Simulation Speed",
            keys: ["-"],
            action: () => clientContext.setSimulationSpeed(1)
        }),
        toggle_debug_info: createControlBinding({
            name: "Toggle Debug Info",
            keys: ["f1"],
            action: () => {
                clientContext.displayDebugInfo = !clientContext.displayDebugInfo;
            }
        }),
        toggle_colliders: createControlBinding({
            name: "Toggle Colliders",
            keys: ["f2"],
            action: () => {
                clientContext.displayBoundingBoxes = !clientContext.displayBoundingBoxes;
            }
        }),
        toggle_display_axes: createControlBinding({
            name: "Toggle Display Axes",
            keys: ["f3"],
            action: () => {
                clientContext.displayEntityAxes = !clientContext.displayEntityAxes;
            }
        }),
        toggle_display_chunks: createControlBinding({
            name: "Toggle Display Chunks",
            keys: ["f4"],
            action: () => {
                clientContext.displayChunks = !clientContext.displayChunks;
            }
        })
    };
}

export function registerDefaultBindings(
    controlBinder: ControlBinder,
    engine: FluidEngine,
    clientContext: ClientContext,
    movementControlComponent: ECSComponent<MovementControlComponent>,
    fireControlComponent: ECSComponent<FireControlComponent>
): ControlBinder {
    const bindings = createDefaultControlBindings(engine, clientContext, movementControlComponent, fireControlComponent);
    Object.values(bindings).forEach(binding => {
        controlBinder.registerBinding(binding);
    });
    return controlBinder;
}