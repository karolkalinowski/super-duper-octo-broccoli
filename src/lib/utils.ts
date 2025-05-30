import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TAG_COLORS = [
  { bg: "bg-red-200", text: "text-red-800" },
  { bg: "bg-blue-200", text: "text-blue-800" },
  { bg: "bg-green-200", text: "text-green-800" },
  { bg: "bg-purple-200", text: "text-purple-800" },
  { bg: "bg-pink-200", text: "text-pink-800" },
  { bg: "bg-indigo-200", text: "text-indigo-800" },
  { bg: "bg-teal-200", text: "text-teal-800" },
  { bg: "bg-amber-200", text: "text-amber-800" },
];

export function getTagColor(tagName: string) {
  const hash = tagName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % TAG_COLORS.length;
  return TAG_COLORS[index];
}
