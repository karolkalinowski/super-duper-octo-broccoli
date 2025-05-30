import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { useTranslation } from "react-i18next";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Plus, Save, CloudUpload } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import ProjectWorkspace from "@/components/ProjectWorkspace";
import SettingsDropdown from "@/components/SettingsDropdown";

export default function ProjectsList() {
  const { t } = useTranslation(["projects", "common", "validation"]);
  const {
    projects,
    addProject,
    deleteProject,
    copyProject,
    setProjects,
    updateProject,
  } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error(t("validation:projectNameEmpty"));
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
    };

    addProject(newProject);
    setIsDialogOpen(false);
    setNewProjectName("");
    toast.success(t("projects:createSuccess"));
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    toast.success(t("projects:deleteSuccess"));
  };

  const handleCopyProject = (project: Project) => {
    copyProject(project);
    toast.success(t("projects:copySuccess"));
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    updateProject(projectId, newName);
    toast.success(t("projects:renameSuccess"));
  };

  const handleExportProjects = () => {
    const data = JSON.stringify(projects);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "projects-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("projects:exportSuccess"));
  };

  const handleImportProjects = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const importedProjects: Project[] = JSON.parse(
          e.target?.result as string
        );
        const mergedProjects = [...projects];

        importedProjects.forEach((newProject) => {
          const exists = projects.some(
            (p) =>
              p.name === newProject.name &&
              JSON.stringify(p) === JSON.stringify(newProject)
          );

          if (!exists) {
            if (projects.some((p) => p.name === newProject.name)) {
              newProject.name = `${newProject.name} (${t("common:imported")})`;
            }
            mergedProjects.push(newProject);
          }
        });

        setProjects(mergedProjects);
        toast.success(t("projects:importSuccess"));
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing projects:", error);
      toast.error(t("projects:importError"));
    }
  };

  if (selectedProject) {
    return (
      <ProjectWorkspace
        project={selectedProject}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            {t("projects:title")}
          </h1>
          <SettingsDropdown />
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("projects:newProject")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {t("projects:createTitle")}
                </DialogTitle>
              </DialogHeader>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t("projects:namePlaceholder")}
                maxLength={50}
                className="bg-background text-foreground"
              />
              <Button onClick={handleCreateProject}>
                {t("projects:createButton")}
              </Button>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleExportProjects}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("projects:exportTooltip")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" asChild>
                <label htmlFor="import-projects">
                  <CloudUpload className="h-4 w-4" />
                  <input
                    id="import-projects"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportProjects}
                  />
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("projects:importTooltip")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={handleDeleteProject}
            onCopy={handleCopyProject}
            onRename={handleRenameProject}
            onOpen={setSelectedProjectId}
          />
        ))}
      </div>
    </div>
  );
}
