
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ClientContext } from "./client/Client";
import { CanvasRenderer } from "./client/renderer/Renderer";
import {
    AxisRenderSystem,
    BoundingBoxRenderSystem,
    BoundingBoxUpdateSystem,
    ChunkBorderRenderSystem,
    ChunkLoadingSystem,
    ChunkOccupancyUpdateSystem,
    ChunkUnloadingSystem,
    CollisionDetectionSystem,
    CursorSystem,
    DebugInfoDisplaySystem,
    FiringSystem,
    KinematicSystem,
    MovementControlSystem,
    PositionSystem,
    ProjectileSystem,
    SpriteRenderSystem,
    ViewportRenderSystem,
    ViewportSystem,
    WorldPreRenderSystem
} from "./systems";
import { OccupiedChunkHighlightingSystem } from "./systems/render/debug/OccupiedChunkHighlightingSystem";
import { WorldContext } from "./world/World";
import { Fluid } from "fluidengine";
import { ECSEntityId } from "fluidengine";
import { FluidEngine, FluidSystemPhase } from "fluidengine/internal";
import { ChunkIndex, ChunkMeta, getChunkCenterFromIndex, Vector2, createChunk, ChunkState, Vec2, MathUtils, Transform } from "fluidengine";
import { HealthBarRenderSystem } from "./systems/render/HealthBarRenderSystem";
import { AsteroidDeathSystem } from "./systems/simulation/AsteroidDeathSystem";
import { ParticleSystem } from "./systems/simulation/ParticleSystem";
import { ProjectileDamageSystem } from "./systems/simulation/ProjectileDamageSystem";
import { InterpolationRegistry, transformScaleLerpId } from "./animation/Interpolators";
import { PropertyAnimationSystem } from "./systems/simulation/animation/PropertyAnimationSystem";
import { ProjectileType, spawnProjectile } from "./Projectiles";
import { calculateRectangleMomentOfInertia } from "./Utils";
import { createSpriteEntity } from "./Sprites";
import { Sprite } from "./components/SpriteComponent";
import { RenderCenter } from "./components/RenderCenterComponent";
import { Stats } from "./components/StatsComponent";
import { FireControl } from "./components/FireControlComponent";
import { MovementControl } from "./components/MovementControlComponent";
import { ViewportBorderWidth } from "./components/ViewportBorderWidthComponent";
import { CameraSpeedFactor } from "./components/CameraSpeedFactorComponent";
import { ScreenPoint } from "./components/ScreenPointComponent";
import { Acceleration } from "./components/AccelerationComponent";
import { Velocity } from "./components/VelocityComponent";
import { TargetPosition } from "./components/TargetPositionComponent";
import { Position } from "./components/PositionComponent";
import { Resolution } from "./components/ResolutionComponent";
import { BoundingBox, createBoundingBox } from "./components/BoundingBoxComponent";
import { Chunk } from "./components/ChunkComponent";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { ProjectileSource } from "./components/ProjectileSourceComponent";
import { Viewport } from "./components/ViewportComponent";
import { Health } from "./components/HealthComponent";
import { Thruster } from "./components/ThrusterComponent";
import { Physics } from "./components/PhysicsComponent";
import { createPropertyAnimationsComponent } from "./components/PropertyAnimationComponent";
import { Asteroid } from "./components/AsteroidComponent";
import { LifeTime } from "./components/LifetimeComponent";
import { Particle } from "./components/ParticleComponent";
import AssetRepo, { SpriteKey } from "./Assets";
import Assets from "./Assets";

interface AsteroidCreationParameters {
    position: Vec2;
    rotation: number;
    velocity: Vec2;
    angularVelocity: number;
    width: number;
    options?: AsteroidCreationOptions;
}

interface AsteroidCreationOptions {
    spriteImageKey?: SpriteKey;
    density?: number;
    health?: number;
    deriveHealth?: (mass: number, size: number) => number;
    damageAnimationScalePercent?: number;
    damageAnimationDuration?: number;
}

export async function start() {
    const maxVelocity = 2.5 * 2.99792458
    const boundedRandom = MathUtils.boundedRandom;

    const assetRepo = AssetRepo;
    const assets = await assetRepo.loadAssets();
    const sprites = assets.sprites;



    const canvasElement = document.getElementById("canvas")! as HTMLCanvasElement;
    canvasElement.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    const VIEWPORT_RESOLUTION_COMPONENT = Resolution.createComponent({
        resolution: Vector2.zero()
    });

    const renderContext = canvasElement.getContext("2d")!;
    const renderer = new CanvasRenderer(
        canvasElement,
        {
            scale: 0.98,
            renderBaseColor: "black",
            onresize:
                (pw, ph, nw, nh) => {
                    VIEWPORT_RESOLUTION_COMPONENT.data.resolution.x = nw;
                    VIEWPORT_RESOLUTION_COMPONENT.data.resolution.y = nh;
                }
        });

    let renderDistance: number = 5;

    const CAMERA = {
        position: Position.createComponent({
            position: {
                x: 0,
                y: 0,
            },
            rotation: 0
        }),
        target: TargetPosition.createComponent({
            position: Position.createComponent({ position: Vector2.zero(), rotation: 0 }).data
        }),
        cameraSpeed: CameraSpeedFactor.createComponent({
            speedFactor: 22
        }),
        borderWidth: ViewportBorderWidth.createComponent({
            borderWidth: 0.05 * Math.min(renderer.getWidth(), renderer.getHeight())
        }),
        viewport: Viewport.createComponent({
        }),
        resolution: VIEWPORT_RESOLUTION_COMPONENT
    }

    const cameraEntityId = Fluid.createEntityWithComponents(
        ...Object.values(CAMERA),
    );

    const engine = new FluidEngine(Fluid.core(), 1024);
    const worldContext: WorldContext = new WorldContext(engine, 1.024, 0.1, generateChunk);
    const clientContext: ClientContext = new ClientContext(engine, worldContext, renderer);

    clientContext.setZoomLevel(20);

    const KEY_STATES = {
    };

    const MOVEMENT_CONTROL_COMPONENT = MovementControl.createComponent({
        accelerationInput: {
            x: 0,
            y: 0
        },
        yawInput: 0
    });

    const KEYBOARD_CONTROLS = {
        up: {
            type: "movement",
            keys: ["w"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y += 1;
            }
        },
        down: {
            keys: ["s"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y += -1;
            }
        },
        left: {
            keys: ["a"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x += -1;
            }
        },
        right: {
            keys: ["d"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x += 1;
            }
        },
        yawLeft: {
            keys: ["q"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.yawInput -= 1;
            }
        },
        yawRight: {
            keys: ["e"],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.data.yawInput += 1;
            }
        }
    };

    const MOUSE_KEY_STATES = {

    }

    const MOUSE_CONTROLS = {
    }

    const HOTKEYS = {
        pause: {
            keys: ["escape"],
            action: () => {
                engine.toggleAnimation();
            }
        },
        eagle_eye_zoom: {
            keys: ["v"],
            action: () => clientContext.setZoomLevel(5)
        },
        reset_zoom: {
            keys: ["x"],
            action: () => clientContext.setZoomLevel(30)
        },
        decrease_zoom: {
            keys: ["z"],
            action: () => {
                const decrement = 10;
                const max = 100;
                const min = decrement;
                const next = (clientContext.getZoomLevel() - decrement);

                clientContext.setZoomLevel(next < min ? max : next);
            }
        },
        increase_zoom: {
            keys: ["c"],
            action: () => {
                const increment = 10;
                const max = 100;
                const min = increment;
                const next = (clientContext.getZoomLevel() + increment);

                clientContext.setZoomLevel(next > max ? min : next);
            }
        },
        slow_time: {
            keys: ["["],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() / 2)
        },
        speed_time: {
            keys: ["]"],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() * 2)
        },
        reset_simulation_speed: {
            keys: ["-"],
            action: () => clientContext.setSimulationSpeed(1)
        },
        toggle_debug_info: {
            keys: ["f1"],
            action: () => {
                clientContext.displayDebugInfo = !clientContext.displayDebugInfo;
            }
        },
        toggle_colliders: {
            keys: ["f2"],
            action: () => {
                clientContext.displayBoundingBoxes = !clientContext.displayBoundingBoxes;
            }
        },
        toggle_display_axes: {
            keys: ["f3"],
            action: () => {
                clientContext.displayEntityAxes = !clientContext.displayEntityAxes;
            }
        },
        toggle_display_chunks: {
            keys: ["f4"],
            action: () => {
                clientContext.displayChunks = !clientContext.displayChunks;
            }
        }
    }

    function activateHotkeyBindings() {
        for (const binding of Object.values(HOTKEYS)) {
            if (binding.keys.some(k => KEY_STATES[k.toLowerCase()] === true))
                binding.action();
        }
    }

    function activateControlBindings() {
        for (const controlBinding of Object.keys(KEYBOARD_CONTROLS).map(k => KEYBOARD_CONTROLS[k])) {
            if (controlBinding.keys.some(k => KEY_STATES[k]))
                controlBinding.action();
        }
        for (const controlBinding of Object.keys(MOUSE_CONTROLS).map(k => MOUSE_CONTROLS[k])) {
            if (controlBinding.keys.some(k => MOUSE_KEY_STATES[k]))
                controlBinding.action();
        }
    }

    function drawPauseScreen() {
        renderContext.save();

        renderContext.globalAlpha = 0.5;
        renderer.clear();
        renderContext.globalAlpha = 0.5;
        renderContext.font = "bold 256px calibri"
        renderContext.fillStyle = "white";
        renderContext.fillText("⏸", (renderer.getWidth() - 256) / 2, renderer.getHeight() / 2);

        renderContext.restore();
    }

    const simulationPhase = new FluidSystemPhase(
        "Simulation Phase",
        () => {
            activateControlBindings();
        },
        () => {
            MOVEMENT_CONTROL_COMPONENT.data.yawInput = 0;
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x = 0;
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y = 0;
            FIRE_CONTROL_COMPONENT.data.fireIntent = false;
        }
    );

    const worldRenderPhase = new FluidSystemPhase(
        "World Render Phase",
        () => { },
        () => {
            renderContext.restore();
        }
    );

    const hudRenderPhase = new FluidSystemPhase(
        "Hud Render Phase",
        () => { },
        () => {
            if (!engine.getAnimationState())
                drawPauseScreen();
        }
    );

    const sysman = Fluid.core().getSystemOrchestrator();
    sysman.pushPhases(simulationPhase, worldRenderPhase, hudRenderPhase);

    let kinematicSystem = new KinematicSystem(clientContext),
        positionSystem = new PositionSystem(engine),
        movementControlSystem = new MovementControlSystem(() => engine.getDeltaTime()),
        viewportSystem = new ViewportSystem(clientContext),
        projectileSystem = new ProjectileSystem(engine),
        firingSystem = new FiringSystem(engine, spawnProjectile),
        cursorSystem = new CursorSystem(engine),
        chunkLoadingSystem = new ChunkLoadingSystem(engine, worldContext),
        chunkUnloadingSystem = new ChunkUnloadingSystem(engine, worldContext),
        chunkOccupancyUpdateSystem = new ChunkOccupancyUpdateSystem(engine, worldContext),
        boundingBoxUpdateSystem = new BoundingBoxUpdateSystem(),
        collisionDetectionSystem = new CollisionDetectionSystem(engine),
        pojectileDamageSystem = new ProjectileDamageSystem(),

        worldPreRenderSystem = new WorldPreRenderSystem(clientContext),
        viewportRenderSystem = new ViewportRenderSystem(renderContext),
        debugInfoDisplaySystem = new DebugInfoDisplaySystem(clientContext),
        spriteRenderSystem = new SpriteRenderSystem(renderer),
        boundingBoxRenderSystem = new BoundingBoxRenderSystem(clientContext),
        axisRenderSystem = new AxisRenderSystem(clientContext),
        chunkBorderRenderSystem = new ChunkBorderRenderSystem(clientContext),
        occupiedChunkHighlightingSystem = new OccupiedChunkHighlightingSystem(clientContext),
        healthBarRenderSystem = new HealthBarRenderSystem(renderContext, () => CAMERA.position.data.rotation);
    ;

    simulationPhase.pushSystems(
        chunkLoadingSystem,
        chunkOccupancyUpdateSystem,
        chunkUnloadingSystem,
        cursorSystem,
        firingSystem,
        projectileSystem,
        movementControlSystem,
        kinematicSystem,
        positionSystem,
        viewportSystem,
        boundingBoxUpdateSystem,
        collisionDetectionSystem,
        pojectileDamageSystem,
        new AsteroidDeathSystem(clientContext),
        new ParticleSystem(clientContext),
        new PropertyAnimationSystem(engine, InterpolationRegistry.resolveInterpolator),
    );

    worldRenderPhase.pushSystems(
        worldPreRenderSystem,
        spriteRenderSystem,
        occupiedChunkHighlightingSystem,
        chunkBorderRenderSystem,
        boundingBoxRenderSystem,
        axisRenderSystem,
        healthBarRenderSystem
    );

    hudRenderPhase.pushSystems(
        viewportRenderSystem,
        debugInfoDisplaySystem
    );

    const FIRE_CONTROL_COMPONENT = FireControl.createComponent({ fireIntent: false });

    const MC_POS = Position.createComponent({
        position: { x: 0, y: 0 },
        rotation: -Math.PI / 2
    });

    CAMERA.target.data.position = MC_POS.data;


    // ProjectileTypes
    const artilleryShell: ProjectileType = {
        lifeTime: 5,
        damage: 0.0015,
        density: 1.8,
        spriteImageKey: "artilleryShellImage"
    }






    function initMainCharacter(): ECSEntityId {
        const modelScaleFactor = 1 / 555;
        const shipImage = sprites.shipImage;
        const shipImageAspectRatio = shipImage.height / shipImage.width;
        const height = 0.2
        const width = height / shipImageAspectRatio;
        const area = width * height;
        const mass = 3e9 * modelScaleFactor;
        return Fluid.createEntityWithComponents(
            MC_POS,
            Velocity.createComponent(
                {
                    velocity: { x: 0, y: 0 },
                    angular: 0
                }),
            Acceleration.createComponent(
                {
                    acceleration: { x: 0, y: 0 },
                    angular: 0
                }),
            Stats.createComponent({}),
            ProjectileSource.createComponent({
                muzzleSpeed: 1.2 * 2.99792458,
                fireRate: 14,
                projectileWidth: 0.035,
                projectileType: artilleryShell,
                lastFireTime: 0,
                transform: {
                    scale: height * 1.1 / 2
                }
            }),
            RenderCenter.createComponent({ renderDistance: renderDistance }),
            Sprite.createComponent(
                {
                    image: shipImage,
                    zIndex: 5,
                    renderSize: { x: width, y: height },
                    transform: {
                        rotate: Math.PI / 2
                    }
                }),
            BoundingBox.createComponent(
                createBoundingBox(
                    {
                        width: width,
                        height: height
                    },
                    {
                        transform: {
                            rotate: Math.PI / 2
                        }
                    }
                )),
            ChunkOccupancy.createComponent({ chunkKeys: new Set() }),
            Physics.createComponent({
                mass: mass,
                centerOfMassOffset: { x: 0, y: 0 },
                area: area,
                momentOfInertia: calculateRectangleMomentOfInertia(mass, width, height)
            }),
            Thruster.createComponent({ maxForce: 1.75 * 4.4e9 * modelScaleFactor }),
            MOVEMENT_CONTROL_COMPONENT,
            FIRE_CONTROL_COMPONENT,
            Health.createComponent({ maxHealth: 100, currentHealth: 60, visible: true })
        );
    }

    const MAIN_CHARACTER = initMainCharacter();


    MOUSE_CONTROLS["fire"] = {
        keys: [0],
        action: () => {
            FIRE_CONTROL_COMPONENT.data.fireIntent = true;
        },
    };

    KEYBOARD_CONTROLS["fire"] = {
        keys: [" "],
        action: () => {
            FIRE_CONTROL_COMPONENT.data.fireIntent = true;
        }
    };

    const CURSOR_SCREEN_COMPONENT = ScreenPoint.createComponent({
        point: { x: 0, y: 0 }
    });

    canvasElement.addEventListener("mousemove", (event) => {
        CURSOR_SCREEN_COMPONENT.data.point = { x: event.offsetX, y: event.offsetY };
    });

    window.addEventListener("keydown", (event) => {
        event.preventDefault();
        KEY_STATES[event.key.toLowerCase()] = true;
        activateHotkeyBindings();
    });

    window.addEventListener("keyup", (event) => {
        KEY_STATES[event.key.toLowerCase()] = false;
    });

    window.addEventListener("mousedown", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = true;
    });

    canvasElement.addEventListener("mouseup", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = false;
    });

    engine.animate();
    console.log("Asteroid Journey Started!");
}