import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, AppSettings, StoryNode, NodePosition } from "@/types";

const INITIAL_PROJECTS_PL: Project[] = [
  {
    id: "377f3c98-ee7d-4047-bd7e-15287366c6af",
    name: "Czerwony Kapturek",
    createdAt: new Date(),
    updatedAt: new Date(),
    nodes: [
      {
        id: "742e167a-38d7-4279-8398-85fe1a9813ca",
        title: "Chora babcia",
        description: "Babcia zapada na zdrowiu, potrzebuje pomocy.",
        causes: [],
        tags: ["ekspozycja", "motywacja postaci"],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 100 },
      },
      {
        id: "f5cfa060-7628-430a-aef5-017eebcd0b3e",
        title: "Wyprawa z jedzeniem",
        description:
          "Matka wysyła Czerwonego Kapturka z podarunkami dla babci.",
        causes: ["742e167a-38d7-4279-8398-85fe1a9813ca"],
        tags: ["inicjacja akcji", "relacja rodzinna"],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 200 },
      },
      {
        id: "09e3833b-1557-400a-b3e4-80cde4c6852d",
        title: "Myśliwy wie o chorobie babci",
        description:
          "Myśliwy regularnie odwiedza babcię i zna jej stan zdrowia.",
        causes: [],
        tags: ["ekspozycja wiedzy postaci", "przygotowanie rozwiązania"],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 550, y: 200 },
      },
      {
        id: "5baddde2-2e6b-4d37-b7dd-1d35348524b0",
        title: "Drwale pracują w lesie",
        description: "Obecność drwali w pobliżu głównej ścieżki.",
        causes: [],
        tags: ["element ograniczający antagonistę"],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 300 },
      },
      {
        id: "1c606c18-598b-4659-90a4-e48964a820df",
        title: "Spotkanie z wilkiem",
        description:
          "Wilk wykorzystuje naiwność dziewczynki, by zdobyć informacje.",
        causes: ["f5cfa060-7628-430a-aef5-017eebcd0b3e"],
        tags: ["konflikt", "manipulacja"],
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 350 },
      },
      {
        id: "b96d8523-48ba-4e71-9407-65d329c70006",
        title: "Strategia uniknięcia drwali",
        description:
          "Wilk wybiera podstęp zamiast ataku ze strachu przed drwalami.",
        causes: [
          "5baddde2-2e6b-4d37-b7dd-1d35348524b0",
          "1c606c18-598b-4659-90a4-e48964a820df",
        ],
        tags: ["napięcie dramatyczne", "antagonistyczna taktyka"],
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 475 },
      },
      {
        id: "5e8dddd0-725a-4858-92c3-0abade8fa823",
        title: "Podwójna droga",
        description:
          "Wilk wykorzystuje krótszą ścieżkę, by uprzedzić Kapturka.",
        causes: ["b96d8523-48ba-4e71-9407-65d329c70006"],
        tags: ["ironia sytuacyjna", "foreshadowing"],
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 575 },
      },
      {
        id: "0246dde3-c9c7-4969-9b53-e2a748f28c64",
        title: "Pożarcie babci",
        description: "Wilk zjada babcię i przyjmuje jej tożsamość.",
        causes: ["5e8dddd0-725a-4858-92c3-0abade8fa823"],
        tags: ["punkt zwrotny", "upadek postaci"],
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 700 },
      },
      {
        id: "a9c49052-4a84-479f-914f-47990b553572",
        title: "Rozpoznanie podstępu",
        description: "Kapturek zauważa anomalie w wyglądzie 'babci'.",
        causes: ["0246dde3-c9c7-4969-9b53-e2a748f28c64"],
        tags: ["kryzys świadomości", "dialog ekspozycyjny"],
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 825 },
      },
      {
        id: "e228a89c-9f40-4b99-86bd-e819e1c6d348",
        title: "Pożarcie Czerwonego Kapturka",
        description: "Wilk pożera dziewczynkę po zdemaskowaniu podstępu.",
        causes: ["a9c49052-4a84-479f-914f-47990b553572"],
        tags: ["kulminacja zagrożenia", "moment najwyższego napięcia"],
        order: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 950 },
      },
      {
        id: "b82b0de6-35ec-46e6-a3d6-2fd92509d7e8",
        title: "Interwencja myśliwego",
        description:
          "Myśliwy, znając chorobę babci, reaguje na podejrzane odgłosy.",
        causes: [
          "09e3833b-1557-400a-b3e4-80cde4c6852d",
          "e228a89c-9f40-4b99-86bd-e819e1c6d348",
        ],
        tags: ["deus ex machina", "rozwiązanie konfliktu"],
        order: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 1075 },
      },
      {
        id: "71a08c92-efaa-4779-8bbe-4deb9cc65c98",
        title: "Wskrzeszenie przez kamienie",
        description:
          "Symboliczne oczyszczenie poprzez zastąpienie ofiar kamieniami.",
        causes: ["b82b0de6-35ec-46e6-a3d6-2fd92509d7e8"],
        tags: ["kara antagonisty", "symbolika moralna"],
        order: 11,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 1200 },
      },
    ],
  },
];

const INITIAL_PROJECTS_EN: Project[] = [
  {
    id: "377f3c98-ee7d-4047-bd7e-15287366c6af-en",
    name: "Little Red Riding Hood",
    createdAt: new Date(),
    updatedAt: new Date(),
    nodes: [
      {
        id: "742e167a-38d7-4279-8398-85fe1a9813ca-en",
        title: "Sick grandmother",
        description: "Grandmother falls ill and needs help.",
        causes: [],
        tags: ["exposition", "character motivation"],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 100 },
      },
      {
        id: "f5cfa060-7628-430a-aef5-017eebcd0b3e-en",
        title: "Journey with food",
        description:
          "Mother sends Little Red Riding Hood with gifts for grandmother.",
        causes: ["742e167a-38d7-4279-8398-85fe1a9813ca-en"],
        tags: ["inciting incident", "family relationship"],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 200 },
      },
      {
        id: "09e3833b-1557-400a-b3e4-80cde4c6852d-en",
        title: "Hunter knows about grandmother's illness",
        description:
          "Hunter regularly visits grandmother and knows her health condition.",
        causes: [],
        tags: ["character knowledge exposition", "solution setup"],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 550, y: 200 },
      },
      {
        id: "5baddde2-2e6b-4d37-b7dd-1d35348524b0-en",
        title: "Woodcutters work in the forest",
        description: "Presence of woodcutters near the main path.",
        causes: [],
        tags: ["antagonist limiting element"],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 300 },
      },
      {
        id: "1c606c18-598b-4659-90a4-e48964a820df-en",
        title: "Meeting with the wolf",
        description: "Wolf exploits the girl's naivety to gather information.",
        causes: ["f5cfa060-7628-430a-aef5-017eebcd0b3e-en"],
        tags: ["conflict", "manipulation"],
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 350 },
      },
      {
        id: "b96d8523-48ba-4e71-9407-65d329c70006-en",
        title: "Strategy to avoid woodcutters",
        description:
          "Wolf chooses deception over attack due to fear of woodcutters.",
        causes: [
          "5baddde2-2e6b-4d37-b7dd-1d35348524b0-en",
          "1c606c18-598b-4659-90a4-e48964a820df-en",
        ],
        tags: ["dramatic tension", "antagonist tactics"],
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 475 },
      },
      {
        id: "5e8dddd0-725a-4858-92c3-0abade8fa823-en",
        title: "Two paths",
        description:
          "Wolf uses the shorter path to reach grandmother's house first.",
        causes: ["b96d8523-48ba-4e71-9407-65d329c70006-en"],
        tags: ["situational irony", "foreshadowing"],
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 575 },
      },
      {
        id: "0246dde3-c9c7-4969-9b53-e2a748f28c64-en",
        title: "Devouring grandmother",
        description: "Wolf eats grandmother and assumes her identity.",
        causes: ["5e8dddd0-725a-4858-92c3-0abade8fa823-en"],
        tags: ["turning point", "character fall"],
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 700 },
      },
      {
        id: "a9c49052-4a84-479f-914f-47990b553572-en",
        title: "Recognition of deception",
        description:
          "Little Red notices anomalies in 'grandmother's' appearance.",
        causes: ["0246dde3-c9c7-4969-9b53-e2a748f28c64-en"],
        tags: ["awareness crisis", "expository dialogue"],
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 825 },
      },
      {
        id: "e228a89c-9f40-4b99-86bd-e819e1c6d348-en",
        title: "Devouring Little Red Riding Hood",
        description: "Wolf devours the girl after the deception is exposed.",
        causes: ["a9c49052-4a84-479f-914f-47990b553572-en"],
        tags: ["threat climax", "highest tension moment"],
        order: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 100, y: 950 },
      },
      {
        id: "b82b0de6-35ec-46e6-a3d6-2fd92509d7e8-en",
        title: "Hunter's intervention",
        description:
          "Hunter, knowing grandmother's illness, reacts to suspicious sounds.",
        causes: [
          "09e3833b-1557-400a-b3e4-80cde4c6852d-en",
          "e228a89c-9f40-4b99-86bd-e819e1c6d348-en",
        ],
        tags: ["deus ex machina", "conflict resolution"],
        order: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 1075 },
      },
      {
        id: "71a08c92-efaa-4779-8bbe-4deb9cc65c98-en",
        title: "Resurrection through stones",
        description: "Symbolic purification by replacing victims with stones.",
        causes: ["b82b0de6-35ec-46e6-a3d6-2fd92509d7e8-en"],
        tags: ["antagonist punishment", "moral symbolism"],
        order: 11,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: { x: 325, y: 1200 },
      },
    ],
  },
];

interface StoreState {
  projects: Project[];
  settings: AppSettings & { initialBackupAdded: boolean };
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  copyProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  updateProject: (id: string, newName: string) => void;
  addNode: (projectId: string, node: StoryNode) => void;
  deleteNode: (projectId: string, nodeId: string) => void;
  updateNode: (
    projectId: string,
    nodeId: string,
    updatedNode: Partial<StoryNode>
  ) => void;
  updateNodeOrder: (projectId: string, nodes: StoryNode[]) => void;
  updateNodePosition: (
    projectId: string,
    nodeId: string,
    position: NodePosition
  ) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  switchLanguageProjects: (language: "pl" | "en") => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      projects: [],
      settings: {
        theme: "dark",
        language: (localStorage.getItem("lang") as "pl" | "en") || "en",
        geminiApiKey: undefined,
        initialBackupAdded: false,
      },

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      copyProject: (project) =>
        set((state) => {
          const copiedProject = {
            ...project,
            id: crypto.randomUUID(),
            name: `Copy of ${project.name}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { projects: [copiedProject, ...state.projects] };
        }),
      setProjects: (projects) => set({ projects }),
      updateProject: (id, newName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: newName, updatedAt: new Date() } : p
          ),
        })),

      addNode: (projectId, node) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  nodes: [...p.nodes, node],
                  updatedAt: new Date(),
                }
              : p
          ),
        })),
      deleteNode: (projectId, nodeId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  nodes: p.nodes.filter((n) => n.id !== nodeId),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),
      updateNode: (projectId, nodeId, updatedNode) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  nodes: p.nodes.map((n) =>
                    n.id === nodeId
                      ? { ...n, ...updatedNode, updatedAt: new Date() }
                      : n
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),
      updateNodeOrder: (projectId, nodes) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, nodes, updatedAt: new Date() } : p
          ),
        })),
      updateNodePosition: (projectId, nodeId, position) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  nodes: p.nodes.map((n) =>
                    n.id === nodeId
                      ? { ...n, position, updatedAt: new Date() }
                      : n
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      switchLanguageProjects: (language) => {
        const state = get();
        const currentProjects = state.projects;

        const userProjects = currentProjects.filter(
          (p) => !p.id.startsWith("377f3c98-ee7d-4047-bd7e-15287366c6af")
        );

        const exampleProjects =
          language === "pl" ? INITIAL_PROJECTS_PL : INITIAL_PROJECTS_EN;

        set({
          projects: [...userProjects, ...exampleProjects],
        });
      },
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        projects: state.projects,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          state.projects.length === 0 &&
          !state.settings.initialBackupAdded
        ) {
          const initialProjects =
            state.settings.language === "pl"
              ? INITIAL_PROJECTS_PL
              : INITIAL_PROJECTS_EN;
          state.setProjects(initialProjects);
          state.updateSettings({ initialBackupAdded: true });
        }
      },
    }
  )
);
