import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CloudCog,
  Cpu,
  Database,
  Download,
  Gauge as GaugeIcon,
  HardDrive,
  Languages,
  LayoutDashboard,
  ListFilter,
  Moon,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  TerminalSquare,
  Trash2,
  Video,
  Workflow,
  Zap,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  activity,
  clusters,
  jobs,
  nodes,
  workers,
  type Cluster,
  type Job,
  type JobType,
  type NodeItem,
  type Phase,
  type Worker as WorkerItem,
} from "./data";

type Page = "overview" | "clusters" | "jobs" | "api" | "certificates";
type Lang = "zh" | "en";
type Theme = "light" | "dark";

function useIsAdminPath() {
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    const p = window.location.pathname.replace(/\/+$/, "");
    return p === "/admin" || p.endsWith("/admin");
  });
  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname.replace(/\/+$/, "");
      setIsAdmin(p === "/admin" || p.endsWith("/admin"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return isAdmin;
}

const copy = {
  zh: {
    nav: {
      overview: "总览",
      clusters: "集群及节点",
      jobs: "任务",
      api: "接口参考",
      certificates: "证书管理",
      admin: "运维管理",
      workspace: "工作台",
      developers: "开发者",
    },
    common: {
      search: "搜索集群、节点、任务...",
      production: "生产环境",
      createJob: "创建任务",
      filters: "筛选",
      refresh: "刷新",
      results: "条结果",
      viewAll: "查看全部",
      actions: "操作",
      env: "环境",
      envMeta: "具身集群 · Mock 数据",
      collapse: "收起侧栏",
      light: "浅色",
      dark: "深色",
      running: "运行中",
      total: "总数",
      logs: "日志",
      monitor: "监控",
      details: "详情",
    },
    status: {
      Running: "运行中",
      Pending: "等待中",
      Succeeded: "成功",
      Failed: "失败",
      Online: "在线",
      Offline: "离线",
    },
    kind: {
      CloudCompute: "云算力节点",
      EmbodiedCompute: "具身算力节点",
      Robot: "具身真机节点",
      Cloud: "云集群",
      Embodied: "具身集群",
    },
    jobType: {
      RL: "强化学习任务",
      DataCollection: "数据采集任务",
      Evaluation: "评测任务",
      Custom: "自定义任务",
    },
    overview: {
      date: "2026 年 6 月 29 日",
      title: "具身集群运行总览",
      desc: "重点观察已纳管的云集群、云算力节点、具身真机、任务与 Worker 的实时状态。",
      health: "平台健康度",
      operational: "运行正常",
      checked: "32 秒前检查",
      cloudClusters: "云集群数量",
      cloudNodes: "云算力节点",
      gpuModels: "云算力型号",
      robots: "具身真机数量",
      robotModels: "具身真机型号",
      jobs: "任务运行情况",
      compute: "计算资源分布",
      computeDesc: "云算力节点、具身算力节点与真机资源使用",
      liveJobs: "运行中的任务",
      liveRobots: "真机执行状态",
      recent: "最近动态",
    },
    clusters: {
      title: "集群及节点",
      eyebrow: "资源纳管",
      desc: "统一管理云集群、具身集群、云算力节点、具身算力节点和具身真机节点。",
      search: "搜索集群或节点...",
      clusterList: "集群列表",
      nodeList: "节点列表",
      selected: "选中资源",
      cpu: "CPU 使用率",
      memory: "内存使用率",
      gpu: "GPU 分配",
      robotState: "真机状态",
    },
    jobs: {
      title: "任务",
      eyebrow: "Job / Worker",
      desc: "创建强化学习、数据采集、评测或自定义任务，并观察每个 Worker 的日志、监控和具身实时通道。",
      search: "搜索任务...",
      selected: "任务详情",
      workers: "Worker 列表",
      defaultRoles: "默认角色",
      embodiedChannel: "具身实时通道",
      embodiedDesc: "预留真机操作画面、动作状态、传感器流和安全告警入口。",
      createTitle: "创建任务",
      customRole: "自定义角色",
    },
    api: {
      title: "接口参考",
      eyebrow: "开发者平台",
      desc: "面向集群、节点、Job 和 Worker 的资源 API。",
      sections: ["介绍", "认证", "集群", "节点", "任务", "Worker"],
      endpointDesc: [
        "查询集群列表",
        "查询节点列表",
        "创建任务",
        "查询 Worker 列表",
        "查看 Worker 日志",
      ],
      example: "响应示例",
      copy: "复制",
    },
  },
  en: {
    nav: {
      overview: "Overview",
      clusters: "Clusters & Nodes",
      jobs: "Jobs",
      api: "API Reference",
      certificates: "Certificates",
      admin: "Admin",
      workspace: "Workspace",
      developers: "Developers",
    },
    common: {
      search: "Search clusters, nodes, jobs...",
      production: "Production",
      createJob: "Create job",
      filters: "Filters",
      refresh: "Refresh",
      results: "results",
      viewAll: "View all",
      actions: "Actions",
      env: "Environment",
      envMeta: "Embodied cluster · Mock data",
      collapse: "Collapse sidebar",
      light: "Light",
      dark: "Dark",
      running: "Running",
      total: "Total",
      logs: "Logs",
      monitor: "Monitor",
      details: "Details",
    },
    status: {
      Running: "Running",
      Pending: "Pending",
      Succeeded: "Succeeded",
      Failed: "Failed",
      Online: "Online",
      Offline: "Offline",
    },
    kind: {
      CloudCompute: "Cloud compute",
      EmbodiedCompute: "Embodied compute",
      Robot: "Robot node",
      Cloud: "Cloud cluster",
      Embodied: "Embodied cluster",
    },
    jobType: {
      RL: "RL job",
      DataCollection: "Data collection",
      Evaluation: "Evaluation",
      Custom: "Custom job",
    },
    overview: {
      date: "Monday, June 29",
      title: "Embodied cluster overview",
      desc: "Track managed cloud clusters, compute nodes, robot fleets, jobs, and workers in real time.",
      health: "Platform health",
      operational: "Operational",
      checked: "Last checked 32s ago",
      cloudClusters: "Cloud clusters",
      cloudNodes: "Cloud compute nodes",
      gpuModels: "GPU models",
      robots: "Robots managed",
      robotModels: "Robot models",
      jobs: "Job status",
      compute: "Compute distribution",
      computeDesc: "Cloud compute, embodied compute, and robot utilization",
      liveJobs: "Running jobs",
      liveRobots: "Robot execution",
      recent: "Recent activity",
    },
    clusters: {
      title: "Clusters & Nodes",
      eyebrow: "Managed resources",
      desc: "Manage cloud clusters, embodied clusters, cloud compute nodes, embodied compute nodes, and robot nodes.",
      search: "Search clusters or nodes...",
      clusterList: "Clusters",
      nodeList: "Nodes",
      selected: "Selected resource",
      cpu: "CPU usage",
      memory: "Memory usage",
      gpu: "GPU allocation",
      robotState: "Robot state",
    },
    jobs: {
      title: "Jobs",
      eyebrow: "Job / Worker",
      desc: "Create RL, data collection, evaluation, or custom jobs, and inspect every worker, log, metric, and robot channel.",
      search: "Search jobs...",
      selected: "Job details",
      workers: "Workers",
      defaultRoles: "Default roles",
      embodiedChannel: "Embodied live channel",
      embodiedDesc:
        "Reserved entry for robot video, action state, sensor streams, and safety alerts.",
      createTitle: "Create job",
      customRole: "Custom role",
    },
    api: {
      title: "API Reference",
      eyebrow: "Developer platform",
      desc: "Resource APIs for clusters, nodes, jobs, and workers.",
      sections: [
        "Introduction",
        "Authentication",
        "Clusters",
        "Nodes",
        "Jobs",
        "Workers",
      ],
      endpointDesc: [
        "List clusters",
        "List nodes",
        "Create job",
        "List workers",
        "View worker logs",
      ],
      example: "Example response",
      copy: "Copy",
    },
  },
} as const;

type Copy = (typeof copy)[Lang];

const navItems: { id: Page; icon: typeof LayoutDashboard }[] = [
  { id: "overview", icon: LayoutDashboard },
  { id: "clusters", icon: Network },
  { id: "jobs", icon: Workflow },
  { id: "certificates", icon: Shield },
  { id: "api", icon: Braces },
];

function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <strong>rlark</strong>
        <small>CONTROL CENTER</small>
      </div>
    </div>
  );
}

function StatusBadge({ phase, copy: c }: { phase: Phase; copy: Copy }) {
  return (
    <span className={"status status-" + phase.toLowerCase()}>
      <i />
      {c.status[phase]}
    </span>
  );
}

function Header({
  title,
  lang,
  theme,
  copy: c,
  onLangChange,
  onThemeChange,
  onCreate,
}: {
  title: string;
  lang: Lang;
  theme: Theme;
  copy: Copy;
  onLangChange: (lang: Lang) => void;
  onThemeChange: (theme: Theme) => void;
  onCreate: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <h1 data-search={c.common.search}>{title}</h1>
      </div>
      <div className="topbar-actions">
        <button className="cluster-picker">
          <span className="online-pulse" />
          {c.common.production}
          <ChevronDown size={14} />
        </button>
        <div className="segmented-control">
          <button
            className={lang === "zh" ? "active" : ""}
            onClick={() => onLangChange("zh")}
          >
            <Languages size={14} />中
          </button>
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => onLangChange("en")}
          >
            EN
          </button>
        </div>
        <div className="segmented-control theme-control">
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => onThemeChange("light")}
          >
            {c.common.light}
          </button>
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => onThemeChange("dark")}
          >
            <Moon size={14} />
            {c.common.dark}
          </button>
        </div>
        <div className="icon-button">
          <Bell size={18} />
          <em>3</em>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} />
          {c.common.createJob}
        </button>
        <div className="avatar">BW</div>
      </div>
    </header>
  );
}

function MetricCard({
  icon: Icon,
  tone,
  label,
  value,
  note,
}: {
  icon: typeof Activity;
  tone: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={"metric-card tone-" + tone}>
      <div className="metric-head">
        <span className="metric-icon">
          <Icon size={18} />
        </span>
        <MoreHorizontal size={17} />
      </div>
      <span className="metric-label">{label}</span>
      <div className="metric-value-row">
        <strong>{value}</strong>
      </div>
      <small>{note}</small>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  return (
    <div className="gauge">
      <div
        style={{
          background: `conic-gradient(#36c98f ${value * 3.6}deg, #e8edf4 0)`,
        }}
      >
        <span>{value}%</span>
      </div>
      <small>{label}</small>
    </div>
  );
}

function PageToolbar({
  placeholder,
  value,
  onChange,
  count,
  copy: c,
  onRefresh,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  count: number;
  copy: Copy;
  onRefresh?: () => void;
}) {
  return (
    <div className="page-toolbar">
      <div className="search-field">
        <Search size={16} />
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <kbd>⌘ K</kbd>
      </div>
      <button className="secondary-button">
        <ListFilter size={16} />
        {c.common.filters}
        <span>2</span>
      </button>
      <button className="secondary-button" onClick={onRefresh}>
        <RefreshCw size={16} />
        {c.common.refresh}
      </button>
      <small>
        {count} {c.common.results}
      </small>
    </div>
  );
}

function ResourceDistribution({ copy: c }: { copy: Copy }) {
  const rows = [
    {
      label: c.kind.CloudCompute,
      value: 72,
      note: "60 nodes · H800 / A100 / L40S",
      color: "blue",
    },
    {
      label: c.kind.EmbodiedCompute,
      value: 49,
      note: "15 nodes · Jetson / RTX Edge",
      color: "green",
    },
    {
      label: c.kind.Robot,
      value: 68,
      note: "44 robots · G1 / Franka / Robodog",
      color: "orange",
    },
  ];
  return (
    <div className="resource-split">
      {rows.map((row) => (
        <div key={row.label} className={"resource-row " + row.color}>
          <div>
            <strong>{row.label}</strong>
            <small>{row.note}</small>
          </div>
          <span>
            <i style={{ width: row.value + "%" }} />
          </span>
          <b>{row.value}%</b>
        </div>
      ))}
    </div>
  );
}

function Overview({
  navigate,
  copy: c,
}: {
  navigate: (page: Page) => void;
  copy: Copy;
}) {
  const cloudClusters = clusters.filter((x) => x.type === "Cloud");
  const embodiedClusters = clusters.filter((x) => x.type === "Embodied");
  const cloudNodeCount = clusters.reduce((sum, x) => sum + x.cloudNodes, 0);
  const robotCount = clusters.reduce((sum, x) => sum + x.robots, 0);
  const runningJobs = jobs.filter((x) => x.phase === "Running").length;
  const gpuModels = Array.from(new Set(clusters.flatMap((x) => x.gpuModels)))
    .slice(0, 4)
    .join(" / ");
  const robotModels = Array.from(
    new Set(clusters.flatMap((x) => x.robotModels)),
  )
    .slice(0, 4)
    .join(" / ");

  return (
    <div className="page-content">
      <section className="hero-strip">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} />
            {c.overview.date}
          </span>
          <h2>{c.overview.title}</h2>
          <p>{c.overview.desc}</p>
        </div>
        <div className="hero-health">
          <span>{c.overview.health}</span>
          <strong>
            <i />
            {c.overview.operational}
          </strong>
          <small>{c.overview.checked}</small>
        </div>
      </section>
      <section className="metric-grid platform-metrics">
        <MetricCard
          icon={CloudCog}
          tone="blue"
          label={c.overview.cloudClusters}
          value={`${cloudClusters.length}`}
          note={cloudClusters.map((x) => x.region).join(" · ")}
        />
        <MetricCard
          icon={Server}
          tone="mint"
          label={c.overview.cloudNodes}
          value={`${cloudNodeCount}`}
          note={gpuModels}
        />
        <MetricCard
          icon={Bot}
          tone="violet"
          label={c.overview.robots}
          value={`${robotCount}`}
          note={`${embodiedClusters.length} ${c.kind.Embodied} · ${robotModels}`}
        />
        <MetricCard
          icon={Workflow}
          tone="orange"
          label={c.overview.jobs}
          value={`${runningJobs} / ${jobs.length}`}
          note={`${jobs.reduce((s, x) => s + x.runningWorkers, 0)} ${c.common.running} Worker`}
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.compute}</span>
              <h3>{c.overview.computeDesc}</h3>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("clusters")}
            >
              {c.common.viewAll}
              <ArrowRight size={14} />
            </button>
          </div>
          <ResourceDistribution copy={c} />
          <div className="cluster-models">
            <div>
              <span>{c.overview.gpuModels}</span>
              <strong>{gpuModels}</strong>
            </div>
            <div>
              <span>{c.overview.robotModels}</span>
              <strong>{robotModels}</strong>
            </div>
          </div>
        </div>
        <div className="panel workload-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.liveRobots}</span>
              <h3>{c.kind.Robot}</h3>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("clusters")}
            >
              {c.common.details}
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="robot-state-list">
            {nodes
              .filter((n) => n.kind === "Robot")
              .map((n) => (
                <div key={n.id}>
                  <span className={"node-status-ring " + n.phase.toLowerCase()}>
                    <Bot size={17} />
                  </span>
                  <div>
                    <strong>{n.name}</strong>
                    <small>
                      {n.model} · {n.robotState}
                    </small>
                  </div>
                  <StatusBadge phase={n.phase} copy={c} />
                </div>
              ))}
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
            {jobs.slice(0, 4).map((job) => (
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
            <button className="icon-button small">
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="activity-list">
            {activity.map((item, i) => (
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ClustersPage({ copy: c }: { copy: Copy }) {
  const [query, setQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<Cluster>(clusters[0]);
  const [selectedNode, setSelectedNode] = useState<NodeItem>(nodes[0]);
  const [resourceView, setResourceView] = useState<"clusters" | "nodes">(
    "clusters",
  );
  const [kindFilter, setKindFilter] = useState<"All" | NodeItem["kind"]>("All");
  const [phaseFilter, setPhaseFilter] = useState<"All" | Phase>("All");

  const clusterNodes = nodes.filter((n) => n.cluster === selectedCluster.name);
  const filteredNodes = nodes.filter((n) => {
    const hit = `${n.name} ${n.cluster} ${n.model} ${n.address}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const kindHit = kindFilter === "All" || n.kind === kindFilter;
    const phaseHit = phaseFilter === "All" || n.phase === phaseFilter;
    return hit && kindHit && phaseHit;
  });
  const onlineClusters = clusters.filter((x) => x.phase === "Online").length;
  const cloudCount = clusters.filter((x) => x.type === "Cloud").length;
  const embodiedCount = clusters.filter((x) => x.type === "Embodied").length;
  const totalNodes = nodes.length;
  const robotNodes = nodes.filter((x) => x.kind === "Robot").length;

  return (
    <div className="page-content resource-page cluster-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.clusters.eyebrow}</span>
          <h2>{c.clusters.title}</h2>
          <p>{c.clusters.desc}</p>
        </div>
      </div>
      <div className="subpage-tabs">
        <button
          className={resourceView === "clusters" ? "active" : ""}
          onClick={() => setResourceView("clusters")}
        >
          <Network size={15} />
          集群视图
        </button>
        <button
          className={resourceView === "nodes" ? "active" : ""}
          onClick={() => setResourceView("nodes")}
        >
          <Server size={15} />
          节点视图
        </button>
      </div>
      <section className="cluster-overview-grid">
        <MetricCard
          icon={Network}
          tone="blue"
          label="集群总数"
          value={`${clusters.length}`}
          note={`${onlineClusters} ${c.status.Online} · ${cloudCount} ${c.kind.Cloud} / ${embodiedCount} ${c.kind.Embodied}`}
        />
        <MetricCard
          icon={Server}
          tone="mint"
          label="节点总数"
          value={`${totalNodes}`}
          note={`${nodes.filter((n) => n.kind === "CloudCompute").length} ${c.kind.CloudCompute} · ${nodes.filter((n) => n.kind === "EmbodiedCompute").length} ${c.kind.EmbodiedCompute}`}
        />
        <MetricCard
          icon={Bot}
          tone="violet"
          label={c.kind.Robot}
          value={`${robotNodes}`}
          note={Array.from(
            new Set(
              nodes.filter((n) => n.kind === "Robot").map((n) => n.model),
            ),
          ).join(" / ")}
        />
        <MetricCard
          icon={Workflow}
          tone="orange"
          label={c.common.running + " Job"}
          value={`${clusters.reduce((s, x) => s + x.runningJobs, 0)}`}
          note="跨云训练、具身采集、评测任务"
        />
      </section>
      {resourceView === "clusters" && (
        <>
          <section className="cluster-topology-grid">
            <div className="panel cluster-map-card">
              <div className="panel-title">
                <div>
                  <span>Distribution</span>
                  <h3>集群分布地图</h3>
                </div>
                <button className="plain-button">
                  {c.common.viewAll}
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="cluster-map">
                <div className="map-grid" />
                {clusters.map((cluster, index) => (
                  <button
                    key={cluster.id}
                    className={`map-pin pin-${index} ${selectedCluster.id === cluster.id ? "active" : ""}`}
                    onClick={() => setSelectedCluster(cluster)}
                  >
                    <span>
                      {cluster.type === "Cloud" ? (
                        <CloudCog size={15} />
                      ) : (
                        <Bot size={15} />
                      )}
                    </span>
                    <strong>{cluster.location}</strong>
                    <small>
                      {cluster.cloudNodes +
                        cluster.embodiedNodes +
                        cluster.robots}{" "}
                      nodes
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <ClusterDetail
              cluster={selectedCluster}
              nodes={clusterNodes}
              copy={c}
            />
          </section>
          <section className="panel cluster-list-panel">
            <div className="panel-title">
              <div>
                <span>{c.clusters.clusterList}</span>
                <h3>集群整体情况</h3>
              </div>
            </div>
            <div className="cluster-card-grid">
              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  className={
                    selectedCluster.id === cluster.id
                      ? "cluster-card selected"
                      : "cluster-card"
                  }
                  onClick={() => setSelectedCluster(cluster)}
                >
                  <div className="cluster-card-head">
                    <span className={cluster.type.toLowerCase()}>
                      {cluster.type === "Cloud" ? (
                        <CloudCog size={18} />
                      ) : (
                        <Bot size={18} />
                      )}
                    </span>
                    <StatusBadge phase={cluster.phase} copy={c} />
                  </div>
                  <strong>{cluster.name}</strong>
                  <small>
                    {c.kind[cluster.type]} · {cluster.region}
                  </small>
                  <div className="cluster-loads">
                    <i>
                      <b style={{ width: cluster.cpuUsage + "%" }} />
                    </i>
                    <i>
                      <b style={{ width: cluster.gpuUsage + "%" }} />
                    </i>
                    <i>
                      <b style={{ width: cluster.robotUsage + "%" }} />
                    </i>
                  </div>
                  <div className="cluster-card-foot">
                    <span>
                      {cluster.cloudNodes +
                        cluster.embodiedNodes +
                        cluster.robots}{" "}
                      nodes
                    </span>
                    <span>{cluster.runningJobs} jobs</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {resourceView === "nodes" && (
        <section className="nodes-resource-section">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">{c.clusters.nodeList}</span>
              <h2>节点资源</h2>
              <p>按节点类型、状态筛选，查看云算力、具身算力和具身真机详情。</p>
            </div>
          </div>
          <PageToolbar
            placeholder={c.clusters.search}
            value={query}
            onChange={setQuery}
            count={filteredNodes.length}
            copy={c}
          />
          <div className="node-filter-bar">
            {(["All", "CloudCompute", "EmbodiedCompute", "Robot"] as const).map(
              (kind) => (
                <button
                  key={kind}
                  className={kindFilter === kind ? "active" : ""}
                  onClick={() => setKindFilter(kind)}
                >
                  {kind === "All" ? c.common.viewAll : c.kind[kind]}
                </button>
              ),
            )}
            {(["All", "Online", "Offline"] as const).map((phase) => (
              <button
                key={phase}
                className={phaseFilter === phase ? "active" : ""}
                onClick={() => setPhaseFilter(phase)}
              >
                {phase === "All" ? "全部状态" : c.status[phase]}
              </button>
            ))}
          </div>
          <div className="node-detail-grid">
            <div className="node-card-grid">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  className={
                    selectedNode.id === node.id
                      ? "node-resource-card selected"
                      : "node-resource-card"
                  }
                  onClick={() => setSelectedNode(node)}
                >
                  <span
                    className={"node-status-ring " + node.phase.toLowerCase()}
                  >
                    {node.kind === "Robot" ? (
                      <Bot size={18} />
                    ) : (
                      <Server size={18} />
                    )}
                  </span>
                  <div>
                    <strong>{node.name}</strong>
                    <small>
                      {c.kind[node.kind]} · {node.model}
                    </small>
                    <em>{node.cluster}</em>
                  </div>
                  <StatusBadge phase={node.phase} copy={c} />
                </button>
              ))}
            </div>
            <NodeDetail node={selectedNode} copy={c} />
          </div>
        </section>
      )}
    </div>
  );
}

function ClusterDetail({
  cluster,
  nodes: clusterNodes,
  copy: c,
}: {
  cluster: Cluster;
  nodes: NodeItem[];
  copy: Copy;
}) {
  return (
    <div className="panel selected-cluster-panel">
      <div className="detail-header">
        <div>
          <span className="eyebrow">{c.clusters.selected}</span>
          <h3>{cluster.name}</h3>
          <p>{cluster.description}</p>
        </div>
        <StatusBadge phase={cluster.phase} copy={c} />
      </div>
      <div className="cluster-detail-stats">
        <div>
          <span>{c.kind[cluster.type]}</span>
          <strong>{cluster.region}</strong>
          <small>{cluster.location}</small>
        </div>
        <div>
          <span>节点规模</span>
          <strong>
            {cluster.cloudNodes + cluster.embodiedNodes + cluster.robots}
          </strong>
          <small>{clusterNodes.length} visible nodes</small>
        </div>
        <div>
          <span>{c.common.running} Job</span>
          <strong>{cluster.runningJobs}</strong>
          <small>active workloads</small>
        </div>
      </div>
      <ResourceDistribution copy={c} />
    </div>
  );
}

function NodeDetail({ node, copy: c }: { node: NodeItem; copy: Copy }) {
  const isRobot = node.kind === "Robot";
  return (
    <div className="node-resource-detail">
      <div className="detail-header">
        <div>
          <span className="eyebrow">{c.clusters.selected}</span>
          <h3>{node.name}</h3>
          <p>
            {node.cluster} · {node.address}
          </p>
        </div>
        <StatusBadge phase={node.phase} copy={c} />
      </div>
      <div className="node-health compact-health">
        <Gauge value={node.cpu} label={c.clusters.cpu} />
        <Gauge value={node.memory} label={c.clusters.memory} />
        <div className="gpu-card">
          <span>
            <Cpu size={18} />
          </span>
          <strong>{node.gpu}</strong>
          <small>{c.clusters.gpu}</small>
        </div>
        <div className="gpu-card">
          <span>
            <Workflow size={18} />
          </span>
          <strong>{node.tasks}</strong>
          <small>Worker</small>
        </div>
      </div>
      {isRobot ? (
        <div className="robot-channel-grid">
          <div className="channel-screen robot-camera">
            <Video size={28} />
            <strong>Camera Preview</strong>
            <span>{node.cameraUrl}</span>
          </div>
          <div className="robot-endpoints">
            <div>
              <span>状态</span>
              <strong>{node.robotState}</strong>
            </div>
            <div>
              <span>电量</span>
              <strong>{node.battery ?? 0}%</strong>
            </div>
            <div>
              <span>Telemetry</span>
              <code>{node.telemetryUrl}</code>
            </div>
            <div>
              <span>Control</span>
              <code>{node.controlUrl}</code>
            </div>
          </div>
        </div>
      ) : (
        <div className="node-map platform-map compact-map">
          <div className="canvas-grid" />
          <div className="machine machine-main">
            <span>
              <Server size={22} />
            </span>
            <strong>{node.model}</strong>
            <small>{c.kind[node.kind]}</small>
          </div>
          <div className="machine machine-gpu">
            <span>
              <GaugeIcon size={19} />
            </span>
            <strong>Runtime</strong>
            <small>{node.gpu}</small>
          </div>
          <div className="machine machine-storage">
            <span>
              <HardDrive size={19} />
            </span>
            <strong>Local cache</strong>
            <small>1.2 / 3.8 TB</small>
          </div>
          <svg viewBox="0 0 700 260" preserveAspectRatio="none">
            <path d="M260 130 C330 130 325 72 405 72" />
            <path d="M260 130 C330 130 325 192 405 192" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface CRDWorkload {
  kind: string;
  replicas: number;
  template: {
    spec: {
      containers: Array<{
        name: string;
        image: string;
        command: string[];
        env: Array<{ name: string; value: string }>;
        volumeMounts?: Array<{ name: string; mountPath: string }>;
        resources?: {
          requests?: Record<string, string>;
          limits?: Record<string, string>;
        };
      }>;
      volumes?: Array<{ name: string; hostPath: { path: string } }>;
    };
  };
}

interface CRDJobTask {
  name: string;
  head: boolean;
  agentType: string;
  role: string;
  nodeSelector: Record<string, string>;
  kubernetes?: {
    workload?: CRDWorkload;
  };
}

interface CRDJob {
  apiVersion: string;
  kind: string;
  metadata: { name: string; creationTimestamp?: string };
  spec: { domain?: string; tasks: CRDJobTask[] };
  status?: {
    phase: string;
    tasks?: Array<{ name: string; phase: string; message: string }>;
  };
}

function crdToJob(crd: CRDJob): Job {
  const tasks = crd.spec.tasks ?? [];
  const container =
    tasks[0]?.kubernetes?.workload?.template.spec.containers?.[0];
  const phase = (crd.status?.phase ?? "Pending") as Phase;
  const allTaskStatuses = crd.status?.tasks ?? [];
  const totalReplicas = tasks.reduce(
    (sum, t) => sum + (t.kubernetes?.workload?.replicas ?? 1),
    0,
  );
  const runningTasks = allTaskStatuses.filter(
    (t) => t.phase === "Running",
  ).length;
  const headerTask = tasks.find((t) => t.head) ?? tasks[0];
  const roles = tasks.map((t) => t.name);
  const resources = tasks.map((t) => {
    const c = t.kubernetes?.workload?.template.spec.containers?.[0];
    const res = c?.resources?.requests ?? {};
    const gpu = res["nvidia.com/gpu"] ?? "0";
    const ns = t.nodeSelector ?? {};
    const nsStr = Object.entries(ns)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return {
      role: t.name,
      cluster: "",
      nodeSelector: nsStr,
      replicas: t.kubernetes?.workload?.replicas ?? 1,
      cpu: res.cpu ?? "",
      memory: res.memory ?? "",
      gpu,
    };
  });
  const env =
    container?.env
      ?.filter((e) => e.name !== "RLARK_TASK_ROLE")
      .map((e) => ({ key: e.name, value: e.value })) ?? [];
  const mounts = (container?.volumeMounts ?? []).map((vm, i) => {
    const vol = tasks[0]?.kubernetes?.workload?.template.spec.volumes?.find(
      (v) => v.name === vm.name,
    );
    return {
      objectStorage: vol?.hostPath?.path ?? "",
      mountPath: vm.mountPath,
    };
  });
  return {
    id: crd.metadata.name,
    name: crd.metadata.name,
    type: mapRoleToJobType(tasks),
    phase,
    owner: "",
    cluster: tasks
      .map((t) => (t.nodeSelector ? Object.values(t.nodeSelector)[0] : ""))
      .filter(Boolean)
      .join(", "),
    target: roles.join(" / "),
    workers: totalReplicas,
    runningWorkers: runningTasks,
    startedAt: crd.metadata.creationTimestamp ?? "—",
    duration: "—",
    progress:
      phase === "Succeeded"
        ? 100
        : phase === "Running"
          ? Math.round((runningTasks / Math.max(totalReplicas, 1)) * 100)
          : 0,
    defaultRoles: roles,
    image: container?.image ?? "",
    command: (container?.command ?? []).join(" "),
    env,
    mounts,
    headerRole: headerTask?.name ?? "",
    headerWorker: headerTask?.name ?? "",
    sshAddress: "",
    resources,
    taskStatuses: allTaskStatuses,
  };
}

function mapRoleToJobType(tasks: CRDJobTask[]): JobType {
  const roles = tasks.map((t) => t.role);
  if (roles.includes("Rollout")) return "RL";
  if (roles.some((r) => r.toLowerCase().includes("collect")))
    return "DataCollection";
  if (roles.some((r) => r.toLowerCase().includes("eval"))) return "Evaluation";
  return "Custom";
}

function JobsPage({ copy: c, onCreate }: { copy: Copy; onCreate: () => void }) {
  const zh = c.nav.overview === "总览";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Job | null>(null);
  const [realJobs, setRealJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/jobs");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: CRDJob[] = data.items ?? [];
      setRealJobs(items.map(crdToJob));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (job: Job) => {
    if (
      !confirm(
        zh ? `确定删除任务 "${job.name}" 吗?` : `Delete job "${job.name}"?`,
      )
    )
      return;
    try {
      const resp = await fetch(`/api/v1/rlinf.io/v1alpha1/jobs/${job.name}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setRealJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const allJobs = realJobs.length > 0 ? realJobs : jobs;
  const filtered = allJobs.filter((j) =>
    `${j.name} ${j.type} ${j.target}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (selected) {
    return (
      <JobDetailPage job={selected} copy={c} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="page-content resource-page jobs-list-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.jobs.eyebrow}</span>
          <h2>{c.jobs.title}</h2>
          <p>{c.jobs.desc}</p>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} />
          {c.common.createJob}
        </button>
      </div>
      <PageToolbar
        placeholder={c.jobs.search}
        value={query}
        onChange={setQuery}
        count={filtered.length}
        copy={c}
        onRefresh={fetchJobs}
      />
      {error && (
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div className="table-panel jobs-table-panel">
        <table>
          <thead>
            <tr>
              <th>{zh ? "任务名称" : "Name"}</th>
              <th>{zh ? "任务类型" : "Type"}</th>
              <th>{zh ? "状态" : "Status"}</th>
              <th>Worker</th>
              <th>Header</th>
              <th>{zh ? "集群/目标" : "Target"}</th>
              <th>{zh ? "耗时" : "Duration"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id}>
                <td>
                  <button
                    className="link-cell"
                    onClick={() => setSelected(job)}
                  >
                    <strong>{job.name}</strong>
                    <small>{job.id}</small>
                  </button>
                </td>
                <td>
                  <span className="role-chip">{c.jobType[job.type]}</span>
                </td>
                <td>
                  <StatusBadge phase={job.phase} copy={c} />
                </td>
                <td>
                  <span className="inline-progress">
                    <i>
                      <b style={{ width: job.progress + "%" }} />
                    </i>
                    {job.runningWorkers}/{job.workers}
                  </span>
                </td>
                <td>
                  <code className="inline-code">{job.headerWorker}</code>
                </td>
                <td>
                  <span className="table-primary">
                    <span>
                      <strong>{job.target}</strong>
                      <small>{job.cluster}</small>
                    </span>
                  </span>
                </td>
                <td>{job.duration}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="secondary-button"
                      onClick={() => setSelected(job)}
                    >
                      {zh ? "详情" : "Details"}
                      <ChevronRight size={14} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => handleDelete(job)}
                      title={zh ? "删除" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobDetailPage({
  job,
  copy: c,
  onBack,
}: {
  job: Job;
  copy: Copy;
  onBack: () => void;
}) {
  const zh = c.nav.overview === "总览";
  const [activeTab, setActiveTab] = useState<
    "config" | "workers" | "logs" | "monitor"
  >("config");
  const jobWorkers: WorkerItem[] =
    job.taskStatuses.length > 0
      ? job.taskStatuses.map((ts, i) => ({
          id: `${job.id}-${i}`,
          name: ts.name,
          jobId: job.id,
          role: ts.name,
          node: "—",
          phase: (ts.phase || "Pending") as Phase,
          cpu: 0,
          memory: 0,
          logs: ts.message ? [ts.message] : [],
        }))
      : workers.filter((w) => w.jobId === job.id);
  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: "config", label: zh ? "配置" : "Config" },
    { id: "workers", label: c.jobs.workers },
    { id: "logs", label: c.common.logs },
    { id: "monitor", label: c.common.monitor },
  ];
  return (
    <div className="page-content resource-page job-detail-page">
      <div className="section-heading">
        <div>
          <button className="plain-button back-button" onClick={onBack}>
            ← {zh ? "返回任务列表" : "Back"}
          </button>
          <span className="eyebrow">{c.jobs.selected}</span>
          <h2>{job.name}</h2>
          <p>
            {c.jobType[job.type]} · {job.cluster}
          </p>
        </div>
        <div>
          <StatusBadge phase={job.phase} copy={c} />
        </div>
      </div>
      <div className="detail-stats">
        <div>
          <span>{c.common.running} Worker</span>
          <strong>
            {job.runningWorkers}/{job.workers}
          </strong>
          <i>
            <b style={{ width: job.progress + "%" }} />
          </i>
        </div>
        <div>
          <span>{c.jobs.defaultRoles}</span>
          <strong>{job.defaultRoles.length}</strong>
          <small>{job.defaultRoles.join(" / ")}</small>
        </div>
        <div>
          <span>Header SSH</span>
          <strong>{job.headerWorker}</strong>
          <small>{job.sshAddress}</small>
        </div>
        <div>
          <span>Owner</span>
          <strong>{job.owner}</strong>
          <small>{job.duration}</small>
        </div>
      </div>
      <div className="sub-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "config" && <JobConfigSummary job={job} />}
      {activeTab === "workers" && (
        <div className="worker-and-channel">
          <div className="worker-table">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Role</th>
                  <th>Node</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jobWorkers.map((worker) => (
                  <WorkerRow key={worker.id} worker={worker} copy={c} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="embodied-channel">
            <div className="channel-screen">
              <Video size={28} />
              <strong>{c.jobs.embodiedChannel}</strong>
              <span>{c.jobs.embodiedDesc}</span>
            </div>
            <div className="log-stream">
              {(jobWorkers[0]?.logs ?? []).map((log, i) => (
                <code key={i}>
                  [{i + 1}] {log}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === "logs" && (
        <div className="embodied-channel">
          <div className="log-stream" style={{ width: "100%" }}>
            {jobWorkers.flatMap((w) => w.logs).length > 0 ? (
              jobWorkers
                .flatMap((w) => w.logs)
                .map((log, i) => (
                  <code key={i}>
                    [{i + 1}] {log}
                  </code>
                ))
            ) : (
              <code>{zh ? "暂无日志" : "No logs available"}</code>
            )}
          </div>
        </div>
      )}
      {activeTab === "monitor" && (
        <div className="embodied-channel">
          <div className="channel-screen" style={{ width: "100%" }}>
            <GaugeIcon size={28} />
            <strong>{zh ? "监控面板" : "Monitor Dashboard"}</strong>
            <span>
              {zh
                ? "等待接入 Prometheus / Grafana 数据源"
                : "Waiting for Prometheus / Grafana data source"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function JobConfigSummary({ job }: { job: Job }) {
  return (
    <div className="job-config-summary">
      <div>
        <span>Image</span>
        <code>{job.image}</code>
      </div>
      <div>
        <span>Command</span>
        <pre>{job.command}</pre>
      </div>
      <div>
        <span>Env</span>
        {job.env.map((item) => (
          <code key={item.key}>
            {item.key}={item.value}
          </code>
        ))}
      </div>
      <div>
        <span>Object storage mounts</span>
        {job.mounts.map((item) => (
          <code key={item.mountPath}>
            {item.objectStorage} → {item.mountPath}
          </code>
        ))}
      </div>
      <div>
        <span>Header Worker</span>
        <strong>
          {job.headerRole} / {job.headerWorker}
        </strong>
        <code>{job.sshAddress}</code>
      </div>
      <div>
        <span>Role resources</span>
        {job.resources.map((item) => (
          <code key={item.role}>
            {item.role}: {item.replicas} × {item.cpu} CPU / {item.memory} /{" "}
            {item.gpu} GPU · {item.nodeSelector}
          </code>
        ))}
      </div>
    </div>
  );
}

function WorkerRow({ worker, copy: c }: { worker: WorkerItem; copy: Copy }) {
  return (
    <tr>
      <td>
        <span className="table-primary">
          <span className="row-icon">
            <Zap size={16} />
          </span>
          <span>
            <strong>{worker.name}</strong>
            <small>{worker.latency ?? `${worker.fps ?? "-"} fps`}</small>
          </span>
        </span>
      </td>
      <td>
        <span className="role-chip">{worker.role}</span>
      </td>
      <td>{worker.node}</td>
      <td>
        <StatusBadge phase={worker.phase} copy={c} />
      </td>
      <td>{worker.cpu}%</td>
      <td>{worker.memory}%</td>
      <td>
        <button className="secondary-button terminal-button">
          <TerminalSquare size={16} />
          WebTerminal
        </button>
      </td>
    </tr>
  );
}

function ApiPage({ copy: c }: { copy: Copy }) {
  const endpoints = [
    ["GET", "/api/v1/clusters", c.api.endpointDesc[0]],
    ["GET", "/api/v1/nodes", c.api.endpointDesc[1]],
    ["POST", "/api/v1/jobs", c.api.endpointDesc[2]],
    ["GET", "/api/v1/jobs/{id}/workers", c.api.endpointDesc[3]],
    ["GET", "/api/v1/workers/{id}/logs", c.api.endpointDesc[4]],
  ];
  const example =
    '{\\n  "kind": "Job",\\n  "type": "RL",\\n  "workers": [\\n    { "role": "Learner", "node": "gpu-cloud-03" },\\n    { "role": "Env Worker", "node": "robot-g1-12" }\\n  ]\\n}';
  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.api.eyebrow}</span>
          <h2>{c.api.title}</h2>
          <p>{c.api.desc}</p>
        </div>
      </div>
      <div className="api-layout">
        <aside>
          <div className="search-field">
            <Search size={15} />
            <input placeholder={c.common.search} />
          </div>
          {c.api.sections.map((x, i) => (
            <button className={i === 4 ? "active" : ""} key={x}>
              {x}
              <ChevronRight size={14} />
            </button>
          ))}
        </aside>
        <main>
          <span className="eyebrow">JOB API</span>
          <h2>Jobs & Workers</h2>
          <p>{c.api.desc}</p>
          <div className="endpoint-list">
            {endpoints.map(([method, path, desc]) => (
              <div key={method + path}>
                <span className={"method " + method.toLowerCase()}>
                  {method}
                </span>
                <code>{path}</code>
                <p>{desc}</p>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
          <div className="code-block">
            <div>
              <span>{c.api.example}</span>
              <button>{c.api.copy}</button>
            </div>
            <pre>{example}</pre>
          </div>
        </main>
      </div>
    </div>
  );
}

const TASK_ROLE_MAP: Record<string, "Actor" | "Rollout" | "Env"> = {
  Learner: "Actor",
  Evaluator: "Actor",
  "Scenario Runner": "Actor",
  "Metrics Aggregator": "Actor",
  Collector: "Actor",
  "Calibration Driver": "Actor",
  "Rollout Worker": "Rollout",
  "Robot Operator": "Rollout",
  "Camera Worker": "Rollout",
  "Env Worker": "Env",
  Uploader: "Env",
  "Quality Checker": "Env",
  "Robot Worker": "Env",
  "Metrics Worker": "Env",
};

const ROLE_TEMPLATES: Record<JobType, string[]> = {
  RL: ["Learner", "Rollout Worker", "Env Worker", "Evaluator"],
  DataCollection: [
    "Collector",
    "Robot Operator",
    "Uploader",
    "Quality Checker",
  ],
  Evaluation: ["Evaluator", "Scenario Runner", "Metrics Aggregator"],
  Custom: ["Custom", "Robot Worker", "Metrics Worker"],
};

interface RoleResource {
  role: string;
  cluster: string;
  nodeSelector: string;
  replicas: number;
  cpu: string;
  memory: string;
  gpu: string;
}

function mapTaskRole(role: string): "Actor" | "Rollout" | "Env" {
  return TASK_ROLE_MAP[role] ?? "Actor";
}

function parseCommand(cmd: string): string[] {
  return cmd.trim().split(/\s+/).filter(Boolean);
}

function parseNodeSelector(s: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of s.split(",")) {
    const [k, v] = part.split("=");
    if (k && v !== undefined) result[k.trim()] = v.trim();
  }
  return result;
}

function generateJobCRD(opts: {
  name: string;
  type: JobType;
  headerRole: string;
  roles: string[];
  roleResources: Record<string, RoleResource>;
  image: string;
  command: string;
  envs: Array<{ key: string; value: string }>;
  mounts: Array<{ objectStorage: string; mountPath: string }>;
}) {
  const tasks = opts.roles.map((role) => {
    const res = opts.roleResources[role];
    const isHead = role === opts.headerRole;
    const envVars = [
      ...opts.envs.map((e) => ({ name: e.key, value: e.value })),
      { name: "RLARK_TASK_ROLE", value: role },
    ];
    const containerVolumes = opts.mounts.map((m) => ({
      name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
      hostPath: { path: m.objectStorage },
    }));
    const volumeMounts = opts.mounts.map((m) => ({
      name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
      mountPath: m.mountPath,
    }));
    return {
      name: role.toLowerCase().replace(/\s+/g, "-"),
      head: isHead,
      agentType: "Kubernetes",
      role: mapTaskRole(role),
      nodeSelector: res ? parseNodeSelector(res.nodeSelector) : {},
      kubernetes: {
        workload: {
          kind: "Deployment",
          replicas: res ? Number(res.replicas) : 1,
          template: {
            spec: {
              containers: [
                {
                  name: "main",
                  image: opts.image,
                  command: parseCommand(opts.command),
                  env: envVars,
                  volumeMounts:
                    volumeMounts.length > 0 ? volumeMounts : undefined,
                  resources: res
                    ? {
                        requests: {
                          cpu: res.cpu,
                          memory: res.memory,
                          ...(res.gpu !== "0"
                            ? { "nvidia.com/gpu": res.gpu }
                            : {}),
                        },
                        limits: {
                          cpu: res.cpu,
                          memory: res.memory,
                          ...(res.gpu !== "0"
                            ? { "nvidia.com/gpu": res.gpu }
                            : {}),
                        },
                      }
                    : undefined,
                },
              ],
              volumes:
                containerVolumes.length > 0 ? containerVolumes : undefined,
            },
          },
        },
      },
    };
  });

  return {
    apiVersion: "rlark.io/v1alpha1",
    kind: "Job",
    metadata: { name: opts.name },
    spec: { tasks },
  };
}

function toYaml(obj: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "string")
    return /[:\n#{}\[\],&*?|>=%@`]/.test(obj) || obj === ""
      ? `"${obj.replace(/"/g, '\\"')}"`
      : obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => {
        if (item !== null && typeof item === "object") {
          const lines = toYaml(item, indent + 2).split("\n");
          const firstLine = lines[0].replace(/^\s+/, "");
          const restLines = lines.slice(1).join("\n");
          return `${pad}- ${firstLine}${restLines ? "\n" + restLines : ""}`;
        }
        return `${pad}- ${toYaml(item, indent)}`;
      })
      .join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    );
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, val]) => {
        if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val) &&
          Object.keys(val).length === 0
        )
          return null;
        if (val !== null && typeof val === "object") {
          const inner = toYaml(val, indent + 2);
          return `${pad}${key}:\n${inner}`;
        }
        return `${pad}${key}: ${toYaml(val, indent)}`;
      })
      .filter(Boolean)
      .join("\n");
  }
  return String(obj);
}

function CreateJobModal({
  onClose,
  copy: c,
}: {
  onClose: () => void;
  copy: Copy;
}) {
  const zh = c.nav.overview === "总览";
  const [type, setType] = useState<JobType>("RL");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roles = ROLE_TEMPLATES[type];
  const [jobName, setJobName] = useState("robot-policy-training");
  const [headerRole, setHeaderRole] = useState(roles[0]);
  const effectiveHeader = roles.includes(headerRole) ? headerRole : roles[0];

  const [image, setImage] = useState(
    "registry.rlark.ai/rl/policy-trainer:v0.42",
  );
  const [command, setCommand] = useState(
    "python train.py --config /mnt/config/train.yaml --dataset /mnt/dataset --output /mnt/checkpoints",
  );
  const [envs, setEnvs] = useState([
    { key: "RLARK_JOB_NAME", value: "robot-policy-training" },
    { key: "DATASET_ROOT", value: "/mnt/dataset" },
  ]);
  const [mounts, setMounts] = useState([
    { objectStorage: "/host/dataset", mountPath: "/mnt/dataset" },
  ]);

  const defaultRoleResources: Record<string, RoleResource> = {};
  roles.forEach((role, index) => {
    defaultRoleResources[role] = {
      role,
      cluster:
        index === 0
          ? clusters[0].name
          : (clusters[2]?.name ?? clusters[0].name),
      nodeSelector:
        index === 0
          ? "gpu=h800"
          : role.toLowerCase().includes("robot") ||
              role.toLowerCase().includes("env")
            ? "robot=online"
            : "any=true",
      replicas: index === 0 ? 1 : 4,
      cpu: index === 0 ? "32" : "4",
      memory: index === 0 ? "256Gi" : "16Gi",
      gpu: index === 0 ? "4" : "0",
    };
  });
  const [roleResources, setRoleResources] =
    useState<Record<string, RoleResource>>(defaultRoleResources);

  const onTypeChange = (next: JobType) => {
    setType(next);
    const newRoles = ROLE_TEMPLATES[next];
    setHeaderRole(newRoles[0]);
    const newRR: Record<string, RoleResource> = {};
    newRoles.forEach((role, index) => {
      newRR[role] = roleResources[role] ?? {
        role,
        cluster:
          index === 0
            ? clusters[0].name
            : (clusters[2]?.name ?? clusters[0].name),
        nodeSelector:
          index === 0
            ? "gpu=h800"
            : role.toLowerCase().includes("robot") ||
                role.toLowerCase().includes("env")
              ? "robot=online"
              : "any=true",
        replicas: index === 0 ? 1 : 4,
        cpu: index === 0 ? "32" : "4",
        memory: index === 0 ? "256Gi" : "16Gi",
        gpu: index === 0 ? "4" : "0",
      };
    });
    setRoleResources(newRR);
  };

  const addEnv = () => setEnvs([...envs, { key: "NEW_ENV", value: "value" }]);
  const updateEnv = (i: number, field: "key" | "value", v: string) => {
    const next = [...envs];
    next[i][field] = v;
    setEnvs(next);
  };
  const addMount = () =>
    setMounts([
      ...mounts,
      { objectStorage: "/host/path", mountPath: "/mnt/data" },
    ]);
  const updateMount = (
    i: number,
    field: "objectStorage" | "mountPath",
    v: string,
  ) => {
    const next = [...mounts];
    next[i][field] = v;
    setMounts(next);
  };
  const updateRR = (
    role: string,
    field: keyof RoleResource,
    v: string | number,
  ) => {
    setRoleResources((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: v },
    }));
  };

  const crd = generateJobCRD({
    name: jobName,
    type,
    headerRole: effectiveHeader,
    roles,
    roleResources,
    image,
    command,
    envs,
    mounts,
  });
  const yaml = toYaml(crd);
  const steps = zh
    ? ["角色和资源", "Worker 配置", "公共配置", "YAML 预览"]
    : ["Roles & Resources", "Worker Config", "Common Config", "YAML Preview"];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crd),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${body}`);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal create-job-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">NEW JOB</span>
            <h2>{c.jobs.createTitle}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="create-stepper">
          {steps.map((label, index) => (
            <button
              key={label}
              className={step >= index + 1 ? "active" : ""}
              onClick={() => setStep(index + 1)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="modal-body create-job-body">
          {step === 1 && (
            <>
              <div className="form-row">
                <label>
                  {zh ? "任务名称" : "Job Name"}
                  <input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                  />
                </label>
                <label>
                  {zh ? "任务类型" : "Job Type"}
                  <select
                    value={type}
                    onChange={(e) => onTypeChange(e.target.value as JobType)}
                  >
                    <option value="RL">{c.jobType.RL}</option>
                    <option value="DataCollection">
                      {c.jobType.DataCollection}
                    </option>
                    <option value="Evaluation">{c.jobType.Evaluation}</option>
                    <option value="Custom">{c.jobType.Custom}</option>
                  </select>
                </label>
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <strong>
                    {zh ? "选择角色和 Header" : "Select Roles & Header"}
                  </strong>
                  <small>
                    {zh
                      ? "系统会从用户指定的 Header 角色里选择第一个 Worker 作为 Header。"
                      : "The first worker of the header role becomes the job header."}
                  </small>
                </div>
                <div className="role-template selectable">
                  {roles.map((role) => (
                    <button
                      key={role}
                      className={effectiveHeader === role ? "active" : ""}
                      onClick={() => setHeaderRole(role)}
                    >
                      <Check size={13} />
                      {role}
                      <small>
                        {effectiveHeader === role ? "Header" : "Worker"}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <div className="role-resource-grid">
              {roles.map((role) => {
                const rr = roleResources[role];
                return (
                  <div className="role-resource-card" key={role}>
                    <strong>{role}</strong>
                    <div className="form-row">
                      <label>
                        {zh ? "集群" : "Cluster"}
                        <select
                          value={rr?.cluster ?? ""}
                          onChange={(e) =>
                            updateRR(role, "cluster", e.target.value)
                          }
                        >
                          <option>{clusters[0].name}</option>
                          <option>{clusters[1].name}</option>
                          <option>{clusters[2].name}</option>
                          <option>{clusters[3].name}</option>
                        </select>
                      </label>
                      <label>
                        {zh ? "节点选择" : "Node Selector"}
                        <input
                          value={rr?.nodeSelector ?? ""}
                          onChange={(e) =>
                            updateRR(role, "nodeSelector", e.target.value)
                          }
                          placeholder="gpu=h800"
                        />
                      </label>
                    </div>
                    <div className="resource-input-row">
                      <label>
                        {zh ? "副本" : "Replicas"}
                        <input
                          type="number"
                          value={rr?.replicas ?? 1}
                          onChange={(e) =>
                            updateRR(role, "replicas", Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        CPU
                        <input
                          value={rr?.cpu ?? ""}
                          onChange={(e) =>
                            updateRR(role, "cpu", e.target.value)
                          }
                          placeholder="32"
                        />
                      </label>
                      <label>
                        Memory
                        <input
                          value={rr?.memory ?? ""}
                          onChange={(e) =>
                            updateRR(role, "memory", e.target.value)
                          }
                          placeholder="256Gi"
                        />
                      </label>
                      <label>
                        GPU
                        <input
                          value={rr?.gpu ?? ""}
                          onChange={(e) =>
                            updateRR(role, "gpu", e.target.value)
                          }
                          placeholder="4"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {step === 3 && (
            <>
              <div className="form-row">
                <label>
                  {zh ? "镜像" : "Image"}
                  <input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </label>
                <label>
                  {zh ? "Header 角色" : "Header Role"}
                  <select
                    value={effectiveHeader}
                    onChange={(e) => setHeaderRole(e.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                {zh ? "启动命令" : "Command"}
                <textarea
                  className="code-textarea"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </label>
              <div className="form-section">
                <div className="form-section-head">
                  <strong>{zh ? "环境变量" : "Environment Variables"}</strong>
                  <button className="secondary-button" onClick={addEnv}>
                    <Plus size={14} />
                    {zh ? "添加变量" : "Add"}
                  </button>
                </div>
                {envs.map((env, index) => (
                  <div className="env-row" key={index}>
                    <input
                      value={env.key}
                      onChange={(e) => updateEnv(index, "key", e.target.value)}
                    />
                    <input
                      value={env.value}
                      onChange={(e) =>
                        updateEnv(index, "value", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <strong>{zh ? "对象存储挂载" : "Volume Mounts"}</strong>
                  <button className="secondary-button" onClick={addMount}>
                    <Plus size={14} />
                    {zh ? "添加挂载" : "Add"}
                  </button>
                </div>
                {mounts.map((mount, index) => (
                  <div className="env-row" key={index}>
                    <input
                      value={mount.objectStorage}
                      onChange={(e) =>
                        updateMount(index, "objectStorage", e.target.value)
                      }
                      placeholder="/host/path"
                    />
                    <input
                      value={mount.mountPath}
                      onChange={(e) =>
                        updateMount(index, "mountPath", e.target.value)
                      }
                      placeholder="/mnt/data"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <div className="yaml-preview">
              <div>
                <strong>{zh ? "任务 YAML 预览" : "Job YAML Preview"}</strong>
                <small>
                  {zh
                    ? "提交前可检查最终资源定义。"
                    : "Review the final resource definition before submitting."}
                </small>
              </div>
              {error && (
                <div className="cert-error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <pre>{yaml}</pre>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            {zh ? "取消" : "Cancel"}
          </button>
          {step > 1 && (
            <button
              className="secondary-button"
              onClick={() => setStep(step - 1)}
            >
              {zh ? "上一步" : "Back"}
            </button>
          )}
          <button
            className="primary-button"
            disabled={submitting}
            onClick={() => (step === 4 ? handleSubmit() : setStep(step + 1))}
          >
            {step === 4
              ? submitting
                ? zh
                  ? "提交中..."
                  : "Submitting..."
                : c.common.createJob
              : zh
                ? "下一步"
                : "Next"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface SignAgentCertResponse {
  cluster_id: string;
  ca_cert: string;
  agent_cert: string;
  agent_key: string;
  server_addr: string;
}

function CertificatesPage({ copy: c, lang }: { copy: Copy; lang: Lang }) {
  const [clusterId, setClusterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignAgentCertResponse | null>(null);

  const handleSign = async () => {
    if (!clusterId.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const resp = await fetch("/api/v1/certificates/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster_id: clusterId.trim() }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${body}`);
      }
      setResult(await resp.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const download = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const zh = lang === "zh";
  const files = result
    ? [
        {
          name: "ca.crt",
          content: result.ca_cert,
          label: zh ? "CA 证书" : "CA Certificate",
        },
        {
          name: "agent.crt",
          content: result.agent_cert,
          label: zh ? "Agent 证书" : "Agent Certificate",
        },
        {
          name: "agent.key",
          content: result.agent_key,
          label: zh ? "Agent 私钥" : "Agent Private Key",
        },
      ]
    : [];

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Shield size={13} />
            {zh ? "证书管理" : "Certificates"}
          </span>
          <h2>{zh ? "证书管理" : "Certificate Management"}</h2>
          <p>
            {zh
              ? "为数据面集群签发 Agent 证书，用于建立与控制面 Server 的 mTLS 连接。"
              : "Sign agent certificates for data-plane clusters to establish mTLS connections with the control-plane server."}
          </p>
        </div>
      </div>

      <div className="panel cert-panel">
        <div className="cert-form">
          <label>
            <span>{zh ? "集群 ID" : "Cluster ID"}</span>
            <input
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder={
                zh
                  ? "输入集群标识，例如 my-cluster-01"
                  : "Enter cluster identifier, e.g. my-cluster-01"
              }
              onKeyDown={(e) => e.key === "Enter" && handleSign()}
            />
          </label>
          <button
            className="primary-button"
            onClick={handleSign}
            disabled={loading || !clusterId.trim()}
          >
            {loading
              ? zh
                ? "签发中..."
                : "Signing..."
              : zh
                ? "签发证书"
                : "Sign Certificate"}
          </button>
        </div>

        {error && <div className="cert-error">{error}</div>}

        {result && (
          <div className="cert-result">
            <div className="cert-result-header">
              <div>
                <Check size={18} />
                <strong>
                  {zh ? "证书签发成功" : "Certificate signed successfully"}
                </strong>
              </div>
              <small>
                {zh ? "集群" : "Cluster"}: {result.cluster_id} ·{" "}
                {zh ? "服务器" : "Server"}: {result.server_addr}
              </small>
            </div>
            <div className="cert-files">
              {files.map((f) => (
                <div key={f.name} className="cert-file-row">
                  <div>
                    <strong>{f.label}</strong>
                    <code>{f.name}</code>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => download(f.name, f.content)}
                  >
                    <Download size={15} />
                    {zh ? "下载" : "Download"}
                  </button>
                </div>
              ))}
            </div>
            <div className="cert-preview">
              <div className="cert-preview-head">
                <strong>{zh ? "证书预览" : "Certificate Preview"}</strong>
              </div>
              <pre>{result.ca_cert}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CRDNode {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    creationTimestamp?: string;
  };
  spec: {
    agentType?: string;
    unschedulable?: boolean;
  };
  status?: {
    phase?: string;
    reason?: string;
    nodeInfo?: {
      architecture?: string;
      kernelVersion?: string;
      agentVersion?: string;
      operatingSystem?: string;
    };
    addresses?: Array<{ type: string; address: string }>;
    allocatable?: Record<string, string>;
    capacity?: Record<string, string>;
    used?: Record<string, string>;
  };
}

function AdminPage({ copy: c }: { copy: Copy }) {
  const zh = c.nav.overview === "总览";
  const [nodes, setNodes] = useState<CRDNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const [newLabelKey, setNewLabelKey] = useState("");
  const [newLabelValue, setNewLabelValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const fetchNodes = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/nodes");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setNodes(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const startEdit = (node: CRDNode) => {
    setEditingNode(node.metadata.name);
    setLabelDraft({ ...(node.metadata.labels ?? {}) });
    setNewLabelKey("");
    setNewLabelValue("");
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setLabelDraft({});
    setNewLabelKey("");
    setNewLabelValue("");
  };

  const saveLabels = async (nodeName: string) => {
    setSaving(true);
    setError("");
    try {
      const patch = {
        metadata: { labels: labelDraft },
      };
      const resp = await fetch(`/api/v1/rlinf.io/v1alpha1/nodes/${nodeName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(patch),
      });
      if (!resp.ok)
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      setNodes((prev) =>
        prev.map((n) =>
          n.metadata.name === nodeName
            ? { ...n, metadata: { ...n.metadata, labels: { ...labelDraft } } }
            : n,
        ),
      );
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const addLabel = () => {
    if (!newLabelKey.trim()) return;
    setLabelDraft((prev) => ({ ...prev, [newLabelKey.trim()]: newLabelValue }));
    setNewLabelKey("");
    setNewLabelValue("");
  };

  const removeLabel = (key: string) => {
    setLabelDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateLabel = (key: string, value: string) => {
    setLabelDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Settings size={13} />
            {zh ? "运维管理" : "Admin"}
          </span>
          <h2>{zh ? "节点管理" : "Node Management"}</h2>
          <p>
            {zh
              ? "查看所有节点并管理节点标签，标签用于任务调度和节点选择。"
              : "View all nodes and manage node labels used for task scheduling and node selection."}
          </p>
        </div>
        <button className="secondary-button" onClick={fetchNodes}>
          <RefreshCw size={16} />
          {c.common.refresh}
        </button>
      </div>

      {error && (
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="table-panel">
        <table className="admin-node-table">
          <thead>
            <tr>
              <th>{zh ? "节点名称" : "Name"}</th>
              <th>{zh ? "状态" : "Phase"}</th>
              <th>{zh ? "接入形态" : "Agent Type"}</th>
              <th>{zh ? "架构" : "Arch"}</th>
              <th>{zh ? "地址" : "Addresses"}</th>
              <th>{zh ? "标签" : "Labels"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const isEditing = editingNode === node.metadata.name;
              const labels = node.metadata.labels ?? {};
              return (
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
                    <code className="inline-code">
                      {node.spec.agentType ?? "—"}
                    </code>
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
                  <td>
                    {isEditing ? (
                      <div className="label-editor">
                        {Object.entries(labelDraft).map(([k, v]) => (
                          <div className="label-edit-row" key={k}>
                            <code>{k}</code>
                            <input
                              value={v}
                              onChange={(e) => updateLabel(k, e.target.value)}
                              placeholder="value"
                            />
                            <button
                              className="icon-button danger"
                              onClick={() => removeLabel(k)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <div className="label-add-row">
                          <input
                            value={newLabelKey}
                            onChange={(e) => setNewLabelKey(e.target.value)}
                            placeholder={zh ? "标签键" : "label key"}
                            onKeyDown={(e) => e.key === "Enter" && addLabel()}
                          />
                          <input
                            value={newLabelValue}
                            onChange={(e) => setNewLabelValue(e.target.value)}
                            placeholder={zh ? "标签值" : "label value"}
                            onKeyDown={(e) => e.key === "Enter" && addLabel()}
                          />
                          <button
                            className="secondary-button"
                            onClick={addLabel}
                          >
                            <Plus size={14} />
                            {zh ? "添加" : "Add"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const entries = Object.entries(labels);
                        const isExpanded = expandedNodes.has(
                          node.metadata.name,
                        );
                        const visible = isExpanded
                          ? entries
                          : entries.slice(0, 3);
                        const hidden = entries.length - visible.length;
                        return (
                          <div className="label-list">
                            {entries.length === 0 ? (
                              <small className="muted">
                                {zh ? "无标签" : "No labels"}
                              </small>
                            ) : (
                              <>
                                {visible.map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="label-chip"
                                    title={`${k}=${v}`}
                                  >
                                    <code>{k}</code>
                                    <i>{v}</i>
                                  </span>
                                ))}
                                {hidden > 0 && (
                                  <button
                                    className="label-toggle"
                                    onClick={() =>
                                      toggleExpand(node.metadata.name)
                                    }
                                  >
                                    +{hidden}
                                  </button>
                                )}
                                {isExpanded && entries.length > 3 && (
                                  <button
                                    className="label-toggle"
                                    onClick={() =>
                                      toggleExpand(node.metadata.name)
                                    }
                                  >
                                    {zh ? "收起" : "Less"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="row-actions">
                        <button
                          className="primary-button"
                          disabled={saving}
                          onClick={() => saveLabels(node.metadata.name)}
                        >
                          <Save size={15} />
                          {saving
                            ? zh
                              ? "保存中..."
                              : "Saving..."
                            : zh
                              ? "保存"
                              : "Save"}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={cancelEdit}
                        >
                          {zh ? "取消" : "Cancel"}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => startEdit(node)}
                      >
                        <Pencil size={15} />
                        {zh ? "编辑" : "Edit"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {nodes.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "32px" }}
                >
                  <small className="muted">
                    {zh ? "暂无节点" : "No nodes found"}
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

const adminNavItems: {
  id: string;
  icon: typeof Activity;
  zh: string;
  en: string;
}[] = [
  { id: "nodes", icon: Server, zh: "节点管理", en: "Nodes" },
  { id: "jobs", icon: Boxes, zh: "任务管理", en: "Jobs" },
  { id: "config", icon: Settings, zh: "系统配置", en: "Config" },
];

function AdminApp() {
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [adminPage, setAdminPage] = useState("nodes");
  const c = copy[lang];
  const zh = lang === "zh";
  return (
    <div className={"app-shell theme-" + theme + " admin-shell"}>
      <header className="topbar admin-topbar">
        <div className="admin-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div className="admin-brand-text">
            <strong>rlark</strong>
            <small>ADMIN</small>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="secondary-button" href="/">
            {c.nav.overview}
            <ArrowRight size={14} />
          </a>
          <div className="segmented-control">
            <button
              className={lang === "zh" ? "active" : ""}
              onClick={() => setLang("zh")}
            >
              <Languages size={14} />中
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
          <div className="segmented-control theme-control">
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
            >
              {c.common.light}
            </button>
            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
            >
              <Moon size={14} />
              {c.common.dark}
            </button>
          </div>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav>
            <span className="nav-label">{zh ? "运维" : "Operations"}</span>
            {adminNavItems.map(({ id, icon: Icon, zh: z, en: e }) => (
              <button
                key={id}
                className={adminPage === id ? "active" : ""}
                onClick={() => setAdminPage(id)}
              >
                <Icon size={18} />
                <span>{zh ? z : e}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="main-area admin-main">
          {adminPage === "nodes" && <AdminPage copy={c} />}
          {adminPage === "jobs" && (
            <div className="page-content">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    <Boxes size={13} />
                    {zh ? "任务管理" : "Jobs"}
                  </span>
                  <h2>{zh ? "任务管理" : "Jobs"}</h2>
                </div>
              </div>
              <p className="muted">{zh ? "即将推出" : "Coming soon"}</p>
            </div>
          )}
          {adminPage === "config" && (
            <div className="page-content">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    <Settings size={13} />
                    {zh ? "系统配置" : "Config"}
                  </span>
                  <h2>{zh ? "系统配置" : "Config"}</h2>
                </div>
              </div>
              <p className="muted">{zh ? "即将推出" : "Coming soon"}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const isAdmin = useIsAdminPath();
  const [page, setPage] = useState<Page>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const c = copy[lang];
  const pageTitle = useMemo(() => c.nav[page], [c, page]);

  if (isAdmin) return <AdminApp />;

  return (
    <div
      className={
        "app-shell theme-" + theme + (collapsed ? " sidebar-collapsed" : "")
      }
    >
      <aside className="sidebar">
        <Logo />
        <nav>
          <span className="nav-label">{c.nav.workspace}</span>
          {navItems.slice(0, 4).map(({ id, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              <span>{c.nav[id]}</span>
              {id === "jobs" && (
                <em>{jobs.filter((j) => j.phase === "Running").length}</em>
              )}
            </button>
          ))}
          <span className="nav-label">{c.nav.developers}</span>
          <button
            className={page === "api" ? "active" : ""}
            onClick={() => setPage("api")}
          >
            <Braces size={18} />
            <span>{c.nav.api}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card">
            <span>
              <CloudCog size={16} />
            </span>
            <div>
              <small>{c.common.env}</small>
              <strong>{c.common.production}</strong>
              <b className="env-meta">{c.common.envMeta}</b>
            </div>
            <i />
          </div>
          <button onClick={() => setCollapsed(!collapsed)}>
            <CircleDot size={17} />
            <span>{c.common.collapse}</span>
          </button>
        </div>
      </aside>
      <main className="main-area">
        <Header
          title={pageTitle}
          lang={lang}
          theme={theme}
          copy={c}
          onLangChange={setLang}
          onThemeChange={setTheme}
          onCreate={() => setCreateOpen(true)}
        />
        {page === "overview" && <Overview navigate={setPage} copy={c} />}{" "}
        {page === "clusters" && <ClustersPage copy={c} />}{" "}
        {page === "jobs" && (
          <JobsPage copy={c} onCreate={() => setCreateOpen(true)} />
        )}{" "}
        {page === "certificates" && <CertificatesPage copy={c} lang={lang} />}{" "}
        {page === "api" && <ApiPage copy={c} />}
      </main>
      {createOpen && (
        <CreateJobModal onClose={() => setCreateOpen(false)} copy={c} />
      )}
    </div>
  );
}
