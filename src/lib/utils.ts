import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TIME_ZONE } from "./timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "GUARDIAN":
      return "bg-crimson-100 text-crimson-700 border-crimson-200";
    case "BUS_LEADER":
      return "bg-gold-100 text-gold-700 border-gold-200";
    default:
      return "bg-forest-100 text-forest-700 border-forest-200";
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "GUARDIAN":
      return "Leader";
    case "BUS_LEADER":
      return "Guardian";
    default:
      return "Beloved";
  }
}
