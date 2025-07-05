export interface InterpolationId {
    getSymbol(): symbol;
    getName(): string;
    getNumericId(): number;
}

export interface Interpolator<V> {
    (from: V, to: V, timeElapsed: number, totalDuration: number): V;
}

class AInterpolationId implements InterpolationId {
    public static map: Map<symbol, Interpolator<any>> = new Map();
    private static nextId = 0;

    private readonly idNumber: number;
    private readonly idSymbol: symbol;
    private readonly name: string;
    constructor(
        name: string
    ) {
        this.idNumber = AInterpolationId.nextId++;
        this.name = `Interpolation#${this.idNumber}(${name})`;
        this.idSymbol = Symbol(this.name);
    }
    getSymbol(): symbol {
        return this.idSymbol;
    }
    getName(): string {
        return this.name;
    }
    getNumericId(): number {
        return this.idNumber;
    }
}



export function registerInterpolation<V>(interpolator: Interpolator<V>, name: string): InterpolationId {
    const id = new AInterpolationId(name);
    AInterpolationId.map.set(id.getSymbol(), interpolator);
    return id;
}

export function resolveInterpolator(interpolationId: InterpolationId): Interpolator<any> | undefined {
    return AInterpolationId.map.get(interpolationId.getSymbol());
}

const reg = { registerInterpolation, resolveInterpolator }
export { reg as InterpolationRegistry };