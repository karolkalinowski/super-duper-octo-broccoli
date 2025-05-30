import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getTagColor } from "@/lib/utils";

interface TagsSelectorProps {
  selectedTags: string[];
  existingTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  t: (key: string) => string;
}

export function TagsSelector({
  selectedTags,
  existingTags,
  onAddTag,
  onRemoveTag,
  t,
}: TagsSelectorProps) {
  const [tagInput, setTagInput] = useState("");
  const [isTagSearchOpen, setIsTagSearchOpen] = useState(false);

  const filteredTags = tagInput
    ? existingTags.filter(
        (tag) =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !selectedTags.includes(tag)
      )
    : [];

  const handleAddTag = (tagName?: string) => {
    const newTag = tagName || tagInput.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      onAddTag(newTag);
      setTagInput("");
      setIsTagSearchOpen(false);
    }
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    setIsTagSearchOpen(!!value && filteredTags.length > 0);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setIsTagSearchOpen(false);
    }
  };

  return (
    <div>
      <Label htmlFor="tags" className="text-foreground mb-1">
        {t("nodeForm:tagsLabel")}
      </Label>
      <div className="relative">
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => handleTagInputChange(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            onFocus={() =>
              setIsTagSearchOpen(!!tagInput && filteredTags.length > 0)
            }
            className="bg-background text-foreground"
            placeholder={t("nodeForm:tagsPlaceholder")}
          />
          <Button
            variant="outline"
            onClick={() => handleAddTag()}
            type="button"
          >
            {t("nodeForm:addTag")}
          </Button>
        </div>

        {isTagSearchOpen && filteredTags.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-card shadow-lg z-20 border rounded-b-md mt-1 max-h-32 overflow-y-auto">
            {filteredTags.map((tag) => (
              <div
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="cursor-pointer hover:bg-accent/50 p-2 text-sm border-b last:border-b-0"
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={`cursor-pointer ${getTagColor(tag).bg} ${
              getTagColor(tag).text
            }`}
            onClick={() => onRemoveTag(tag)}
          >
            {tag}
            <span className="ml-2">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
