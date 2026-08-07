import { useEffect, useState } from "react";
import { Bot, CircleDot, CloudCog, Server } from "lucide-react";
import { nodes as mockNodes, type NodeKind } from "../data";
import type { CRDNode, CRDNodeLite, NodeCategory } from "../types";

const NODE_CATEGORY_LABEL = "rlark.io/node-category";

export function getNodeCategory(node: CRDNode): NodeCategory {
  const v = node.metadata.labels?.[NODE_CATEGORY_LABEL];
  if (v === "cloud" || v === "edge" || v === "robot") return v;
  return "unknown";
}

export const categoryLabels: Record<
  NodeCategory,
  { zh: string; en: string; icon: typeof CloudCog }
> = {
  cloud: { zh: "云算力", en: "Cloud", icon: CloudCog },
  edge: { zh: "端算力", en: "Edge", icon: Server },
  robot: { zh: "端真机", en: "Robot", icon: Bot },
  unknown: { zh: "未知", en: "Unknown", icon: CircleDot },
};

export { NODE_CATEGORY_LABEL };

export function buildMockCRDNodes(): CRDNode[] {
  const categoryByKind: Record<NodeKind, NodeCategory> = {
    CloudCompute: "cloud",
    EmbodiedCompute: "edge",
    Robot: "robot",
  };

  return mockNodes.map((node) => ({
    apiVersion: "rlinf.io/v1alpha1",
    kind: "Node",
    metadata: {
      name: node.name,
      namespace: node.cluster,
      labels: {
        [NODE_CATEGORY_LABEL]: categoryByKind[node.kind],
        "rlark.io/model": node.model,
      },
      creationTimestamp: "2026-06-29T10:00:00Z",
    },
    spec: {
      agentType:
        node.kind === "Robot"
          ? "Robot"
          : node.kind === "EmbodiedCompute"
            ? "Edge"
            : "Kubernetes",
      unschedulable: node.phase === "Offline",
    },
    status: {
      phase: node.phase,
      reason: node.robotState,
      nodeInfo: {
        architecture: "amd64",
        kernelVersion: "mock",
        agentVersion: "demo",
        operatingSystem: node.kind === "Robot" ? "robot-os" : "linux",
      },
      addresses: [{ type: "InternalIP", address: node.address }],
      allocatable: {
        cpu: "16",
        memory: "64Gi",
        "nvidia.com/gpu": node.gpu.split(" / ")[1] ?? "0",
      },
      capacity: {
        cpu: "16",
        memory: "64Gi",
        "nvidia.com/gpu": node.gpu.split(" / ")[1] ?? "0",
      },
      used: {
        cpu: `${node.cpu}%`,
        memory: `${node.memory}%`,
        "nvidia.com/gpu": node.gpu.split(" / ")[0] ?? "0",
      },
    },
  }));
}

export function useNodeLabels() {
  const [nodes, setNodes] = useState<CRDNodeLite[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/rlinf.io/v1alpha1/nodes")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) => setNodes(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const clusterNames = Array.from(
    new Set(
      nodes.map((n) => n.metadata.namespace).filter((v): v is string => !!v),
    ),
  );
  const clusterDisplayNames = clusterNames;
  return { nodes, loading, clusterNames, clusterDisplayNames };
}
