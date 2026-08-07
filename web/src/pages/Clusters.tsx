import { useMemo, useState } from "react";
import {
  Activity,
  CloudCog,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Settings,
} from "lucide-react";
import { nodes, type Phase } from "../data";
import type { Copy } from "../i18n";
import type { CRDNode, NodeCategory } from "../types";
import { useAutoRefresh } from "../hooks";
import {
  buildMockCRDNodes,
  categoryLabels,
  getNodeCategory,
} from "../utils/nodes";
import {
  MetricCard,
  PageToolbar,
  StatusBadge,
} from "../components/shared";

export function ClustersPage({
  copy: c,
  initialView,
  selectedNodeName,
  onNavigate,
}: {
  copy: Copy;
  initialView?: "clusters" | "nodes";
  selectedNodeName?: string;
  onNavigate?: (name?: string) => void;
}) {
  const zh = c.nav.overview === "总览";
  const [query, setQuery] = useState("");
  const [realNodes, setRealNodes] = useState<CRDNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourceView, setResourceView] = useState<"clusters" | "nodes">(
    initialView ?? "clusters",
  );
  const [selectedClusterNs, setSelectedClusterNs] = useState<string | null>(
    null,
  );
  const [phaseFilter, setPhaseFilter] = useState<"All" | Phase>("All");

  const fetchNodes = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/nodes");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setRealNodes(data.items ?? []);
    } catch (e) {
      setRealNodes(buildMockCRDNodes());
      setError("");
      console.warn("API request failed, using mock data:", e);
      // Fallback to mock data when API is not available
      const mockNodes: CRDNode[] = nodes.map((node, index) => ({
        apiVersion: "rlinf.io/v1alpha1",
        kind: "Node",
        metadata: {
          name: node.name,
          namespace: "default",
          labels: {
            "rlinf.io/cluster": node.cluster,
            "rlinf.io/kind": node.kind,
          },
          creationTimestamp: new Date(
            Date.now() - index * 86400000,
          ).toISOString(),
        },
        spec: {
          agentType: node.kind === "Robot" ? "robot" : "kubernetes",
        },
        status: {
          phase: node.phase,
          nodeInfo: {
            architecture: "amd64",
            kernelVersion: "5.15.0",
            agentVersion: "v1.0.0",
            operatingSystem: "linux",
          },
          addresses: [{ type: "InternalIP", address: node.address }],
          allocatable: {
            cpu: "8",
            memory: "16Gi",
            "nvidia.com/gpu": node.kind === "CloudCompute" ? "8" : "1",
          },
          capacity: {
            cpu: "8",
            memory: "16Gi",
            "nvidia.com/gpu": node.kind === "CloudCompute" ? "8" : "1",
          },
          used: {
            cpu: `${node.cpu}`,
            memory: `${node.memory}%`,
            "nvidia.com/gpu": node.gpu ? node.gpu.split("/")[0] : "0",
          },
        },
      }));
      setRealNodes(mockNodes);
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchNodes, 10000);

  const clustersList = useMemo(() => {
    const map = new Map<string, CRDNode[]>();
    for (const n of realNodes) {
      const ns = n.metadata.namespace ?? "default";
      if (!map.has(ns)) map.set(ns, []);
      map.get(ns)!.push(n);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [realNodes]);

  const selectedCluster =
    clustersList.find(([ns]) => ns === selectedClusterNs) ?? clustersList[0];
  const selectedClusterNodes = selectedCluster?.[1] ?? [];

  const filteredNodes = realNodes.filter((n) => {
    const hit =
      `${n.metadata.name} ${n.metadata.namespace ?? ""} ${n.spec.agentType ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const phase = (n.status?.phase ?? "Offline") as Phase;
    const phaseHit = phaseFilter === "All" || phase === phaseFilter;
    return hit && phaseHit;
  });

  const onlineClusters = clustersList.filter(([, nsNodes]) =>
    nsNodes.some((n) => n.status?.phase === "Online"),
  ).length;
  const totalNodes = realNodes.length;

  if (loading) {
    return (
      <div className="page-content resource-page cluster-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{c.clusters.eyebrow}</span>
            <h2>{c.clusters.title}</h2>
            <p>{c.clusters.desc}</p>
          </div>
        </div>
        <p className="muted">{zh ? "加载中..." : "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content resource-page cluster-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{c.clusters.eyebrow}</span>
            <h2>{c.clusters.title}</h2>
            <p>{c.clusters.desc}</p>
          </div>
          <button className="secondary-button" onClick={() => fetchNodes()}>
            <RefreshCw size={16} />
            {c.common.refresh}
          </button>
        </div>
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      </div>
    );
  }

  const selectedNodeObj =
    realNodes.find((n) => n.metadata.name === selectedNodeName) ?? null;

  if (selectedNodeName && selectedNodeObj) {
    return (
      <div className="page-content resource-page node-detail-page">
        <div className="section-heading">
          <div>
            <button
              className="plain-button back-button"
              onClick={() => onNavigate?.()}
            >
              ← {zh ? "返回节点列表" : "Back"}
            </button>
            <span className="eyebrow">
              <Settings size={13} />
              {zh ? "节点详情" : "Node Detail"}
            </span>
          </div>
        </div>
        <NodeDetailReal node={selectedNodeObj} copy={c} />
      </div>
    );
  }

  return (
    <div
      className={`page-content resource-page cluster-page${
        resourceView === "clusters" ? " cluster-overview-page" : ""
      }`}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.clusters.eyebrow}</span>
          <h2>{c.clusters.title}</h2>
          <p>{c.clusters.desc}</p>
        </div>
        <button className="secondary-button" onClick={() => fetchNodes()}>
          <RefreshCw size={16} />
          {c.common.refresh}
        </button>
      </div>
      {resourceView === "clusters" && (
      <section className="cluster-overview-grid">
        <MetricCard
          icon={Network}
          tone="blue"
          label={zh ? "集群总数" : "Clusters"}
          value={`${clustersList.length}`}
          note={`${onlineClusters} ${c.status.Online}`}
        />
        <MetricCard
          icon={Server}
          tone="mint"
          label={zh ? "节点总数" : "Nodes"}
          value={`${totalNodes}`}
          note={`${realNodes.filter((n) => n.status?.phase === "Online").length} ${c.status.Online}`}
        />
        <MetricCard
          icon={Activity}
          tone="orange"
          label={zh ? "在线率" : "Online Rate"}
          value={`${totalNodes > 0 ? Math.round(realNodes.filter((n) => n.status?.phase === "Online").length / totalNodes * 100) : 0}%`}
          note={`${realNodes.filter((n) => n.status?.phase === "Online").length}/${totalNodes} ${zh ? "在线" : "online"}`}
        />
      </section>
      )}
      {resourceView === "clusters" && (
        <>
          <section className="cluster-topology-grid">
            <div className="panel cluster-map-card">
              <div className="panel-title">
                <div>
                  <span>Distribution</span>
                  <h3>{zh ? "集群分布" : "Cluster Distribution"}</h3>
                </div>
              </div>
              <div className="cluster-map">
                <div className="map-grid" />
                {clustersList.map(([ns, nsNodes], index) => (
                  <button
                    key={ns}
                    className={`map-pin pin-${index} ${selectedCluster?.[0] === ns ? "active" : ""}`}
                    onClick={() => setSelectedClusterNs(ns)}
                  >
                    <span>
                      <CloudCog size={15} />
                    </span>
                    <strong>{ns}</strong>
                    <small>
                      {nsNodes.length} {zh ? "节点" : "nodes"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <ClusterDetailReal
              namespace={selectedCluster?.[0] ?? ""}
              nodes={selectedClusterNodes}
              copy={c}
            />
          </section>
          <section className="panel cluster-list-panel">
            <div className="panel-title">
              <div>
                <span>{c.clusters.clusterList}</span>
                <h3>{zh ? "集群整体情况" : "Cluster Overview"}</h3>
              </div>
            </div>
            <div className="cluster-list-scroll">
              <table className="cluster-list-table">
                <thead>
                  <tr>
                    <th>{zh ? "集群" : "Cluster"}</th>
                    <th>{zh ? "节点数" : "Nodes"}</th>
                    <th>{zh ? "在线" : "Online"}</th>
                    <th>{zh ? "在线率" : "Rate"}</th>
                    <th>{zh ? "状态" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {clustersList.map(([ns, nsNodes]) => {
                    const onlineCount = nsNodes.filter(
                      (n) => n.status?.phase === "Online",
                    ).length;
                    const phase: Phase =
                      nsNodes.length === 0 ? "Offline" : "Online";
                    const rate = nsNodes.length > 0
                      ? Math.round((onlineCount / nsNodes.length) * 100)
                      : 0;
                    return (
                      <tr
                        key={ns}
                        className={
                          selectedCluster?.[0] === ns ? "selected" : ""
                        }
                        onClick={() => setSelectedClusterNs(ns)}
                      >
                        <td>
                          <span className="cluster-list-name">
                            <CloudCog size={15} />
                            <strong>{ns}</strong>
                          </span>
                        </td>
                        <td>{nsNodes.length}</td>
                        <td>{onlineCount}</td>
                        <td>
                          <span className="cluster-list-rate">
                            <i>
                              <b style={{ width: `${rate}%` }} />
                            </i>
                            <small>{rate}%</small>
                          </span>
                        </td>
                        <td>
                          <StatusBadge phase={phase} copy={c} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {resourceView === "nodes" && (
        <section className="nodes-resource-section">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">{c.clusters.nodeList}</span>
              <h2>{zh ? "节点资源" : "Node Resources"}</h2>
              <p>
                {zh
                  ? "按状态筛选，查看节点详情。"
                  : "Filter by status to view node details."}
              </p>
            </div>
          </div>
          <PageToolbar
            placeholder={c.clusters.search}
            value={query}
            onChange={setQuery}
            count={filteredNodes.length}
            copy={c}
            onRefresh={() => fetchNodes()}
          />
          <div className="node-filter-bar">
            {(["All", "Online", "Offline"] as const).map((phase) => (
              <button
                key={phase}
                className={phaseFilter === phase ? "active" : ""}
                onClick={() => setPhaseFilter(phase)}
              >
                {phase === "All" ? (zh ? "全部状态" : "All") : c.status[phase]}
              </button>
            ))}
          </div>
          <div className="node-admin-layout">
            <div
              className="node-category-grid"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${
                  (
                    ["cloud", "edge", "robot", "unknown"] as NodeCategory[]
                  ).filter((cat) => {
                    const cn = filteredNodes.filter(
                      (n) => getNodeCategory(n) === cat,
                    );
                    return cn.length > 0 || cat === "unknown";
                  }).length
                }, 1fr)`,
                gap: 16,
              }}
            >
              {(["cloud", "edge", "robot", "unknown"] as NodeCategory[]).map(
                (cat) => {
                  const catNodes = filteredNodes.filter(
                    (n) => getNodeCategory(n) === cat,
                  );
                  if (catNodes.length === 0 && cat !== "unknown") return null;
                  const info = categoryLabels[cat];
                  const Icon = info.icon;
                  const onlineCount = catNodes.filter(
                    (n) => n.status?.phase === "Online",
                  ).length;
                  return (
                    <div
                      key={cat}
                      className={"panel node-category-column cat-" + cat}
                    >
                      <div className="node-category-header">
                        <span className="node-category-icon">
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{zh ? info.zh : info.en}</strong>
                          <small>
                            {catNodes.length} {zh ? "节点" : "nodes"} ·{" "}
                            {onlineCount} {zh ? "在线" : "online"}
                          </small>
                        </div>
                      </div>
                      {catNodes.length === 0 ? (
                        <div className="node-category-empty">
                          <small className="muted">
                            {zh ? "暂无节点" : "No nodes"}
                          </small>
                        </div>
                      ) : (
                        <div className="node-category-list">
                          {catNodes.map((node) => {
                            const phase = (node.status?.phase ??
                              "Offline") as Phase;
                            const isSelected =
                              selectedNodeName === node.metadata.name;
                            return (
                              <div
                                className={
                                  "node-row" + (isSelected ? " selected" : "")
                                }
                                key={node.metadata.name}
                                onClick={() => onNavigate?.(node.metadata.name)}
                              >
                                <span
                                  className={
                                    "node-status-ring " + phase.toLowerCase()
                                  }
                                />
                                <span className="node-row-name">
                                  {node.metadata.name}
                                </span>
                                <StatusBadge phase={phase} copy={c} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function ClusterDetailReal({
  namespace,
  nodes: clusterNodes,
  copy: c,
}: {
  namespace: string;
  nodes: CRDNode[];
  copy: Copy;
}) {
  const zh = c.nav.overview === "总览";
  const onlineCount = clusterNodes.filter(
    (n) => n.status?.phase === "Online",
  ).length;
  const phase: Phase = clusterNodes.length === 0 ? "Offline" : "Online";
  return (
    <div className="panel selected-cluster-panel">
      <div className="cluster-detail-header">
        <div className="cluster-detail-title">
          <CloudCog size={18} />
          <strong>{namespace}</strong>
          <StatusBadge phase={phase} copy={c} />
        </div>
        <div className="cluster-detail-meta">
          <span>{clusterNodes.length} {zh ? "节点" : "nodes"}</span>
          <i className="dot" />
          <span>{onlineCount} {zh ? "在线" : "online"}</span>
          <i className="dot" />
          <span>
            {Array.from(
              new Set(clusterNodes.map((n) => n.spec.agentType ?? "—")),
            ).join(", ") || "—"}
          </span>
        </div>
      </div>
      <div className="cluster-node-table-wrap">
        <table className="cluster-node-table">
          <thead>
            <tr>
              <th>{zh ? "节点名称" : "Name"}</th>
              <th>{zh ? "状态" : "Phase"}</th>
              <th>{zh ? "架构" : "Arch"}</th>
              <th>{zh ? "地址" : "Addresses"}</th>
            </tr>
          </thead>
          <tbody>
            {clusterNodes.map((node) => (
              <tr key={node.metadata.name}>
                <td>
                  <strong>{node.metadata.name}</strong>
                </td>
                <td>
                  <StatusBadge
                    phase={(node.status?.phase ?? "Offline") as Phase}
                    copy={c}
                  />
                </td>
                <td>
                  <small>{node.status?.nodeInfo?.architecture ?? "—"}</small>
                </td>
                <td>
                  <small>
                    {(node.status?.addresses ?? [])
                      .map((a) => a.address)
                      .join(", ") || "—"}
                  </small>
                </td>
              </tr>
            ))}
            {clusterNodes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  <small className="muted">
                    {zh ? "暂无节点" : "No nodes"}
                  </small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NodeDetailReal({ node, copy: c }: { node: CRDNode; copy: Copy }) {
  const zh = c.nav.overview === "总览";
  const phase = (node.status?.phase ?? "Offline") as Phase;
  const labels = node.metadata.labels ?? {};
  const labelEntries = Object.entries(labels);
  return (
    <div className="node-resource-detail">
      <div className="detail-header">
        <div>
          <span className="eyebrow">{c.clusters.selected}</span>
          <h3>{node.metadata.name}</h3>
          <p>
            {node.metadata.namespace ?? "default"} ·{" "}
            {(node.status?.addresses ?? []).map((a) => a.address).join(", ") ||
              "—"}
          </p>
        </div>
        <StatusBadge phase={phase} copy={c} />
      </div>
      <div className="node-health compact-health">
        <div className="gpu-card">
          <span>
            <Cpu size={18} />
          </span>
          <strong>{node.status?.nodeInfo?.architecture ?? "—"}</strong>
          <small>{zh ? "架构" : "Arch"}</small>
        </div>
        <div className="gpu-card">
          <span>
            <Server size={18} />
          </span>
          <strong>{node.spec.agentType ?? "—"}</strong>
          <small>{zh ? "接入形态" : "Agent Type"}</small>
        </div>
        <div className="gpu-card">
          <span>
            <HardDrive size={18} />
          </span>
          <strong>{node.status?.nodeInfo?.operatingSystem ?? "—"}</strong>
          <small>{zh ? "系统" : "OS"}</small>
        </div>
        <div className="gpu-card">
          <span>
            <Activity size={18} />
          </span>
          <strong>{node.status?.nodeInfo?.agentVersion ?? "—"}</strong>
          <small>{zh ? "Agent 版本" : "Agent Version"}</small>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="form-section-head">
          <small>{zh ? "标签" : "Labels"}</small>
        </div>
        <div className="label-list">
          {labelEntries.length === 0 ? (
            <small className="muted">{zh ? "无标签" : "No labels"}</small>
          ) : (
            labelEntries.map(([k, v]) => (
              <span key={k} className="label-chip" title={`${k}=${v}`}>
                <code>{k}</code>
                <i>{v}</i>
              </span>
            ))
          )}
        </div>
      </div>
      {node.status?.capacity &&
        Object.keys(node.status.capacity).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="form-section-head">
              <small>{zh ? "容量" : "Capacity"}</small>
            </div>
            <div className="label-list">
              {Object.entries(node.status.capacity).map(([k, v]) => (
                <span key={k} className="label-chip">
                  <code>{k}</code>
                  <i>{v}</i>
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
