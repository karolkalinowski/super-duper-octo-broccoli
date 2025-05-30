import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { StoryNode, Project } from "@/types";
import { useStore } from "@/store";
import { NodeFormFields } from "./NodeFormFields";
import { CausesSelector } from "./CausesSelector";
import { TagsSelector } from "./TagsSelector";
import { AIGenerateButton } from "./AIGenerateButton";

interface NodeFormProps {
  node?: StoryNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (node: StoryNode) => void;
  availableNodes: StoryNode[];
  project: Project;
}

export default function NodeForm({
  node,
  open,
  onOpenChange,
  onSubmit,
  availableNodes,
  project,
}: NodeFormProps) {
  const { t } = useTranslation(["nodeForm", "common", "validation"]);
  const { settings } = useStore();
  const [formData, setFormData] = useState<StoryNode>(
    node || {
      id: "",
      title: "",
      description: "",
      causes: [],
      tags: [],
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ title: string; description: string }>
  >([]);

  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    project.nodes.forEach((node) => {
      node.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [project.nodes]);

  // Sprawdź czy węzeł jest przyczyną innych węzłów
  const isNodeCauseOfOthers = useMemo(() => {
    if (!formData.id) return false;
    return project.nodes.some((node) => node.causes.includes(formData.id));
  }, [formData.id, project.nodes]);

  // Określ czy pokazać przycisk AI
  const shouldShowAIButton = useMemo(() => {
    const hasApiKey = !!settings.geminiApiKey;
    const hasCauses = formData.causes.length > 0;
    const isCauseOfOthers = isNodeCauseOfOthers;

    return hasApiKey && (hasCauses || isCauseOfOthers);
  }, [settings.geminiApiKey, formData.causes.length, isNodeCauseOfOthers]);

  useEffect(() => {
    if (node) {
      setFormData(node);
    } else {
      const maxOrder =
        availableNodes.length > 0
          ? Math.max(...availableNodes.map((n) => n.order))
          : -1;

      setFormData({
        id: "",
        title: "",
        description: "",
        causes: [],
        tags: [],
        order: maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setErrorMessage(null);
    setAiSuggestions([]);
  }, [node, open, availableNodes]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleFieldChange = (field: keyof StoryNode, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddCause = (nodeId: string) => {
    setFormData({
      ...formData,
      causes: [...formData.causes, nodeId],
    });
  };

  const handleRemoveCause = (nodeId: string) => {
    setFormData({
      ...formData,
      causes: formData.causes.filter((id) => id !== nodeId),
    });
  };

  const handleAddTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: [...formData.tags, tag],
    });
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  };

  const handleGenerateAI = async () => {
    if (!settings.geminiApiKey) {
      setErrorMessage(t("validation:noApiKey"));
      return;
    }

    setIsGenerating(true);
    setAiSuggestions([]);

    try {
      const { generateNodeSuggestions } = await import("@/lib/gemini");
      const suggestions = await generateNodeSuggestions(
        settings.geminiApiKey,
        project,
        formData
      );

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      setErrorMessage(
        error instanceof Error
          ? `AI Error: ${error.message}`
          : t("validation:aiGenerationFailed")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: {
    title: string;
    description: string;
  }) => {
    setFormData({
      ...formData,
      title: suggestion.title,
      description: suggestion.description,
      updatedAt: new Date(),
    });
    setAiSuggestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {node ? t("nodeForm:editTitle") : t("nodeForm:createTitle")}
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <div className="text-destructive text-sm font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        <div className="space-y-6 flex-1 overflow-y-auto">
          {shouldShowAIButton && (
            <AIGenerateButton
              onGenerate={handleGenerateAI}
              disabled={isGenerating}
              t={t}
            />
          )}

          {isGenerating && (
            <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-muted-foreground">
                {t("nodeForm:generatingAI")}
              </span>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                {t("nodeForm:aiSuggestions")}
              </h3>
              {aiSuggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleApplySuggestion(suggestion)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {suggestion.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiSuggestions([])}
                className="w-full"
              >
                {t("nodeForm:closeSuggestions")}
              </Button>
            </div>
          )}

          <NodeFormFields
            formData={formData}
            onChange={handleFieldChange}
            t={t}
          />

          <CausesSelector
            selectedCauses={formData.causes}
            availableNodes={availableNodes}
            currentNodeId={formData.id}
            currentNodeOrder={formData.order}
            onAddCause={handleAddCause}
            onRemoveCause={handleRemoveCause}
            onError={handleError}
            t={t}
          />

          <TagsSelector
            selectedTags={formData.tags}
            existingTags={existingTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            t={t}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {node ? t("common:saveChanges") : t("common:create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
