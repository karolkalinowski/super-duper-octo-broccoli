import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { useState } from "react";
import type { StoryNode } from "@/types";

interface CausesSelectorProps {
  selectedCauses: string[];
  availableNodes: StoryNode[];
  currentNodeId: string;
  currentNodeOrder?: number;
  onAddCause: (nodeId: string) => void;
  onRemoveCause: (nodeId: string) => void;
  onError: (message: string) => void;
  t: (key: string) => string;
}

export function CausesSelector({
  selectedCauses,
  availableNodes,
  currentNodeId,
  currentNodeOrder = 0,
  onAddCause,
  onRemoveCause,
  onError,
  t,
}: CausesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredNodes = searchQuery
    ? availableNodes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          n.id !== currentNodeId &&
          n.order < currentNodeOrder
      )
    : [];

  const handleAddCause = (nodeId: string) => {
    if (selectedCauses.includes(nodeId)) {
      return;
    }

    const causeNode = availableNodes.find((n) => n.id === nodeId);

    if (causeNode && causeNode.order >= currentNodeOrder) {
      onError(t("validation:invalidCausalityOrder"));
      setSearchQuery("");
      setIsSearchOpen(false);
      return;
    }

    onAddCause(nodeId);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <div>
      <Label htmlFor="causes" className="text-foreground mb-1">
        {t("nodeForm:causesLabel")}
      </Label>
      <div className="relative">
        <Command className="rounded-lg border">
          <CommandInput
            placeholder={t("nodeForm:causesPlaceholder")}
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              setIsSearchOpen(!!value);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />

          {isSearchOpen && (
            <CommandList className="absolute top-full w-full bg-card shadow-lg z-10 border rounded-b-md mt-1">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node) => (
                  <CommandItem
                    key={node.id}
                    value={node.title}
                    onSelect={() => handleAddCause(node.id)}
                    className="cursor-pointer hover:bg-accent/50 p-2"
                  >
                    {node.title}
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty className="p-2 text-muted-foreground">
                  {searchQuery
                    ? t("nodeForm:noCausesFound")
                    : t("nodeForm:noNodesFound")}
                </CommandEmpty>
              )}
            </CommandList>
          )}
        </Command>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {selectedCauses.map((causeId) => {
          const causeNode = availableNodes.find((n) => n.id === causeId);
          return (
            <Badge
              key={causeId}
              variant="outline"
              className="text-foreground cursor-pointer hover:bg-accent"
              onClick={() => onRemoveCause(causeId)}
            >
              {causeNode?.title}
              <span className="ml-2">×</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
