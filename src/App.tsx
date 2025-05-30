import { useEffect } from "react";
import { useStore } from "@/store";
import ProjectsList from "@/components/ProjectsList";

function App() {
  const { settings } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-background">
      <ProjectsList />
    </div>
  );
}

export default App;
