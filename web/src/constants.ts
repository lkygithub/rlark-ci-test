import {
  Boxes,
  Braces,
  CloudCog,
  HardDrive,
  Network,
  Package,
  Server,
  Settings,
  Shield,
  Workflow,
  LayoutDashboard,
} from "lucide-react";
import type { NavParent, AdminNavItem } from "./types";

export const navItems: NavParent[] = [
  { id: "overview", icon: LayoutDashboard },
  {
    id: "clusters-overview",
    icon: Network,
    children: [
      { id: "clusters-overview", icon: Network },
      { id: "clusters-nodes", icon: Server },
    ],
  },
  { id: "jobs", icon: Workflow },
  { id: "workflows", icon: Boxes },
  { id: "storageClass", icon: HardDrive },
];

export const adminNavItems: AdminNavItem[] = [
  {
    id: "clusters",
    icon: Network,
    zh: "集群管理",
    en: "Clusters",
    children: [
      { id: "clusters-nodes", icon: Server, zh: "节点管理", en: "Nodes" },
      {
        id: "create-cluster",
        icon: Shield,
        zh: "创建集群",
        en: "Create Cluster",
      },
      { id: "addons", icon: Package, zh: "组件市场", en: "Addons" },
    ],
  },
  { id: "jobs", icon: Boxes, zh: "任务管理", en: "Jobs" },
  { id: "domains", icon: CloudCog, zh: "网络域", en: "Domains" },
  { id: "api", icon: Braces, zh: "接口参考", en: "API Reference" },
  { id: "config", icon: Settings, zh: "系统配置", en: "Config" },
  { id: "storageClass", icon: HardDrive, zh: "存储管理", en: "Storage" },
];
