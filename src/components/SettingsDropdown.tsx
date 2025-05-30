import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
import { useStore } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Sun, Moon, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsDropdown() {
  const { t } = useTranslation(["common"]);
  const { settings, updateSettings, switchLanguageProjects } = useStore();

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ geminiApiKey: e.target.value });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("common:settings")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>{t("common:settings")}</DropdownMenuLabel>

        <DropdownMenuLabel className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          {t("common:language")}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            i18n.changeLanguage("en");
            updateSettings({ language: "en" });
            localStorage.setItem("lang", "en");
            switchLanguageProjects("en");
          }}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            i18n.changeLanguage("pl");
            updateSettings({ language: "pl" });
            localStorage.setItem("lang", "pl");
            switchLanguageProjects("pl");
          }}
        >
          Polski
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            updateSettings({
              theme: settings.theme === "dark" ? "light" : "dark",
            });
          }}
        >
          <div className="flex items-center gap-2">
            {settings.theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {t(
              `common:${
                settings.theme === "dark" ? "switchToLight" : "switchToDark"
              }`
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>{t("common:geminiApiKey")}</DropdownMenuLabel>
        <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
          <Input
            type="password"
            value={settings.geminiApiKey || ""}
            onChange={handleApiKeyChange}
            placeholder={t("common:geminiApiKeyPlaceholder")}
            className="h-8"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
