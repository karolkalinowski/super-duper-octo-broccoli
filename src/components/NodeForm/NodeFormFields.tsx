import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StoryNode } from "@/types";

interface NodeFormFieldsProps {
  formData: StoryNode;
  onChange: (field: keyof StoryNode, value: string) => void;
  t: (key: string) => string;
}

export function NodeFormFields({ formData, onChange, t }: NodeFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground mb-1">
          {t("nodeForm:titleLabel")}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onChange("title", e.target.value)}
          maxLength={50}
          className="bg-background text-foreground"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-foreground mb-1">
          {t("nodeForm:descriptionLabel")}
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={4}
          className="bg-background text-foreground"
        />
      </div>
    </div>
  );
}
