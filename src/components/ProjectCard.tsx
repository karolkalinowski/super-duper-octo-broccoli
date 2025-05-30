import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Project } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Trash2, Copy, FolderPen, FolderOpen } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onCopy: (project: Project) => void;
  onRename: (projectId: string, newName: string) => void;
  onOpen: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onDelete,
  onCopy,
  onRename,
  onOpen,
}: ProjectCardProps) {
  const { t } = useTranslation(["projects", "common", "validation"]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editedProjectName, setEditedProjectName] = useState("");

  const handleRename = () => {
    if (!editedProjectName.trim()) {
      toast.error(t("validation:projectNameEmpty"));
      return;
    }
    onRename(project.id, editedProjectName.trim());
    setEditingProjectId(null);
    setEditedProjectName("");
  };

  return (
    <Card className="bg-card text-foreground border">
      <CardHeader>
        <CardTitle className="text-foreground">{project.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {t("common:created")}:{" "}
          {new Date(project.createdAt).toLocaleDateString()}
          <br />
          {t("common:updated")}:{" "}
          {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {project.nodes.length} {t("common:nodes")}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpen(project.id)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t("common:open")}
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingProjectId(project.id);
                setEditedProjectName(project.name);
              }}
            >
              <FolderPen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("projects:renameTooltip")}</TooltipContent>
        </Tooltip>

        <Dialog
          open={editingProjectId === project.id}
          onOpenChange={(open) => !open && setEditingProjectId(null)}
        >
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {t("projects:renameTitle")}
              </DialogTitle>
            </DialogHeader>
            <Input
              value={editedProjectName}
              onChange={(e) => setEditedProjectName(e.target.value)}
              placeholder={t("projects:namePlaceholder")}
              maxLength={50}
              className="bg-background text-foreground"
            />
            <Button onClick={handleRename}>{t("projects:renameButton")}</Button>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onCopy(project)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("projects:copyTooltip")}</TooltipContent>
        </Tooltip>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {t("projects:deleteTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {t("projects:deleteDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-foreground">
                {t("common:cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(project.id)}
                className="bg-destructive text-destructive-foreground"
              >
                {t("common:delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
