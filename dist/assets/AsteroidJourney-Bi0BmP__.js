import { O as OrderedArrayList, f as fluidInternal$1, C as CoreRuntime, F as FluidCore, g as getChunkIndexFromPosition, a as getChunkKeyFromIndex, b as ChunkState, c as getChunkCornerFromIndex, p as parseChunkKey, d as getChunkCenterFromIndex, e as createChunk } from "./index-D2JzxBXC.js";
class FPSTimer {
  FRAME_SAMPLING_INTERVAL;
  previousSampleTimestamp = 0;
  frameCountSinceSample = 0;
  currentFPS = 0;
  constructor(FRAME_SAMPLING_INTERVAL = 20) {
    this.FRAME_SAMPLING_INTERVAL = FRAME_SAMPLING_INTERVAL;
  }
  tick() {
    this.frameCountSinceSample++;
    if (this.frameCountSinceSample < this.FRAME_SAMPLING_INTERVAL)
      return;
    const now = performance.now(), elapsed = now - this.previousSampleTimestamp;
    if (this.previousSampleTimestamp && elapsed > 0)
      this.currentFPS = this.FRAME_SAMPLING_INTERVAL * 1e3 / elapsed;
    this.previousSampleTimestamp = now;
    this.frameCountSinceSample = 0;
  }
  getFPS() {
    return this.currentFPS;
  }
}
class FluidEngine {
  core;
  PIXELS_PER_METER;
  deltaTime;
  isAnimating = false;
  gameTime = 0;
  fpsTimer;
  constructor(core, PIXELS_PER_METER = 1e3, deltaTime = 1 / 60, FPS_SAMPLING_INTERVAL = 20) {
    this.core = core;
    this.PIXELS_PER_METER = PIXELS_PER_METER;
    this.deltaTime = deltaTime;
    this.fpsTimer = new FPSTimer(FPS_SAMPLING_INTERVAL);
  }
  getFPS() {
    return this.fpsTimer.getFPS();
  }
  getGameTime() {
    return this.gameTime;
  }
  getDeltaTime() {
    return this.deltaTime;
  }
  animate() {
    try {
      this.fpsTimer.tick();
      this.core.update();
    } catch (err) {
      console.error(err);
    }
    if (this.isAnimating)
      requestAnimationFrame(this.animate.bind(this));
    this.gameTime += this.deltaTime;
  }
  getAnimationState() {
    return this.isAnimating;
  }
  startAnimation() {
    if (this.isAnimating)
      return;
    this.isAnimating = true;
    this.animate();
  }
  stopAnimation() {
    this.isAnimating = false;
  }
  toggleAnimation() {
    if (this.isAnimating)
      this.stopAnimation();
    else
      this.startAnimation();
  }
}
class FluidSystemMeta {
  systemName;
  nodeSchemaMeta;
  constructor(systemName, nodeSchemaMeta) {
    this.systemName = systemName;
    this.nodeSchemaMeta = nodeSchemaMeta;
  }
}
class FluidSystem {
  systemMeta;
  constructor(name, nodeSchemaMeta) {
    this.systemMeta = new FluidSystemMeta(name, nodeSchemaMeta);
  }
  getSystemMeta() {
    return this.systemMeta;
  }
  updateNodes(nodes) {
    for (const node of nodes) {
      if (this.updateNode)
        this.updateNode(node);
    }
  }
}
class FluidSystemPhase {
  name;
  preUpdate;
  postUpdate;
  systemList = new OrderedArrayList();
  constructor(name, preUpdate, postUpdate) {
    this.name = name;
    this.preUpdate = preUpdate;
    this.postUpdate = postUpdate;
  }
  getName() {
    return this.name;
  }
  hasSystem(system) {
    return this.systemList.has(system);
  }
  addSystem(system, inPhaseOrder) {
    if (this.systemList.has(system)) {
      throw new Error(`Failed to add system '${system.getSystemMeta().systemName}' to phase '${this.name}': system has already been added.`);
    }
    this.systemList.insert(system, inPhaseOrder);
  }
  pushSystem(system) {
    this.addSystem(system, this.systemList.getSize());
  }
  pushSystems(...systems) {
    systems.forEach((system) => this.pushSystem(system));
  }
  removeSystem(system) {
    if (!this.systemList.has(system)) {
      throw new Error(`Failed to remove system '${system.getSystemMeta().systemName}' from phase '${this.name}': system was not found.`);
    }
    this.systemList.remove(system);
  }
  getSystems() {
    return this.systemList.getAll();
  }
  update(nodeIndex) {
    try {
      this.preUpdate?.();
    } catch (error) {
      console.error(`Failed to complete phase '${this.getName()}' pre-update:
${error}`);
    }
    for (const system of this.systemList.getAll()) {
      try {
        system.updateNodes(nodeIndex.getNodesWithSchema(system.getSystemMeta().nodeSchemaMeta));
      } catch (error) {
        console.error(`Failed to complete system '${system.getSystemMeta().systemName}' update:
${error}`);
      }
    }
    try {
      this.postUpdate?.();
    } catch (error) {
      console.error(`Failed to complete phase '${this.getName()}' post-update:
${error}`);
    }
  }
}
function aabbsIntersect(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.maxY >= b.minY && a.minY <= b.maxY;
}
const reference_axis = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
function isSeparatingAxisExistent(polygonA, polygonB, quantization_precision = 1e6) {
  const seen = /* @__PURE__ */ new Set();
  for (const vertices of [polygonA, polygonB]) {
    for (let i = 0; i < vertices.length; i++) {
      const current = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      const edgeX = next.x - current.x, edgeY = next.y - current.y;
      const edgeLength = Math.hypot(edgeX, edgeY);
      const unitNormX = -edgeY / edgeLength, unitNormY = edgeX / edgeLength;
      const dot = unitNormX * reference_axis.x + unitNormY * reference_axis.y;
      const quantized = Math.round(Math.abs(dot) * quantization_precision);
      if (seen.has(quantized))
        continue;
      seen.add(quantized);
      const [minA, maxA] = projectPolygonOntoAxis(polygonA, unitNormX, unitNormY);
      const [minB, maxB] = projectPolygonOntoAxis(polygonB, unitNormX, unitNormY);
      if (maxA < minB || maxB < minA) {
        return true;
      }
    }
  }
  return false;
}
function projectPolygonOntoAxis(polygon, axisX, axisY) {
  let min = Infinity, max = -Infinity;
  for (const v of polygon) {
    const proj = v.x * axisX + v.y * axisY;
    if (proj < min)
      min = proj;
    if (proj > max)
      max = proj;
  }
  return [min, max];
}
const Vector2 = {
  zero: () => {
    return { x: 0, y: 0 };
  },
  create: (x = 0, y = 0) => ({ x, y }),
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  subtract: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  multiply: (a, b) => ({ x: a.x * b.x, y: a.y * b.y }),
  divide: (a, b) => ({ x: a.x / b.x, y: a.y / b.y }),
  scale: (v, scalar) => ({ x: v.x * scalar, y: v.y * scalar }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  abs: (v) => ({ x: Math.abs(v.x), y: Math.abs(v.y) }),
  magnitude: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v) => {
    const mag = Vector2.magnitude(v);
    return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
  },
  distanceSquared: (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
  distance: (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),
  // the clockwise, radian angle between the positive x axis with vector 'a' as the origin and the line from vector 'a' to vector 'b'
  angle: (a, b) => {
    let diff = Vector2.subtract(b, a);
    return Math.atan2(diff.y, diff.x);
  },
  fromAngle: (t) => ({ x: Math.cos(t), y: Math.sin(t) }),
  copy: (v) => {
    return { x: v.x, y: v.y };
  }
};
function createOBB({ halfExtents = Vector2.zero(), axes = { x: Vector2.zero(), y: Vector2.zero() }, corners = [Vector2.zero(), Vector2.zero(), Vector2.zero(), Vector2.zero()] } = {}) {
  return { halfExtents, axes, corners };
}
function createTransform({ translate = void 0, rotate = void 0, scale = void 0 } = {}) {
  return { translate, scale, rotate };
}
const PI$3 = Math.PI, PI2$2 = PI$3 * 2;
function shortestAngleDiff$1(a, b) {
  let diff = (b - a) % PI2$2;
  if (diff > Math.PI)
    diff -= PI2$2;
  if (diff < -Math.PI)
    diff += PI2$2;
  return diff;
}
function round$2(num, decimalPlaces = 3) {
  return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}
function lerp(start, end, t) {
  return start + (end - start) * t;
}
function boundedRandom$1(min, max) {
  return min + (max - min) * Math.random();
}
function encodeIntegerPair(x, y) {
  const X = x >= 0 ? 2 * x : -2 * x - 1;
  const Y = y >= 0 ? 2 * y : -2 * y - 1;
  return X >= Y ? X * X + X + Y : Y * Y + X;
}
const ceil = Math.ceil, floor = Math.floor;
function conservativeOBBRasterization$1(rectWidth, rectHeight, cellSize, widthProjectionFactor, heightProjectionFactor, axes, center, scanResolution, collect) {
  if (rectWidth <= 0 || rectHeight <= 0 || cellSize <= 0)
    throw new Error(`Invalid grid scan parameters: found zero or negative values.`);
  const rw = rectWidth * widthProjectionFactor, rh = rectHeight * heightProjectionFactor;
  const hw = rw / 2, hh = rh / 2;
  const nXStep = ceil(rw / cellSize) * scanResolution, nYStep = ceil(rh / cellSize) * scanResolution;
  const xStep = rw / nXStep, yStep = rh / nYStep;
  const cx = center.x, cy = center.y;
  const ax = axes.x, ay = axes.y;
  const axx = ax.x, axy = ax.y, ayx = ay.x, ayy = ay.y;
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i <= nXStep; i++) {
    for (let j = 0; j <= nYStep; j++) {
      const lx = -hw + i * xStep, ly = -hh + j * yStep;
      const x = cx + lx * axx + ly * ayx, y = cy + lx * axy + ly * ayy;
      const cellIdxX = floor(x / cellSize), cellIdxY = floor(y / cellSize);
      const enc = encodeIntegerPair(cellIdxX, cellIdxY);
      if (seen.has(enc))
        continue;
      seen.add(enc);
      collect(cellIdxX, cellIdxY);
    }
  }
}
function loadImage$1(src, timeoutMs = 1e4) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      reject(new Error(`Timeout while loading image: "${src}"`));
    }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = (event) => {
      clearTimeout(timer);
      const error = new Error(`Failed to load image: '${src}'`);
      console.error(event);
      error.event = event;
      error.src = src;
      reject(error);
    };
    img.src = src;
  });
}
function canvasToImage$1(canvas, imageObject) {
  const imageDataUrl = canvas.toDataURL();
  const image = imageObject || new Image();
  image.src = imageDataUrl;
  return image;
}
class ClientContext {
  constructor(engineInstance, worldContext2, renderer2) {
    this.engineInstance = engineInstance;
    this.worldContext = worldContext2;
    this.renderer = renderer2;
  }
  displayBoundingBoxes = false;
  displayEntityAxes = false;
  displayDebugInfo = false;
  displayChunks = false;
  setZoomLevel(level) {
    this.engineInstance.PIXELS_PER_METER = 10 * level;
  }
  getZoomLevel() {
    return this.engineInstance.PIXELS_PER_METER / 10;
  }
  getSimulationSpeed() {
    return this.engineInstance.deltaTime * 60;
  }
  setSimulationSpeed(speed) {
    this.engineInstance.deltaTime = speed / 60;
  }
}
const defaultResizeHandler = function(prevWidth, prevHeight, newWidth, newHeight) {
};
class CanvasRenderer {
  canvasElement;
  renderContext;
  scale;
  renderBaseColor;
  width;
  height;
  resizeHandler;
  constructor(canvasElement2, { scale = 0.98, renderBaseColor = "black", onresize = defaultResizeHandler } = {}) {
    this.canvasElement = canvasElement2;
    this.renderContext = canvasElement2.getContext("2d");
    this.scale = scale;
    this.renderBaseColor = renderBaseColor;
    this.width = canvasElement2.width;
    this.height = canvasElement2.height;
    this.resizeHandler = onresize.bind(this);
    window.addEventListener("resize", this.updateSize.bind(this));
    this.updateSize();
  }
  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }
  updateSize() {
    const prevWidth = this.width, prevHeight = this.height, newWidth = window.innerWidth * this.scale, newHeight = window.innerHeight * this.scale;
    if (prevWidth === newWidth && prevHeight === newHeight)
      return;
    this.width = this.canvasElement.width = newWidth;
    this.height = this.canvasElement.height = newHeight;
    this.resizeHandler(prevWidth, prevHeight, newWidth, newHeight);
  }
  clear() {
    this.renderContext.fillStyle = this.renderBaseColor;
    this.renderContext.fillRect(0, 0, this.width, this.height);
  }
}
const Sprite = fluidInternal$1.defineComponentType("Sprite");
const RenderCenter = fluidInternal$1.defineComponentType("Render Center");
const Stats = fluidInternal$1.defineComponentType("Stats");
const FireControl = fluidInternal$1.defineComponentType("Fire Control");
const MovementControl = fluidInternal$1.defineComponentType("Movement Control");
const ViewportBorderWidth = fluidInternal$1.defineComponentType("Viewport Border Width");
const CameraSpeedFactor = fluidInternal$1.defineComponentType("Camera Speed Factor");
const ScreenPoint = fluidInternal$1.defineComponentType("Screen Point");
const Acceleration = fluidInternal$1.defineComponentType("Acceleration");
const Velocity = fluidInternal$1.defineComponentType("Velocity");
const TargetPosition = fluidInternal$1.defineComponentType("Target Position");
const Position = fluidInternal$1.defineComponentType("Position");
const Resolution = fluidInternal$1.defineComponentType("Resolution");
const CursorTranslate = fluidInternal$1.defineComponentType("Cursor Translate");
var FluidInternal;
(function(FluidInternal2) {
  function initialize(core2) {
    CoreRuntime.initialize(core2);
    return core2;
  }
  FluidInternal2.initialize = initialize;
  function bootstrap() {
    return FluidInternal2.initialize(FluidCore.bootstrap());
  }
  FluidInternal2.bootstrap = bootstrap;
  function core() {
    return CoreRuntime.getInstance();
  }
  FluidInternal2.core = core;
  function defineComponentType(name) {
    const componentManager = FluidInternal2.core().getComponentManager();
    const componentType = componentManager.getComponentTypeFactory().createComponentType(name);
    componentManager.getComponentTypeRegistry().addComponentType(componentType);
    return componentType;
  }
  FluidInternal2.defineComponentType = defineComponentType;
  function registerNodeSchema(nodeSchema2, name) {
    return FluidInternal2.core().getNodeManager().getNodeSchemaRegistry().addSchema(nodeSchema2, name);
  }
  FluidInternal2.registerNodeSchema = registerNodeSchema;
  function getEntityProxy(entityId) {
    return FluidInternal2.core().getEntityManager().getEntityProxy(entityId);
  }
  FluidInternal2.getEntityProxy = getEntityProxy;
  function removeEntity(entityId) {
    FluidInternal2.core().getEntityManager().removeEntity(entityId);
    FluidInternal2.core().getComponentManager().getComponentRepository().removeEntityComponents(entityId);
  }
  FluidInternal2.removeEntity = removeEntity;
  function addEntityComponent(entityId, component) {
    FluidInternal2.core().getComponentManager().getComponentRepository().addComponent(component, entityId);
  }
  FluidInternal2.addEntityComponent = addEntityComponent;
  function addEntityComponents(entityId, ...components) {
    const componentRepo = FluidInternal2.core().getComponentManager().getComponentRepository();
    for (const component of components) {
      componentRepo.addComponent(component, entityId);
    }
  }
  FluidInternal2.addEntityComponents = addEntityComponents;
  function createEntityWithComponents(...components) {
    const entityId = FluidInternal2.core().getEntityManager().createEntity();
    FluidInternal2.addEntityComponents(entityId, ...components);
    return entityId;
  }
  FluidInternal2.createEntityWithComponents = createEntityWithComponents;
  function getEntityComponent(entityId, componentType) {
    return FluidInternal2.core().getComponentManager().getComponentRepository().getComponent(componentType, entityId);
  }
  FluidInternal2.getEntityComponent = getEntityComponent;
  function removeEntityComponent(entityId, componentType) {
    FluidInternal2.core().getComponentManager().getComponentRepository().removeComponent(componentType, entityId);
  }
  FluidInternal2.removeEntityComponent = removeEntityComponent;
  function entityHasComponent(entityId, componentType) {
    return FluidInternal2.core().getComponentManager().getComponentRepository().hasComponent(componentType, entityId);
  }
  FluidInternal2.entityHasComponent = entityHasComponent;
})(FluidInternal || (FluidInternal = {}));
const fluidInternal = FluidInternal;
const schema$m = {
  position: Position,
  screenPoint: ScreenPoint,
  cursorTranslate: CursorTranslate
};
const nodeMeta$m = fluidInternal.registerNodeSchema(schema$m, "Cursor Update");
class CursorSystem extends FluidSystem {
  constructor(engineInstance) {
    super("Cursor System", nodeMeta$m);
    this.engineInstance = engineInstance;
  }
  updateNode(node) {
    node.position.position = Vector2.add(
      node.cursorTranslate.cursorTranslate,
      Vector2.scale(node.screenPoint.point, 1 / this.engineInstance.PIXELS_PER_METER)
    );
  }
}
const ProjectileSource = fluidInternal$1.defineComponentType("Projectile Source");
const schema$l = {
  position: Position,
  velocity: Velocity,
  projectileSource: ProjectileSource,
  fireControl: FireControl
};
const nodeMeta$l = fluidInternal.registerNodeSchema(schema$l, "Firing");
class FiringSystem extends FluidSystem {
  constructor(engineInstance, spawnProjectile2) {
    super("Firing System", nodeMeta$l);
    this.engineInstance = engineInstance;
    this.spawnProjectile = spawnProjectile2;
  }
  updateNode(node) {
    const GAME_TIME = this.engineInstance.getGameTime();
    const {
      fireControl,
      projectileSource,
      position: sourcePositionComponent,
      velocity: sourceVelocityComponent
    } = node;
    const {
      position: sourcePositionVector,
      rotation: sourceRotation
    } = sourcePositionComponent;
    const {
      velocity: sourceVelocity,
      angular: sourceAngularVelocity
    } = sourceVelocityComponent;
    const {
      muzzleSpeed,
      projectileWidth,
      projectileType,
      fireRate,
      transform: sourceTransform
    } = projectileSource;
    if (!fireControl.fireIntent)
      return;
    if (GAME_TIME - projectileSource.lastFireTime < 1 / fireRate)
      return;
    let projectileRotation = sourceRotation;
    if (sourceTransform?.rotate !== void 0)
      projectileRotation += sourceTransform.rotate;
    const projectileDirectionX = Math.cos(projectileRotation);
    const projectileDirectionY = Math.sin(projectileRotation);
    const projectileInitialStep = sourceTransform?.scale || 0;
    const projectileMuzzleOffsetX = projectileDirectionX * projectileInitialStep;
    const projectileMuzzleOffsetY = projectileDirectionY * projectileInitialStep;
    let projectilePositionX = sourcePositionVector.x;
    let projectilePositionY = sourcePositionVector.y;
    const sourceTranslate = sourceTransform?.translate;
    if (sourceTranslate) {
      projectilePositionX += sourceTranslate.x;
      projectilePositionY += sourceTranslate.y;
    }
    const projectilePosition = {
      x: projectilePositionX + projectileMuzzleOffsetX,
      y: projectilePositionY + projectileMuzzleOffsetY
    };
    const muzzleTangentVectorX = -projectileMuzzleOffsetY;
    const muzzleTangentVectorY = projectileMuzzleOffsetX;
    const tangentialVelocityX = sourceAngularVelocity * muzzleTangentVectorX;
    const tangentialVelocityY = sourceAngularVelocity * muzzleTangentVectorY;
    const projectileVelocity = {
      x: sourceVelocity.x + tangentialVelocityX + projectileDirectionX * muzzleSpeed,
      y: sourceVelocity.y + tangentialVelocityY + projectileDirectionY * muzzleSpeed
    };
    const spID = this.spawnProjectile({
      position: projectilePosition,
      velocity: projectileVelocity,
      rotation: sourceRotation,
      angularVelocity: 0,
      type: projectileType,
      width: projectileWidth,
      spawnTime: GAME_TIME,
      generation: 1
    });
    if (!spID)
      console.warn("Failed to spawn projectile!");
    projectileSource.lastFireTime = GAME_TIME;
  }
}
const schema$k = {
  position: Position,
  velocity: Velocity,
  acceleration: Acceleration
};
const nodeMeta$k = fluidInternal$1.registerNodeSchema(schema$k, "Kinematic");
class KinematicSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Kinematic System", nodeMeta$k);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const DELTA_TIME = this.clientContext.engineInstance.getDeltaTime();
    const { velocity: velocityComp, acceleration: accelerationComp } = node;
    const a = accelerationComp.acceleration, v = velocityComp.velocity;
    v.x += a.x * DELTA_TIME;
    v.y += a.y * DELTA_TIME;
    velocityComp.angular += accelerationComp.angular * DELTA_TIME;
  }
}
const Thruster = fluidInternal$1.defineComponentType("Thruster");
const Physics = fluidInternal$1.defineComponentType("Physics");
const round$1 = round$2;
function clamp(value, min, max) {
  if (value < min)
    return min;
  if (value > max)
    return max;
  return value;
}
function computeAcceleration(inputMultiplier, speed, maxAcceleration, maxSpeed, accelerationCurveControlFactor) {
  if (inputMultiplier === 0) return 0;
  inputMultiplier = clamp(inputMultiplier, -1, 1);
  maxSpeed = Math.abs(inputMultiplier) * maxSpeed;
  speed = clamp(speed, -maxSpeed, maxSpeed);
  accelerationCurveControlFactor = clamp(accelerationCurveControlFactor, -0.9, 10);
  const targetSpeed = inputMultiplier * maxSpeed;
  const speedDelta = targetSpeed - speed;
  const normalizedDelta = speedDelta / (2 * maxSpeed);
  const accelLin = normalizedDelta * maxAcceleration;
  const curveControlBase = round$1(Math.abs(speedDelta) == 0 ? 1 : Math.abs(normalizedDelta), 1);
  const accel = curveControlBase ** accelerationCurveControlFactor * accelLin;
  return clamp(accel, -maxAcceleration, maxAcceleration);
}
const schema$j = {
  position: Position,
  velocity: Velocity,
  acceleration: Acceleration,
  thruster: Thruster,
  physics: Physics,
  movementControl: MovementControl
};
const nodeMeta$j = fluidInternal$1.registerNodeSchema(schema$j, "Movement Control");
const DefaultMovementControlParameters = {
  maxSpeed: 3 * Math.E,
  maxAngularSpeed: Math.PI,
  axialThrusterPowerCoefficient: 1,
  lateralThrusterPowerCoefficient: 0.8,
  angularThrusterPowerCoefficient: 0.85,
  axialStabilizationFactor: 0.25,
  lateralStabilizationFactor: 0.8,
  angularStabilizationFactor: 0.75,
  axialAccelerationCurveControlFactor: -0.6,
  angularAccelerationCurveControlFactor: -0.6
};
const inputComponentMultiplierLookup = [
  // x = -1
  [
    // -1, -1
    Math.SQRT1_2,
    // -1, 0
    1,
    // -1, 1
    Math.SQRT1_2
  ],
  // x = 0
  [
    // 0, -1
    1,
    // 0, 0
    0,
    // 0, 1
    1
  ],
  // x = 1
  [
    // 1, -1
    Math.SQRT1_2,
    // 1, 0
    1,
    // 1, 1
    Math.SQRT1_2
  ]
];
function applyLinearTransformationMatrixToVector(matrix_i_x, matrix_i_y, matrix_j_x, matrix_j_y, vector_x, vector_y, out = { x: 0, y: 0 }, { decimalPlaces = 5 } = {}) {
  out.x = round$1(vector_x * matrix_i_x + vector_y * matrix_j_x, decimalPlaces);
  out.y = round$1(vector_x * matrix_i_y + vector_y * matrix_j_y, decimalPlaces);
  return out;
}
function transformRealLocalVectorToWorldSpace(vector_x, vector_y, sin, cos, out) {
  return applyLinearTransformationMatrixToVector(
    -sin,
    cos,
    cos,
    sin,
    vector_x,
    vector_y,
    out
  );
}
class MovementControlSystem extends FluidSystem {
  constructor(getDeltaTime, motionParameters = DefaultMovementControlParameters) {
    super("Movement Control System", nodeMeta$j);
    this.getDeltaTime = getDeltaTime;
    this.motionParameters = motionParameters;
  }
  updateNode(node) {
    const {
      maxSpeed,
      maxAngularSpeed,
      axialThrusterPowerCoefficient,
      lateralThrusterPowerCoefficient,
      angularThrusterPowerCoefficient,
      axialStabilizationFactor,
      lateralStabilizationFactor,
      angularStabilizationFactor,
      axialAccelerationCurveControlFactor,
      angularAccelerationCurveControlFactor
    } = this.motionParameters;
    const {
      velocity: velocityComponent,
      acceleration: accelerationComponent,
      movementControl: controlInput,
      physics,
      thruster
    } = node;
    const velocity = velocityComponent.velocity;
    const acceleration = accelerationComponent.acceleration;
    const accelerationInputFlag = controlInput.accelerationInput.x || controlInput.accelerationInput.y ? 1 : 0;
    const angularSpeed = velocityComponent.angular;
    const yawInputFlag = controlInput.yawInput;
    const inputComponentScale = inputComponentMultiplierLookup[controlInput.accelerationInput.x + 1][controlInput.accelerationInput.y + 1];
    const thrusterMaxAcceleration = thruster.maxForce / physics.mass;
    const rotation = node.position.rotation;
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    accelerationComponent.angular = 0;
    acceleration.x = 0;
    acceleration.y = 0;
    const angularSpeedPercentage = angularSpeed / maxAngularSpeed;
    const yawControl = yawInputFlag || -angularSpeedPercentage;
    const angularAccelerationCoefficient = yawInputFlag ? 1 : Math.abs(angularSpeedPercentage) * angularStabilizationFactor;
    const angularAccelerationMagnitude = round$1(
      computeAcceleration(
        yawControl,
        angularSpeed,
        thrusterMaxAcceleration * angularThrusterPowerCoefficient,
        maxAngularSpeed,
        angularAccelerationCurveControlFactor
      ),
      3
    );
    accelerationComponent.angular = angularAccelerationMagnitude * angularAccelerationCoefficient;
    const speed = Math.hypot(velocity.x, velocity.y);
    let accelerationControl = 0;
    let accelerationDirectionX = 0;
    let accelerationDirectionY = 0;
    let axialAccelerationCoefficient = 0;
    let lateralAccelerationCoefficient = 0;
    if (speed && !accelerationInputFlag) {
      let speedPercentage = speed / maxSpeed;
      accelerationControl = -speedPercentage;
      accelerationDirectionX = velocity.x / speed;
      accelerationDirectionY = velocity.y / speed;
      axialAccelerationCoefficient = speedPercentage * axialStabilizationFactor;
      lateralAccelerationCoefficient = speedPercentage * lateralStabilizationFactor;
    }
    if (accelerationInputFlag) {
      transformRealLocalVectorToWorldSpace(
        controlInput.accelerationInput.x * inputComponentScale,
        controlInput.accelerationInput.y * inputComponentScale,
        sin,
        cos,
        controlInput.accelerationInput
      );
      accelerationControl = accelerationInputFlag;
      accelerationDirectionX = controlInput.accelerationInput.x;
      accelerationDirectionY = controlInput.accelerationInput.y;
      axialAccelerationCoefficient = 1;
      lateralAccelerationCoefficient = 1;
    }
    if (speed || accelerationInputFlag) {
      const speedAlongAccelerationDirection = velocity.x * accelerationDirectionX + velocity.y * accelerationDirectionY;
      const accelerationMagnitude = round$1(
        computeAcceleration(
          accelerationControl,
          speedAlongAccelerationDirection,
          thrusterMaxAcceleration,
          maxSpeed,
          axialAccelerationCurveControlFactor
        ),
        3
      );
      const accelerationX = accelerationMagnitude * accelerationDirectionX;
      const accelerationY = accelerationMagnitude * accelerationDirectionY;
      const axialAcceleration = axialAccelerationCoefficient * axialThrusterPowerCoefficient * (accelerationX * cos + accelerationY * sin);
      const axialAccelerationX = axialAcceleration * cos;
      const axialAccelerationY = axialAcceleration * sin;
      const lateralAcceleration = lateralAccelerationCoefficient * lateralThrusterPowerCoefficient * (accelerationX * -sin + accelerationY * cos);
      const lateralAccelerationX = lateralAcceleration * -sin;
      const lateralAccelerationY = lateralAcceleration * cos;
      acceleration.x = round$1(axialAccelerationX + lateralAccelerationX, 3);
      acceleration.y = round$1(axialAccelerationY + lateralAccelerationY, 3);
    }
    controlInput.yawInput = 0;
    controlInput.accelerationInput.x = 0;
    controlInput.accelerationInput.y = 0;
  }
}
const PI$2 = Math.PI, PI2$1 = 2 * PI$2;
const schema$i = {
  position: Position,
  velocity: Velocity
};
const nodeMeta$i = fluidInternal$1.registerNodeSchema(schema$i, "Position");
class PositionSystem extends FluidSystem {
  constructor(engineInstance) {
    super("Position System", nodeMeta$i);
    this.engineInstance = engineInstance;
  }
  updateNode(node) {
    const DELTA_TIME = this.engineInstance.deltaTime;
    const { position: posComp, velocity: velComp } = node;
    const { position: pos } = posComp;
    const { velocity: vel, angular: angVel } = velComp;
    let rot = posComp.rotation;
    pos.x += vel.x * DELTA_TIME;
    pos.y += vel.y * DELTA_TIME;
    rot += angVel * DELTA_TIME;
    if (rot >= PI$2)
      rot -= PI2$1;
    if (rot < -PI$2)
      rot += PI2$1;
    posComp.rotation = rot;
  }
}
const BoundingBox = fluidInternal$1.defineComponentType("BoundingBox");
function createBoundingBox(size, { center = Vector2.zero(), rotation = 0, transform = createTransform(), aabb = void 0, obb = void 0 } = {}) {
  return { center, rotation, size, transform, obb, aabb };
}
const ChunkOccupancy = fluidInternal$1.defineComponentType("Chunk Occupancy");
const Collision = fluidInternal$1.defineComponentType("Collision");
const schema$h = {
  boundingBox: BoundingBox,
  chunks: ChunkOccupancy
};
const nodeMeta$h = fluidInternal.registerNodeSchema(schema$h, "Collision Detection");
class CollisionDetectionSystem extends FluidSystem {
  constructor(engineInstance) {
    super("Collision Detection System", nodeMeta$h);
    this.engineInstance = engineInstance;
  }
  *clearCollisionComponent(nodes) {
    for (const node of nodes) {
      const entityId = node.entityId;
      if (fluidInternal.entityHasComponent(entityId, Collision))
        fluidInternal.removeEntityComponent(entityId, Collision);
      yield node;
    }
  }
  getEntitiesPerChunk(nodes) {
    const chunkMap = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      if (!node.boundingBox.aabb)
        continue;
      const entityChunks = node.chunks.chunkKeys;
      const entitySymbol = node.entityId.getSymbol();
      for (const chunk of entityChunks) {
        let entityMap = chunkMap.get(chunk);
        if (!entityMap) {
          entityMap = /* @__PURE__ */ new Map();
          chunkMap.set(chunk, entityMap);
        }
        if (!entityMap.has(entitySymbol))
          entityMap.set(entitySymbol, node);
      }
    }
    return chunkMap.values().map((entityMap) => Array.from(entityMap.values()));
  }
  *sortAndSweep(groups) {
    for (const group of groups) {
      if (group.length <= 1)
        continue;
      group.sort(
        (nodeA, nodeB) => nodeA.boundingBox.aabb.minX - nodeB.boundingBox.aabb.minX
      );
      const groupSize = group.length;
      for (let i = 0; i < groupSize; i++) {
        const nodeA = group[i];
        const boundingBoxA = nodeA.boundingBox;
        for (let j = i + 1; j < groupSize; j++) {
          const nodeB = group[j];
          const boundingBoxB = nodeB.boundingBox;
          if (boundingBoxB.aabb.minX > boundingBoxA.aabb.maxX) break;
          yield [nodeA, nodeB];
        }
      }
    }
  }
  *checkCollision(candidatePairs) {
    for (const candidatePair of candidatePairs) {
      const nodeA = candidatePair[0];
      const nodeB = candidatePair[1];
      const boundingBoxA = nodeA.boundingBox;
      const boundingBoxB = nodeB.boundingBox;
      if (!aabbsIntersect(boundingBoxA.aabb, boundingBoxB.aabb))
        continue;
      if (!isSeparatingAxisExistent(boundingBoxA.obb.corners, boundingBoxB.obb.corners))
        yield [nodeA, nodeB];
    }
  }
  onCollide(nodeA, nodeB) {
    const eA = nodeA.entityId, eB = nodeB.entityId;
    const proxyA = fluidInternal.getEntityProxy(eA);
    const proxyB = fluidInternal.getEntityProxy(eB);
    if (!proxyA.hasComponent(Collision))
      proxyA.addComponent(Collision.createComponent({ collidedEntity: eB }));
    if (!proxyB.hasComponent(Collision))
      proxyB.addComponent(Collision.createComponent({ collidedEntity: eA }));
  }
  updateNodes(nodes) {
    const entityGroups = this.getEntitiesPerChunk(this.clearCollisionComponent(nodes));
    const candidates = this.sortAndSweep(entityGroups);
    const collided = this.checkCollision(candidates);
    for (const pair of collided) {
      this.onCollide(pair[0], pair[1]);
    }
  }
}
const Viewport = fluidInternal$1.defineComponentType("Viewport");
const shortestAngleDiff = shortestAngleDiff$1;
const schema$g = {
  position: Position,
  resolution: Resolution,
  targetPosition: TargetPosition,
  speedFactor: CameraSpeedFactor,
  viewport: Viewport
};
const nodeMeta$g = fluidInternal$1.registerNodeSchema(schema$g, "Viewport");
class ViewportSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Viewport System", nodeMeta$g);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const eng = this.clientContext.engineInstance;
    const DELTA_TIME = eng.getDeltaTime();
    const PPM = eng.PIXELS_PER_METER;
    const { position: positionComp, targetPosition: targetPositionComp, speedFactor: speedFactorComp, resolution: resolutionComp } = node;
    const { position: pos, rotation: rot } = positionComp;
    const { position: tPos, rotation: tRot } = targetPositionComp.position;
    const vpRes = resolutionComp.resolution;
    const step = speedFactorComp.speedFactor * DELTA_TIME;
    const centerPos = Vector2.add(pos, { x: vpRes.x / (2 * PPM), y: vpRes.y / (2 * PPM) });
    const diff = Vector2.subtract(tPos, centerPos);
    const dist = Vector2.abs(diff);
    const moveDir = Vector2.normalize(diff);
    if (dist.x > 0 || dist.y > 0) {
      const moveVec = Vector2.multiply(moveDir, dist);
      const stepVec = Vector2.scale(moveVec, step);
      positionComp.position = Vector2.add(pos, stepVec);
    }
    if (rot != tRot) {
      const angleDiff = shortestAngleDiff(rot, tRot);
      positionComp.rotation = rot + angleDiff * step;
    }
  }
}
const Projectile = fluidInternal$1.defineComponentType("Projectile");
const schema$f = {
  projectile: Projectile,
  position: Position
};
const nodeMeta$f = fluidInternal$1.registerNodeSchema(schema$f, "Projectile");
class ProjectileSystem extends FluidSystem {
  constructor(engineInstance) {
    super("Projectile System", nodeMeta$f);
    this.engineInstance = engineInstance;
  }
  updateNode(node) {
    const eng = this.engineInstance;
    const GAME_TIME = eng.getGameTime();
    if (GAME_TIME >= node.projectile.deathTime) {
      fluidInternal$1.removeEntity(node.entityId);
    }
  }
}
const fcos = Math.cos, fsin = Math.sin, abs = Math.abs;
const schema$e = {
  position: Position,
  boundingBox: BoundingBox
};
const nodeMeta$e = fluidInternal$1.registerNodeSchema(schema$e, "Bounding Box Update");
class BoundingBoxUpdateSystem extends FluidSystem {
  constructor() {
    super("Bounding Box Update System", nodeMeta$e);
  }
  updateNode(node) {
    const { position: posComp, boundingBox: bb } = node;
    const { center } = bb;
    const eP = posComp.position;
    const size = bb.size;
    bb.rotation = posComp.rotation;
    center.x = eP.x;
    center.y = eP.y;
    const transform = bb.transform;
    if (transform) {
      const { scale, rotate, translate } = transform;
      if (scale) {
        size.width *= scale;
        size.height *= scale;
        transform.scale = void 0;
      }
      if (rotate) {
        bb.rotation += rotate;
      }
      if (translate) {
        center.x += translate.x;
        center.y += translate.y;
      }
    }
    const { x: cx, y: cy } = center;
    const rot = bb.rotation;
    const cos = fcos(rot), sin = fsin(rot);
    const hw = size.width / 2, hh = size.height / 2;
    const dX = abs(hw * cos) + abs(hh * sin);
    const dY = abs(hw * sin) + abs(hh * cos);
    const aabb = bb.aabb || {};
    aabb.minX = cx - dX;
    aabb.maxX = cx + dX;
    aabb.maxY = cy + dY;
    aabb.minY = cy - dY;
    bb.aabb = aabb;
    const axisX = { x: cos, y: sin };
    const axisY = { x: -sin, y: cos };
    const obb = bb.obb || createOBB();
    obb.halfExtents.x = hw;
    obb.halfExtents.y = hh;
    obb.axes.x = axisX;
    obb.axes.y = axisY;
    const dx = [hw, hw, -hw, -hw];
    const dy = [hh, -hh, -hh, hh];
    for (let i = 0; i < 4; i++) {
      const offsetX = dx[i] * axisX.x + dy[i] * axisY.x;
      const offsetY = dx[i] * axisX.y + dy[i] * axisY.y;
      obb.corners[i].x = cx + offsetX;
      obb.corners[i].y = cy + offsetY;
    }
    bb.obb = obb;
  }
}
const schema$d = {
  renderCenter: RenderCenter,
  position: Position
};
const nodeMeta$d = fluidInternal$1.registerNodeSchema(schema$d, "Chunk Loading");
class ChunkLoadingSystem extends FluidSystem {
  constructor(engineInstance, worldContext2) {
    super("Chunk Loading System", nodeMeta$d);
    this.engineInstance = engineInstance;
    this.worldContext = worldContext2;
  }
  updateNode(node) {
    const worldContext2 = this.worldContext;
    const chunkSize = worldContext2.chunkSize;
    const gameTime = this.engineInstance.getGameTime();
    const renderCenterPos = node.position.position, renderDistance2 = node.renderCenter.renderDistance;
    const [ci, cj] = getChunkIndexFromPosition(renderCenterPos, chunkSize);
    const renderDistanceInChunks = Math.ceil(renderDistance2 / chunkSize);
    for (let i = -renderDistanceInChunks; i <= renderDistanceInChunks; i++)
      for (let j = -renderDistanceInChunks; j <= renderDistanceInChunks; j++) {
        const idxX = ci + i, idxY = cj + j;
        const chunkKey = getChunkKeyFromIndex(idxX, idxY);
        let chunk = worldContext2.getChunk(chunkKey);
        if (!chunk || chunk.state == ChunkState.Unloaded) {
          try {
            chunk = worldContext2.loadChunk(chunkKey);
          } catch (error) {
            console.error(`Failed to load chunk (chunk: ${chunkKey})`, error);
            continue;
          }
        }
        chunk.lastAccessed = gameTime;
      }
  }
}
const Chunk = fluidInternal$1.defineComponentType("Chunk");
const schema$c = {
  chunk: Chunk
};
const nodeMeta$c = fluidInternal$1.registerNodeSchema(schema$c, "Chunk Unloading");
class ChunkUnloadingSystem extends FluidSystem {
  constructor(engineInstance, worldContext2) {
    super("Chunk Unloading System", nodeMeta$c);
    this.engineInstance = engineInstance;
    this.worldContext = worldContext2;
  }
  updateNode(node) {
    const worldContext2 = this.worldContext;
    const { chunkTimeout } = this.worldContext;
    const gameTime = this.engineInstance.getGameTime();
    const chunk = node.chunk.chunk;
    if (chunk.state == ChunkState.Loaded && gameTime - chunk.lastAccessed >= chunkTimeout)
      try {
        worldContext2.unloadChunk(chunk.key);
      } catch (error) {
        console.error(`Failed to unload chunk#${chunk.key}}:`, error);
      }
  }
}
const conservativeOBBRasterization = conservativeOBBRasterization$1;
const schema$b = {
  boundingBox: BoundingBox,
  chunks: ChunkOccupancy
};
const nodeMeta$b = fluidInternal$1.registerNodeSchema(schema$b, "Chunk Occupancy Update");
class ChunkOccupancyUpdateSystem extends FluidSystem {
  constructor(engineInstance, worldContext2) {
    super("Chunk Occupancy Update System", nodeMeta$b);
    this.engineInstance = engineInstance;
    this.worldContext = worldContext2;
  }
  updateNode(node) {
    const { boundingBox: bb, chunks: entityChunksComp, entityId } = node;
    const entityChunkKeys = entityChunksComp.chunkKeys;
    const { aabb, obb, size, center } = bb;
    const { width: width2, height: height2 } = size;
    const wc = this.worldContext;
    const chunkSize = wc.chunkSize;
    if (!obb && !aabb) return;
    let currentChunkKeys = /* @__PURE__ */ new Set();
    if (obb) {
      conservativeOBBRasterization(
        width2,
        height2,
        chunkSize,
        1.15,
        1.15,
        obb.axes,
        center,
        3,
        (i, j) => {
          currentChunkKeys.add(getChunkKeyFromIndex(i, j));
        }
      );
    } else if (aabb) {
      const { minX: left, maxX: right, minY: bottom, maxY: top } = aabb;
      const corners = [
        { x: left, y: bottom },
        { x: right, y: bottom },
        { x: right, y: top },
        { x: left, y: top }
      ];
      for (const v of corners) {
        const [i, j] = getChunkIndexFromPosition(v, chunkSize);
        currentChunkKeys.add(getChunkKeyFromIndex(i, j));
      }
    }
    if (currentChunkKeys.size == 0) return;
    if (entityChunkKeys.size === currentChunkKeys.size && [...entityChunkKeys].every((k) => currentChunkKeys.has(k)))
      return;
    const toAdd = /* @__PURE__ */ new Set();
    const toRemove = /* @__PURE__ */ new Set();
    let unloadEntity = true;
    for (const chunkKey of currentChunkKeys) {
      if (wc.getChunk(chunkKey)?.state === ChunkState.Loaded)
        unloadEntity = false;
      if (!entityChunkKeys.has(chunkKey)) {
        toAdd.add(chunkKey);
      }
    }
    for (const chunkKey of entityChunkKeys) {
      if (!currentChunkKeys.has(chunkKey)) {
        toRemove.add(chunkKey);
      }
    }
    entityChunksComp.chunkKeys = currentChunkKeys;
    for (const chunkKey of toAdd) {
      wc.getChunk(chunkKey)?.entitySymbolSet.add(entityId.getSymbol());
    }
    for (const chunkKey of toRemove) {
      wc.getChunk(chunkKey)?.entitySymbolSet.delete(entityId.getSymbol());
    }
    if (unloadEntity) {
      for (const chunkKey of currentChunkKeys)
        wc.unloadEntity(entityId, chunkKey);
    }
  }
}
const hPI$1 = Math.PI / 2;
const schema$a = {
  position: Position,
  resolution: Resolution,
  viewport: Viewport
};
const nodeMeta$a = fluidInternal$1.registerNodeSchema(schema$a, "World Pre Render");
class WorldPreRenderSystem extends FluidSystem {
  constructor(clientContext2) {
    super("World Pre Render System", nodeMeta$a);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const renderer2 = this.clientContext.renderer;
    const ctx = renderer2.renderContext;
    const PPM = this.clientContext.engineInstance.PIXELS_PER_METER;
    const { position: vpPosComp, resolution: resolutionComponent } = node;
    const vpPos = vpPosComp.position;
    const resolution = resolutionComponent.resolution;
    const hW = resolution.x / (2 * PPM), hH = resolution.y / (2 * PPM);
    renderer2.clear();
    ctx.save();
    ctx.scale(PPM, PPM);
    ctx.translate(hW, hH);
    ctx.rotate(-vpPosComp.rotation - hPI$1);
    ctx.translate(-hW - vpPos.x, -hH - vpPos.y);
  }
}
const schema$9 = {
  resolution: Resolution,
  borderWidth: ViewportBorderWidth,
  viewport: Viewport
};
const nodeMeta$9 = fluidInternal$1.registerNodeSchema(schema$9, "Viewport Render");
class ViewportRenderSystem extends FluidSystem {
  constructor(renderContext2) {
    super("Viewport Render System", nodeMeta$9);
    this.renderContext = renderContext2;
  }
  updateNode(node) {
    const ctx = this.renderContext;
    let borderWidth = node.borderWidth.borderWidth;
    let vWidth = node.resolution.resolution.x, vHeight = node.resolution.resolution.y;
    let darkShade = "rgba(0,0,0,1)", transparentShade = "rgba(0,0,0,0)";
    let wCS1 = borderWidth / vWidth;
    let grad = ctx.createLinearGradient(0, 0, vWidth, 0);
    grad.addColorStop(0, darkShade);
    grad.addColorStop(wCS1, transparentShade);
    grad.addColorStop(1 - wCS1, transparentShade);
    grad.addColorStop(1, darkShade);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vWidth, vHeight);
    let hCS1 = borderWidth / vHeight;
    grad = ctx.createLinearGradient(0, 0, 0, vHeight);
    grad.addColorStop(0, darkShade);
    grad.addColorStop(hCS1, transparentShade);
    grad.addColorStop(1 - hCS1, transparentShade);
    grad.addColorStop(1, darkShade);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vWidth, vHeight);
  }
}
const round = round$2;
function drawComplexText(renderContext2, x, y, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
  const TEXT_METRICS = renderContext2.measureText("A");
  const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;
  let xOrig = x;
  for (const piece of content) {
    let text = piece[0];
    let color2 = piece.length > 1 ? piece[1] : renderContext2.fillStyle;
    renderContext2.fillStyle = color2;
    if (text.includes("\n")) {
      for (const line of text.split("\n")) {
        renderContext2.fillText(line, x, y);
        y += FONT_HEIGHT + lineSpacing;
        x = xOrig;
      }
    } else {
      renderContext2.fillText(text, x, y);
      x += renderContext2.measureText(text).width;
    }
  }
  return y;
}
const schema$8 = {
  position: Position,
  velocity: Velocity,
  acceleration: Acceleration,
  stats: Stats
};
const nodeMeta$8 = fluidInternal$1.registerNodeSchema(schema$8, "Debug Info Display");
class DebugInfoDisplaySystem extends FluidSystem {
  constructor(clientContext2) {
    super("Debug Info Display System", nodeMeta$8);
    this.clientContext = clientContext2;
  }
  stats = {
    isAnimating: (node) => this.clientContext.engineInstance.getAnimationState(),
    fps: (node) => round(this.clientContext.engineInstance.getFPS()),
    position: (node) => {
      const pC = node.position;
      const { position: p, rotation: r } = pC;
      return `([${round(p.x)}, ${round(p.y)}] m) (${round(r)} rad)`;
    },
    velocity: (node) => {
      const vC = node.velocity;
      const { velocity: v, angular: a } = vC;
      return `(${round(Vector2.magnitude(v))} m/s) (${round(a)} rad/s) ([${round(v.x)}, ${round(v.y)}] m/s)`;
    },
    acceleration: (node) => {
      const aC = node.acceleration;
      const { acceleration: accel, angular: angl } = aC;
      return `(${round(Vector2.magnitude(accel))} m/s^2) (${round(angl)} rad/s^2) ([${round(accel.x)}, ${round(accel.y)}] m/s^2)`;
    },
    zoom: () => {
      return `%${round(this.clientContext.getZoomLevel())}`;
    },
    time: () => {
      return `x${round(this.clientContext.getSimulationSpeed(), 5)}`;
    }
  };
  static formatStats(key, value) {
    return [`${key}: ${typeof value === "number" ? round(value) : value}
`, "white"];
  }
  updateNode(node) {
    const cc = this.clientContext, stats = this.stats;
    if (!cc.displayDebugInfo)
      return;
    drawComplexText(
      cc.renderer.renderContext,
      10,
      10,
      Object.keys(stats).map(
        (key) => DebugInfoDisplaySystem.formatStats(key, stats[key](node))
      ),
      2
    );
  }
}
const schema$7 = {
  position: Position,
  spriteTexture: Sprite
};
const nodeMeta$7 = fluidInternal$1.registerNodeSchema(schema$7, "Sprite Render");
class SpriteRenderSystem extends FluidSystem {
  constructor(canvasRenderer) {
    super("Sprite Render System", nodeMeta$7);
    this.canvasRenderer = canvasRenderer;
  }
  updateNodes(nodes) {
    const sortedNodes = Array.from(nodes).sort(
      (a, b) => a.spriteTexture.zIndex - b.spriteTexture.zIndex
    );
    for (const { position, spriteTexture: sprite } of sortedNodes) {
      this.renderSprite(
        sprite,
        position.position.x,
        position.position.y,
        position.rotation
      );
    }
  }
  renderSprite(sprite, x, y, rotation) {
    const ctx = this.canvasRenderer.renderContext;
    const { renderSize: { x: width2, y: height2 }, transform, image } = sprite;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (transform) {
      if (transform.rotate) ctx.rotate(transform.rotate);
      if (transform.translate) ctx.translate(transform.translate.x, transform.translate.y);
      if (transform.scale) ctx.scale(transform.scale, transform.scale);
    }
    ctx.scale(width2 / image.width, height2 / image.height);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  }
}
const PI$1 = Math.PI;
const nodeSchema = {
  boundingBox: BoundingBox
};
const nodeMeta$6 = fluidInternal$1.registerNodeSchema(nodeSchema, "Bounding Box Render");
class BoundingBoxRenderSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Bounding Box Render System", nodeMeta$6);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const client = this.clientContext;
    const PPM = client.engineInstance.PIXELS_PER_METER;
    if (!client.displayBoundingBoxes)
      return;
    const { boundingBox: bb } = node;
    const { width: width2, height: height2 } = bb.size;
    const ctx = this.clientContext.renderer.renderContext;
    ctx.save();
    ctx.lineWidth = 1 / PPM;
    ctx.strokeStyle = "white";
    const aabb = bb.aabb;
    if (aabb) {
      const { maxY, minY, minX, maxX } = aabb;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
    const obb = bb.obb;
    if (obb && obb.corners) {
      const corners = obb.corners;
      ctx.beginPath();
      let corner = corners[0];
      ctx.moveTo(corner.x, corner.y);
      for (let i = 1; i < 4; i++) {
        corner = corners[i];
        ctx.lineTo(corner.x, corner.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = "white";
    ctx.beginPath();
    const centerPointWidth = Math.min(width2, height2) / 20;
    const hcpw = centerPointWidth / 2;
    const ctr = bb.center;
    ctx.arc(ctr.x, ctr.y, hcpw, 0, 2 * PI$1);
    ctx.fill();
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bb.aabb.maxX, ctr.y, hcpw, 0, 2 * PI$1);
    ctx.fill();
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(ctr.x, bb.aabb.maxY, hcpw, 0, 2 * PI$1);
    ctx.fill();
    ctx.restore();
  }
}
const PI = Math.PI, PI2 = 2 * PI;
const backgroundOverlayRenderColor = "black";
const backgroundOverlayAlpha = 0.7;
const alignedAxisScaleFactor = 1.5;
const alignedAxisThicknessFactor = 2;
const alignedAxisRenderColor = "white";
const orientedAxisScaleFactor = 1.2;
const orientedAxisThicknessFactor = 1.25;
const orientedAxisRenderColor = "red";
const rotationAngleArcRadiusFactor = 0.25;
const rotationAngleArcColor = "yellow";
const nodeMeta$5 = fluidInternal$1.registerNodeSchema(
  {
    position: Position,
    boundingBox: BoundingBox
  },
  "Axis Render"
);
class AxisRenderSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Axis Render System", nodeMeta$5);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    if (!this.clientContext.displayEntityAxes)
      return;
    const { position: ePos, rotation: eRot } = node.position;
    const { size: bbRect, transform: bbTransform } = node.boundingBox;
    const width2 = bbRect.width, height2 = bbRect.height;
    const ctx = this.clientContext.renderer.renderContext;
    const PPM = this.clientContext.engineInstance.PIXELS_PER_METER;
    let rot = eRot, rotOffset = 0;
    ctx.save();
    ctx.translate(ePos.x, ePos.y);
    if (bbTransform) {
      const bbTranslate = bbTransform.translate, bbScale = bbTransform.scale, bbRot = bbTransform.rotate;
      if (bbTranslate) ctx.translate(bbTranslate.x, bbTranslate.y);
      if (bbScale) ctx.scale(bbScale, bbScale);
      if (bbRot) {
        rotOffset = bbRot;
      }
    }
    const length = Math.max(width2, height2) / 2;
    ctx.globalAlpha = backgroundOverlayAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, length, 0, PI2);
    ctx.fillStyle = backgroundOverlayRenderColor;
    ctx.fill();
    ctx.globalAlpha = 1;
    const axisAlignedLength = alignedAxisScaleFactor * length;
    ctx.strokeStyle = alignedAxisRenderColor;
    ctx.lineWidth = alignedAxisThicknessFactor / PPM;
    ctx.beginPath();
    ctx.moveTo(-axisAlignedLength, 0);
    ctx.lineTo(axisAlignedLength, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -axisAlignedLength);
    ctx.lineTo(0, axisAlignedLength);
    ctx.stroke();
    ctx.lineWidth = orientedAxisThicknessFactor / PPM;
    ctx.strokeStyle = rotationAngleArcColor;
    ctx.beginPath();
    ctx.arc(0, 0, rotationAngleArcRadiusFactor * length, rotOffset, rot + rotOffset, rot < 0);
    ctx.stroke();
    ctx.rotate(rot);
    const orientedAxisLength = orientedAxisScaleFactor * length;
    ctx.strokeStyle = orientedAxisRenderColor;
    ctx.beginPath();
    ctx.moveTo(-orientedAxisLength, 0);
    ctx.lineTo(orientedAxisLength, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -orientedAxisLength);
    ctx.lineTo(0, orientedAxisLength);
    ctx.stroke();
    ctx.restore();
  }
}
const schema$6 = {
  chunk: Chunk
};
const meta$1 = fluidInternal$1.registerNodeSchema(schema$6, "Chunk");
const lineWidth = 1 / 1e3;
const color = "red";
class ChunkBorderRenderSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Chunk Border Render System", meta$1);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const clientContext2 = this.clientContext;
    if (!clientContext2.displayChunks)
      return;
    const ctx = this.clientContext.renderer.renderContext;
    const chunk = node.chunk.chunk;
    if (chunk.state !== ChunkState.Loaded) return;
    const { index, size } = chunk;
    const corner = getChunkCornerFromIndex(index[0], index[1], size);
    ctx.save();
    ctx.translate(corner.x, corner.y);
    ctx.lineWidth = lineWidth * 4 / 3;
    ctx.strokeStyle = "white";
    ctx.strokeRect(0, 0, size, size);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.strokeRect(0, 0, size, size);
    ctx.restore();
  }
}
const schema$5 = {
  chunks: ChunkOccupancy
};
const nodeMeta$4 = fluidInternal$1.registerNodeSchema(schema$5, "Occupied Chunk Highlighting");
const generalHighlightColor = "blue";
const renderCenterHighlightColor = "red";
const generalHighlightAlpha = 0.05;
const renderCenterHighlightAlpha = 0.35;
class OccupiedChunkHighlightingSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Occupied Chunk Highlighting System", nodeMeta$4);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const clientContext2 = this.clientContext;
    if (!clientContext2.displayChunks)
      return;
    const worldContext2 = clientContext2.worldContext, ctx = clientContext2.renderer.renderContext;
    const chunkSize = worldContext2.chunkSize;
    const proxy = fluidInternal$1.getEntityProxy(node.entityId);
    const isRenderCenter = proxy.hasComponent(RenderCenter);
    ctx.save();
    if (isRenderCenter) {
      ctx.globalAlpha = renderCenterHighlightAlpha;
      ctx.fillStyle = renderCenterHighlightColor;
    } else {
      ctx.globalAlpha = generalHighlightAlpha;
      ctx.fillStyle = generalHighlightColor;
    }
    for (let chunkKey of node.chunks.chunkKeys) {
      const index = parseChunkKey(chunkKey);
      const corner = getChunkCornerFromIndex(index[0], index[1], chunkSize);
      ctx.fillRect(corner.x, corner.y, chunkSize, chunkSize);
    }
    ctx.restore();
  }
}
class ReloadableEntityImpl {
  constructor(entityId, components = []) {
    this.entityId = entityId;
    this.components = components;
  }
  load() {
    const entityId = this.entityId;
    const core = fluidInternal$1.core();
    const entityManager = core.getEntityManager();
    const componentRepo = core.getComponentManager().getComponentRepository();
    if (entityManager.hasEntity(entityId))
      return false;
    entityManager.addEntity(entityId);
    if (this.components.length > 0) {
      for (const component of this.components) {
        componentRepo.addComponent(component, entityId);
      }
    }
    return true;
  }
  unload() {
    const entityId = this.entityId;
    const core = fluidInternal$1.core();
    if (core.getEntityManager().hasEntity(entityId)) {
      this.components = Array.from(core.getComponentManager().getComponentRepository().getEntityComponents(entityId));
      fluidInternal$1.removeEntity(entityId);
      return true;
    }
    return false;
  }
}
class SceneFacade {
  static entityMap = /* @__PURE__ */ new Map();
  static unloadEntity(entityId) {
    const entitySymbol = entityId.getSymbol();
    let rEntity = this.entityMap.get(entitySymbol);
    if (!rEntity) {
      rEntity = new ReloadableEntityImpl(entityId, []);
      this.entityMap.set(entitySymbol, rEntity);
    }
    rEntity.unload();
    return rEntity;
  }
  static loadEntity(entitySymbol) {
    const rEntity = this.entityMap.get(entitySymbol);
    return rEntity ? rEntity.load() : false;
  }
}
class WorldContext {
  // private unloadedEntitiesChunkMap = new Map<ChunkKey, Entity[]>();
  constructor(engineInstance, chunkSize, chunkTimeout, generateChunk2) {
    this.engineInstance = engineInstance;
    this.chunkSize = chunkSize;
    this.chunkTimeout = chunkTimeout;
    this.generateChunk = generateChunk2;
  }
  chunkMap = /* @__PURE__ */ new Map();
  getChunk(key) {
    return this.chunkMap.get(key);
  }
  setChunk(key, chunk) {
    this.chunkMap.set(key, chunk);
  }
  loadChunk(key) {
    let chunk = this.chunkMap.get(key);
    if (!chunk) {
      chunk = this.generateChunk(this, parseChunkKey(key), this.chunkSize);
      this.setChunk(key, chunk);
    } else {
      if (chunk.state === ChunkState.Loaded) {
        throw new Error(`Chunk is already loaded (chunk: ${key})`);
      }
      for (const entitySymbol of chunk.entitySymbolSet) {
        SceneFacade.loadEntity(entitySymbol);
      }
    }
    chunk.state = ChunkState.Loaded;
    return chunk;
  }
  unloadEntity(entityID, chunkKey) {
    SceneFacade.unloadEntity(entityID);
  }
  unloadChunk(key) {
    let chunk = this.chunkMap.get(key);
    if (!chunk) throw new Error(`Chunk is undefined (key: ${key})`);
    if (chunk.state === ChunkState.Unloaded) throw new Error(`Chunk is already unloaded (chunk: ${key})`);
    const entityResolver = fluidInternal$1.core().getEntityManager().getEntityResolver();
    for (const entitySymbol of chunk.entitySymbolSet) {
      const entityId = entityResolver.getEntityBySymbol(entitySymbol);
      if (entityId)
        SceneFacade.unloadEntity(entityId);
    }
    chunk.state = ChunkState.Unloaded;
    return true;
  }
  getAllChunks() {
    return Array.from(this.chunkMap.values());
  }
}
const Health = fluidInternal$1.defineComponentType("Health");
const schema$4 = {
  position: Position,
  health: Health
};
const meta = fluidInternal$1.registerNodeSchema(schema$4, "Health Render");
const width = 0.2;
const height = 0.01;
const outlineThickness = 5e-3;
const owidth = width + outlineThickness;
const oheight = height + outlineThickness;
const yDist = 0.13;
const bkg = "white";
function interpolateRGB(rgb1, rgb2, percent) {
  const result = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[i] = lerp(rgb1[i], rgb2[i], percent);
  }
  return result;
}
const highColorRGB = [5, 240, 25];
const lowColorRGB = [240, 5, 5];
const healthColorGradient = [];
const gradientSteps = 255;
for (let step = 0; step <= gradientSteps; step++) {
  healthColorGradient[step] = `rgb(${interpolateRGB(lowColorRGB, highColorRGB, step / gradientSteps).join(",")})`;
}
const hPI = Math.PI / 2;
class HealthBarRenderSystem extends FluidSystem {
  constructor(renderContext2, getViewportRotation) {
    super("Health Bar Render System", meta);
    this.renderContext = renderContext2;
    this.getViewportRotation = getViewportRotation;
  }
  updateNode(node) {
    const ctx = this.renderContext;
    const { position, health } = node;
    if (!health.visible)
      return;
    const { x, y } = position.position;
    const { currentHealth, maxHealth } = health;
    const healthPercent = currentHealth / maxHealth;
    const fillWidth = healthPercent * width;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.getViewportRotation() + hPI);
    ctx.translate(0, yDist);
    ctx.fillStyle = bkg;
    ctx.fillRect(-0.10250000000000001, -75e-4, owidth, oheight);
    ctx.fillStyle = healthColorGradient[Math.floor(healthPercent * (healthColorGradient.length - 1))];
    ctx.fillRect(-0.1, -5e-3, fillWidth, height);
    ctx.restore();
  }
}
const Asteroid = fluidInternal$1.defineComponentType("Asteroid");
const EntityDeath = fluidInternal$1.defineComponentType("Entity Death");
function createSpriteEntity(position, rotation, spriteTexture, zIndex, renderSize, transform) {
  return fluidInternal$1.createEntityWithComponents(
    Position.createComponent({
      position,
      rotation
    }),
    Sprite.createComponent({
      image: spriteTexture,
      zIndex,
      renderSize,
      transform
    })
  );
}
const canvasToImage = canvasToImage$1;
const loadImage = loadImage$1;
function renderSingleNeonLaserSprite({
  width: width2 = 256,
  height: height2 = 128,
  laserLength = 64,
  laserWidth = 16,
  color: color2 = "cyan"
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width2;
  canvas.height = height2;
  const ctx = canvas.getContext("2d");
  const centerX = width2 / 2;
  const centerY = height2 / 2;
  ctx.clearRect(0, 0, width2, height2);
  ctx.save();
  ctx.translate(centerX, centerY);
  const gradient = ctx.createLinearGradient(-laserLength / 2, 0, laserLength / 2, 0);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(0.3, color2);
  gradient.addColorStop(0.7, color2);
  gradient.addColorStop(1, "transparent");
  ctx.shadowBlur = 24;
  ctx.shadowColor = color2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, laserLength / 2, laserWidth / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return canvas;
}
function loadImg(assetPath) {
  return loadImage(`${assetRoot}/${assetPath}`);
}
const assetRoot = "/assets";
const backgroundTileImage = await loadImg("background/space_background_tile.png");
const asteroidImage = await loadImg("asteroid/asteroid1.png");
const shipImage = await loadImg("ship/ship1.png");
const laserShotCanvas = renderSingleNeonLaserSprite();
canvasToImage(laserShotCanvas);
const artilleryShellImage = await loadImg("projectile/shell2.png");
const SpriteImages = {
  backgroundTileImage,
  asteroidImage,
  shipImage,
  projectile: {
    artilleryShellImage
  }
};
function calculateRectangleMomentOfInertia(mass, width2, height2) {
  return 1 / 12 * mass * (width2 * width2 + height2 * height2);
}
function transformScaleLerpBulge(from, to, timeElapsed, totalDuration) {
  return {
    scale: lerp(from.scale, to.scale, Math.sin(Math.PI * timeElapsed / totalDuration))
  };
}
class AInterpolationId {
  static map = /* @__PURE__ */ new Map();
  static nextId = 0;
  idNumber;
  idSymbol;
  name;
  constructor(name) {
    this.idNumber = AInterpolationId.nextId++;
    this.name = `Interpolation#${this.idNumber}(${name})`;
    this.idSymbol = Symbol(this.name);
  }
  getSymbol() {
    return this.idSymbol;
  }
  getName() {
    return this.name;
  }
  getNumericId() {
    return this.idNumber;
  }
}
function registerInterpolation(interpolator, name) {
  const id = new AInterpolationId(name);
  AInterpolationId.map.set(id.getSymbol(), interpolator);
  return id;
}
function resolveInterpolator(interpolationId) {
  return AInterpolationId.map.get(interpolationId.getSymbol());
}
const InterpolationRegistry = { registerInterpolation, resolveInterpolator };
const transformScaleLerpId = InterpolationRegistry.registerInterpolation(transformScaleLerpBulge, "LERP(transform.scale)");
const PropertyAnimation = fluidInternal$1.defineComponentType("Property Animation");
function createPropertyAnimationsComponent(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const [componentType, animationsData] of entries) {
    for (const animationData of animationsData) {
      const componentTypeSymbol = componentType.getId().getSymbol();
      let innerMap = map.get(componentTypeSymbol);
      if (!innerMap) {
        innerMap = /* @__PURE__ */ new Map();
        map.set(componentTypeSymbol, innerMap);
      }
      innerMap.set(animationData.propertyName, { componentType, ...animationData });
    }
  }
  return PropertyAnimation.createComponent({ animations: map });
}
const LifeTime = fluidInternal$1.defineComponentType("Lifetime");
const Particle = fluidInternal$1.defineComponentType("Particle");
function createAsteroid({
  position,
  rotation,
  velocity,
  angularVelocity,
  width: width2,
  options = {}
}) {
  const {
    spriteImage = SpriteImages.asteroidImage,
    density = 3.2,
    health: optionalHealth,
    deriveHealth = (mass2, area2) => mass2 * area2,
    damageAnimationScalePercent = 1.11,
    damageAnimationDuration = 0.15
  } = options;
  const aspectRatio = spriteImage.height / spriteImage.width;
  const height2 = width2 * aspectRatio;
  const area = width2 * height2;
  const mass = density * area;
  const sizeTransform = { scale: 1 };
  const health = optionalHealth ? optionalHealth : deriveHealth(mass, area);
  const entity = createSpriteEntity(
    Vector2.copy(position),
    rotation,
    spriteImage,
    3,
    {
      x: width2,
      y: height2
    }
  );
  fluidInternal$1.addEntityComponents(
    entity,
    Asteroid.createComponent({ area }),
    Velocity.createComponent({
      velocity,
      angular: angularVelocity
    }),
    Physics.createComponent({
      mass,
      centerOfMassOffset: Vector2.zero(),
      area: width2 * height2,
      momentOfInertia: calculateRectangleMomentOfInertia(mass, width2, height2)
    }),
    ChunkOccupancy.createComponent({ chunkKeys: /* @__PURE__ */ new Set() }),
    BoundingBox.createComponent(createBoundingBox({ width: width2, height: height2 })),
    Health.createComponent({ maxHealth: health, currentHealth: health, visible: true }),
    createPropertyAnimationsComponent(
      [
        [
          // Sprite animations
          Sprite,
          [
            // damaged animation
            {
              propertyName: "transform",
              beginningValue: sizeTransform,
              endingValue: { scale: damageAnimationScalePercent },
              completed: true,
              duration: damageAnimationDuration,
              elapsed: 0,
              onComplete(entityId, propertyAnimationComponent) {
                const transform = propertyAnimationComponent.animations.get(Sprite.getId().getSymbol()).get("transform");
                transform.completed = true;
              },
              interpolationId: transformScaleLerpId
            }
          ]
        ]
      ]
    )
  );
  return entity;
}
function createAsteroidParticle(position, velocity, rotation, angularVelocity, spawnTime, lifeTime, size) {
  const entityId = createSpriteEntity(
    position,
    rotation,
    SpriteImages.asteroidImage,
    3,
    { x: size, y: size }
  );
  fluidInternal$1.addEntityComponents(
    entityId,
    Velocity.createComponent({ velocity, angular: angularVelocity }),
    LifeTime.createComponent({ lifeDuration: lifeTime, spawnTime }),
    Particle.createComponent({})
  );
  return entityId;
}
const schema$3 = {
  asteroid: Asteroid,
  position: Position,
  velocity: Velocity,
  entityDeath: EntityDeath
};
const nodeMeta$3 = fluidInternal$1.registerNodeSchema(schema$3, "Asteroid Death");
const explosionIntensityScale = 0.1;
class AsteroidDeathSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Asteroid Death System", nodeMeta$3);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const {
      asteroid,
      position,
      velocity,
      entityDeath,
      entityId
    } = node;
    const { area } = asteroid;
    const count = area * 10 * 5;
    const increment = 2 * Math.PI / count;
    if (entityDeath.readyToRemove) {
      fluidInternal$1.removeEntity(entityId);
      return;
    }
    for (let angle = 0; angle < 2 * Math.PI; angle += increment) {
      let vX = Math.cos(angle) * (0.5 + 0.65 * Math.random());
      let vY = Math.sin(angle) * (0.5 + 0.65 * Math.random());
      createAsteroidParticle(
        Vector2.copy(position.position),
        Vector2.add(velocity.velocity, Vector2.scale({ x: vX, y: vY }, explosionIntensityScale)),
        position.rotation + angle,
        velocity.angular + 1.2 * Math.PI * Math.random(),
        this.clientContext.engineInstance.getGameTime(),
        5,
        Math.sqrt((0.3 + 0.7 * Math.random() / count) * asteroid.area)
      );
    }
    entityDeath.readyToRemove = true;
  }
}
const schema$2 = {
  particle: Particle,
  lifetime: LifeTime
};
const nodeMeta$2 = fluidInternal$1.registerNodeSchema(schema$2, "Particle Render System");
class ParticleSystem extends FluidSystem {
  constructor(clientContext2) {
    super("Particle Render System", nodeMeta$2);
    this.clientContext = clientContext2;
  }
  updateNode(node) {
    const gameTime = this.clientContext.engineInstance.getGameTime();
    const { entityId, lifetime } = node;
    let { lifeDuration, spawnTime } = lifetime;
    if (spawnTime <= 0)
      spawnTime = gameTime;
    const deathTime = spawnTime + lifeDuration;
    if (gameTime >= deathTime)
      fluidInternal$1.removeEntity(entityId);
  }
}
const schema$1 = {
  projectile: Projectile,
  collision: Collision
};
const nodeMeta$1 = fluidInternal.registerNodeSchema(schema$1, "Projectile Damage");
class ProjectileDamageSystem extends FluidSystem {
  constructor() {
    super("Projectile Damage System", nodeMeta$1);
  }
  updateNode(node) {
    const { collision, entityId: projectileEntityId, projectile: projectileData } = node;
    const otherEntity = fluidInternal.getEntityProxy(collision.collidedEntity);
    if (!otherEntity.hasComponent(Health))
      return;
    const healthData = otherEntity.getComponent(Health).data;
    const health = Math.max(0, healthData.currentHealth - projectileData.damage);
    healthData.currentHealth = health;
    if (otherEntity.hasComponent(Asteroid) && otherEntity.hasComponent(PropertyAnimation)) {
      const animations = otherEntity.getComponent(PropertyAnimation).data.animations;
      const anim = animations.get(Sprite.getId().getSymbol())?.get("transform");
      if (anim) {
        if (anim.completed) {
          anim.elapsed = 0;
          anim.completed = false;
        }
      }
    }
    if (health === 0) {
      if (!otherEntity.hasComponent(EntityDeath))
        otherEntity.addComponent(EntityDeath.createComponent({ readyToRemove: false }));
    }
    fluidInternal.removeEntity(projectileEntityId);
    otherEntity.removeComponent(Collision);
  }
}
const schema = {
  propertyAnimation: PropertyAnimation
};
const nodeMeta = fluidInternal.registerNodeSchema(schema, "Property Animation Node");
class PropertyAnimationSystem extends FluidSystem {
  constructor(engineInstance, resolveInterpolator2) {
    super("Property Animation System", nodeMeta);
    this.engineInstance = engineInstance;
    this.resolveInterpolator = resolveInterpolator2;
  }
  updateNode(node) {
    const { propertyAnimation, entityId } = node;
    const deltaTime = this.engineInstance.getDeltaTime();
    for (const [componentTypeSymbol, animationMap] of propertyAnimation.animations.entries())
      for (const [propertyName, animation] of animationMap.entries()) {
        const { componentType, duration, elapsed, beginningValue, interpolationId, propertyName: propertyName2, endingValue, loop, onComplete } = animation;
        if (animation.completed || !fluidInternal.entityHasComponent(entityId, componentType))
          continue;
        animation.elapsed += deltaTime;
        const interpolator = this.resolveInterpolator(interpolationId);
        const clampedElapsed = Math.min(elapsed, duration);
        const nextValue = interpolator(beginningValue, endingValue, clampedElapsed, duration);
        const component = fluidInternal.getEntityComponent(entityId, componentType);
        component.data[propertyName2] = nextValue;
        if (elapsed >= duration) {
          if (loop) {
            animation.elapsed = 0;
          } else {
            animation.completed = true;
            onComplete?.(entityId, propertyAnimation);
          }
        }
      }
  }
}
const artilleryShell = {
  lifeTime: 5,
  damage: 15e-4,
  density: 1.8,
  spriteImage: SpriteImages.projectile.artilleryShellImage
};
function spawnProjectile({
  position,
  velocity,
  rotation,
  angularVelocity,
  generation,
  width: width2,
  type,
  spawnTime,
  options = {}
}) {
  const {
    damage,
    density,
    spriteImage,
    lifeTime
  } = type;
  const imageAspectRatio = spriteImage.height / spriteImage.width;
  const height2 = width2 * imageAspectRatio;
  const area = width2 * height2;
  const mass = density * area;
  const deathTime = spawnTime + lifeTime;
  const entity = createSpriteEntity(
    position,
    rotation,
    spriteImage,
    0,
    {
      x: width2,
      y: height2
    }
  );
  fluidInternal$1.addEntityComponents(
    entity,
    Projectile.createComponent({
      deathTime,
      generation,
      damage
    }),
    Velocity.createComponent({
      velocity,
      angular: angularVelocity
    }),
    Acceleration.createComponent({
      acceleration: { x: 0, y: 0 },
      angular: 0
    }),
    Physics.createComponent({
      mass,
      centerOfMassOffset: Vector2.zero(),
      area,
      momentOfInertia: calculateRectangleMomentOfInertia(mass, width2, height2)
    }),
    BoundingBox.createComponent(
      createBoundingBox(
        {
          width: width2,
          height: height2
        },
        { transform: { scale: 0.98 } }
        // smaller bounding box for tighter collision tolerance
      )
    ),
    ChunkOccupancy.createComponent({ chunkKeys: /* @__PURE__ */ new Set() })
  );
  return entity;
}
const maxVelocity = 2.5 * 2.99792458;
const boundedRandom = boundedRandom$1;
function generateChunk(worldContext2, chunkIndex, chunkSize) {
  const chunkCenter = getChunkCenterFromIndex(chunkIndex[0], chunkIndex[1], chunkSize);
  let chunkEntity = createSpriteEntity(
    chunkCenter,
    0,
    SpriteImages.backgroundTileImage,
    0,
    {
      x: chunkSize,
      y: chunkSize
    }
  );
  const halfChunkSize = chunkSize / 2;
  const nSubDivision = 3;
  const subGridSize = chunkSize / 3;
  const asteroidProbability = 0.3, sgap = asteroidProbability / (nSubDivision * nSubDivision);
  const minVelocity = 0.08, maxVelocity2 = 0.32, maxAngularVelocity = 1.2;
  const minSize = 0.08, maxSize = 0.4;
  const minDensity = 1, maxDensity = 2.2;
  for (let i = 0; i < nSubDivision; i++)
    for (let j = 0; j < nSubDivision; j++) {
      if (Math.random() > sgap)
        continue;
      let x = chunkCenter.x - halfChunkSize + i * subGridSize;
      let y = chunkCenter.y - halfChunkSize + j * subGridSize;
      let asteroidPosition = {
        x: boundedRandom(x, x + subGridSize),
        y: boundedRandom(y, y + subGridSize)
      };
      let asteroidRotation = Math.random() * 2 * Math.PI;
      let asteroidVelocity = Vector2.scale(
        Vector2.normalize(
          {
            x: Math.random() - 0.5,
            y: Math.random() - 0.5
          }
        ),
        boundedRandom(minVelocity, maxVelocity2)
      );
      const angularVelocity = boundedRandom(minVelocity, maxAngularVelocity);
      const size = boundedRandom(minSize, maxSize);
      const density = boundedRandom(minDensity, maxDensity);
      createAsteroid({
        position: asteroidPosition,
        velocity: asteroidVelocity,
        rotation: asteroidRotation,
        angularVelocity,
        width: size,
        options: {
          density
        }
      });
    }
  const chunkMeta = createChunk(
    chunkIndex,
    chunkSize,
    ChunkState.Loaded,
    {
      entitySymbolSet: /* @__PURE__ */ new Set([chunkEntity.getSymbol()]),
      lastAccessed: engine.getGameTime()
    }
  );
  const chunkComponent = Chunk.createComponent({ chunk: chunkMeta }, false);
  fluidInternal$1.addEntityComponent(chunkEntity, chunkComponent);
  return chunkMeta;
}
const canvasElement = document.getElementById("canvas");
canvasElement.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});
const VIEWPORT_RESOLUTION_COMPONENT = Resolution.createComponent({
  resolution: Vector2.zero()
});
const renderContext = canvasElement.getContext("2d");
const renderer = new CanvasRenderer(
  canvasElement,
  {
    scale: 0.98,
    renderBaseColor: "black",
    onresize: (pw, ph, nw, nh) => {
      VIEWPORT_RESOLUTION_COMPONENT.data.resolution.x = nw;
      VIEWPORT_RESOLUTION_COMPONENT.data.resolution.y = nh;
    }
  }
);
let renderDistance = 5;
const CAMERA = {
  position: Position.createComponent({
    position: {
      x: 0,
      y: 0
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
  viewport: Viewport.createComponent({}),
  resolution: VIEWPORT_RESOLUTION_COMPONENT
};
fluidInternal$1.createEntityWithComponents(
  ...Object.values(CAMERA)
);
const engine = new FluidEngine(fluidInternal$1.core(), 1024);
const worldContext = new WorldContext(engine, 1.024, 0.1, generateChunk);
const clientContext = new ClientContext(engine, worldContext, renderer);
clientContext.setZoomLevel(20);
const KEY_STATES = {};
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
const MOUSE_KEY_STATES = {};
const MOUSE_CONTROLS = {};
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
      const next = clientContext.getZoomLevel() - decrement;
      clientContext.setZoomLevel(next < min ? max : next);
    }
  },
  increase_zoom: {
    keys: ["c"],
    action: () => {
      const increment = 10;
      const max = 100;
      const min = increment;
      const next = clientContext.getZoomLevel() + increment;
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
};
function activateHotkeyBindings() {
  for (const binding of Object.values(HOTKEYS)) {
    if (binding.keys.some((k) => KEY_STATES[k.toLowerCase()] === true))
      binding.action();
  }
}
function activateControlBindings() {
  for (const controlBinding of Object.keys(KEYBOARD_CONTROLS).map((k) => KEYBOARD_CONTROLS[k])) {
    if (controlBinding.keys.some((k) => KEY_STATES[k]))
      controlBinding.action();
  }
  for (const controlBinding of Object.keys(MOUSE_CONTROLS).map((k) => MOUSE_CONTROLS[k])) {
    if (controlBinding.keys.some((k) => MOUSE_KEY_STATES[k]))
      controlBinding.action();
  }
}
function drawPauseScreen() {
  renderContext.save();
  renderContext.globalAlpha = 0.5;
  renderer.clear();
  renderContext.globalAlpha = 0.5;
  renderContext.font = "bold 256px calibri";
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
  () => {
  },
  () => {
    renderContext.restore();
  }
);
const hudRenderPhase = new FluidSystemPhase(
  "Hud Render Phase",
  () => {
  },
  () => {
    if (!engine.getAnimationState())
      drawPauseScreen();
  }
);
const sysman = fluidInternal$1.core().getSystemOrchestrator();
sysman.pushPhases(simulationPhase, worldRenderPhase, hudRenderPhase);
let kinematicSystem = new KinematicSystem(clientContext), positionSystem = new PositionSystem(engine), movementControlSystem = new MovementControlSystem(() => engine.getDeltaTime()), viewportSystem = new ViewportSystem(clientContext), projectileSystem = new ProjectileSystem(engine), firingSystem = new FiringSystem(engine, spawnProjectile), cursorSystem = new CursorSystem(engine), chunkLoadingSystem = new ChunkLoadingSystem(engine, worldContext), chunkUnloadingSystem = new ChunkUnloadingSystem(engine, worldContext), chunkOccupancyUpdateSystem = new ChunkOccupancyUpdateSystem(engine, worldContext), boundingBoxUpdateSystem = new BoundingBoxUpdateSystem(), collisionDetectionSystem = new CollisionDetectionSystem(engine), pojectileDamageSystem = new ProjectileDamageSystem(), worldPreRenderSystem = new WorldPreRenderSystem(clientContext), viewportRenderSystem = new ViewportRenderSystem(renderContext), debugInfoDisplaySystem = new DebugInfoDisplaySystem(clientContext), spriteRenderSystem = new SpriteRenderSystem(renderer), boundingBoxRenderSystem = new BoundingBoxRenderSystem(clientContext), axisRenderSystem = new AxisRenderSystem(clientContext), chunkBorderRenderSystem = new ChunkBorderRenderSystem(clientContext), occupiedChunkHighlightingSystem = new OccupiedChunkHighlightingSystem(clientContext), healthBarRenderSystem = new HealthBarRenderSystem(renderContext, () => CAMERA.position.data.rotation);
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
  new PropertyAnimationSystem(engine, InterpolationRegistry.resolveInterpolator)
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
function initMainCharacter() {
  const modelScaleFactor = 1 / 555;
  const shipImage2 = SpriteImages.shipImage;
  const shipImageAspectRatio = shipImage2.height / shipImage2.width;
  const height2 = 0.2;
  const width2 = height2 / shipImageAspectRatio;
  const area = width2 * height2;
  const mass = 3e9 * modelScaleFactor;
  return fluidInternal$1.createEntityWithComponents(
    MC_POS,
    Velocity.createComponent(
      {
        velocity: { x: 0, y: 0 },
        angular: 0
      }
    ),
    Acceleration.createComponent(
      {
        acceleration: { x: 0, y: 0 },
        angular: 0
      }
    ),
    Stats.createComponent({}),
    ProjectileSource.createComponent({
      muzzleSpeed: 1.2 * 2.99792458,
      fireRate: 14,
      projectileWidth: 0.035,
      projectileType: artilleryShell,
      lastFireTime: 0,
      transform: {
        scale: height2 * 1.1 / 2
      }
    }),
    RenderCenter.createComponent({ renderDistance }),
    Sprite.createComponent(
      {
        image: shipImage2,
        zIndex: 5,
        renderSize: { x: width2, y: height2 },
        transform: {
          rotate: Math.PI / 2
        }
      }
    ),
    BoundingBox.createComponent(
      createBoundingBox(
        {
          width: width2,
          height: height2
        },
        {
          transform: {
            rotate: Math.PI / 2
          }
        }
      )
    ),
    ChunkOccupancy.createComponent({ chunkKeys: /* @__PURE__ */ new Set() }),
    Physics.createComponent({
      mass,
      centerOfMassOffset: { x: 0, y: 0 },
      area,
      momentOfInertia: calculateRectangleMomentOfInertia(mass, width2, height2)
    }),
    Thruster.createComponent({ maxForce: 1.75 * 44e8 * modelScaleFactor }),
    MOVEMENT_CONTROL_COMPONENT,
    FIRE_CONTROL_COMPONENT,
    Health.createComponent({ maxHealth: 100, currentHealth: 60, visible: true })
  );
}
initMainCharacter();
MOUSE_CONTROLS["fire"] = {
  keys: [0],
  action: () => {
    FIRE_CONTROL_COMPONENT.data.fireIntent = true;
  }
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
window.addEventListener("mousedown", (event) => {
  MOUSE_KEY_STATES[event.button] = true;
});
canvasElement.addEventListener("mouseup", (event) => {
  MOUSE_KEY_STATES[event.button] = false;
});
engine.animate();
console.log("Asteroid Journey Started!");
export {
  CAMERA,
  maxVelocity
};
