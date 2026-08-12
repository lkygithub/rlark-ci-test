import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  CloudCog,
  RefreshCw,
  Server,
  Sparkles,
  Workflow,
} from "lucide-react";
import { activity, type Cluster, type Job, type Phase } from "../data";
import type { Copy } from "../i18n";
import type { CRDJob, CRDNode, Page, ResourceRow } from "../types";
import { useAutoRefresh } from "../hooks";
import { crdToJob } from "../utils/crd";
import { buildMockCRDNodes, getNodeCategory } from "../utils/nodes";
import {
  MetricCard,
  ResourceDistribution,
  StatusBadge,
} from "../components/shared";
import { OverviewChinaMap } from "../components/OverviewChinaMap";

export function Overview({
  navigate,
  copy: c,
  isMockMode,
}: {
  navigate: (
    page: Page,
    name?: string,
    options?: { query?: Record<string, string | undefined> },
  ) => void;
  copy: Copy;
  isMockMode: boolean;
}) {
  const [realClusters, setRealClusters] = useState<Cluster[]>([]);
  const [realNodes, setRealNodes] = useState<CRDNode[]>([]);
  const [realJobs, setRealJobs] = useState<Job[]>([]);
  const isZh = c.nav.overview === "总览";

  const { refresh } = useAutoRefresh(async () => {
    const [clustersRes, nodesRes, jobsRes] = await Promise.all([
      fetch("/api/v1/clusters")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .catch(() => ({ data: [] })),
      fetch("/api/v1/rlinf.io/v1alpha1/nodes")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .catch(() => ({ items: [] })),
      fetch("/api/v1/rlinf.io/v1alpha1/jobs")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .catch(() => ({ items: [] })),
    ]);
    setRealClusters(clustersRes.data ?? []);
    setRealNodes(nodesRes.items ?? []);
    const jobItems: CRDJob[] = jobsRes.items ?? [];
    setRealJobs(jobItems.map(crdToJob));
  }, 15000);

  const displayNodes = useMemo(
    () => (isMockMode ? buildMockCRDNodes() : realNodes),
    [isMockMode, realNodes],
  );
  const cloudClusters = realClusters.filter((x) => x.type === "Cloud");
  const embodiedClusters = realClusters.filter((x) => x.type === "Embodied");
  const runningJobs = realJobs.filter((x) => x.phase === "Running").length;
  const gpuModelList = Array.from(
    new Set(
      isMockMode
        ? displayNodes
            .filter((node) => getNodeCategory(node) === "cloud")
            .map((node) => node.metadata.labels?.["rlark.io/model"] ?? "")
            .filter(Boolean)
        : realClusters.flatMap((x) => x.gpuModels),
    ),
  );
  const robotModelList = Array.from(
    new Set(
      isMockMode
        ? displayNodes
            .filter((node) => getNodeCategory(node) === "robot")
            .map((node) => node.metadata.labels?.["rlark.io/model"] ?? "")
            .filter(Boolean)
        : realClusters.flatMap((x) => x.robotModels),
    ),
  );
  const gpuModels = gpuModelList.slice(0, 4).join(" / ") || (isZh ? "—" : "—");
  const robotModels =
    robotModelList.slice(0, 4).join(" / ") || (isZh ? "—" : "—");
  const regionCount = isMockMode
    ? new Set(
        displayNodes
          .filter((node) => getNodeCategory(node) === "cloud")
          .map((node) => node.metadata.namespace),
      ).size
    : new Set(cloudClusters.map((x) => x.region)).size;
  const runningWorkerCount = realJobs.reduce((s, x) => s + x.runningWorkers, 0);

  const categoryCounts = useMemo(() => {
    const counts = { cloud: 0, edge: 0, robot: 0 };
    for (const n of displayNodes) {
      const cat = getNodeCategory(n);
      if (cat === "cloud") counts.cloud++;
      else if (cat === "edge") counts.edge++;
      else if (cat === "robot") counts.robot++;
    }
    return counts;
  }, [displayNodes]);

  const cloudNodeCount = isMockMode
    ? categoryCounts.cloud
    : realClusters.reduce((sum, cluster) => sum + cluster.cloudNodes, 0);
  const robotCount = isMockMode
    ? categoryCounts.robot
    : realClusters.reduce((sum, cluster) => sum + cluster.robots, 0);
  const cloudClusterCount = isMockMode
    ? new Set(
        displayNodes
          .filter((node) => getNodeCategory(node) === "cloud")
          .map((node) => node.metadata.namespace),
      ).size
    : cloudClusters.length;
  const embodiedClusterCount = isMockMode
    ? new Set(
        displayNodes
          .filter((node) => getNodeCategory(node) !== "cloud")
          .map((node) => node.metadata.namespace),
      ).size
    : embodiedClusters.length;

  const resourceRows: ResourceRow[] = [
    {
      label: c.kind.CloudCompute,
      count: categoryCounts.cloud,
      models: gpuModelList.slice(0, 3).join(" / "),
      color: "blue",
    },
    {
      label: c.kind.EmbodiedCompute,
      count: categoryCounts.edge,
      models: "",
      color: "green",
    },
    {
      label: c.kind.Robot,
      count: categoryCounts.robot,
      models: robotModelList.slice(0, 3).join(" / "),
      color: "orange",
    },
  ];

  const robotNodes = displayNodes.filter((n) => getNodeCategory(n) === "robot");
  const today = new Intl.DateTimeFormat(isZh ? "zh-CN" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="page-content overview-page">
      <section className="hero-strip">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} />
            {today}
          </span>
          <h2>{c.overview.title}</h2>
          <p>{c.overview.desc}</p>
        </div>
        <div className="hero-health">
          <span>
            {isMockMode ? (isZh ? "数据模式" : "Data mode") : c.overview.health}
          </span>
          <strong>
            <i />
            {isMockMode
              ? isZh
                ? "Mock 演示"
                : "Mock demo"
              : c.overview.operational}
          </strong>
          <small>
            {isMockMode
              ? isZh
                ? "未连接后端服务"
                : "Backend unavailable"
              : isZh
                ? "实时数据"
                : "Live data"}
          </small>
        </div>
      </section>
      <section className="metric-grid platform-metrics">
        <MetricCard
          icon={CloudCog}
          tone="blue"
          label={c.overview.cloudClusters}
          value={`${cloudClusterCount}`}
          note={isZh ? `${regionCount} 个地域` : `${regionCount} regions`}
          onClick={() => navigate("clusters-management")}
        />
        <MetricCard
          icon={Server}
          tone="mint"
          label={c.overview.cloudNodes}
          value={`${cloudNodeCount}`}
          note={
            isZh
              ? `${gpuModelList.length} 种 GPU 型号`
              : `${gpuModelList.length} GPU models`
          }
          onClick={() => navigate("clusters-nodes")}
        />
        <MetricCard
          icon={Bot}
          tone="violet"
          label={c.overview.robots}
          value={`${robotCount}`}
          note={
            isZh
              ? `${embodiedClusterCount} 个具身集群 · ${robotModelList.length} 种真机`
              : `${embodiedClusterCount} embodied clusters · ${robotModelList.length} robot models`
          }
          onClick={() => navigate("clusters-nodes")}
        />
        <MetricCard
          icon={Workflow}
          tone="orange"
          label={c.overview.jobs}
          value={`${runningJobs} / ${realJobs.length}`}
          note={
            isZh
              ? `${runningWorkerCount} 个运行 Worker`
              : `${runningWorkerCount} running workers`
          }
          onClick={() => navigate("jobs")}
        />
      </section>
      <OverviewChinaMap
        navigate={navigate}
        copy={c}
        nodes={displayNodes}
        jobs={realJobs}
        clusters={realClusters}
      />
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.compute}</span>
              <h3>{c.overview.computeDesc}</h3>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("clusters-nodes")}
            >
              {c.common.viewAll}
              <ArrowRight size={14} />
            </button>
          </div>
          <ResourceDistribution copy={c} rows={resourceRows} />
        </div>
        <div className="panel workload-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.liveRobots}</span>
              <h3>{c.kind.Robot}</h3>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("clusters-nodes")}
            >
              {c.common.details}
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="robot-state-list">
            {robotNodes.length === 0 ? (
              <p
                className="muted"
                style={{ padding: "16px 0", textAlign: "center" }}
              >
                {isZh ? "暂无真机" : "No robots"}
              </p>
            ) : (
              robotNodes.slice(0, 6).map((n) => {
                const phase = (n.status?.phase ?? "Offline") as Phase;
                const model =
                  n.metadata.labels?.["rlark.io/model"] ||
                  n.metadata.labels?.["node.kubernetes.io/instance-type"] ||
                  "—";
                const reason = n.status?.reason || "—";
                return (
                  <div key={n.metadata.name}>
                    <span className={"node-status-ring " + phase.toLowerCase()}>
                      <Bot size={17} />
                    </span>
                    <div>
                      <strong>{n.metadata.name}</strong>
                      <small>
                        {model} · {reason}
                      </small>
                    </div>
                    <StatusBadge phase={phase} copy={c} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      <section className="bottom-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.liveJobs}</span>
              <h3>{c.nav.jobs}</h3>
            </div>
            <button className="plain-button" onClick={() => navigate("jobs")}>
              {c.common.viewAll}
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="workflow-list">
            {realJobs.slice(0, 4).map((job) => (
              <button key={job.id} onClick={() => navigate("jobs")}>
                <span className={"workflow-symbol " + job.phase.toLowerCase()}>
                  <Workflow size={17} />
                </span>
                <span className="workflow-info">
                  <strong>{job.name}</strong>
                  <small>
                    {c.jobType[job.type]} · {job.target}
                  </small>
                </span>
                <StatusBadge phase={job.phase} copy={c} />
                <span className="progress-cell">
                  <i>
                    <b style={{ width: job.progress + "%" }} />
                  </i>
                  <small>
                    {job.runningWorkers}/{job.workers}
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>
        <div className="panel activity-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.recent}</span>
              <h3>{c.common.production}</h3>
            </div>
            <button className="icon-button small" onClick={refresh}>
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="activity-list">
            {activity.length === 0 ? (
              <p
                className="muted"
                style={{ padding: "16px 0", textAlign: "center" }}
              >
                {isZh ? "暂无活动" : "No recent activity"}
              </p>
            ) : (
              activity.map((item, i) => (
                <div key={i}>
                  <span className={"activity-dot " + item.type}>
                    <i />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </div>
                  <time>{item.time}</time>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
