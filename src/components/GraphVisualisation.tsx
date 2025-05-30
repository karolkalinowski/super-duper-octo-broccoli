import React, { useRef, useEffect, useState, useCallback } from "react";
import type { StoryNode } from "@/types";
import { useStore } from "@/store";

interface GraphVisualizationProps {
  nodes: StoryNode[];
  projectId: string;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface TouchState {
  touches: Array<{ id: number; x: number; y: number }>;
  lastDistance?: number;
  lastCenter?: { x: number; y: number };
}

const getTagColors = (tagName: string): { bg: string; text: string } => {
  const colors = [
    { bg: "#fecaca", text: "#991b1b" },
    { bg: "#bfdbfe", text: "#1e40af" },
    { bg: "#bbf7d0", text: "#166534" },
    { bg: "#ddd6fe", text: "#6b21a8" },
    { bg: "#fbcfe8", text: "#9d174d" },
    { bg: "#c7d2fe", text: "#3730a3" },
    { bg: "#99f6e4", text: "#115e59" },
    { bg: "#fde68a", text: "#92400e" },
  ];
  const hash = tagName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % colors.length;
  return colors[index];
};

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  projectId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<{
    type: "node" | "canvas";
    nodeId?: string;
    startX: number;
    startY: number;
    startViewX: number;
    startViewY: number;
  } | null>(null);
  const [touchState, setTouchState] = useState<TouchState>({ touches: [] });

  const { updateNodePosition } = useStore();

  const calculateNodeDimensions = useCallback(
    (node: StoryNode, ctx: CanvasRenderingContext2D) => {
      const width = 200;
      const padding = 8;
      const lineHeight = 18;
      const tagHeight = 16;
      const tagSpacing = 4;
      const sectionSpacing = 8;

      ctx.font = "14px Inter, sans-serif";
      const maxTitleWidth = width - padding * 2;
      const titleLines = wrapText(ctx, node.title, maxTitleWidth);
      const titleHeight = titleLines.length * lineHeight;

      let tagsHeight = 0;
      if (node.tags.length > 0) {
        ctx.font = "10px Inter, sans-serif";
        const maxTagsWidth = width - padding * 2;
        const tagRows = calculateTagRows(ctx, node.tags, maxTagsWidth);
        tagsHeight = tagRows.length * (tagHeight + tagSpacing) - tagSpacing;
      }

      const totalHeight =
        padding +
        titleHeight +
        (tagsHeight > 0 ? sectionSpacing + tagsHeight : 0) +
        padding;

      return {
        width,
        height: Math.max(80, totalHeight),
      };
    },
    []
  );

  const calculateTagRows = useCallback(
    (ctx: CanvasRenderingContext2D, tags: string[], maxWidth: number) => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentRowWidth = 0;
      const tagSpacing = 4;

      for (const tag of tags) {
        const tagWidth = ctx.measureText(tag).width + 12;

        if (currentRow.length === 0) {
          currentRow.push(tag);
          currentRowWidth = tagWidth;
        } else if (currentRowWidth + tagSpacing + tagWidth <= maxWidth) {
          currentRow.push(tag);
          currentRowWidth += tagSpacing + tagWidth;
        } else {
          rows.push([...currentRow]);
          currentRow = [tag];
          currentRowWidth = tagWidth;
        }
      }

      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      return rows;
    },
    []
  );

  useEffect(() => {
    if (nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const positions: NodePosition[] = nodes.map((node, index) => {
      const savedPos = node.position;
      const defaultX = 100 + (index % 3) * 300;
      const defaultY = 100 + Math.floor(index / 3) * 200;

      const dimensions = calculateNodeDimensions(node, ctx);

      return {
        id: node.id,
        x: savedPos?.x ?? defaultX,
        y: savedPos?.y ?? defaultY,
        width: dimensions.width,
        height: dimensions.height,
      };
    });

    setNodePositions(positions);
  }, [nodes, calculateNodeDimensions]);

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - viewState.offsetX) / viewState.scale;
      const y = (screenY - rect.top - viewState.offsetY) / viewState.scale;
      return { x, y };
    },
    [viewState.offsetX, viewState.offsetY, viewState.scale]
  );

  const getNodeAtPosition = useCallback(
    (x: number, y: number): string | null => {
      for (const pos of nodePositions) {
        if (
          x >= pos.x &&
          x <= pos.x + pos.width &&
          y >= pos.y &&
          y <= pos.y + pos.height
        ) {
          return pos.id;
        }
      }
      return null;
    },
    [nodePositions]
  );

  const calculateCurve = (from: NodePosition, to: NodePosition) => {
    const fromCenterX = from.x + from.width / 2;
    const fromBottomY = from.y + from.height;
    const toCenterX = to.x + to.width / 2;
    const toTopY = to.y;

    const dx = toCenterX - fromCenterX;
    const dy = toTopY - fromBottomY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const curvature = Math.min(distance * 0.3, 100);

    const cp1x = fromCenterX;
    const cp1y = fromBottomY + curvature;
    const cp2x = toCenterX;
    const cp2y = toTopY - curvature;

    return {
      startX: fromCenterX,
      startY: fromBottomY,
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      endX: toCenterX,
      endY: toTopY,
    };
  };

  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number
  ) => {
    const headLength = 15;
    const headAngle = Math.PI / 6;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      -headLength * Math.cos(headAngle),
      -headLength * Math.sin(headAngle)
    );
    ctx.lineTo(
      -headLength * Math.cos(-headAngle),
      -headLength * Math.sin(-headAngle)
    );
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 3);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.scale, viewState.scale);

    nodes.forEach((node) => {
      const nodePos = nodePositions.find((p) => p.id === node.id);
      if (!nodePos) return;

      node.causes.forEach((causeId) => {
        const causePos = nodePositions.find((p) => p.id === causeId);
        if (!causePos) return;

        const curve = calculateCurve(causePos, nodePos);

        ctx.lineWidth = 8;
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(curve.startX, curve.startY);
        ctx.bezierCurveTo(
          curve.cp1x,
          curve.cp1y,
          curve.cp2x,
          curve.cp2y,
          curve.endX,
          curve.endY
        );
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(curve.startX, curve.startY);
        ctx.bezierCurveTo(
          curve.cp1x,
          curve.cp1y,
          curve.cp2x,
          curve.cp2y,
          curve.endX,
          curve.endY
        );
        ctx.stroke();

        const angle = Math.atan2(
          curve.endY - curve.cp2y,
          curve.endX - curve.cp2x
        );
        drawArrowHead(ctx, curve.endX, curve.endY, angle);
      });
    });

    nodePositions.forEach((pos) => {
      const node = nodes.find((n) => n.id === pos.id);
      if (!node) return;

      ctx.fillStyle = "#1F2937";
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
      ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

      const padding = 8;
      const lineHeight = 18;
      const tagHeight = 16;
      const tagSpacing = 4;
      const sectionSpacing = 8;
      let currentY = pos.y + padding;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const maxTitleWidth = pos.width - padding * 2;
      const titleLines = wrapText(ctx, node.title, maxTitleWidth);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, pos.x + padding, currentY + index * lineHeight);
      });
      currentY += titleLines.length * lineHeight + sectionSpacing;

      if (node.tags.length > 0) {
        ctx.font = "10px Inter, sans-serif";
        const maxTagsWidth = pos.width - padding * 2;
        const tagRows = calculateTagRows(ctx, node.tags, maxTagsWidth);

        tagRows.forEach((row, rowIndex) => {
          let tagX = pos.x + padding;
          const tagY = currentY + rowIndex * (tagHeight + tagSpacing);

          row.forEach((tagName) => {
            const tagColors = getTagColors(tagName);
            const tagWidth = ctx.measureText(tagName).width + 12;

            ctx.fillStyle = tagColors.bg;
            const radius = 8;
            ctx.beginPath();
            ctx.roundRect(tagX, tagY, tagWidth, tagHeight, radius);
            ctx.fill();

            ctx.fillStyle = tagColors.text;
            ctx.fillText(tagName, tagX + 6, tagY + 3);

            tagX += tagWidth + tagSpacing;
          });
        });
      }
    });

    ctx.restore();
  }, [nodes, nodePositions, viewState, calculateTagRows]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const nodeId = getNodeAtPosition(canvasPos.x, canvasPos.y);

    if (nodeId) {
      setDragState({
        type: "node",
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        startViewX: viewState.offsetX,
        startViewY: viewState.offsetY,
      });
    } else {
      setDragState({
        type: "canvas",
        startX: e.clientX,
        startY: e.clientY,
        startViewX: viewState.offsetX,
        startViewY: viewState.offsetY,
      });
    }
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    if (dragState.type === "canvas") {
      setViewState((prev) => ({
        ...prev,
        offsetX: dragState.startViewX + deltaX,
        offsetY: dragState.startViewY + deltaY,
      }));
    } else if (dragState.type === "node" && dragState.nodeId) {
      setNodePositions((prev) =>
        prev.map((pos) =>
          pos.id === dragState.nodeId
            ? {
                ...pos,
                x: pos.x + deltaX / viewState.scale,
                y: pos.y + deltaY / viewState.scale,
              }
            : pos
        )
      );
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              startX: e.clientX,
              startY: e.clientY,
            }
          : null
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragState?.type === "node" && dragState.nodeId) {
      const nodePos = nodePositions.find((pos) => pos.id === dragState.nodeId);
      if (nodePos) {
        updateNodePosition(projectId, dragState.nodeId, {
          x: nodePos.x,
          y: nodePos.y,
        });
      }
    }

    setIsDragging(false);
    setDragState(null);
  };

  const getTouchDistance = useCallback(
    (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.1,
        Math.min(3, viewState.scale * scaleFactor)
      );

      const worldX = (mouseX - viewState.offsetX) / viewState.scale;
      const worldY = (mouseY - viewState.offsetY) / viewState.scale;

      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;

      setViewState((prev) => ({
        ...prev,
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      }));
    };

    canvas.addEventListener("wheel", handleWheelEvent, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent);
    };
  }, [viewState.scale, viewState.offsetX, viewState.offsetY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStartEvent = (e: TouchEvent) => {
      e.preventDefault();

      const touches = Array.from(e.touches).map((touch) => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      }));

      setTouchState({ touches });

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
        const nodeId = getNodeAtPosition(canvasPos.x, canvasPos.y);

        if (nodeId) {
          setDragState({
            type: "node",
            nodeId,
            startX: touch.clientX,
            startY: touch.clientY,
            startViewX: viewState.offsetX,
            startViewY: viewState.offsetY,
          });
        } else {
          setDragState({
            type: "canvas",
            startX: touch.clientX,
            startY: touch.clientY,
            startViewX: viewState.offsetX,
            startViewY: viewState.offsetY,
          });
        }
        setIsDragging(true);
      } else if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        setTouchState({
          touches,
          lastDistance: distance,
          lastCenter: center,
        });
        setIsDragging(false);
        setDragState(null);
      }
    };

    const handleTouchMoveEvent = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging && dragState) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragState.startX;
        const deltaY = touch.clientY - dragState.startY;

        if (dragState.type === "canvas") {
          setViewState((prev) => ({
            ...prev,
            offsetX: dragState.startViewX + deltaX,
            offsetY: dragState.startViewY + deltaY,
          }));
        } else if (dragState.type === "node" && dragState.nodeId) {
          setNodePositions((prev) =>
            prev.map((pos) =>
              pos.id === dragState.nodeId
                ? {
                    ...pos,
                    x: pos.x + deltaX / viewState.scale,
                    y: pos.y + deltaY / viewState.scale,
                  }
                : pos
            )
          );
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  startX: touch.clientX,
                  startY: touch.clientY,
                }
              : null
          );
        }
      } else if (
        e.touches.length === 2 &&
        touchState.lastDistance &&
        touchState.lastCenter
      ) {
        const rect = canvas.getBoundingClientRect();
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        const scaleFactor = distance / touchState.lastDistance;
        const newScale = Math.max(
          0.1,
          Math.min(3, viewState.scale * scaleFactor)
        );

        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;
        const lastCenterX = touchState.lastCenter.x - rect.left;
        const lastCenterY = touchState.lastCenter.y - rect.top;

        const worldX = (centerX - viewState.offsetX) / viewState.scale;
        const worldY = (centerY - viewState.offsetY) / viewState.scale;

        const newOffsetX =
          centerX - worldX * newScale + (centerX - lastCenterX);
        const newOffsetY =
          centerY - worldY * newScale + (centerY - lastCenterY);

        setViewState({
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });

        setTouchState({
          touches: Array.from(e.touches).map((touch) => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
          })),
          lastDistance: distance,
          lastCenter: center,
        });
      }
    };

    const handleTouchEndEvent = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 0) {
        if (isDragging && dragState?.type === "node" && dragState.nodeId) {
          const nodePos = nodePositions.find(
            (pos) => pos.id === dragState.nodeId
          );
          if (nodePos) {
            updateNodePosition(projectId, dragState.nodeId, {
              x: nodePos.x,
              y: nodePos.y,
            });
          }
        }

        setIsDragging(false);
        setDragState(null);
        setTouchState({ touches: [] });
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
        const nodeId = getNodeAtPosition(canvasPos.x, canvasPos.y);

        if (nodeId) {
          setDragState({
            type: "node",
            nodeId,
            startX: touch.clientX,
            startY: touch.clientY,
            startViewX: viewState.offsetX,
            startViewY: viewState.offsetY,
          });
        } else {
          setDragState({
            type: "canvas",
            startX: touch.clientX,
            startY: touch.clientY,
            startViewX: viewState.offsetX,
            startViewY: viewState.offsetY,
          });
        }
        setIsDragging(true);
        setTouchState({
          touches: [
            {
              id: touch.identifier,
              x: touch.clientX,
              y: touch.clientY,
            },
          ],
        });
      }
    };

    canvas.addEventListener("touchstart", handleTouchStartEvent, {
      passive: false,
    });
    canvas.addEventListener("touchmove", handleTouchMoveEvent, {
      passive: false,
    });
    canvas.addEventListener("touchend", handleTouchEndEvent, {
      passive: false,
    });
    canvas.addEventListener("touchcancel", handleTouchEndEvent, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStartEvent);
      canvas.removeEventListener("touchmove", handleTouchMoveEvent);
      canvas.removeEventListener("touchend", handleTouchEndEvent);
      canvas.removeEventListener("touchcancel", handleTouchEndEvent);
    };
  }, [
    isDragging,
    dragState,
    touchState,
    viewState,
    nodePositions,
    projectId,
    screenToCanvas,
    getNodeAtPosition,
    getTouchDistance,
    getTouchCenter,
    updateNodePosition,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const checkVisibility = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const isVisible = parentRect.width > 0 && parentRect.height > 0;

      if (isVisible && (canvas.width === 0 || canvas.height === 0)) {
        setTimeout(() => {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          draw();
        }, 10);
      }
    };

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        checkVisibility();
      });

      const parent = canvas.parentElement;
      if (parent) {
        resizeObserver.observe(parent);
      }

      return () => resizeObserver.disconnect();
    } else {
      const intervalId = setInterval(checkVisibility, 100);
      return () => clearInterval(intervalId);
    }
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
      }
    };

    resizeCanvas();

    const timeoutId = setTimeout(resizeCanvas, 50);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(timeoutId);
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default GraphVisualization;
