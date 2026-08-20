"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

type CropBox = { x: number; y: number; width: number; height: number };
type DragMode = "new" | "move" | "nw" | "ne" | "sw" | "se" | null;

type ImageCropperProps = {
  imageUrl: string;
  onApply: (croppedImage: string) => void;
  onCancel: () => void;
  language?: "zh" | "en";
};

const MIN_SIZE = 48;

/* 优化：轻量 Canvas 框选器，鼠标与手机触屏均可操作，不引入额外前端依赖。 */
export default function ImageCropper({ imageUrl, onApply, onCancel, language = "zh" }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; startBox: CropBox } | null>(null);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxWidth = 920;
      const maxHeight = 560;
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      imageRef.current = image;
      setCrop({
        x: canvas.width * 0.1,
        y: canvas.height * 0.1,
        width: canvas.width * 0.8,
        height: canvas.height * 0.8,
      });
      setReady(true);
    };
    image.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !ready) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(13, 9, 24, 0.48)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.rect(crop.x, crop.y, crop.width, crop.height);
    context.clip();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();

    context.strokeStyle = "#9f67d6";
    context.lineWidth = 3;
    context.strokeRect(crop.x, crop.y, crop.width, crop.height);
    context.setLineDash([7, 7]);
    context.lineWidth = 1;
    context.strokeStyle = "rgba(255,255,255,.8)";
    context.beginPath();
    context.moveTo(crop.x + crop.width / 3, crop.y);
    context.lineTo(crop.x + crop.width / 3, crop.y + crop.height);
    context.moveTo(crop.x + crop.width * 2 / 3, crop.y);
    context.lineTo(crop.x + crop.width * 2 / 3, crop.y + crop.height);
    context.moveTo(crop.x, crop.y + crop.height / 3);
    context.lineTo(crop.x + crop.width, crop.y + crop.height / 3);
    context.moveTo(crop.x, crop.y + crop.height * 2 / 3);
    context.lineTo(crop.x + crop.width, crop.y + crop.height * 2 / 3);
    context.stroke();
    context.setLineDash([]);

    const handles = [
      [crop.x, crop.y],
      [crop.x + crop.width, crop.y],
      [crop.x, crop.y + crop.height],
      [crop.x + crop.width, crop.y + crop.height],
    ];
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#7b3faf";
    context.lineWidth = 2;
    handles.forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 7, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
  }, [crop, ready]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
  };

  const modeAtPoint = (x: number, y: number): DragMode => {
    const hit = 22;
    const corners: Array<[DragMode, number, number]> = [
      ["nw", crop.x, crop.y], ["ne", crop.x + crop.width, crop.y],
      ["sw", crop.x, crop.y + crop.height], ["se", crop.x + crop.width, crop.y + crop.height],
    ];
    const corner = corners.find(([, cx, cy]) => Math.hypot(x - cx, y - cy) <= hit);
    if (corner) return corner[0];
    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) return "move";
    return "new";
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    const mode = modeAtPoint(point.x, point.y);
    const startBox = mode === "new" ? { x: point.x, y: point.y, width: MIN_SIZE, height: MIN_SIZE } : crop;
    if (mode === "new") setCrop(startBox);
    dragRef.current = { mode, startX: point.x, startY: point.y, startBox };
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const point = pointFromEvent(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const box = drag.startBox;
    let left = box.x;
    let top = box.y;
    let right = box.x + box.width;
    let bottom = box.y + box.height;

    if (drag.mode === "move") {
      left = Math.max(0, Math.min(canvas.width - box.width, box.x + dx));
      top = Math.max(0, Math.min(canvas.height - box.height, box.y + dy));
      right = left + box.width;
      bottom = top + box.height;
    } else {
      if (drag.mode === "new" || drag.mode === "se") { right = point.x; bottom = point.y; }
      if (drag.mode === "nw") { left = point.x; top = point.y; }
      if (drag.mode === "ne") { right = point.x; top = point.y; }
      if (drag.mode === "sw") { left = point.x; bottom = point.y; }
      left = Math.max(0, Math.min(left, canvas.width));
      right = Math.max(0, Math.min(right, canvas.width));
      top = Math.max(0, Math.min(top, canvas.height));
      bottom = Math.max(0, Math.min(bottom, canvas.height));
      if (right < left) [left, right] = [right, left];
      if (bottom < top) [top, bottom] = [bottom, top];
      if (right - left < MIN_SIZE) right = Math.min(canvas.width, left + MIN_SIZE);
      if (bottom - top < MIN_SIZE) bottom = Math.min(canvas.height, top + MIN_SIZE);
    }
    setCrop({ x: left, y: top, width: right - left, height: bottom - top });
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const selectFullImage = () => {
    const canvas = canvasRef.current;
    if (canvas) setCrop({ x: 0, y: 0, width: canvas.width, height: canvas.height });
  };

  const applyCrop = () => {
    const source = imageRef.current;
    const display = canvasRef.current;
    if (!source || !display || crop.width < 1 || crop.height < 1) return;
    const scaleX = source.naturalWidth / display.width;
    const scaleY = source.naturalHeight / display.height;
    const output = document.createElement("canvas");
    output.width = Math.max(1, Math.round(crop.width * scaleX));
    output.height = Math.max(1, Math.round(crop.height * scaleY));
    const context = output.getContext("2d");
    if (!context) return;
    context.drawImage(
      source,
      crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY,
      0, 0, output.width, output.height,
    );
    onApply(output.toDataURL("image/jpeg", 0.94));
  };

  return (
    <div className="cropper-backdrop" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
      <div className="cropper-dialog">
        <div className="cropper-heading">
          <div>
            <span>{language === "en" ? "Step 2 / 2" : "步骤 2 / 2"}</span>
            <h3 id="cropper-title">{language === "en" ? "Select the stone area" : "框选需要识别的石头"}</h3>
            <p>{language === "en" ? "Drag inside the box to move it, or drag the corners to resize. Try to exclude hands and complex backgrounds." : "拖动框内可移动，拖动四角可调整大小；尽量排除手部和复杂背景。"}</p>
          </div>
          <button type="button" className="cropper-close" onClick={onCancel} aria-label={language === "en" ? "Close cropper" : "关闭裁剪"}>×</button>
        </div>
        <div className="cropper-canvas-shell">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label={language === "en" ? "Stone image crop area" : "石头图片裁剪区域"}
          />
        </div>
        <div className="cropper-actions">
          <button type="button" className="cropper-text-button" onClick={selectFullImage}>{language === "en" ? "Use full image" : "使用整张图片"}</button>
          <div>
            <button type="button" className="secondary-button" onClick={onCancel}>{language === "en" ? "Cancel" : "取消"}</button>
            <button type="button" className="primary-button" onClick={applyCrop} disabled={!ready}>{language === "en" ? "Use selected area" : "使用框选区域"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
