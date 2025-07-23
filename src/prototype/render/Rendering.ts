import { ECSSystem, Renderable, RenderableId, RenderableType, RenderableTypeId, RenderContext, Renderer, RendererId, RendererType, RendererTypeId, RenderProcess, UniqueIdentity, UniqueIdentity2, UniqueIdentity3, } from "fluidengine/dev/api";
import { Vec2, Transform } from "fluidengine/v0/lib";


// RenderableType symbol -> RenderableType
const renderableTypeMap: Map<symbol, RenderableType<any>> = new Map();
// RenderableType symbol -> Renderable[]
const renderableMap: Map<symbol, Renderable<any>[]> = new Map();

//RenderTypeSymbol -> RendererType
const rendererTypeMap: Map<symbol, RendererType<any>> = new Map();
// RendererType symbol -> Renderer[]
const rendererMap: Map<symbol, Renderer<any>[]> = new Map();

// RenderableType -> RendererType -> RendererProcess
const renderProcessMap: Map<symbol, Map<symbol, RenderProcess<any, any>>> = new Map();

class AUniqueId2 implements UniqueIdentity2 {
    private readonly sym: symbol;
    constructor(
        private readonly name: string,
    ) {
        this.sym = Symbol(name);
    }
    getName(): string {
        return this.name;
    }
    equals<I extends UniqueIdentity>(other: I): boolean {
        return other instanceof ARendererId && other.sym === this.sym;
    }
    toString(): string {
        return this.name;
    }
    getSymbol(): symbol {
        return this.sym;
    }
}

class AUniqueId3 extends AUniqueId2 implements UniqueIdentity3 {
    private static count: number = 0;
    private readonly number: number;
    constructor(
        name: string
    ) {
        super(name);
        this.number = AUniqueId3.count++;
    }
    getNumber(): number {
        return this.number;
    }
}

class ARendererId extends AUniqueId2 implements RendererId {
}

class ARendererTypeId extends AUniqueId2 implements RendererTypeId {
}

class ARendererType<I> implements RendererType<I> {
    public readonly id: RendererTypeId;
    constructor(
        name: string
    ) {
        this.id = new ARendererTypeId(name);
    }
    is(rendererType: RendererType<any>): rendererType is RendererType<I> {
        return rendererType instanceof ARendererType && rendererType.id.equals(this.id);
    }
    create(instance: I): Renderer<I> {
        return new ARenderer(instance, this, new ARendererId("Canvas Renderer"));
    }
}

class ARenderer<I> implements Renderer<I> {
    constructor(
        public instance: I,
        public type: RendererType<I>,
        public readonly id: RendererId
    ) {
    }
}

class ARenderableTypeId extends AUniqueId2 implements ARenderableTypeId {
}

class ARenderableType<T> implements RenderableType<T> {
    public readonly id: RenderableTypeId;
    constructor(
        name: string
    ) {
        this.id = new ARenderableTypeId(name);
    }
    is(renderableType: RenderableType<any>): renderableType is RenderableType<T> {
        return renderableType instanceof ARenderableType && renderableType.id.equals(this.id);
    }
    create(data: T, copyData?: boolean): Renderable<T> {
        return new ARenderable(copyData ? { ...data } : data, this);
    }
}

class ARenderable<T> implements Renderable<T> {
    public readonly id: RenderableId;
    constructor(
        public data: T,
        public type: RenderableType<T>
    ) {
        this.id = new AUniqueId3("Renderable");
    }
}

class ARenderProcess<T, I> implements RenderProcess<T, I> {
    constructor(
        public renderableType: RenderableType<T>,
        public rendererType: RendererType<I>,
        public render: (data: T, renderer: I, context: RenderContext) => void
    ) {
    }
}

export interface PrototypeRenderContext extends RenderContext {
    deltaTime: number;
}

export function renderAll(renderContext: PrototypeRenderContext) {
    for (const [renderableTypeSymbol, renderables] of renderableMap.entries()) {
        const renderableType = renderableTypeMap.get(renderableTypeSymbol);
        const renderProcessInnerMap = renderProcessMap.get(renderableTypeSymbol);
        if (!renderProcessInnerMap) {
            console.warn(`Could not find any render process for renderable type '${renderableType.id.getName()}'`);
            continue;
        }
        for (const [rendererTypeSymbol, renderProcess] of renderProcessInnerMap.entries()) {
            const renderers = rendererMap.get(rendererTypeSymbol);
            const rendererType = rendererTypeMap.get(rendererTypeSymbol);
            if (!renderers) {
                console.warn(`Could not find any renderer instance of type '${rendererType.id.getName()}'`);
                continue;
            }
            for (const renderer of renderers) {
                for (const renderable of renderables) {
                    renderProcess.render(renderable.data, renderer.instance, renderContext);
                }
            }
        }
    }
}

export interface SpriteRenderable {
    position: Vec2;
    rotation: number;
    image: HTMLImageElement;
    renderSize: Vec2;
    transform?: Transform;
}

export function prototypeTestInit(
    canvasContext: CanvasRenderingContext2D,
    spriteData: SpriteRenderable[]
) {
    const canvasRendererType = new ARendererType<CanvasRenderingContext2D>("CanvasRenderingContext2D");
    const renderer = canvasRendererType.create(canvasContext);
    const canvasRendererTypeSymbol = canvasRendererType.id.getSymbol();
    rendererTypeMap.set(canvasRendererTypeSymbol, canvasRendererType);
    rendererMap.set(canvasRendererTypeSymbol, [renderer]);

    const spriteRenderableType = new ARenderableType<SpriteRenderable>("Sprite");
    const spriteRenderableTypeSymbol = spriteRenderableType.id.getSymbol();
    const spriteRenderables = spriteData.map(data => spriteRenderableType.create(data, true));
    renderableTypeMap.set(spriteRenderableTypeSymbol, spriteRenderableType);
    renderableMap.set(spriteRenderableTypeSymbol, spriteRenderables);

    const spriteRenderProcess = new ARenderProcess(
        spriteRenderableType,
        canvasRendererType,
        (data, ctx, renderContext) => {
            const {
                renderSize: { x: width, y: height },
                position: { x, y },
                rotation,
                transform,
                image
            } = data;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            if (transform) {
                if (transform.rotate) ctx.rotate(transform.rotate);
                if (transform.translate) ctx.translate(transform.translate.x, transform.translate.y);
                if (transform.scale) ctx.scale(transform.scale, transform.scale);
            }

            ctx.scale(width / image.width, height / image.height);
            ctx.drawImage(image, -image.width / 2, -image.height / 2);
            ctx.restore();
        }
    );

    const renderProcessInnerMap: Map<symbol, RenderProcess<any, any>> = new Map();
    renderProcessInnerMap.set(canvasRendererTypeSymbol, spriteRenderProcess);
    renderProcessMap.set(spriteRenderableTypeSymbol, renderProcessInnerMap);
}