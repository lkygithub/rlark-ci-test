import { useEffect, useState } from "react";
import type { Page } from "../types";

export function useIsAdminPath() {
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname.startsWith("/admin");
  });
  useEffect(() => {
    const onPop = () => {
      setIsAdmin(window.location.pathname.startsWith("/admin"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return isAdmin;
}

export function parseRoute() {
  const parts = window.location.pathname
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);
  const valid: Page[] = [
    "overview",
    "clusters-overview",
    "clusters-nodes",
    "jobs",
    "workflows",
    "domains",
    "storageClass",
    "files",
  ];
  const top = (parts[0] as Page) ?? "overview";
  if ((top as string) === "clusters") {
    const sub = parts[1] ?? "overview";
    if (sub === "nodes") {
      const nodeName = parts.slice(2).join("/");
      return { page: "clusters-nodes" as Page, sub: decodeURIComponent(nodeName) };
    }
    return { page: "clusters-overview" as Page, sub: "" };
  }
  if (!valid.includes(top)) return { page: "overview" as Page, sub: "" };
  const sub = parts.slice(1).join("/");
  return { page: top, sub: decodeURIComponent(sub) };
}
