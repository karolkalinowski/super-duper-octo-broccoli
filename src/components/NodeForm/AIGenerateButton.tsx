import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface AIGenerateButtonProps {
  onGenerate: () => void;
  disabled: boolean;
  t: (key: string) => string;
}

export function AIGenerateButton({
  onGenerate,
  disabled,
  t,
}: AIGenerateButtonProps) {
  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={disabled}
      >
        <Wand2 className="mr-2 h-4 w-4" />
        {t("nodeForm:generateAI")}
      </Button>
    </div>
  );
}
