import type { CRDNode, NodeCategory } from "../types";

export const NODE_CATEGORY_LABEL = "rlark.io/node-category";
const CONTROL_PLANE_ROLE_LABELS = [
  "node-role.kubernetes.io/control-plane",
  "node-role.kubernetes.io/master",
];

export function getNodeCategory(node: CRDNode): NodeCategory {
  const value = node.metadata.labels?.[NODE_CATEGORY_LABEL];
  if (value === "cloud" || value === "edge" || value === "robot") {
    return value;
  }
  const resources = {
    ...(node.status?.capacity ?? {}),
    ...(node.status?.allocatable ?? {}),
  };
  if (
    Object.entries(resources).some(
      ([name, quantity]) =>
        Number.parseFloat(quantity) > 0 && /(^|[./-])gpu($|[./-])/i.test(name),
    )
  ) {
    return "cloud";
  }
  return "unknown";
}

export function isBusinessWorkerNode(node: CRDNode): boolean {
  const labels = node.metadata.labels ?? {};
  const kubernetesRole = labels["kubernetes.io/role"];
  const isControlPlane =
    CONTROL_PLANE_ROLE_LABELS.some((label) => label in labels) ||
    kubernetesRole === "master" ||
    kubernetesRole === "control-plane";
  const resources = {
    ...(node.status?.capacity ?? {}),
    ...(node.status?.allocatable ?? {}),
  };
  const hasWorkloadDevice = Object.entries(resources).some(
    ([name, value]) =>
      Number.parseFloat(value) > 0 &&
      (/(^|[./-])gpu($|[./-])/i.test(name) ||
        name === "rlinf.io/device" ||
        name.startsWith("rlinf.io/device-")),
  );
  return (
    !isControlPlane &&
    (getNodeCategory(node) !== "unknown" || hasWorkloadDevice)
  );
}
