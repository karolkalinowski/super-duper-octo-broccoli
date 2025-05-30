import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { List, Network } from "lucide-react";
import { useStore } from "@/store";
import NodeList from "@/components/NodeList";
import NodeForm from "@/components/NodeForm/NodeForm";
import GraphVisualization from "@/components/GraphVisualisation";
import { useTranslation } from "react-i18next";
import type { Project, StoryNode } from "@/types";
import SettingsDropdown from "./SettingsDropdown";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

export default function ProjectWorkspace({
  project,
  onBack,
}: ProjectWorkspaceProps) {
  const { t } = useTranslation(["common", "validation"]);
  const { deleteNode, updateNode, updateNodeOrder, addNode } = useStore();
  const [editingNode, setEditingNode] = useState<StoryNode | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"list" | "graph">("list");

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleEditNode = (node: StoryNode) => {
    setEditingNode(node);
    setFormOpen(true);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (project.nodes.some((n) => n.causes.includes(nodeId))) {
      setErrorMessage(t("validation:cantDeleteUsedNode"));
      return;
    }
    deleteNode(project.id, nodeId);
  };

  const handleSortNodes = (nodes: StoryNode[]) => {
    const causalityErrors = nodes.some((node) =>
      node.causes.some((causeId) => {
        const causeNode = nodes.find((n) => n.id === causeId);
        return causeNode && nodes.indexOf(causeNode) > nodes.indexOf(node);
      })
    );

    if (causalityErrors) {
      setErrorMessage(t("validation:invalidCausalityOrder"));
      return;
    }

    updateNodeOrder(project.id, nodes);
  };

  const handleFormSubmit = (nodeData: StoryNode) => {
    if (editingNode) {
      updateNode(project.id, editingNode.id, {
        ...nodeData,
        updatedAt: new Date(),
      });
    } else {
      addNode(project.id, {
        ...nodeData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setFormOpen(false);
    setEditingNode(undefined);
  };

  return (
    <div className="container mx-auto p-4">
      {errorMessage && (
        <div className="group fixed bottom-4 right-4 z-50 pointer-events-auto w-full max-w-sm p-4 pr-6 shadow-lg rounded-md border bg-background text-foreground transition-all data-[state=open]:animate-in data-[state=closed]:animate-out">
          <div className="grid gap-1">
            <div className="text-sm font-semibold text-destructive">
              {t("common:error")}
            </div>
            <div className="text-sm opacity-90">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={onBack}
                  className="cursor-pointer hover:text-foreground"
                >
                  {t("projects:backToProjects")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink className="text-foreground font-semibold">
                  {project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <SettingsDropdown />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setActiveView(activeView === "list" ? "graph" : "list")
            }
            className="md:hidden"
            aria-label={activeView === "list" ? "Show graph" : "Show list"}
          >
            {activeView === "list" ? (
              <Network className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100dvh-120px)] md:h-[calc(100vh-84px)]">
        <div
          className={`h-full w-full md:w-[350px] md:flex-shrink-0 ${
            activeView === "list" ? "block" : "hidden md:block"
          } border rounded-lg p-4 bg-card`}
        >
          <NodeList
            nodes={project.nodes}
            onAdd={() => {
              setEditingNode(undefined);
              setFormOpen(true);
            }}
            onEdit={handleEditNode}
            onDelete={handleDeleteNode}
            onSort={handleSortNodes}
          />
        </div>
        <div
          className={`w-full md:flex-1 ${
            activeView === "graph" ? "block" : "hidden md:block"
          } border rounded-lg bg-card overflow-hidden h-full`}
        >
          <div className="h-full">
            <GraphVisualization nodes={project.nodes} projectId={project.id} />
          </div>
        </div>
      </div>

      <NodeForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingNode(undefined);
        }}
        node={editingNode}
        onSubmit={handleFormSubmit}
        availableNodes={project.nodes}
        project={project}
      />
    </div>
  );
}
