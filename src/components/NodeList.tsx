import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Hash,
  ArrowRightToLine,
  ArrowRightFromLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StoryNode } from "@/types";
import { getTagColor } from "@/lib/utils";

interface NodeListProps {
  nodes: StoryNode[];
  onAdd: () => void;
  onEdit: (node: StoryNode) => void;
  onDelete: (nodeId: string) => void;
  onSort: (nodes: StoryNode[]) => void;
}

function SortableNode({
  node,
  onEdit,
  onDelete,
}: {
  node: StoryNode;
  onEdit: (node: StoryNode) => void;
  onDelete: (nodeId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-4 mb-2 bg-card text-foreground rounded-lg shadow-sm border"
      data-node-id={node.id}
    >
      <button
        {...attributes}
        {...listeners}
        className="hover:bg-accent p-1 rounded-md"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <h3 className="font-medium">{node.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {node.description}
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(node)}
        className="hover:bg-accent"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDelete(node.id)}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function NodePreview({
  node,
  nodes,
  onEdit,
  onDelete,
}: {
  node: StoryNode;
  nodes: StoryNode[];
  onEdit: (node: StoryNode) => void;
  onDelete: (nodeId: string) => void;
}) {
  const getCauseNodes = () => {
    return node.causes
      .map((causeId) => nodes.find((n) => n.id === causeId))
      .filter(Boolean) as StoryNode[];
  };

  const causeNodes = getCauseNodes();

  const getEffectNodes = () => {
    return nodes.filter((n) => n.causes.includes(node.id));
  };

  const effectNodes = getEffectNodes();

  return (
    <div
      className="flex items-start gap-2 p-4 mb-2 bg-card text-foreground rounded-lg shadow-sm border"
      data-node-id={node.id}
    >
      <div className="flex-1 space-y-2">
        <h3 className="font-medium">{node.title}</h3>
        <p className="text-sm text-muted-foreground">{node.description}</p>

        {causeNodes.length > 0 && (
          <div className="flex">
            <ArrowRightToLine className="h-4 w-4 text-muted-foreground mt-1 mr-1 shrink-0 grow-0" />
            <div className="flex flex-wrap gap-1">
              {causeNodes.map((causeNode) => (
                <span
                  key={causeNode.id}
                  className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md"
                >
                  {causeNode.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {effectNodes.length > 0 && (
          <div className="flex">
            <ArrowRightFromLine className="h-4 w-4 text-muted-foreground mt-1 mr-1 shrink-0 grow-0" />
            <div className="flex flex-wrap gap-1">
              {effectNodes.map((effectNode) => (
                <span
                  key={effectNode.id}
                  className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md"
                >
                  {effectNode.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.tags.length > 0 && (
          <div className="flex">
            <Hash className="h-4 w-4 text-muted-foreground mt-1 mr-1 shrink-0 grow-0" />
            <div className="flex flex-wrap gap-1">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 ${getTagColor(tag).bg} ${
                    getTagColor(tag).text
                  } rounded-md`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 mt-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(node)}
          className="hover:bg-accent h-8 w-8"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(node.id)}
          className="text-destructive hover:bg-destructive/10 h-8 w-8"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function NodeList({
  nodes,
  onAdd,
  onEdit,
  onDelete,
  onSort,
}: NodeListProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const prevNodesLength = useRef(nodes.length);

  // Zapisujemy aktualną pozycję scrolla jako względną (0-1)
  const [scrollPosition, setScrollPosition] = useState(0);

  // Funkcja do zapisania aktualnej pozycji scrolla
  const saveScrollPosition = () => {
    const container = containerRef.current;
    if (!container) return;

    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll > 0) {
      const relativePosition = container.scrollTop / maxScroll;
      setScrollPosition(relativePosition);
    }
  };

  // Funkcja do przywrócenia pozycji scrolla
  const restoreScrollPosition = () => {
    const container = containerRef.current;
    if (!container) return;

    // Używamy requestAnimationFrame żeby mieć pewność że DOM jest gotowy
    requestAnimationFrame(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const targetScrollTop = scrollPosition * maxScroll;
        container.scrollTop = targetScrollTop;
      }
    });
  };

  // Obsługa zmiany trybu z zachowaniem pozycji
  const handleSortModeChange = (newSortMode: boolean) => {
    saveScrollPosition();
    setIsSortMode(newSortMode);
  };

  // useEffect który przywraca pozycję po zmianie trybu
  useEffect(() => {
    if (scrollPosition > 0) {
      restoreScrollPosition();
    }
  }, [isSortMode]);

  useEffect(() => {
    if (nodes.length > prevNodesLength.current) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    prevNodesLength.current = nodes.length;
  }, [nodes.length]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((n) => n.id === String(active.id));
      const newIndex = nodes.findIndex((n) => n.id === String(over.id));
      const newNodes = arrayMove(nodes, oldIndex, newIndex);

      const updatedNodes = newNodes.map((node, index) => ({
        ...node,
        order: index,
        updatedAt: new Date(),
      }));

      onSort(updatedNodes);
    }
    setActiveId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Switch
            id="sort-mode"
            checked={isSortMode}
            onCheckedChange={handleSortModeChange}
          />
          <Label htmlFor="sort-mode" className="text-sm text-muted-foreground">
            {t("common:sortMode")}
          </Label>
        </div>
        <Button onClick={onAdd} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {t("common:addNode")}
        </Button>
      </div>

      {isSortMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={nodes} strategy={verticalListSortingStrategy}>
            <div ref={containerRef} className="flex-1 overflow-y-auto pr-2">
              {nodes.map((node) => (
                <SortableNode
                  key={node.id}
                  node={node}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="flex items-center gap-2 p-4 mb-2 bg-card text-foreground rounded-lg shadow-sm border opacity-50">
                <button className="hover:bg-accent p-1 rounded-md">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {nodes.find((n) => n.id === activeId)?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {nodes.find((n) => n.id === activeId)?.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto pr-2">
          {nodes.map((node) => (
            <NodePreview
              key={node.id}
              node={node}
              nodes={nodes}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
