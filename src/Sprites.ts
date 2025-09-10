import { Fluid } from "fluidengine";
import { ECSEntityId } from "fluidengine";
import { Vec2, Transform, ImageUtils } from "fluidengine";
import { Position } from "./components/PositionComponent";
import { Sprite } from "./components/SpriteComponent";
import Assets, { SpriteKey } from "./Assets";

export function createSpriteEntity(
    position: Vec2,
    rotation: number,
    spriteImageKey: SpriteKey,
    zIndex: number,
    renderSize: Vec2,
    transform?: Transform
): ECSEntityId {
    return Fluid.createEntityWithComponents(
        Position.createComponent({
            position,
            rotation
        }),
        Sprite.createComponent({
            image: Assets.getSprite(spriteImageKey),
            zIndex,
            renderSize,
            transform
        })
    )
}

const canvasToImage = ImageUtils.canvasToImage;
const loadImage = ImageUtils.loadImage;

export function createGlowingStar(spikes, outerRadius, innerRadius, glowRadius) {
    const size = glowRadius * 2;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = offCanvas.height = size;
    const offCtx = offCanvas.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;

    // Glow
    const glow = offCtx.createRadialGradient(cx, cy, innerRadius, cx, cy, glowRadius);
    glow.addColorStop(0, "rgba(255, 255, 150, 0.5)");
    glow.addColorStop(1, "rgba(255, 255, 150, 0)");

    offCtx.fillStyle = glow;
    offCtx.beginPath();
    offCtx.arc(cx, cy, glowRadius, 0, 2 * Math.PI);
    offCtx.fill();

    // Star path
    offCtx.beginPath();
    const step = Math.PI / spikes;
    let rotation = Math.PI / 2 * 3;

    offCtx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rotation) * outerRadius;
        let y = cy + Math.sin(rotation) * outerRadius;
        offCtx.lineTo(x, y);
        rotation += step;

        x = cx + Math.cos(rotation) * innerRadius;
        y = cy + Math.sin(rotation) * innerRadius;
        offCtx.lineTo(x, y);
        rotation += step;
    }
    offCtx.closePath();

    offCtx.fillStyle = "#FFD700";
    offCtx.fill();
    offCtx.strokeStyle = "#FFF";
    offCtx.lineWidth = 1.2;
    offCtx.stroke();

    return offCanvas;
}

export function renderSingleNeonLaserSprite({
    width = 256,
    height = 128,
    laserLength = 64,
    laserWidth = 16,
    color = "cyan"
} = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const centerX = width / 2;
    const centerY = height / 2;

    // Fill background with transparency for sprite use
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);

    // Create glowing linear gradient for the laser core
    const gradient = ctx.createLinearGradient(-laserLength / 2, 0, laserLength / 2, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, "transparent");

    ctx.shadowBlur = 24;
    ctx.shadowColor = color;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, laserLength / 2, laserWidth / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return canvas;
}

