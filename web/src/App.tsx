import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  Braces,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CloudCog,
  Copy,
  Cpu,
  Download,
  Gauge as GaugeIcon,
  HardDrive,
  KeyRound,
  Languages,
  LayoutDashboard,
  ListFilter,
  Moon,
  MoreHorizontal,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  TerminalSquare,
  Trash2,
  Video,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  activity,
  type Cluster,
  clusters,
  type Domain,
  type Job,
  jobs,
  type JobType,
  type NodeItem,
  type NodeKind,
  nodes,
  type Phase,
  type Worker as WorkerItem,
  workers,
} from "./data";

type Page = "overview" | "clusters" | "jobs" | "workflows" | "domains" | "api";
type Lang = "zh" | "en";
type Theme = "light" | "dark";

function useIsAdminPath() {
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

const copy = {
  zh: {
    nav: {
      overview: "总览",
      clusters: "集群及节点",
      jobs: "任务",
      workflows: "工作流",
      domains: "网络域",
      api: "接口参考",
      createCluster: "创建集群",
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
      sshLogin: "SSH 登录",
      sshDialogTitle: "SSH 登录命令",
      sshDialogDesc: "在终端中执行以下命令登录到该 Worker Pod：",
      sshCopied: "已复制",
    },
    workflows: {
      title: "工作流",
      eyebrow: "Workflow",
      desc: "由多个任务组成的有向无环图，按依赖关系自动编排执行。",
      search: "搜索工作流...",
      createTitle: "创建工作流",
      addJob: "添加任务",
      jobName: "任务名称",
      dependencies: "依赖任务",
      noDeps: "无依赖",
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
      workflows: "Workflows",
      domains: "Domains",
      api: "API Reference",
      createCluster: "Create Cluster",
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
      sshLogin: "SSH Login",
      sshDialogTitle: "SSH Login Command",
      sshDialogDesc:
        "Run the following command in your terminal to log in to this Worker Pod:",
      sshCopied: "Copied",
    },
    workflows: {
      title: "Workflows",
      eyebrow: "Workflow",
      desc: "DAG of jobs, automatically orchestrated by dependency.",
      search: "Search workflows...",
      createTitle: "Create Workflow",
      addJob: "Add Job",
      jobName: "Job Name",
      dependencies: "Dependencies",
      noDeps: "No dependencies",
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
  { id: "workflows", icon: Boxes },
  { id: "domains", icon: CloudCog },
];

function Logo() {
  return (
    <div className="brand">
      <img src="/rlark-logo.png" alt="RLark" className="brand-logo" />
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
  onClick,
}: {
  icon: typeof Activity;
  tone: string;
  label: string;
  value: string;
  note: string;
  onClick?: () => void;
}) {
  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={"metric-card metric-card-action tone-" + tone}
        onClick={onClick}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={"metric-card tone-" + tone}>
      {content}
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
  navigate: (page: Page, name?: string) => void;
  copy: Copy;
}) {
  const cloudClusters = clusters.filter((x) => x.type === "Cloud");
  const embodiedClusters = clusters.filter((x) => x.type === "Embodied");
  const cloudNodeCount = clusters.reduce((sum, x) => sum + x.cloudNodes, 0);
  const robotCount = clusters.reduce((sum, x) => sum + x.robots, 0);
  const runningJobs = jobs.filter((x) => x.phase === "Running").length;
  const gpuModelList = Array.from(new Set(clusters.flatMap((x) => x.gpuModels)));
  const robotModelList = Array.from(
    new Set(clusters.flatMap((x) => x.robotModels)),
  );
  const gpuModels = gpuModelList.slice(0, 4).join(" / ");
  const robotModels = robotModelList.slice(0, 4).join(" / ");
  const isZh = c.nav.overview === "总览";
  const regionCount = new Set(cloudClusters.map((x) => x.region)).size;
  const runningWorkerCount = jobs.reduce((s, x) => s + x.runningWorkers, 0);

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
          note={isZh ? `${regionCount} 个地域` : `${regionCount} regions`}
          onClick={() => navigate("clusters")}
        />
        <MetricCard
          icon={Server}
          tone="mint"
          label={c.overview.cloudNodes}
          value={`${cloudNodeCount}`}
          note={isZh ? `${gpuModelList.length} 种 GPU 型号` : `${gpuModelList.length} GPU models`}
          onClick={() => navigate("clusters")}
        />
        <MetricCard
          icon={Bot}
          tone="violet"
          label={c.overview.robots}
          value={`${robotCount}`}
          note={
            isZh
              ? `${embodiedClusters.length} 个具身集群 · ${robotModelList.length} 种真机`
              : `${embodiedClusters.length} embodied clusters · ${robotModelList.length} robot models`
          }
          onClick={() => navigate("clusters")}
        />
        <MetricCard
          icon={Workflow}
          tone="orange"
          label={c.overview.jobs}
          value={`${runningJobs} / ${jobs.length}`}
          note={
            isZh
              ? `${runningWorkerCount} 个运行 Worker`
              : `${runningWorkerCount} running workers`
          }
          onClick={() => navigate("jobs")}
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
  const zh = c.nav.overview === "总览";
  const [query, setQuery] = useState("");
  const [realNodes, setRealNodes] = useState<CRDNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourceView, setResourceView] = useState<"clusters" | "nodes">(
    "clusters",
  );
  const [selectedClusterNs, setSelectedClusterNs] = useState<string | null>(
    null,
  );
  const [selectedNode, setSelectedNode] = useState<CRDNode | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<"All" | Phase>("All");

  const fetchNodes = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/nodes");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setRealNodes(data.items ?? []);
    } catch (e) {
      setRealNodes(buildMockCRDNodes());
      setError("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

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
          <button className="secondary-button" onClick={fetchNodes}>
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

  return (
    <div className="page-content resource-page cluster-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.clusters.eyebrow}</span>
          <h2>{c.clusters.title}</h2>
          <p>{c.clusters.desc}</p>
        </div>
        <button className="secondary-button" onClick={fetchNodes}>
          <RefreshCw size={16} />
          {c.common.refresh}
        </button>
      </div>
      <div className="subpage-tabs">
        <button
          className={resourceView === "clusters" ? "active" : ""}
          onClick={() => setResourceView("clusters")}
        >
          <Network size={15} />
          {zh ? "集群视图" : "Clusters"}
        </button>
        <button
          className={resourceView === "nodes" ? "active" : ""}
          onClick={() => setResourceView("nodes")}
        >
          <Server size={15} />
          {zh ? "节点视图" : "Nodes"}
        </button>
      </div>
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
          icon={CloudCog}
          tone="violet"
          label={zh ? "集群分组" : "Namespaces"}
          value={`${clustersList.length}`}
          note={zh ? "按命名空间分组" : "namespace groups"}
        />
        <MetricCard
          icon={Activity}
          tone="orange"
          label={zh ? "节点状态" : "Node Status"}
          value={`${realNodes.filter((n) => n.status?.phase === "Online").length}`}
          note={`${realNodes.filter((n) => n.status?.phase !== "Online").length} ${zh ? "离线" : "offline"}`}
        />
      </section>
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
            <div className="cluster-card-grid">
              {clustersList.map(([ns, nsNodes]) => {
                const onlineCount = nsNodes.filter(
                  (n) => n.status?.phase === "Online",
                ).length;
                const allOnline = onlineCount === nsNodes.length;
                const phase: Phase =
                  nsNodes.length === 0
                    ? "Offline"
                    : allOnline
                      ? "Online"
                      : "Online";
                return (
                  <button
                    key={ns}
                    className={
                      selectedCluster?.[0] === ns
                        ? "cluster-card selected"
                        : "cluster-card"
                    }
                    onClick={() => setSelectedClusterNs(ns)}
                  >
                    <div className="cluster-card-head">
                      <span className="cloud">
                        <CloudCog size={18} />
                      </span>
                      <StatusBadge phase={phase} copy={c} />
                    </div>
                    <strong>{ns}</strong>
                    <small>
                      {nsNodes.length} {zh ? "节点" : "nodes"}
                    </small>
                    <div className="cluster-loads">
                      <i>
                        <b
                          style={{
                            width: `${nsNodes.length > 0 ? (onlineCount / nsNodes.length) * 100 : 0}%`,
                          }}
                        />
                      </i>
                    </div>
                    <div className="cluster-card-foot">
                      <span>
                        {onlineCount} / {nsNodes.length}{" "}
                        {zh ? "在线" : "online"}
                      </span>
                    </div>
                  </button>
                );
              })}
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
            onRefresh={fetchNodes}
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
                              selectedNode?.metadata.name ===
                              node.metadata.name;
                            return (
                              <div
                                className={
                                  "node-row" + (isSelected ? " selected" : "")
                                }
                                key={node.metadata.name}
                                onClick={() => setSelectedNode(node)}
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
            {selectedNode && <NodeDetailReal node={selectedNode} copy={c} />}
          </div>
        </section>
      )}
    </div>
  );
}

function ClusterDetailReal({
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
      <div className="detail-header">
        <div>
          <span className="eyebrow">{c.clusters.selected}</span>
          <h3>{namespace}</h3>
          <p>
            {zh
              ? `命名空间 ${namespace} 下的节点`
              : `Nodes in namespace ${namespace}`}
          </p>
        </div>
        <StatusBadge phase={phase} copy={c} />
      </div>
      <div className="cluster-detail-stats">
        <div>
          <span>{zh ? "命名空间" : "Namespace"}</span>
          <strong>{namespace}</strong>
          <small>{zh ? "集群标识" : "Cluster ID"}</small>
        </div>
        <div>
          <span>{zh ? "节点规模" : "Nodes"}</span>
          <strong>{clusterNodes.length}</strong>
          <small>
            {onlineCount} {zh ? "在线" : "online"}
          </small>
        </div>
        <div>
          <span>{zh ? "接入形态" : "Agent Types"}</span>
          <strong>
            {Array.from(
              new Set(clusterNodes.map((n) => n.spec.agentType ?? "—")),
            ).join(", ") || "—"}
          </strong>
        </div>
      </div>
      <div className="table-panel" style={{ marginTop: 12 }}>
        <table className="admin-node-table">
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

function NodeDetailReal({ node, copy: c }: { node: CRDNode; copy: Copy }) {
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

interface CRDWorkload {
  kind: string;
  replicas: number;
  template: {
    spec: {
      containers: Array<{
        name: string;
        image: string;
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
  prepareScript?: string;
  runScript?: string;
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
    tasks?: Array<{
      name: string;
      phase: string;
      message: string;
      observedNodes?: string[];
    }>;
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
    const taskEnv =
      c?.env
        ?.filter((e) => e.name !== "RLARK_TASK_ROLE")
        .map((e) => ({
          key: e.name,
          value: e.value,
        })) ?? [];
    const taskMounts = (c?.volumeMounts ?? []).map((vm) => {
      const vol = t.kubernetes?.workload?.template.spec.volumes?.find(
        (v) => v.name === vm.name,
      );
      return {
        objectStorage: vol?.hostPath?.path ?? "",
        mountPath: vm.mountPath,
      };
    });
    return {
      role: t.name,
      cluster: "",
      nodeSelector: nsStr,
      replicas: t.kubernetes?.workload?.replicas ?? 1,
      cpu: res.cpu ?? "",
      memory: res.memory ?? "",
      gpu,
      image: c?.image ?? "",
      prepareScript: t.prepareScript ?? "",
      env: taskEnv,
      mounts: taskMounts,
    };
  });
  const env =
    container?.env
      ?.filter((e) => e.name !== "RLARK_TASK_ROLE")
      .map((e) => ({
        key: e.name,
        value: e.value,
      })) ?? [];
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
    command: headerTask?.runScript ?? "",
    env,
    mounts,
    headerRole: headerTask?.name ?? "",
    headerWorker: headerTask?.name ?? "",
    sshAddress: "",
    domain: crd.spec.domain ?? "",
    resources,
    taskStatuses: allTaskStatuses,
  };
}

function mapRoleToJobType(tasks: CRDJobTask[]): JobType {
  const roles = new Set(tasks.map((t) => t.role.toLowerCase()));
  const hasEnv = roles.has("env");
  const hasRollout = roles.has("rollout");
  const hasActor = roles.has("actor");
  if (hasActor) return "RL";
  if (hasEnv && hasRollout) return "Evaluation";
  if (hasEnv) return "DataCollection";
  if (hasRollout) return "RL";
  return "Custom";
}

function JobsPage({
  copy: c,
  selectedName,
  onSelect,
  onCreate,
  onClone,
  onEdit,
}: {
  copy: Copy;
  selectedName: string;
  onSelect: (name?: string) => void;
  onCreate: () => void;
  onClone: (job: Job) => void;
  onEdit: (job: Job) => void;
}) {
  const zh = c.nav.overview === "总览";
  const [query, setQuery] = useState("");
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
      setRealJobs(jobs);
      setError("");
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

  const selected =
    selectedName && allJobs.length > 0
      ? (allJobs.find((j) => j.name === selectedName) ?? null)
      : null;

  if (selected) {
    return (
      <JobDetailPage
        job={selected}
        copy={c}
        onBack={() => onSelect(undefined)}
      />
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
                    onClick={() => onSelect(job.name)}
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
                      className="icon-button"
                      onClick={() => onEdit(job)}
                      title={zh ? "编辑" : "Edit"}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => onClone(job)}
                      title={zh ? "复制" : "Clone"}
                    >
                      <Copy size={15} />
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
  const [activeTab, setActiveTab] = useState<"config" | "workers" | "logs">(
    "config",
  );
  const [taskNodes, setTaskNodes] = useState<Record<string, string>>({});
  const [podLogs, setPodLogs] = useState<
    Array<{
      taskName: string;
      podName: string;
      phase: string;
      node: string;
      logs: string;
    }>
  >([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPodName, setSelectedPodName] = useState<string | null>(null);

  useEffect(() => {
    const labelSelector = `rlinf.io/job=${job.name}`;
    fetch(
      `/api/v1/rlinf.io/v1alpha1/tasks?labelSelector=${encodeURIComponent(labelSelector)}`,
    )
      .then((resp) =>
        resp.ok
          ? resp.json()
          : Promise.reject(new Error(`HTTP ${resp.status}`)),
      )
      .then((data) => {
        const items = data.items ?? [];
        const nodeMap: Record<string, string> = {};
        for (const item of items) {
          const taskName = item.metadata?.name ?? "";
          const observedNodes = item.status?.observedNodes ?? [];
          nodeMap[taskName] = observedNodes.join(", ") || "—";
        }
        setTaskNodes(nodeMap);
      })
      .catch(() => {});
  }, [job.name]);

  useEffect(() => {
    if (activeTab !== "logs") return;
    setLogsLoading(true);
    setLogsError(null);
    fetch(`/api/v1/rlinf.io/v1alpha1/jobs/${encodeURIComponent(job.name)}/logs`)
      .then((resp) =>
        resp.ok
          ? resp.json()
          : Promise.reject(new Error(`HTTP ${resp.status}`)),
      )
      .then((data) => {
        const pods = data.pods ?? [];
        setPodLogs(pods);
        const roles = [
          ...new Set(pods.map((p: { taskName: string }) => p.taskName)),
        ];
        if (roles.length > 0) {
          setSelectedRole(roles[0] as string);
          const firstPod = pods.find(
            (p: { taskName: string }) => p.taskName === roles[0],
          );
          if (firstPod) setSelectedPodName(firstPod.podName);
        }
        setLogsLoading(false);
      })
      .catch((err) => {
        setLogsError(err.message);
        setLogsLoading(false);
      });
  }, [activeTab, job.name]);

  const jobWorkers: WorkerItem[] =
    job.taskStatuses.length > 0
      ? job.taskStatuses.map((ts, i) => {
          const childTaskName = ts.name.toLowerCase().replace(/\s+/g, "-");
          const jobChildName = `${job.name}-${childTaskName}`
            .toLowerCase()
            .replace(/\s+/g, "-");
          return {
            id: `${job.id}-${i}`,
            name: ts.name,
            jobId: job.id,
            role: ts.name,
            node:
              taskNodes[jobChildName] ??
              taskNodes[ts.name] ??
              ts.observedNodes?.join(", ") ??
              "—",
            phase: (ts.phase || "Pending") as Phase,
            cpu: 0,
            memory: 0,
            logs: ts.message ? [ts.message] : [],
          };
        })
      : workers.filter((w) => w.jobId === job.id);
  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: "config", label: zh ? "配置" : "Config" },
    { id: "workers", label: c.jobs.workers },
    { id: "logs", label: c.common.logs },
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
      {activeTab === "config" && (
        <div className="config-with-channel">
          <JobConfigSummary job={job} />
          <div className="embodied-channel" style={{ marginTop: 18 }}>
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
      {activeTab === "workers" && (
        <div className="worker-table" style={{ marginTop: 18 }}>
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
      )}
      {activeTab === "logs" && (
        <div
          className="embodied-channel"
          style={{ flexDirection: "column", gap: 12 }}
        >
          {logsLoading ? (
            <code>{zh ? "加载日志中…" : "Loading logs…"}</code>
          ) : logsError ? (
            <code className="log-error">{logsError}</code>
          ) : podLogs.length === 0 ? (
            <code>{zh ? "暂无日志" : "No logs available"}</code>
          ) : (
            <>
              <div className="log-toolbar">
                <div className="log-role-tabs">
                  {[...new Set(podLogs.map((p) => p.taskName))].map((role) => {
                    const rolePods = podLogs.filter((p) => p.taskName === role);
                    const running = rolePods.some((p) => p.phase === "Running");
                    return (
                      <button
                        key={role}
                        className={
                          "log-role-tab" +
                          (selectedRole === role ? " active" : "")
                        }
                        onClick={() => {
                          setSelectedRole(role);
                          const firstPod = podLogs.find(
                            (p) => p.taskName === role,
                          );
                          setSelectedPodName(
                            firstPod ? firstPod.podName : null,
                          );
                        }}
                      >
                        <i
                          className={
                            "log-role-dot" + (running ? " running" : "")
                          }
                        />
                        {role}
                        <small>{rolePods.length}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="log-pod-picker">
                  <span className="log-pod-label">Pod</span>
                  <select
                    className="log-pod-select"
                    value={selectedPodName ?? ""}
                    onChange={(e) => setSelectedPodName(e.target.value)}
                  >
                    {podLogs
                      .filter((p) => p.taskName === selectedRole)
                      .map((pod) => (
                        <option key={pod.podName} value={pod.podName}>
                          {pod.podName} ({pod.phase})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {(() => {
                const pod = podLogs.find((p) => p.podName === selectedPodName);
                if (!pod)
                  return <code>{zh ? "请选择 Pod" : "Select a pod"}</code>;
                return (
                  <div className="log-stream" style={{ width: "100%" }}>
                    <div className="log-stream-head">
                      <strong>{pod.podName}</strong>
                      <span
                        className={"status status-" + pod.phase.toLowerCase()}
                      >
                        <i />
                        {pod.phase}
                      </span>
                      <small>
                        {pod.taskName} · {pod.node}
                      </small>
                    </div>
                    <pre className="log-content">{pod.logs}</pre>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function JobConfigSummary({ job }: { job: Job }) {
  return (
    <div className="job-config-summary">
      <div>
        <span>Header Worker</span>
        <strong>
          {job.headerRole} / {job.headerWorker}
        </strong>
        <code>{job.sshAddress}</code>
      </div>
      <div>
        <span>Run Script</span>
        <pre>{job.command}</pre>
      </div>
      {job.resources.map((item) => (
        <div key={item.role}>
          <span>
            {item.role} · {item.replicas} × {item.cpu} CPU / {item.memory} /{" "}
            {item.gpu} GPU · {item.nodeSelector}
          </span>
          <strong>{item.image}</strong>
          {item.prepareScript && <code>{item.prepareScript}</code>}
          {item.env.length > 0 &&
            item.env.map((e) => (
              <code key={e.key}>
                {e.key}={e.value}
              </code>
            ))}
          {item.mounts.length > 0 &&
            item.mounts.map((m) => (
              <code key={m.mountPath}>
                {m.objectStorage} → {m.mountPath}
              </code>
            ))}
        </div>
      ))}
    </div>
  );
}

function WorkerRow({ worker, copy: c }: { worker: WorkerItem; copy: Copy }) {
  const zh = c.nav.overview === "总览";
  const [sshOpen, setSshOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const sshServer = "ssh.rlark.ai";
  const sshCommand = `ssh -J rlark-user@${sshServer} user@${worker.name}`;
  const handleCopy = () => {
    navigator.clipboard?.writeText(sshCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <>
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
          <div className="row-actions">
            <button className="secondary-button terminal-button">
              <TerminalSquare size={16} />
              WebTerminal
            </button>
            <button
              className="secondary-button terminal-button"
              onClick={() => setSshOpen(true)}
            >
              <KeyRound size={16} />
              {c.jobs.sshLogin}
            </button>
          </div>
        </td>
      </tr>
      {sshOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setSshOpen(false)}
        >
          <div className="modal ssh-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  <KeyRound size={13} />
                  SSH
                </span>
                <h2>{c.jobs.sshDialogTitle}</h2>
              </div>
              <button className="icon-button" onClick={() => setSshOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="ssh-desc">{c.jobs.sshDialogDesc}</p>
              <div className="ssh-command-box">
                <code>{sshCommand}</code>
                <button className="secondary-button" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check size={15} />
                      {c.jobs.sshCopied}
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      {c.api.copy}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CRDDomain {
  apiVersion: string;
  kind: string;
  metadata: { name: string; creationTimestamp?: string };
  spec: { cidr: string };
  status?: {
    ipAllocations?: Array<{
      ip: string;
      job: string;
      task: string;
      pod: string;
    }>;
  };
}

interface CRDWorkflowJobTemplate {
  name: string;
  dependencies?: string[];
  spec: { domain?: string; tasks: CRDJobTask[] };
}

interface CRDWorkflow {
  apiVersion: string;
  kind: string;
  metadata: { name: string; creationTimestamp?: string };
  spec: { jobTemplates: CRDWorkflowJobTemplate[] };
  status?: {
    phase: string;
    jobs?: Array<{ name: string; phase: string; message: string }>;
    startTime?: string;
    endTime?: string;
  };
}

function crdToWorkflow(crd: CRDWorkflow) {
  const jobs = crd.status?.jobs ?? [];
  const running = jobs.filter((j) => j.phase === "Running").length;
  const phase = crd.status?.phase ?? "Pending";
  return {
    name: crd.metadata.name,
    phase: phase as Phase,
    jobCount: crd.spec.jobTemplates.length,
    runningJobs: running,
    created: crd.metadata.creationTimestamp ?? "—",
    templates: crd.spec.jobTemplates,
    jobStatuses: jobs,
  };
}

function DomainsPage({
  copy: c,
  selectedName,
  onSelect,
}: {
  copy: Copy;
  selectedName: string;
  onSelect: (name?: string) => void;
}) {
  const zh = c.nav.overview === "总览";
  const [domains, setDomains] = useState<CRDDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCidr, setNewCidr] = useState("10.244.0.0/16");
  const [creating, setCreating] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/domains");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setDomains(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiVersion: "rlinf.io/v1alpha1",
          kind: "Domain",
          metadata: { name: newName.trim() },
          spec: { cidr: newCidr.trim() },
        }),
      });
      if (!resp.ok)
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      setShowCreate(false);
      setNewName("");
      setNewCidr("10.244.0.0/16");
      fetchDomains();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(zh ? `确定删除域 "${name}" 吗?` : `Delete domain "${name}"?`))
      return;
    try {
      const resp = await fetch(`/api/v1/rlinf.io/v1alpha1/domains/${name}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setDomains((prev) => prev.filter((d) => d.metadata.name !== name));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const selected =
    selectedName && domains.length > 0
      ? (domains.find((d) => d.metadata.name === selectedName) ?? null)
      : null;

  if (selected) {
    return (
      <DomainDetailPage
        domain={selected}
        copy={c}
        onBack={() => onSelect(undefined)}
      />
    );
  }

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {zh ? "跨集群网络" : "Cross-cluster Network"}
          </span>
          <h2>{c.nav.domains}</h2>
          <p>
            {zh
              ? "管理跨集群网络域，为 Pod 分配跨集群可达的 IP 地址。"
              : "Manage cross-cluster network domains for pod IP allocation."}
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          <Plus size={17} />
          {zh ? "创建域" : "Create Domain"}
        </button>
      </div>
      <PageToolbar
        placeholder={zh ? "搜索域..." : "Search domains..."}
        value=""
        onChange={() => {}}
        count={domains.length}
        copy={c}
        onRefresh={fetchDomains}
      />
      {error && (
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>{zh ? "域名" : "Name"}</th>
              <th>CIDR</th>
              <th>{zh ? "IP 分配" : "IP Allocations"}</th>
              <th>{zh ? "创建时间" : "Created"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr
                key={d.metadata.name}
                className="clickable-row"
                onClick={() => onSelect(d.metadata.name)}
              >
                <td>
                  <strong>{d.metadata.name}</strong>
                </td>
                <td>
                  <code className="inline-code">{d.spec.cidr}</code>
                </td>
                <td>
                  <small>
                    {d.status?.ipAllocations?.length ?? 0}{" "}
                    {zh ? "个分配" : "allocated"}
                  </small>
                </td>
                <td>
                  <small>{d.metadata.creationTimestamp ?? "—"}</small>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(d.metadata.name);
                      }}
                      title={zh ? "删除" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {domains.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "32px" }}
                >
                  <small className="muted">
                    {zh ? "暂无域" : "No domains"}
                  </small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowCreate(false)
          }
        >
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">NEW DOMAIN</span>
                <h2>{zh ? "创建网络域" : "Create Domain"}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-head">
                  <small>{zh ? "域名" : "Domain Name"}</small>
                </div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={zh ? "my-domain" : "my-domain"}
                />
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <small>CIDR</small>
                </div>
                <input
                  value={newCidr}
                  onChange={(e) => setNewCidr(e.target.value)}
                  placeholder="10.244.0.0/16"
                />
                <small
                  className="muted"
                  style={{ display: "block", marginTop: 4 }}
                >
                  {zh
                    ? "Pod 跨集群 IP 将从此网段中分配"
                    : "Cross-cluster pod IPs will be allocated from this subnet"}
                </small>
              </div>
              {error && (
                <div className="cert-error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div className="step-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                >
                  {zh ? "取消" : "Cancel"}
                </button>
                <button
                  className="primary-button"
                  disabled={creating || !newName.trim() || !newCidr.trim()}
                  onClick={handleCreate}
                >
                  {creating
                    ? zh
                      ? "创建中…"
                      : "Creating…"
                    : zh
                      ? "创建"
                      : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainDetailPage({
  domain,
  copy: c,
  onBack,
}: {
  domain: CRDDomain;
  copy: Copy;
  onBack: () => void;
}) {
  const zh = c.nav.overview === "总览";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"ip" | "job" | "task" | "pod" | null>(
    null,
  );
  const [sortAsc, setSortAsc] = useState(true);

  const allAllocs = domain.status?.ipAllocations ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return allAllocs;
    const q = query.toLowerCase();
    return allAllocs.filter((a) =>
      `${a.ip} ${a.job} ${a.task} ${a.pod}`.toLowerCase().includes(q),
    );
  }, [allAllocs, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = (a[sortKey] ?? "").toString();
      const bv = (b[sortKey] ?? "").toString();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const toggleSort = (key: "ip" | "job" | "task" | "pod") => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="page-content resource-page domain-detail-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {zh ? "跨集群网络" : "Cross-cluster Network"}
          </span>
          <h2>{domain.metadata.name}</h2>
          <p>
            {zh
              ? "管理跨集群网络域，为 Pod 分配跨集群可达的 IP 地址。"
              : "Manage cross-cluster network domains for pod IP allocation."}
          </p>
        </div>
        <button className="secondary-button" onClick={onBack}>
          <ChevronLeft size={17} />
          {zh ? "返回列表" : "Back"}
        </button>
      </div>
      <div className="form-section">
        <div className="form-section-head">
          <small>CIDR</small>
        </div>
        <code className="inline-code">{domain.spec.cidr}</code>
      </div>
      <div className="form-section">
        <div className="form-section-head">
          <small>
            {zh ? "IP 分配明细" : "IP Allocations"} ({allAllocs.length})
          </small>
        </div>
        {allAllocs.length > 0 ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={
                  zh ? "搜索 IP/任务/Pod..." : "Search IP/Job/Pod..."
                }
                style={{ minWidth: 240, flex: 1, maxWidth: 360 }}
              />
              <small className="muted">
                {zh ? `共 ${total} 条` : `${total} total`}
              </small>
              <div style={{ marginLeft: "auto" }}>
                <label
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <small className="muted">{zh ? "每页" : "Page size"}</small>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{ width: "auto" }}
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("ip")}
                      >
                        IP
                        {sortKey === "ip" && (sortAsc ? " ▲" : " ▼")}
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("job")}
                      >
                        {zh ? "任务" : "Job"}
                        {sortKey === "job" && (sortAsc ? " ▲" : " ▼")}
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("task")}
                      >
                        {zh ? "子任务" : "Task"}
                        {sortKey === "task" && (sortAsc ? " ▲" : " ▼")}
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("pod")}
                      >
                        Pod
                        {sortKey === "pod" && (sortAsc ? " ▲" : " ▼")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((alloc, i) => (
                    <tr key={start + i}>
                      <td>
                        <code className="inline-code">{alloc.ip}</code>
                      </td>
                      <td>
                        <small>{alloc.job}</small>
                      </td>
                      <td>
                        <small>{alloc.task}</small>
                      </td>
                      <td>
                        <small>{alloc.pod}</small>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: "center", padding: "32px" }}
                      >
                        <small className="muted">
                          {zh ? "暂无匹配记录" : "No matching records"}
                        </small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar">
              <button
                className="icon-button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title={zh ? "上一页" : "Prev"}
              >
                <ChevronLeft size={16} />
              </button>
              <small>
                {zh
                  ? `第 ${currentPage} / ${totalPages} 页`
                  : `Page ${currentPage} / ${totalPages}`}
              </small>
              <button
                className="icon-button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title={zh ? "下一页" : "Next"}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <small className="muted">
            {zh ? "暂无 IP 分配" : "No IP allocations"}
          </small>
        )}
      </div>
      <div className="form-section">
        <div className="form-section-head">
          <small>{zh ? "创建时间" : "Created"}</small>
        </div>
        <small>{domain.metadata.creationTimestamp ?? "—"}</small>
      </div>
    </div>
  );
}

function WorkflowDetailPage({
  wf,
  crd,
  copy: c,
  onBack,
  onJobClick,
}: {
  wf: ReturnType<typeof crdToWorkflow>;
  crd: CRDWorkflow;
  copy: Copy;
  onBack: () => void;
  onJobClick: (jobName: string) => void;
}) {
  const zh = c.nav.overview === "总览";
  const templates = wf.templates;
  const jobStatuses = wf.jobStatuses;

  const statusOf = (name: string) =>
    jobStatuses.find((s) => s.name === name)?.phase ?? "Pending";

  const phaseColor = (phase: string) =>
    phase === "Succeeded"
      ? "#22c55e"
      : phase === "Running"
        ? "var(--blue)"
        : phase === "Failed"
          ? "#ef4444"
          : "#94a3b8";

  const phaseLabel = (phase: string) =>
    zh
      ? phase === "Succeeded"
        ? "已完成"
        : phase === "Running"
          ? "运行中"
          : phase === "Failed"
            ? "失败"
            : "待执行"
      : phase === "Succeeded"
        ? "Done"
        : phase === "Running"
          ? "Running"
          : phase === "Failed"
            ? "Failed"
            : "Pending";

  const NODE_W = 200;
  const NODE_H = 56;
  const COL_GAP = 280;
  const ROW_GAP = 100;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [portPositions, setPortPositions] = useState<
    Record<
      string,
      { in: { x: number; y: number }; out: { x: number; y: number } }
    >
  >({});

  const sorted = [...templates];
  const depMap = new Map(templates.map((t) => [t.name, t.dependencies ?? []]));
  const layerOf = new Map<string, number>();
  const calcLayer = (name: string): number => {
    if (layerOf.has(name)) return layerOf.get(name)!;
    const deps = depMap.get(name) ?? [];
    if (deps.length === 0) {
      layerOf.set(name, 0);
      return 0;
    }
    const max = Math.max(...deps.map(calcLayer));
    layerOf.set(name, max + 1);
    return max + 1;
  };
  templates.forEach((t) => calcLayer(t.name));

  const layers = new Map<number, string[]>();
  sorted.forEach((t) => {
    const l = layerOf.get(t.name) ?? 0;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(t.name);
  });

  const layoutNodes = useMemo(
    () =>
      templates.map((t) => {
        const layer = layerOf.get(t.name) ?? 0;
        const col = layers.get(layer) ?? [];
        const idx = col.indexOf(t.name);
        return {
          id: t.name,
          name: t.name,
          phase: statusOf(t.name),
          x: 40 + layer * COL_GAP,
          y: 40 + idx * ROW_GAP,
        };
      }),
    [templates, jobStatuses],
  );

  const allEdges = useMemo(() => {
    const edges: { from: string; to: string }[] = [];
    templates.forEach((t) => {
      (t.dependencies ?? []).forEach((dep) => {
        edges.push({ from: dep, to: t.name });
      });
    });
    return edges;
  }, [templates]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const next: Record<
      string,
      { in: { x: number; y: number }; out: { x: number; y: number } }
    > = {};
    for (const n of layoutNodes) {
      const el = canvas.querySelector(
        `[data-node-id="${n.id}"]`,
      ) as HTMLElement | null;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const sx = r.left - cRect.left + canvas.scrollLeft;
      const sy = r.top - cRect.top + canvas.scrollTop;
      const cy = sy + r.height / 2;
      next[n.id] = { in: { x: sx, y: cy }, out: { x: sx + r.width, y: cy } };
    }
    setPortPositions(next);
  }, [layoutNodes]);

  const nodePos = (id: string, side: "in" | "out") => {
    const p = portPositions[id];
    if (p) return side === "in" ? p.in : p.out;
    const n = layoutNodes.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0 };
    const cy = n.y + NODE_H / 2;
    return side === "in"
      ? { x: n.x + 1, y: cy }
      : { x: n.x + NODE_W - 1, y: cy };
  };

  const canvasW = 40 + (layers.size - 1) * COL_GAP + NODE_W + 40;
  const canvasH =
    40 + Math.max(...[...layers.values()].map((c) => c.length)) * ROW_GAP;

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <button
            className="secondary-button"
            onClick={onBack}
            style={{ marginBottom: 8 }}
          >
            <ChevronLeft size={14} />
            {zh ? "返回" : "Back"}
          </button>
          <span className="eyebrow">{c.workflows.eyebrow}</span>
          <h2>{wf.name}</h2>
          <p>
            <StatusBadge phase={wf.phase} copy={c} />
            <span
              style={{ marginLeft: 12, fontSize: 12, color: "var(--muted)" }}
            >
              {zh ? "任务" : "Jobs"}: {wf.runningJobs}/{wf.jobCount}
            </span>
          </p>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-head">
          <strong>{zh ? "DAG 执行状态" : "DAG Execution Status"}</strong>
        </div>
        <div
          className="dag-canvas"
          ref={canvasRef}
          style={{ overflow: "auto", maxHeight: 500 }}
        >
          <div
            className="dag-canvas-content"
            style={{ width: canvasW, height: canvasH }}
          >
            <svg className="dag-svg" width={canvasW} height={canvasH}>
              <defs>
                <marker
                  id="wf-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--blue)" />
                </marker>
              </defs>
              {allEdges.map((e) => {
                const p1 = nodePos(e.from, "out");
                const p2 = nodePos(e.to, "in");
                const midX = (p1.x + p2.x) / 2;
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={`M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`}
                    stroke="var(--blue)"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#wf-arrow)"
                  />
                );
              })}
            </svg>
            {layoutNodes.map((n) => (
              <div
                key={n.id}
                data-node-id={n.id}
                className="dag-node"
                onClick={
                  n.phase === "Pending"
                    ? undefined
                    : () => onJobClick(`${wf.name}-${n.name}`)
                }
                style={{
                  left: n.x,
                  top: n.y,
                  borderColor: phaseColor(n.phase),
                  cursor: n.phase === "Pending" ? "default" : "pointer",
                  boxShadow:
                    n.phase === "Running"
                      ? `0 0 0 2px ${phaseColor(n.phase)}, 0 2px 12px rgba(124,58,237,0.2)`
                      : undefined,
                }}
              >
                <div
                  className="dag-node-port input"
                  style={{ borderColor: phaseColor(n.phase) }}
                />
                <div className="dag-node-body">
                  <strong>{n.name}</strong>
                  <span
                    className="dag-node-type"
                    style={{
                      color: phaseColor(n.phase),
                      background:
                        n.phase === "Running"
                          ? "rgba(124,58,237,0.1)"
                          : undefined,
                    }}
                  >
                    {phaseLabel(n.phase)}
                  </span>
                </div>
                <div
                  className="dag-node-port output"
                  style={{ borderColor: phaseColor(n.phase) }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="table-panel" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>{zh ? "任务名称" : "Job Name"}</th>
              <th>{zh ? "状态" : "Phase"}</th>
              <th>{zh ? "依赖" : "Dependencies"}</th>
              <th>{zh ? "消息" : "Message"}</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => {
              const st = jobStatuses.find((s) => s.name === t.name);
              return (
                <tr
                  key={t.name}
                  onClick={
                    (st?.phase ?? "Pending") === "Pending"
                      ? undefined
                      : () => onJobClick(`${wf.name}-${t.name}`)
                  }
                  style={{
                    cursor:
                      (st?.phase ?? "Pending") === "Pending"
                        ? "default"
                        : "pointer",
                  }}
                >
                  <td>
                    <strong>{t.name}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        color: phaseColor(st?.phase ?? "Pending"),
                        fontWeight: 600,
                      }}
                    >
                      {phaseLabel(st?.phase ?? "Pending")}
                    </span>
                  </td>
                  <td>
                    <small>{(t.dependencies ?? []).join(", ") || "—"}</small>
                  </td>
                  <td>
                    <small>{st?.message || "—"}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkflowsPage({
  copy: c,
  onCreate,
  selectedName,
  onSelect,
  onJobClick,
}: {
  copy: Copy;
  onCreate: () => void;
  selectedName: string;
  onSelect: (name?: string) => void;
  onJobClick: (jobName: string) => void;
}) {
  const zh = c.nav.overview === "总览";
  const [workflows, setWorkflows] = useState<CRDWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkflows = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/workflows");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setWorkflows(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDelete = async (name: string) => {
    if (
      !confirm(
        zh ? `确定删除工作流 "${name}" 吗?` : `Delete workflow "${name}"?`,
      )
    )
      return;
    try {
      const resp = await fetch(`/api/v1/rlinf.io/v1alpha1/workflows/${name}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setWorkflows((prev) => prev.filter((w) => w.metadata.name !== name));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const items = workflows.map(crdToWorkflow);

  const selected =
    selectedName && items.length > 0
      ? (items.find((w) => w.name === selectedName) ?? null)
      : null;

  if (selected) {
    return (
      <WorkflowDetailPage
        wf={selected}
        crd={workflows.find((w) => w.metadata.name === selectedName)!}
        copy={c}
        onBack={() => onSelect(undefined)}
        onJobClick={onJobClick}
      />
    );
  }

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{c.workflows.eyebrow}</span>
          <h2>{c.workflows.title}</h2>
          <p>{c.workflows.desc}</p>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} />
          {c.workflows.createTitle}
        </button>
      </div>
      <PageToolbar
        placeholder={c.workflows.search}
        value=""
        onChange={() => {}}
        count={items.length}
        copy={c}
        onRefresh={fetchWorkflows}
      />
      {error && (
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>{zh ? "工作流名称" : "Name"}</th>
              <th>{zh ? "状态" : "Status"}</th>
              <th>{zh ? "任务数" : "Jobs"}</th>
              <th>{zh ? "创建时间" : "Created"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((wf) => (
              <tr
                key={wf.name}
                onClick={() => onSelect(wf.name)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <strong>{wf.name}</strong>
                </td>
                <td>
                  <StatusBadge phase={wf.phase} copy={c} />
                </td>
                <td>
                  <span className="inline-progress">
                    <i>
                      <b
                        style={{
                          width:
                            wf.jobCount > 0
                              ? (wf.runningJobs / wf.jobCount) * 100 + "%"
                              : "0%",
                        }}
                      />
                    </i>
                    {wf.runningJobs}/{wf.jobCount}
                  </span>
                </td>
                <td>
                  <small>{wf.created}</small>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button danger"
                      onClick={() => handleDelete(wf.name)}
                      title={zh ? "删除" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "32px" }}
                >
                  <small className="muted">
                    {zh ? "暂无工作流" : "No workflows"}
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

interface DAGNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface DAGEdge {
  from: string;
  to: string;
}

interface WorkflowJobDef {
  id: string;
  name: string;
  dependencies: string[];
  type: JobType;
  roles: string[];
  headerRole: string;
  roleResources: Record<string, RoleResource>;
  runScript: string;
  domain: string;
}

function makeDefaultRoleResources(
  type: JobType,
  roles: string[],
): Record<string, RoleResource> {
  const rr: Record<string, RoleResource> = {};
  roles.forEach((role, index) => {
    rr[role] = {
      role,
      cluster: clusters[0].name,
      nodeSelector: index === 0 ? "gpu=h800" : "any=true",
      replicas: 0,
      cpu: "",
      memory: "",
      gpu: index === 0 ? "4" : "0",
      image: "registry.rlark.ai/rl/policy-trainer:v0.42",
      prepareScript: "",
      envs: [{ key: "RLARK_TASK_ROLE", value: role }],
      mounts: [{ objectStorage: "/host/dataset", mountPath: "/mnt/dataset" }],
    };
  });
  return rr;
}

function hasCycle(edges: DAGEdge[], nodes: DAGNode[]): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.from)?.push(e.to));
  const visited = new Set<string>();
  const stack = new Set<string>();
  const dfs = (id: string): boolean => {
    visited.add(id);
    stack.add(id);
    for (const next of adj.get(id) ?? []) {
      if (!visited.has(next) && dfs(next)) return true;
      if (stack.has(next)) return true;
    }
    stack.delete(id);
    return false;
  };
  for (const n of nodes) {
    if (!visited.has(n.id) && dfs(n.id)) return true;
  }
  return false;
}

function CreateWorkflowModal({
  onClose,
  copy: c,
}: {
  onClose: () => void;
  copy: Copy;
}) {
  const zh = c.nav.overview === "总览";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [workflowName, setWorkflowName] = useState("rl-training-pipeline");
  const [domains, setDomains] = useState<{ name: string; cidr: string }[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [activeRoleTab, setActiveRoleTab] = useState<string>("");

  const [dragNode, setDragNode] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragEdge, setDragEdge] = useState<{
    from: string;
    x: number;
    y: number;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<DAGNode[]>([
    { id: "n1", name: "job-1", x: 40, y: 40 },
  ]);
  const [edges, setEdges] = useState<DAGEdge[]>([]);

  const [jobs, setJobs] = useState<WorkflowJobDef[]>([
    {
      id: "n1",
      name: "job-1",
      dependencies: [],
      type: "RL",
      roles: ROLE_TEMPLATES["RL"],
      headerRole: ROLE_TEMPLATES["RL"][0],
      roleResources: makeDefaultRoleResources("RL", ROLE_TEMPLATES["RL"]),
      runScript:
        "python train.py --config /mnt/config/train.yaml --dataset /mnt/dataset --output /mnt/checkpoints",
      domain: "",
    },
  ]);

  useEffect(() => {
    fetch("/api/v1/rlinf.io/v1alpha1/domains")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) =>
        setDomains(
          (data.items ?? []).map((d: any) => ({
            name: d.metadata?.name ?? "",
            cidr: d.spec?.cidr ?? "",
          })),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeJobId && jobs.length > 0) setActiveJobId(jobs[0].id);
  }, [activeJobId, jobs]);

  useEffect(() => {
    if (!activeRoleTab && jobs.length > 0) {
      const job = jobs.find((j) => j.id === activeJobId);
      if (job && job.roles.length > 0) setActiveRoleTab(job.roles[0]);
    }
  }, [activeRoleTab, activeJobId, jobs]);

  const addJobToDAG = () => {
    const id = `n${Date.now()}`;
    let maxNum = 0;
    for (const j of jobs) {
      const m = j.name.match(/^job-(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
    }
    const name = `job-${maxNum + 1}`;
    const x = 40 + (jobs.length % 3) * 260;
    const y = 40 + Math.floor(jobs.length / 3) * 160;
    const roles = ROLE_TEMPLATES["RL"];
    const newJob: WorkflowJobDef = {
      id,
      name,
      dependencies: [],
      type: "RL",
      roles,
      headerRole: roles[0],
      roleResources: makeDefaultRoleResources("RL", roles),
      runScript:
        "python train.py --config /mnt/config/train.yaml --dataset /mnt/dataset --output /mnt/checkpoints",
      domain: "",
    };
    setJobs([...jobs, newJob]);
    setNodes([...nodes, { id, name, x, y }]);
    setActiveJobId(id);
    setActiveRoleTab(roles[0]);
  };

  const removeJobFromDAG = (id: string) => {
    if (jobs.length <= 1) return;
    const nextJobs = jobs.filter((j) => j.id !== id);
    const nextNodes = nodes.filter((n) => n.id !== id);
    const nextEdges = edges.filter((e) => e.from !== id && e.to !== id);
    setJobs(
      nextJobs.map((j) => ({
        ...j,
        dependencies: j.dependencies.filter((d) => {
          const depJob = jobs.find((j2) => j2.name === d);
          return depJob && depJob.id !== id;
        }),
      })),
    );
    setNodes(nextNodes);
    setEdges(nextEdges);
    if (activeJobId === id) setActiveJobId(nextJobs[0].id);
  };

  const updateJob = (id: string, patch: Partial<WorkflowJobDef>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };

  const updateNodeName = (id: string, name: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, name } : n)));
  };

  const renameJob = (id: string, newName: string) => {
    const oldName = jobs.find((j) => j.id === id)?.name ?? "";
    updateJob(id, { name: newName });
    updateNodeName(id, newName);
    setJobs((prev) =>
      prev.map((j) => {
        if (j.dependencies.includes(oldName)) {
          return {
            ...j,
            dependencies: j.dependencies.map((d) =>
              d === oldName ? newName : d,
            ),
          };
        }
        return j;
      }),
    );
  };

  const addEdge = (from: string, to: string) => {
    if (from === to) return;
    if (edges.some((e) => e.from === from && e.to === to)) return;
    const nextEdges = [...edges, { from, to }];
    if (hasCycle(nextEdges, nodes)) {
      setError(zh ? "不能创建循环依赖" : "Cannot create circular dependency");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setEdges(nextEdges);
    const fromName = jobs.find((j) => j.id === from)?.name ?? "";
    const toJob = jobs.find((j) => j.id === to);
    if (toJob) {
      updateJob(to, {
        dependencies: [...new Set([...toJob.dependencies, fromName])],
      });
    }
  };

  const removeEdge = (from: string, to: string) => {
    setEdges(edges.filter((e) => !(e.from === from && e.to === to)));
    const fromName = jobs.find((j) => j.id === from)?.name ?? "";
    const toJob = jobs.find((j) => j.id === to);
    if (toJob) {
      updateJob(to, {
        dependencies: toJob.dependencies.filter((d) => d !== fromName),
      });
    }
  };

  const getCanvasXY = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left + el.scrollLeft,
      y: clientY - rect.top + el.scrollTop,
    };
  };

  const onNodeMouseDown = (e: MouseEvent, id: string) => {
    if ((e.target as HTMLElement).classList.contains("dag-node-port")) return;
    const { x: mx, y: my } = getCanvasXY(e.clientX, e.clientY);
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    setDragNode({ id, offsetX: mx - node.x, offsetY: my - node.y });
  };

  const onCanvasMouseMove = (e: MouseEvent) => {
    const { x: mx, y: my } = getCanvasXY(e.clientX, e.clientY);
    if (dragNode) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragNode.id
            ? { ...n, x: mx - dragNode.offsetX, y: my - dragNode.offsetY }
            : n,
        ),
      );
    }
    if (dragEdge) {
      setDragEdge({ ...dragEdge, x: mx, y: my });
    }
  };

  const onCanvasMouseUp = (e: MouseEvent) => {
    if (dragEdge) {
      const target = (e.target as HTMLElement).closest(
        "[data-node-id]",
      ) as HTMLElement | null;
      if (target) {
        const toId = target.dataset.nodeId!;
        addEdge(dragEdge.from, toId);
      }
      setDragEdge(null);
    }
    setDragNode(null);
  };

  const onPortMouseDown = (e: MouseEvent, fromId: string) => {
    e.stopPropagation();
    const { x, y } = getCanvasXY(e.clientX, e.clientY);
    setDragEdge({ from: fromId, x, y });
  };

  const buildJobSpec = (job: WorkflowJobDef) => {
    const crd = generateJobCRD({
      name: job.name,
      type: job.type,
      headerRole: job.headerRole,
      roles: job.roles,
      roleResources: job.roleResources,
      runScript: job.runScript,
      domain: job.domain,
    });
    return { domain: crd.spec.domain, tasks: crd.spec.tasks };
  };

  const buildWorkflowCRD = () => {
    const jobTemplates = jobs.map((job) => {
      const depNames = edges
        .filter((e) => e.to === job.id)
        .map((e) => jobs.find((j) => j.id === e.from)?.name)
        .filter(Boolean) as string[];
      return {
        name: job.name,
        dependencies: depNames.length > 0 ? depNames : undefined,
        spec: buildJobSpec(job),
      };
    });
    return {
      apiVersion: "rlinf.io/v1alpha1",
      kind: "Workflow",
      metadata: { name: workflowName },
      spec: { jobTemplates },
    };
  };

  const crd = buildWorkflowCRD();
  const yaml = toYaml(crd);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/workflows", {
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

  const activeJob = jobs.find((j) => j.id === activeJobId) ?? jobs[0];
  const effectiveHeader =
    activeJob && activeJob.roles.includes(activeJob.headerRole)
      ? activeJob.headerRole
      : (activeJob?.roles[0] ?? "");
  const steps = zh
    ? ["DAG 编排", "Job 详情", "YAML 预览"]
    : ["DAG Editor", "Job Details", "YAML Preview"];

  const NODE_W = 200;
  const NODE_H = 56;
  const [portPositions, setPortPositions] = useState<
    Record<
      string,
      { in: { x: number; y: number }; out: { x: number; y: number } }
    >
  >({});

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const next: Record<
      string,
      { in: { x: number; y: number }; out: { x: number; y: number } }
    > = {};
    for (const n of nodes) {
      const el = canvas.querySelector(
        `[data-node-id="${n.id}"]`,
      ) as HTMLElement | null;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const sx = r.left - cRect.left + canvas.scrollLeft;
      const sy = r.top - cRect.top + canvas.scrollTop;
      const cx = sx + r.width;
      const cy = sy + r.height / 2;
      next[n.id] = { in: { x: sx, y: cy }, out: { x: cx, y: cy } };
    }
    setPortPositions(next);
  }, [nodes]);

  const nodePortPos = (id: string, side: "in" | "out") => {
    const stored = portPositions[id];
    if (stored) return stored[side];
    const n = nodes.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0 };
    const cy = n.y + NODE_H / 2;
    return side === "in"
      ? { x: n.x + 1, y: cy }
      : { x: n.x + NODE_W - 1, y: cy };
  };

  const updateRR = (role: string, field: keyof RoleResource, value: any) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    updateJob(activeJob.id, {
      roleResources: {
        ...activeJob.roleResources,
        [role]: { ...rr, [field]: value },
      },
    });
  };

  const updateRREnv = (
    role: string,
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    const envs = rr.envs.map((e, i) =>
      i === index ? { ...e, [field]: value } : e,
    );
    updateRR(role, "envs", envs);
  };

  const addRREnv = (role: string) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    updateRR(role, "envs", [...rr.envs, { key: "", value: "" }]);
  };

  const removeRREnv = (role: string, index: number) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    updateRR(
      role,
      "envs",
      rr.envs.filter((_, i) => i !== index),
    );
  };

  const updateRRMount = (
    role: string,
    index: number,
    field: "objectStorage" | "mountPath",
    value: string,
  ) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    const mounts = rr.mounts.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    );
    updateRR(role, "mounts", mounts);
  };

  const addRRMount = (role: string) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    updateRR(role, "mounts", [
      ...rr.mounts,
      { objectStorage: "", mountPath: "" },
    ]);
  };

  const removeRRMount = (role: string, index: number) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    updateRR(
      role,
      "mounts",
      rr.mounts.filter((_, i) => i !== index),
    );
  };

  const onJobTypeChange = (next: JobType) => {
    if (!activeJob) return;
    const newRoles = ROLE_TEMPLATES[next];
    const newRR = makeDefaultRoleResources(next, newRoles);
    updateJob(activeJob.id, {
      type: next,
      roles: newRoles,
      headerRole: newRoles[0],
      roleResources: newRR,
    });
    if (newRoles.length > 0) setActiveRoleTab(newRoles[0]);
  };

  const addRole = () => {
    if (!activeJob) return;
    const newRole = `Role ${activeJob.roles.length + 1}`;
    const roles = [...activeJob.roles, newRole];
    const rr = { ...activeJob.roleResources };
    rr[newRole] = {
      role: newRole,
      cluster: clusters[0].name,
      nodeSelector: "any=true",
      replicas: 0,
      cpu: "",
      memory: "",
      gpu: "0",
      image: "registry.rlark.ai/rl/policy-trainer:v0.42",
      prepareScript: "",
      envs: [{ key: "RLARK_TASK_ROLE", value: newRole }],
      mounts: [{ objectStorage: "/host/dataset", mountPath: "/mnt/dataset" }],
    };
    updateJob(activeJob.id, { roles, roleResources: rr });
    setActiveRoleTab(newRole);
  };

  const removeRole = (role: string) => {
    if (!activeJob || activeJob.roles.length <= 1) return;
    const roles = activeJob.roles.filter((r) => r !== role);
    const rr = { ...activeJob.roleResources };
    delete rr[role];
    const headerRole =
      activeJob.headerRole === role ? roles[0] : activeJob.headerRole;
    updateJob(activeJob.id, { roles, roleResources: rr, headerRole });
    if (activeRoleTab === role) setActiveRoleTab(roles[0]);
  };

  const renameRole = (old: string, newName: string) => {
    if (!activeJob) return;
    if (!newName.trim()) return;
    const roles = activeJob.roles.map((r) => (r === old ? newName : r));
    const rr: Record<string, RoleResource> = {};
    for (const [k, v] of Object.entries(activeJob.roleResources)) {
      rr[k === old ? newName : k] = k === old ? { ...v, role: newName } : v;
    }
    const headerRole =
      activeJob.headerRole === old ? newName : activeJob.headerRole;
    updateJob(activeJob.id, { roles, roleResources: rr, headerRole });
    if (activeRoleTab === old) setActiveRoleTab(newName);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal create-job-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{c.workflows.eyebrow}</span>
            <h2>{c.workflows.createTitle}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body create-job-body">
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

          {step === 1 && (
            <div className="form-section">
              <div className="form-section-head">
                <strong>{zh ? "工作流名称" : "Workflow Name"}</strong>
              </div>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="rl-training-pipeline"
                style={{ marginBottom: 12 }}
              />
              <div className="dag-toolbar">
                <button className="secondary-button" onClick={addJobToDAG}>
                  <Plus size={14} />
                  {c.workflows.addJob}
                </button>
              </div>
              <div
                className="dag-canvas"
                ref={canvasRef}
                onMouseMove={onCanvasMouseMove}
                onMouseUp={onCanvasMouseUp}
                onMouseLeave={onCanvasMouseUp}
              >
                <div className="dag-canvas-content">
                  <svg className="dag-svg" width={900} height={500}>
                    <defs>
                      <marker
                        id="dag-arrow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L7,3 L0,6 Z" fill="var(--blue)" />
                      </marker>
                    </defs>
                    {edges.map((e) => {
                      const p1 = nodePortPos(e.from, "out");
                      const p2 = nodePortPos(e.to, "in");
                      const midX = (p1.x + p2.x) / 2;
                      return (
                        <path
                          key={`${e.from}-${e.to}`}
                          d={`M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`}
                          stroke="var(--blue)"
                          strokeWidth="2"
                          fill="none"
                          markerEnd="url(#dag-arrow)"
                          className="dag-edge"
                          onClick={() => removeEdge(e.from, e.to)}
                        />
                      );
                    })}
                    {dragEdge &&
                      (() => {
                        const p1 = nodePortPos(dragEdge.from, "out");
                        return (
                          <path
                            d={`M ${p1.x} ${p1.y} C ${(p1.x + dragEdge.x) / 2} ${p1.y}, ${(p1.x + dragEdge.x) / 2} ${dragEdge.y}, ${dragEdge.x} ${dragEdge.y}`}
                            stroke="var(--blue)"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="4 3"
                            className="dag-temp-line"
                          />
                        );
                      })()}
                  </svg>
                  {nodes.map((n) => (
                    <div
                      key={n.id}
                      className={
                        "dag-node" + (activeJobId === n.id ? " selected" : "")
                      }
                      style={{ left: n.x, top: n.y }}
                      data-node-id={n.id}
                      onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                      onClick={() => {
                        setActiveJobId(n.id);
                        const j = jobs.find((j) => j.id === n.id);
                        if (j && j.roles.length > 0)
                          setActiveRoleTab(j.roles[0]);
                      }}
                    >
                      <div
                        className="dag-node-port input"
                        title={zh ? "输入" : "Input"}
                      />
                      <div className="dag-node-body">
                        {editingNodeId === n.id ? (
                          <input
                            className="dag-node-name"
                            value={n.name}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => renameJob(n.id, e.target.value)}
                            onBlur={() => {
                              if (!n.name.trim()) renameJob(n.id, "unnamed");
                              setEditingNodeId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingNodeId(null);
                            }}
                          />
                        ) : (
                          <strong
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingNodeId(n.id);
                            }}
                          >
                            {n.name}
                          </strong>
                        )}
                        <span className="dag-node-type">
                          {jobs.find((j) => j.id === n.id)?.type ?? ""}
                        </span>
                      </div>
                      <div
                        className="dag-node-port output"
                        onMouseDown={(e) => onPortMouseDown(e, n.id)}
                        title={
                          zh
                            ? "拖拽到目标节点创建依赖"
                            : "Drag to target to create dependency"
                        }
                      />
                      {jobs.length > 1 && (
                        <button
                          className="dag-node-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeJobFromDAG(n.id);
                          }}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="dag-hint">
                {zh
                  ? "拖拽节点右侧端口到目标节点创建依赖，点击连线可删除。点击节点切换 Job 详情。"
                  : "Drag output port (right) to target node to create dependency. Click edge to remove. Click node to edit."}
              </div>
            </div>
          )}

          {step === 2 && activeJob && (
            <>
              <div className="role-config-tabs" style={{ marginBottom: 12 }}>
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    className={activeJobId === job.id ? "active" : ""}
                    onClick={() => {
                      setActiveJobId(job.id);
                      if (job.roles.length > 0) setActiveRoleTab(job.roles[0]);
                    }}
                  >
                    {job.name}
                  </button>
                ))}
              </div>
              <div className="form-section">
                <div className="form-row">
                  <label>
                    {c.workflows.jobName}
                    <input
                      value={activeJob.name}
                      onChange={(e) => renameJob(activeJob.id, e.target.value)}
                    />
                  </label>
                  <label>
                    {zh ? "任务类型" : "Job Type"}
                    <select
                      value={activeJob.type}
                      onChange={(e) =>
                        onJobTypeChange(e.target.value as JobType)
                      }
                    >
                      {(
                        [
                          "RL",
                          "DataCollection",
                          "Evaluation",
                          "Custom",
                        ] as JobType[]
                      ).map((t) => (
                        <option key={t} value={t}>
                          {c.jobType[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <strong>{zh ? "角色管理" : "Roles"}</strong>
                  <button
                    className="secondary-button"
                    style={{ padding: "2px 10px", fontSize: 12 }}
                    onClick={addRole}
                  >
                    <Plus size={13} />
                    {zh ? "添加角色" : "Add Role"}
                  </button>
                </div>
                <div className="role-edit-list">
                  {activeJob.roles.map((role) => (
                    <div
                      key={role}
                      className={`role-edit-row ${effectiveHeader === role ? "active" : ""}`}
                      onClick={() =>
                        updateJob(activeJob.id, { headerRole: role })
                      }
                    >
                      <Check size={14} />
                      <input
                        value={role}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => renameRole(role, e.target.value)}
                        onBlur={(e) => {
                          if (!e.target.value.trim()) renameRole(role, role);
                        }}
                      />
                      <small>
                        {effectiveHeader === role ? "Header" : "Worker"}
                      </small>
                      {activeJob.roles.length > 1 && (
                        <button
                          className="icon-button danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRole(role);
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {activeJob.roles.length > 0 && (
                <>
                  <div className="role-config-tabs">
                    {activeJob.roles.map((role) => (
                      <button
                        key={role}
                        className={activeRoleTab === role ? "active" : ""}
                        onClick={() => setActiveRoleTab(role)}
                      >
                        {role}
                        {effectiveHeader === role && (
                          <span
                            className="role-chip"
                            style={{ marginLeft: 6, fontSize: 10 }}
                          >
                            Header
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const role = activeRoleTab || activeJob.roles[0];
                    if (!role) return null;
                    const rr = activeJob.roleResources[role];
                    if (!rr) return null;
                    return (
                      <div className="role-resource-card" key={role}>
                        <div className="form-section-head">
                          <strong>{role}</strong>
                          {effectiveHeader === role && (
                            <span
                              className="role-chip"
                              style={{
                                background: "#f3eefe",
                                color: "var(--blue)",
                              }}
                            >
                              Header
                            </span>
                          )}
                        </div>
                        <div className="form-row">
                          <label>
                            {zh ? "集群" : "Cluster"}
                            <select
                              value={rr.cluster}
                              onChange={(e) =>
                                updateRR(role, "cluster", e.target.value)
                              }
                            >
                              {clusters.slice(0, 4).map((cl) => (
                                <option key={cl.name}>{cl.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>{zh ? "节点选择" : "Node Selector"}</small>
                          </div>
                          <NodeSelectorPicker
                            value={rr.nodeSelector}
                            onChange={(v) => updateRR(role, "nodeSelector", v)}
                            zh={zh}
                            onMatchedCount={(n) =>
                              updateRR(role, "replicas", n)
                            }
                          />
                        </div>
                        <div
                          className="resource-input-row"
                          style={{ gridTemplateColumns: "1fr 1fr" }}
                        >
                          <label>
                            {zh ? "副本（自动匹配节点数）" : "Replicas (auto)"}
                            <input
                              type="number"
                              value={rr.replicas}
                              readOnly
                              style={{ opacity: 0.6 }}
                            />
                          </label>
                          <label>
                            GPU
                            <input
                              value={rr.gpu}
                              onChange={(e) =>
                                updateRR(role, "gpu", e.target.value)
                              }
                              placeholder="4"
                            />
                          </label>
                        </div>
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>{zh ? "镜像" : "Image"}</small>
                          </div>
                          <input
                            value={rr.image}
                            onChange={(e) =>
                              updateRR(role, "image", e.target.value)
                            }
                            placeholder="registry.rlark.ai/rl/policy-trainer:v0.42"
                          />
                        </div>
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>
                              {zh
                                ? "准备脚本 (Ray 启动前)"
                                : "Prepare Script (before Ray)"}
                            </small>
                          </div>
                          <textarea
                            className="code-textarea"
                            style={{ minHeight: 60 }}
                            value={rr.prepareScript}
                            onChange={(e) =>
                              updateRR(role, "prepareScript", e.target.value)
                            }
                          />
                        </div>
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>
                              {zh ? "环境变量" : "Environment Variables"}
                            </small>
                            <button
                              className="secondary-button"
                              onClick={() => addRREnv(role)}
                            >
                              <Plus size={14} />
                              {zh ? "添加" : "Add"}
                            </button>
                          </div>
                          {rr.envs.map((env, index) => (
                            <div className="env-row" key={index}>
                              <input
                                value={env.key}
                                onChange={(e) =>
                                  updateRREnv(
                                    role,
                                    index,
                                    "key",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                value={env.value}
                                onChange={(e) =>
                                  updateRREnv(
                                    role,
                                    index,
                                    "value",
                                    e.target.value,
                                  )
                                }
                              />
                              <button
                                className="icon-button danger"
                                onClick={() => removeRREnv(role, index)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>
                              {zh ? "对象存储挂载" : "Volume Mounts"}
                            </small>
                            <button
                              className="secondary-button"
                              onClick={() => addRRMount(role)}
                            >
                              <Plus size={14} />
                              {zh ? "添加" : "Add"}
                            </button>
                          </div>
                          {rr.mounts.map((mount, index) => (
                            <div className="env-row" key={index}>
                              <input
                                value={mount.objectStorage}
                                onChange={(e) =>
                                  updateRRMount(
                                    role,
                                    index,
                                    "objectStorage",
                                    e.target.value,
                                  )
                                }
                                placeholder="/host/path"
                              />
                              <input
                                value={mount.mountPath}
                                onChange={(e) =>
                                  updateRRMount(
                                    role,
                                    index,
                                    "mountPath",
                                    e.target.value,
                                  )
                                }
                                placeholder="/mnt/data"
                              />
                              <button
                                className="icon-button danger"
                                onClick={() => removeRRMount(role, index)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
              <div className="form-section">
                <div className="form-section-head">
                  <small>{zh ? "选择 Head 节点" : "Select Head"}</small>
                </div>
                <div className="role-template selectable">
                  {activeJob.roles.map((role) => (
                    <button
                      key={role}
                      className={effectiveHeader === role ? "active" : ""}
                      onClick={() =>
                        updateJob(activeJob.id, { headerRole: role })
                      }
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
              <div className="form-section">
                <div className="form-section-head">
                  <small>
                    {zh
                      ? "跨集群网络域 (可选)"
                      : "Cross-cluster Network Domain (optional)"}
                  </small>
                </div>
                <select
                  value={activeJob.domain}
                  onChange={(e) =>
                    updateJob(activeJob.id, { domain: e.target.value })
                  }
                >
                  <option value="">
                    {zh ? "不使用跨集群网络" : "No cross-cluster network"}
                  </option>
                  {domains.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.cidr})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <small>{zh ? "运行脚本" : "Run Script"}</small>
                </div>
                <textarea
                  className="code-textarea"
                  value={activeJob.runScript}
                  onChange={(e) =>
                    updateJob(activeJob.id, { runScript: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="yaml-preview">
              <div className="yaml-preview-head">
                <span>YAML</span>
                <button
                  className="secondary-button"
                  onClick={() => navigator.clipboard?.writeText(yaml)}
                >
                  {c.api.copy}
                </button>
              </div>
              <pre>{yaml}</pre>
            </div>
          )}

          {error && (
            <div className="cert-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="step-actions">
            <button
              className="secondary-button"
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            >
              {step > 1 ? (zh ? "上一步" : "Back") : zh ? "取消" : "Cancel"}
            </button>
            {step < 3 ? (
              <button
                className="primary-button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !workflowName.trim()}
              >
                {zh ? "下一步" : "Next"}
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting
                  ? zh
                    ? "提交中…"
                    : "Submitting…"
                  : zh
                    ? "创建"
                    : "Create"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
  Actor: "Actor",
  Learner: "Actor",
  Evaluator: "Actor",
  "Scenario Runner": "Actor",
  "Metrics Aggregator": "Actor",
  Collector: "Actor",
  "Calibration Driver": "Actor",
  Rollout: "Rollout",
  "Rollout Worker": "Rollout",
  "Robot Operator": "Rollout",
  "Camera Worker": "Rollout",
  Environment: "Env",
  "Env Worker": "Env",
  Uploader: "Env",
  "Quality Checker": "Env",
  "Robot Worker": "Env",
  "Metrics Worker": "Env",
};

const ROLE_TEMPLATES: Record<JobType, string[]> = {
  RL: ["Actor", "Rollout", "Environment"],
  DataCollection: ["Environment"],
  Evaluation: ["Rollout", "Environment"],
  Custom: [],
};

interface RoleResource {
  role: string;
  cluster: string;
  nodeSelector: string;
  replicas: number;
  cpu: string;
  memory: string;
  gpu: string;
  image: string;
  prepareScript: string;
  envs: Array<{ key: string; value: string }>;
  mounts: Array<{ objectStorage: string; mountPath: string }>;
}

function mapTaskRole(role: string): "Actor" | "Rollout" | "Env" {
  if (TASK_ROLE_MAP[role]) return TASK_ROLE_MAP[role];
  const lower = role.toLowerCase();
  if (
    lower.includes("env") ||
    lower.includes("uploader") ||
    lower.includes("quality") ||
    lower.includes("metrics worker")
  )
    return "Env";
  if (
    lower.includes("rollout") ||
    lower.includes("camera") ||
    lower.includes("robot operator")
  )
    return "Rollout";
  if (lower.includes("robot")) return "Env";
  if (lower.includes("collect") || lower.includes("eval")) return "Actor";
  return "Actor";
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
  runScript: string;
  domain: string;
}) {
  const tasks = opts.roles.map((role) => {
    const res = opts.roleResources[role];
    const isHead = role === opts.headerRole;
    const roleEnvs = res?.envs ?? [];
    const roleMounts = res?.mounts ?? [];
    const envVars = [
      ...roleEnvs
        .filter((e) => e.key !== "RLARK_TASK_ROLE")
        .map((e) => ({ name: e.key, value: e.value })),
      { name: "RLARK_TASK_ROLE", value: role },
    ];
    const containerVolumes = roleMounts.map((m) => ({
      name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
      hostPath: { path: m.objectStorage },
    }));
    const volumeMounts = roleMounts.map((m) => ({
      name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
      mountPath: m.mountPath,
    }));
    return {
      name: role.toLowerCase().replace(/\s+/g, "-"),
      head: isHead,
      agentType: "Kubernetes",
      role: mapTaskRole(role),
      nodeSelector: res ? parseNodeSelector(res.nodeSelector) : {},
      prepareScript: res?.prepareScript ?? "",
      ...(isHead ? { runScript: opts.runScript } : {}),
      kubernetes: {
        workload: {
          kind: "Deployment",
          replicas: res ? Number(res.replicas) : 1,
          template: {
            spec: {
              containers: [
                {
                  name: "main",
                  image: res?.image ?? "",
                  env: envVars,
                  volumeMounts:
                    volumeMounts.length > 0 ? volumeMounts : undefined,
                  resources: res
                    ? {
                        requests: {
                          ...(res.cpu ? { cpu: res.cpu } : {}),
                          ...(res.memory ? { memory: res.memory } : {}),
                          ...(res.gpu && res.gpu !== "0"
                            ? { "nvidia.com/gpu": res.gpu }
                            : {}),
                        },
                        limits: {
                          ...(res.gpu && res.gpu !== "0"
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
    apiVersion: "rlinf.io/v1alpha1",
    kind: "Job",
    metadata: { name: opts.name },
    spec: { tasks, ...(opts.domain ? { domain: opts.domain } : {}) },
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

interface CRDNodeLite {
  metadata: { name: string; labels?: Record<string, string> };
  status?: { phase?: string };
}

function parseNodeSelectorStr(s: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of s.split(",")) {
    const [k, v] = part.split("=");
    if (k && v !== undefined) result[k.trim()] = v.trim();
  }
  return result;
}

function selectorToStr(sel: Record<string, string>): string {
  return Object.entries(sel)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

function useNodeLabels() {
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
  return { nodes, loading };
}

function NodeSelectorPicker({
  value,
  onChange,
  zh,
  onMatchedCount,
}: {
  value: string;
  onChange: (v: string) => void;
  zh: boolean;
  onMatchedCount?: (n: number) => void;
}) {
  const { nodes, loading } = useNodeLabels();
  const [open, setOpen] = useState(false);
  const selectorMap = parseNodeSelectorStr(value);

  const labelMap: Record<string, Set<string>> = {};
  for (const n of nodes) {
    const labels = n.metadata.labels ?? {};
    for (const [k, v] of Object.entries(labels)) {
      if (!k.startsWith("kubernetes.io/") && !k.startsWith("rlark.io/"))
        continue;
      if (!labelMap[k]) labelMap[k] = new Set();
      labelMap[k].add(v);
    }
  }

  const matchedNodes = nodes.filter((n) => {
    const labels = n.metadata.labels ?? {};
    return Object.entries(selectorMap).every(([k, v]) => labels[k] === v);
  });

  useEffect(() => {
    onMatchedCount?.(matchedNodes.length);
  }, [matchedNodes.length]);

  const toggleLabel = (key: string, val: string) => {
    const next = { ...selectorMap };
    if (next[key] === val) {
      delete next[key];
    } else {
      next[key] = val;
    }
    onChange(selectorToStr(next));
  };

  const removeLabel = (key: string) => {
    const next = { ...selectorMap };
    delete next[key];
    onChange(selectorToStr(next));
  };

  const labelKeys = Object.keys(labelMap).sort();

  return (
    <div className="node-selector-picker">
      <div className="selector-chips-area" onClick={() => setOpen(!open)}>
        {Object.keys(selectorMap).length === 0 ? (
          <span className="selector-placeholder">
            {zh ? "点击选择节点标签…" : "Click to select node labels…"}
          </span>
        ) : (
          Object.entries(selectorMap).map(([k, v]) => (
            <span
              key={k}
              className="selector-chip"
              onClick={(e) => {
                e.stopPropagation();
                removeLabel(k);
              }}
            >
              {k}={v}
              <X size={12} />
            </span>
          ))
        )}
        <ChevronDown size={14} className="selector-chevron" />
      </div>
      {open && (
        <div className="selector-dropdown">
          {loading ? (
            <div className="selector-loading">
              {zh ? "加载中…" : "Loading…"}
            </div>
          ) : labelKeys.length === 0 ? (
            <div className="selector-empty">
              {zh ? "暂无节点标签数据" : "No node labels available"}
            </div>
          ) : (
            labelKeys.map((key) => (
              <div key={key} className="selector-group">
                <div className="selector-group-head">
                  <code>{key}</code>
                </div>
                <div className="selector-group-values">
                  {Array.from(labelMap[key])
                    .sort()
                    .map((val) => (
                      <button
                        key={val}
                        className={
                          "selector-value-chip " +
                          (selectorMap[key] === val ? "active" : "")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLabel(key, val);
                        }}
                      >
                        {val}
                      </button>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <input
        className="selector-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          zh
            ? "或手动输入，如 gpu=h800,robot=online"
            : "Or type manually, e.g. gpu=h800,robot=online"
        }
      />
      {!loading &&
        Object.keys(selectorMap).length > 0 &&
        (matchedNodes.length > 0 ? (
          <div className="selector-matched selector-matched-inline">
            <div className="selector-matched-head">
              {zh
                ? `匹配节点 (${matchedNodes.length})`
                : `Matched nodes (${matchedNodes.length})`}
            </div>
            <div className="selector-matched-list">
              {matchedNodes.map((n) => (
                <div key={n.metadata.name} className="selector-matched-node">
                  <span
                    className={
                      "node-dot " + (n.status?.phase ?? "").toLowerCase()
                    }
                  />
                  <code>{n.metadata.name}</code>
                </div>
              ))}
            </div>
          </div>
        ) : (
          labelKeys.length > 0 && (
            <div className="selector-no-match">
              {zh ? "⚠ 没有匹配的节点" : "⚠ No matching nodes"}
            </div>
          )
        ))}
    </div>
  );
}

function CreateJobModal({
  onClose,
  copy: c,
  cloneJob,
  editJob,
}: {
  onClose: () => void;
  copy: Copy;
  cloneJob?: Job | null;
  editJob?: Job | null;
}) {
  const zh = c.nav.overview === "总览";
  const isEdit = !!editJob;
  const sourceJob = editJob ?? cloneJob;
  const [type, setType] = useState<JobType>(sourceJob?.type ?? "RL");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [roles, setRoles] = useState<string[]>(
    sourceJob?.defaultRoles ?? ROLE_TEMPLATES[type],
  );
  const [jobName, setJobName] = useState(
    sourceJob
      ? editJob
        ? sourceJob.name
        : sourceJob.name + "-copy"
      : "robot-policy-training",
  );
  const [headerRole, setHeaderRole] = useState(
    sourceJob?.headerRole ?? roles[0],
  );
  const effectiveHeader = roles.includes(headerRole) ? headerRole : roles[0];

  const [runScript, setRunScript] = useState(
    sourceJob?.command ??
      "python train.py --config /mnt/config/train.yaml --dataset /mnt/dataset --output /mnt/checkpoints",
  );
  const [domain, setDomain] = useState(sourceJob?.domain ?? "");
  const [domains, setDomains] = useState<{ name: string; cidr: string }[]>([]);

  useEffect(() => {
    fetch("/api/v1/rlinf.io/v1alpha1/domains")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) =>
        setDomains(
          (data.items ?? []).map((d: any) => ({
            name: d.metadata?.name ?? "",
            cidr: d.spec?.cidr ?? "",
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const cloneRR: Record<string, RoleResource> = {};
  if (sourceJob) {
    sourceJob.resources.forEach((res) => {
      cloneRR[res.role] = {
        role: res.role,
        cluster: res.cluster,
        nodeSelector: res.nodeSelector,
        replicas: res.replicas,
        cpu: "",
        memory: "",
        gpu: res.gpu,
        image: res.image,
        prepareScript: res.prepareScript ?? "",
        envs: res.env.map((e) => ({ ...e })),
        mounts: res.mounts.map((m) => ({ ...m })),
      };
    });
  }
  const defaultRoleResources: Record<string, RoleResource> = {};
  if (!sourceJob) {
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
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: index === 0 ? "4" : "0",
        image: "registry.rlark.ai/rl/policy-trainer:v0.42",
        prepareScript: "",
        envs: [{ key: "RLARK_TASK_ROLE", value: role }],
        mounts: [{ objectStorage: "/host/dataset", mountPath: "/mnt/dataset" }],
      };
    });
  }
  const [roleResources, setRoleResources] = useState<
    Record<string, RoleResource>
  >(sourceJob ? cloneRR : defaultRoleResources);
  const [activeRoleTab, setActiveRoleTab] = useState<string>(roles[0] ?? "");

  const onTypeChange = (next: JobType) => {
    setType(next);
    const newRoles = ROLE_TEMPLATES[next];
    setRoles(newRoles);
    setHeaderRole(newRoles[0] ?? "");
    setActiveRoleTab(newRoles[0] ?? "");
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
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: index === 0 ? "4" : "0",
        image: "registry.rlark.ai/rl/policy-trainer:v0.42",
        prepareScript: "",
        envs: [{ key: "RLARK_TASK_ROLE", value: role }],
        mounts: [{ objectStorage: "/host/dataset", mountPath: "/mnt/dataset" }],
      };
    });
    setRoleResources(newRR);
  };

  const addRole = () => {
    const name = zh ? "新角色" : "New Role";
    setRoles((prev) => [...prev, name]);
    setRoleResources((prev) => ({
      ...prev,
      [name]: {
        role: name,
        cluster: clusters[0].name,
        nodeSelector: "any=true",
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: "0",
        image: "registry.rlark.ai/rl/policy-trainer:v0.42",
        prepareScript: "",
        envs: [{ key: "RLARK_TASK_ROLE", value: name }],
        mounts: [],
      },
    }));
  };
  const removeRole = (role: string) => {
    if (roles.length === 0) return;
    setRoles((prev) => prev.filter((r) => r !== role));
    setRoleResources((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
    if (headerRole === role) setHeaderRole(roles[0]);
  };
  const renameRole = (oldName: string, newName: string) => {
    newName = newName.trim();
    if (!newName || oldName === newName) return;
    if (roles.includes(newName)) return;
    setRoles((prev) => prev.map((r) => (r === oldName ? newName : r)));
    setRoleResources((prev) => {
      const rr = prev[oldName];
      if (!rr) return prev;
      const next = { ...prev };
      delete next[oldName];
      next[newName] = {
        ...rr,
        role: newName,
        envs: rr.envs.map((e) =>
          e.key === "RLARK_TASK_ROLE" ? { ...e, value: newName } : e,
        ),
      };
      return next;
    });
    if (headerRole === oldName) setHeaderRole(newName);
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
  const updateRREnv = (
    role: string,
    i: number,
    field: "key" | "value",
    v: string,
  ) => {
    setRoleResources((prev) => {
      const rr = prev[role];
      const next = [...rr.envs];
      next[i] = { ...next[i], [field]: v };
      return { ...prev, [role]: { ...rr, envs: next } };
    });
  };
  const addRREnv = (role: string) => {
    setRoleResources((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        envs: [...prev[role].envs, { key: "NEW_ENV", value: "value" }],
      },
    }));
  };
  const removeRREnv = (role: string, i: number) => {
    setRoleResources((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        envs: prev[role].envs.filter((_, idx) => idx !== i),
      },
    }));
  };
  const updateRRMount = (
    role: string,
    i: number,
    field: "objectStorage" | "mountPath",
    v: string,
  ) => {
    setRoleResources((prev) => {
      const rr = prev[role];
      const next = [...rr.mounts];
      next[i] = { ...next[i], [field]: v };
      return { ...prev, [role]: { ...rr, mounts: next } };
    });
  };
  const addRRMount = (role: string) => {
    setRoleResources((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        mounts: [
          ...prev[role].mounts,
          { objectStorage: "/host/path", mountPath: "/mnt/data" },
        ],
      },
    }));
  };
  const removeRRMount = (role: string, i: number) => {
    setRoleResources((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        mounts: prev[role].mounts.filter((_, idx) => idx !== i),
      },
    }));
  };

  const crd = generateJobCRD({
    name: jobName,
    type,
    headerRole: effectiveHeader,
    roles,
    roleResources,
    runScript,
    domain,
  });
  const yaml = toYaml(crd);
  const steps = zh
    ? ["角色和资源", "Worker 配置", "公共配置", "YAML 预览"]
    : ["Roles & Resources", "Worker Config", "Common Config", "YAML Preview"];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const url = isEdit
        ? `/api/v1/rlinf.io/v1alpha1/jobs/${editJob!.name}`
        : "/api/v1/rlinf.io/v1alpha1/jobs";
      const method = isEdit ? "PUT" : "POST";
      const resp = await fetch(url, {
        method,
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
            <span className="eyebrow">
              {isEdit ? (zh ? "编辑任务" : "EDIT JOB") : "NEW JOB"}
            </span>
            <h2>
              {isEdit ? (zh ? "编辑任务" : "Edit Job") : c.jobs.createTitle}
            </h2>
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
                    disabled={isEdit}
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
                  <strong>{zh ? "角色列表" : "Roles"}</strong>
                  <small>
                    {zh
                      ? "点击选择 Header 角色，可编辑角色名称、增删角色。"
                      : "Click to select header role. Roles can be renamed, added, or removed."}
                  </small>
                </div>
                <div className="role-edit-list">
                  {roles.map((role) => (
                    <div
                      key={role}
                      className={`role-edit-row ${effectiveHeader === role ? "active" : ""}`}
                      onClick={() => setHeaderRole(role)}
                    >
                      <Check size={14} />
                      <input
                        value={role}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => renameRole(role, e.target.value)}
                        onBlur={(e) => {
                          if (!e.target.value.trim()) renameRole(role, role);
                        }}
                      />
                      <small>
                        {effectiveHeader === role
                          ? zh
                            ? "Header"
                            : "Header"
                          : zh
                            ? "Worker"
                            : "Worker"}
                      </small>
                      <button
                        className="icon-button danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRole(role);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  style={{ marginTop: 8 }}
                  onClick={addRole}
                >
                  <Plus size={14} />
                  {zh ? "添加角色" : "Add Role"}
                </button>
              </div>
            </>
          )}
          {step === 2 &&
            (roles.length === 0 ? (
              <div className="empty-state-hint">
                {zh
                  ? "请先在「角色和资源」步骤中添加角色。"
                  : 'Please add roles in the "Roles & Resources" step first.'}
              </div>
            ) : (
              <>
                <div className="role-config-tabs">
                  {roles.map((role) => (
                    <button
                      key={role}
                      className={activeRoleTab === role ? "active" : ""}
                      onClick={() => setActiveRoleTab(role)}
                    >
                      {role}
                      {effectiveHeader === role && (
                        <span
                          className="role-chip"
                          style={{ marginLeft: 6, fontSize: 10 }}
                        >
                          Header
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {(() => {
                  const role = activeRoleTab || roles[0];
                  if (!role) return null;
                  const rr = roleResources[role];
                  if (!rr) return null;
                  return (
                    <div className="role-resource-card" key={role}>
                      <div className="form-section-head">
                        <strong>{role}</strong>
                        {effectiveHeader === role && (
                          <span
                            className="role-chip"
                            style={{
                              background: "#f3eefe",
                              color: "var(--blue)",
                            }}
                          >
                            Header
                          </span>
                        )}
                      </div>
                      <div className="form-row">
                        <label>
                          {zh ? "集群" : "Cluster"}
                          <select
                            value={rr.cluster}
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
                      </div>
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>{zh ? "节点选择" : "Node Selector"}</small>
                        </div>
                        <NodeSelectorPicker
                          value={rr.nodeSelector}
                          onChange={(v) => updateRR(role, "nodeSelector", v)}
                          zh={zh}
                          onMatchedCount={(n) => updateRR(role, "replicas", n)}
                        />
                      </div>
                      <div
                        className="resource-input-row"
                        style={{ gridTemplateColumns: "1fr 1fr" }}
                      >
                        <label>
                          {zh
                            ? "副本（自动匹配节点数）"
                            : "Replicas (auto from nodes)"}
                          <input
                            type="number"
                            value={rr.replicas}
                            readOnly
                            style={{ opacity: 0.6 }}
                          />
                        </label>
                        <label>
                          GPU
                          <input
                            value={rr.gpu}
                            onChange={(e) =>
                              updateRR(role, "gpu", e.target.value)
                            }
                            placeholder="4"
                          />
                        </label>
                      </div>
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>{zh ? "镜像" : "Image"}</small>
                        </div>
                        <input
                          value={rr.image}
                          onChange={(e) =>
                            updateRR(role, "image", e.target.value)
                          }
                          placeholder="registry.rlark.ai/rl/policy-trainer:v0.42"
                        />
                      </div>
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>
                            {zh
                              ? "准备脚本 (Ray 启动前)"
                              : "Prepare Script (before Ray starts)"}
                          </small>
                        </div>
                        <textarea
                          className="code-textarea"
                          style={{ minHeight: 60 }}
                          value={rr.prepareScript}
                          onChange={(e) =>
                            updateRR(role, "prepareScript", e.target.value)
                          }
                          placeholder={
                            zh
                              ? "pip install ray[default] or other setup commands"
                              : "pip install ray[default] or other setup commands"
                          }
                        />
                      </div>
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>
                            {zh ? "环境变量" : "Environment Variables"}
                          </small>
                          <button
                            className="secondary-button"
                            onClick={() => addRREnv(role)}
                          >
                            <Plus size={14} />
                            {zh ? "添加" : "Add"}
                          </button>
                        </div>
                        {rr.envs.map((env, index) => (
                          <div className="env-row" key={index}>
                            <input
                              value={env.key}
                              onChange={(e) =>
                                updateRREnv(role, index, "key", e.target.value)
                              }
                            />
                            <input
                              value={env.value}
                              onChange={(e) =>
                                updateRREnv(
                                  role,
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                            />
                            <button
                              className="icon-button danger"
                              onClick={() => removeRREnv(role, index)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>{zh ? "对象存储挂载" : "Volume Mounts"}</small>
                          <button
                            className="secondary-button"
                            onClick={() => addRRMount(role)}
                          >
                            <Plus size={14} />
                            {zh ? "添加" : "Add"}
                          </button>
                        </div>
                        {rr.mounts.map((mount, index) => (
                          <div className="env-row" key={index}>
                            <input
                              value={mount.objectStorage}
                              onChange={(e) =>
                                updateRRMount(
                                  role,
                                  index,
                                  "objectStorage",
                                  e.target.value,
                                )
                              }
                              placeholder="/host/path"
                            />
                            <input
                              value={mount.mountPath}
                              onChange={(e) =>
                                updateRRMount(
                                  role,
                                  index,
                                  "mountPath",
                                  e.target.value,
                                )
                              }
                              placeholder="/mnt/data"
                            />
                            <button
                              className="icon-button danger"
                              onClick={() => removeRRMount(role, index)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            ))}
          {step === 3 && (
            <>
              <div className="form-section">
                <div className="form-section-head">
                  <strong>{zh ? "选择 Head 节点" : "Select Head"}</strong>
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
              <div className="form-section">
                <div className="form-section-head">
                  <small>
                    {zh
                      ? "跨集群网络域 (可选)"
                      : "Cross-cluster Network Domain (optional)"}
                  </small>
                </div>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="">
                    {zh ? "不使用跨集群网络" : "No cross-cluster network"}
                  </option>
                  {domains.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.cidr})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-section">
                <div className="form-section-head">
                  <small>
                    {zh
                      ? "运行脚本 (Ray 集群就绪后, 仅 Head 节点)"
                      : "Run Script (after Ray cluster ready, head only)"}
                  </small>
                </div>
                <textarea
                  className="code-textarea"
                  style={{ minHeight: 80 }}
                  value={runScript}
                  onChange={(e) => setRunScript(e.target.value)}
                  placeholder="python train.py --config /mnt/config/train.yaml"
                />
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
          <div className="step-actions">
            {step > 1 && (
              <button
                className="secondary-button"
                onClick={() => setStep(step - 1)}
              >
                {zh ? "上一步" : "Previous"}
              </button>
            )}
            {step < 4 ? (
              <button
                className="primary-button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && roles.length === 0}
              >
                {zh ? "下一步" : "Next"}
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={submitting || roles.length === 0}
                onClick={handleSubmit}
              >
                {submitting
                  ? zh
                    ? "提交中…"
                    : "Submitting…"
                  : zh
                    ? isEdit
                      ? "保存修改"
                      : "提交任务"
                    : isEdit
                      ? "Save Changes"
                      : "Submit Job"}
              </button>
            )}
          </div>
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

interface AgentCertListItem {
  cluster_id: string;
  created_at: string;
  server_addr: string;
}

function CreateClusterPage({ copy: c, lang }: { copy: Copy; lang: Lang }) {
  const [clusterId, setClusterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignAgentCertResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [certList, setCertList] = useState<AgentCertListItem[]>([]);
  const [certListLoading, setCertListLoading] = useState(true);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] =
    useState<SignAgentCertResponse | null>(null);
  const [expandedCopied, setExpandedCopied] = useState(false);

  const zh = lang === "zh";

  const fetchCertList = async () => {
    setCertListLoading(true);
    try {
      const resp = await fetch("/api/v1/certificates/agent");
      if (resp.ok) {
        setCertList(await resp.json());
      }
    } catch {
    } finally {
      setCertListLoading(false);
    }
  };

  useEffect(() => {
    fetchCertList();
  }, []);

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
      fetchCertList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const buildDeployYaml = (
    r: SignAgentCertResponse,
  ) => `apiVersion: rlark.io/v1alpha1
kind: DeployConfig
plane: data
control-plane-address: ${r.server_addr}

cert:
  ca-cert: |
${r.ca_cert
  .split("\n")
  .map((l: string) => "    " + l)
  .join("\n")}
  agent-cert: |
${r.agent_cert
  .split("\n")
  .map((l: string) => "    " + l)
  .join("\n")}
  agent-key: |
${r.agent_key
  .split("\n")
  .map((l: string) => "    " + l)
  .join("\n")}

kubernetes:
  kubeconfig: /path/to/kubeconfig.yaml
  agent-image: harbor.infini-ai.com/share/rlark-agent:latest
`;

  const deployYaml = result ? buildDeployYaml(result) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(deployYaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExpand = async (cid: string) => {
    if (expandedCluster === cid) {
      setExpandedCluster(null);
      setExpandedResult(null);
      return;
    }
    setExpandedCluster(cid);
    setExpandedResult(null);
    try {
      const resp = await fetch(
        `/api/v1/certificates/agent/${encodeURIComponent(cid)}`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setExpandedResult(await resp.json());
    } catch {}
  };

  const handleExpandedCopy = () => {
    if (!expandedResult) return;
    navigator.clipboard.writeText(buildDeployYaml(expandedResult)).then(() => {
      setExpandedCopied(true);
      setTimeout(() => setExpandedCopied(false), 2000);
    });
  };

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Shield size={13} />
            {zh ? "创建集群" : "Create Cluster"}
          </span>
          <h2>{zh ? "创建集群" : "Create Cluster"}</h2>
          <p>
            {zh
              ? "部署数据面集群前，请自定义集群名称并签发证书。签发成功后，将下方 YAML 内容填入 deploy-conf.yaml 的 cert 字段即可。"
              : "Before deploying a data-plane cluster, customize the cluster name and sign certificates. After signing, paste the YAML content below into the cert field of your deploy-conf.yaml."}
          </p>
        </div>
      </div>

      <div className="panel cert-panel">
        <div className="cert-form">
          <label>
            <span>{zh ? "集群名称" : "Cluster Name"}</span>
            <input
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              placeholder={
                zh
                  ? "输入集群名称，例如 my-cluster-01"
                  : "Enter cluster name, e.g. my-cluster-01"
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
            <div className="cert-yaml-block">
              <div className="cert-yaml-head">
                <strong>
                  {zh
                    ? "部署配置 YAML（可直接复制到 deploy-conf.yaml）"
                    : "Deploy YAML (copy to deploy-conf.yaml)"}
                </strong>
                <button className="secondary-button" onClick={handleCopy}>
                  {copied ? (zh ? "已复制" : "Copied") : zh ? "复制" : "Copy"}
                </button>
              </div>
              <pre>{deployYaml}</pre>
            </div>
          </div>
        )}
      </div>

      {certList.length > 0 && (
        <div className="panel cert-panel" style={{ marginTop: 24 }}>
          <div className="section-heading" style={{ marginBottom: 16 }}>
            <div>
              <span className="eyebrow">
                <Shield size={13} />
                {zh ? "已签发集群" : "Signed Clusters"}
              </span>
              <h3>{zh ? "已签发集群" : "Signed Clusters"}</h3>
            </div>
          </div>
          <div className="cert-list">
            {certList.map((item) => (
              <div key={item.cluster_id} className="cert-list-item">
                <div
                  className={
                    "cert-list-row" +
                    (expandedCluster === item.cluster_id ? " expanded" : "")
                  }
                  onClick={() => handleExpand(item.cluster_id)}
                >
                  <span className="cert-list-dot" />
                  <span className="cert-list-name">{item.cluster_id}</span>
                  <small className="cert-list-date">
                    {new Date(item.created_at).toLocaleString(
                      zh ? "zh-CN" : "en-US",
                    )}
                  </small>
                  <ChevronRight
                    size={16}
                    className={
                      "cert-list-chevron" +
                      (expandedCluster === item.cluster_id ? " rotated" : "")
                    }
                  />
                </div>
                {expandedCluster === item.cluster_id && (
                  <div className="cert-yaml-block" style={{ marginTop: 8 }}>
                    {expandedResult ? (
                      <>
                        <div className="cert-yaml-head">
                          <strong>
                            {zh ? "部署配置 YAML" : "Deploy YAML"}
                          </strong>
                          <button
                            className="secondary-button"
                            onClick={handleExpandedCopy}
                          >
                            {expandedCopied
                              ? zh
                                ? "已复制"
                                : "Copied"
                              : zh
                                ? "复制"
                                : "Copy"}
                          </button>
                        </div>
                        <pre>{buildDeployYaml(expandedResult)}</pre>
                      </>
                    ) : (
                      <p className="muted">{zh ? "加载中..." : "Loading..."}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type NodeCategory = "cloud" | "edge" | "robot" | "unknown";

const NODE_CATEGORY_LABEL = "rlark.io/node-category";

function getNodeCategory(node: CRDNode): NodeCategory {
  const v = node.metadata.labels?.[NODE_CATEGORY_LABEL];
  if (v === "cloud" || v === "edge" || v === "robot") return v;
  return "unknown";
}

const categoryLabels: Record<
  NodeCategory,
  { zh: string; en: string; icon: typeof CloudCog }
> = {
  cloud: { zh: "云算力", en: "Cloud", icon: CloudCog },
  edge: { zh: "端算力", en: "Edge", icon: Server },
  robot: { zh: "端真机", en: "Robot", icon: Bot },
  unknown: { zh: "未知", en: "Unknown", icon: CircleDot },
};

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

function buildMockCRDNodes(): CRDNode[] {
  const categoryByKind: Record<NodeKind, NodeCategory> = {
    CloudCompute: "cloud",
    EmbodiedCompute: "edge",
    Robot: "robot",
  };

  return nodes.map((node) => ({
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

function ClustersOverviewAdminPage({ copy: c }: { copy: Copy }) {
  const zh = c.nav.overview === "总览";
  const [nodes, setNodes] = useState<CRDNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClusterNs, setSelectedClusterNs] = useState<string | null>(
    null,
  );

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

  const clustersList = useMemo(() => {
    const map = new Map<string, CRDNode[]>();
    for (const n of nodes) {
      const ns = n.metadata.namespace ?? "default";
      if (!map.has(ns)) map.set(ns, []);
      map.get(ns)!.push(n);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [nodes]);

  const selectedCluster =
    clustersList.find(([ns]) => ns === selectedClusterNs) ?? clustersList[0];
  const selectedClusterNodes = selectedCluster?.[1] ?? [];

  const onlineClusters = clustersList.filter(([, nsNodes]) =>
    nsNodes.some((n) => n.status?.phase === "Online"),
  ).length;
  const totalNodes = nodes.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<NodeCategory, number> = {
      cloud: 0,
      edge: 0,
      robot: 0,
      unknown: 0,
    };
    for (const n of nodes) {
      counts[getNodeCategory(n)]++;
    }
    return counts;
  }, [nodes]);

  if (loading) {
    return (
      <div className="page-content resource-page cluster-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              <Network size={13} />
              {zh ? "资源纳管" : "Managed resources"}
            </span>
            <h2>{zh ? "集群概览" : "Clusters Overview"}</h2>
            <p>
              {zh
                ? "按命名空间（集群）分组查看所有已纳管节点。"
                : "View all managed nodes grouped by namespace (cluster)."}
            </p>
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
            <span className="eyebrow">
              <Network size={13} />
              {zh ? "资源纳管" : "Managed resources"}
            </span>
            <h2>{zh ? "集群概览" : "Clusters Overview"}</h2>
            <p>
              {zh
                ? "按命名空间（集群）分组查看所有已纳管节点。"
                : "View all managed nodes grouped by namespace (cluster)."}
            </p>
          </div>
          <button className="secondary-button" onClick={fetchNodes}>
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

  return (
    <div className="page-content resource-page cluster-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Network size={13} />
            {zh ? "资源纳管" : "Managed resources"}
          </span>
          <h2>{zh ? "集群概览" : "Clusters Overview"}</h2>
          <p>
            {zh
              ? "按命名空间（集群）分组查看所有已纳管节点。"
              : "View all managed nodes grouped by namespace (cluster)."}
          </p>
        </div>
        <button className="secondary-button" onClick={fetchNodes}>
          <RefreshCw size={16} />
          {c.common.refresh}
        </button>
      </div>
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
          note={`${nodes.filter((n) => n.status?.phase === "Online").length} ${c.status.Online}`}
        />
        <MetricCard
          icon={CloudCog}
          tone="violet"
          label={zh ? "节点分类" : "Categories"}
          value={`${categoryCounts.cloud} / ${categoryCounts.edge} / ${categoryCounts.robot}`}
          note={zh ? "云 / 端 / 真机" : "Cloud / Edge / Robot"}
        />
        <MetricCard
          icon={Activity}
          tone="orange"
          label={zh ? "未知类型" : "Unknown"}
          value={`${categoryCounts.unknown}`}
          note={zh ? "未设置分类标签" : "No category label"}
        />
      </section>
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
            <span>{zh ? "集群列表" : "Cluster List"}</span>
            <h3>{zh ? "集群整体情况" : "Cluster Overview"}</h3>
          </div>
        </div>
        <div className="cluster-card-grid">
          {clustersList.map(([ns, nsNodes]) => {
            const onlineCount = nsNodes.filter(
              (n) => n.status?.phase === "Online",
            ).length;
            const phase: Phase = nsNodes.length === 0 ? "Offline" : "Online";
            return (
              <button
                key={ns}
                className={
                  selectedCluster?.[0] === ns
                    ? "cluster-card selected"
                    : "cluster-card"
                }
                onClick={() => setSelectedClusterNs(ns)}
              >
                <div className="cluster-card-head">
                  <span className="cloud">
                    <CloudCog size={18} />
                  </span>
                  <StatusBadge phase={phase} copy={c} />
                </div>
                <strong>{ns}</strong>
                <small>
                  {nsNodes.length} {zh ? "节点" : "nodes"}
                </small>
                <div className="cluster-loads">
                  <i>
                    <b
                      style={{
                        width: `${nsNodes.length > 0 ? (onlineCount / nsNodes.length) * 100 : 0}%`,
                      }}
                    />
                  </i>
                </div>
                <div className="cluster-card-foot">
                  <span>
                    {onlineCount} / {nsNodes.length} {zh ? "在线" : "online"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NodeCategoryColumn({
  cat,
  catNodes,
  selectedNode,
  onSelectNode,
  ...ctx
}: {
  cat: NodeCategory;
  catNodes: CRDNode[];
  selectedNode: string | null;
  onSelectNode: (name: string) => void;
  zh: boolean;
  c: Copy;
  editingNode: string | null;
  labelDraft: Record<string, string>;
  newLabelKey: string;
  newLabelValue: string;
  saving: boolean;
  onStartEdit: (node: CRDNode) => void;
  onCancelEdit: () => void;
  onSaveLabels: (nodeName: string, namespace: string) => void;
  onAddLabel: () => void;
  onRemoveLabel: (key: string) => void;
  onUpdateLabel: (key: string, value: string) => void;
  onNewLabelKey: (v: string) => void;
  onNewLabelValue: (v: string) => void;
}) {
  const { zh, c } = ctx;
  const info = categoryLabels[cat];
  const Icon = info.icon;
  const onlineCount = catNodes.filter(
    (n) => n.status?.phase === "Online",
  ).length;

  return (
    <div className={"panel node-category-column cat-" + cat}>
      <div className="node-category-header">
        <span className="node-category-icon">
          <Icon size={18} />
        </span>
        <div>
          <strong>{zh ? info.zh : info.en}</strong>
          <small>
            {catNodes.length} {zh ? "节点" : "nodes"} · {onlineCount}{" "}
            {zh ? "在线" : "online"}
          </small>
        </div>
      </div>
      {catNodes.length === 0 ? (
        <div className="node-category-empty">
          <small className="muted">{zh ? "暂无节点" : "No nodes"}</small>
        </div>
      ) : (
        <div className="node-category-list">
          {catNodes.map((node) => {
            const phase = (node.status?.phase ?? "Offline") as Phase;
            const isSelected = selectedNode === node.metadata.name;
            return (
              <div
                className={"node-row" + (isSelected ? " selected" : "")}
                key={node.metadata.name}
                onClick={() => onSelectNode(node.metadata.name)}
              >
                <span className={"node-status-ring " + phase.toLowerCase()} />
                <span className="node-row-name">{node.metadata.name}</span>
                <StatusBadge phase={phase} copy={c} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NodeDetailPanel({
  node,
  ...ctx
}: {
  node: CRDNode;
  zh: boolean;
  c: Copy;
  editingNode: string | null;
  labelDraft: Record<string, string>;
  newLabelKey: string;
  newLabelValue: string;
  saving: boolean;
  onStartEdit: (node: CRDNode) => void;
  onCancelEdit: () => void;
  onSaveLabels: (nodeName: string, namespace: string) => void;
  onAddLabel: () => void;
  onRemoveLabel: (key: string) => void;
  onUpdateLabel: (key: string, value: string) => void;
  onNewLabelKey: (v: string) => void;
  onNewLabelValue: (v: string) => void;
}) {
  const { zh, c } = ctx;
  const phase = (node.status?.phase ?? "Offline") as Phase;
  const isEditing = ctx.editingNode === node.metadata.name;
  const labels = node.metadata.labels ?? {};
  const cat = getNodeCategory(node);
  const catInfo = categoryLabels[cat];
  const CatIcon = catInfo.icon;

  const resKeys = (obj?: Record<string, string>) =>
    obj ? Object.keys(obj) : [];
  const capKeys = resKeys(node.status?.capacity);
  const allocKeys = resKeys(node.status?.allocatable);
  const usedKeys = resKeys(node.status?.used);
  const allResKeys = Array.from(
    new Set([...capKeys, ...allocKeys, ...usedKeys]),
  );

  return (
    <div className="panel node-detail-panel">
      <div className="node-detail-header">
        <span className={"node-status-ring " + phase.toLowerCase()}>
          <CatIcon size={18} />
        </span>
        <div>
          <h3>{node.metadata.name}</h3>
          <small>
            <StatusBadge phase={phase} copy={c} />
            {" · "}
            {node.spec.agentType ?? "—"}
            {" · "}
            {node.status?.nodeInfo?.architecture ?? "—"}
            {" · "}
            {node.status?.nodeInfo?.operatingSystem ?? "—"}
          </small>
        </div>
        <button
          className="icon-button"
          onClick={() => ctx.onStartEdit(node)}
          title={zh ? "编辑标签" : "Edit Labels"}
        >
          <Pencil size={15} />
        </button>
      </div>

      <div className="node-detail-body">
        {node.status?.addresses && node.status.addresses.length > 0 && (
          <div className="node-detail-section">
            <span className="node-detail-label">
              {zh ? "地址" : "Addresses"}
            </span>
            <div className="node-detail-value">
              {node.status.addresses.map((addr, i) => (
                <span key={i} className="label-chip">
                  <code>{addr.type}</code>
                  <i>{addr.address}</i>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="node-detail-section">
          <span className="node-detail-label">
            {zh ? "系统信息" : "System Info"}
          </span>
          <div className="node-detail-grid">
            <div>
              <span className="muted">{zh ? "架构" : "Arch"}</span>
              <strong>{node.status?.nodeInfo?.architecture ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">{zh ? "内核" : "Kernel"}</span>
              <strong>{node.status?.nodeInfo?.kernelVersion ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">{zh ? "系统" : "OS"}</span>
              <strong>{node.status?.nodeInfo?.operatingSystem ?? "—"}</strong>
            </div>
            <div>
              <span className="muted">{zh ? "Agent" : "Agent"}</span>
              <strong>{node.status?.nodeInfo?.agentVersion ?? "—"}</strong>
            </div>
          </div>
        </div>

        {allResKeys.length > 0 && (
          <div className="node-detail-section">
            <span className="node-detail-label">
              {zh ? "资源" : "Resources"}
            </span>
            <table className="node-resource-table">
              <thead>
                <tr>
                  <th>{zh ? "资源" : "Resource"}</th>
                  <th>{zh ? "总量" : "Capacity"}</th>
                  <th>{zh ? "可分配" : "Allocatable"}</th>
                  <th>{zh ? "已用" : "Used"}</th>
                </tr>
              </thead>
              <tbody>
                {allResKeys.map((k) => (
                  <tr key={k}>
                    <td>
                      <code>{k}</code>
                    </td>
                    <td>{node.status?.capacity?.[k] ?? "—"}</td>
                    <td>{node.status?.allocatable?.[k] ?? "—"}</td>
                    <td>{node.status?.used?.[k] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="node-detail-section">
          <span className="node-detail-label">{zh ? "标签" : "Labels"}</span>
          {isEditing ? (
            <div className="label-editor">
              {Object.entries(ctx.labelDraft).map(([k, v]) => (
                <div className="label-edit-row" key={k}>
                  <code>{k}</code>
                  <input
                    value={v}
                    onChange={(e) => ctx.onUpdateLabel(k, e.target.value)}
                    placeholder="value"
                  />
                  <button
                    className="icon-button danger"
                    onClick={() => ctx.onRemoveLabel(k)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="label-add-row">
                <input
                  value={ctx.newLabelKey}
                  onChange={(e) => ctx.onNewLabelKey(e.target.value)}
                  placeholder={
                    zh
                      ? "标签键（请以 rlark.io/ 开头）"
                      : "label key (prefix with rlark.io/)"
                  }
                  onKeyDown={(e) => e.key === "Enter" && ctx.onAddLabel()}
                />
                <input
                  value={ctx.newLabelValue}
                  onChange={(e) => ctx.onNewLabelValue(e.target.value)}
                  placeholder={zh ? "标签值" : "label value"}
                  onKeyDown={(e) => e.key === "Enter" && ctx.onAddLabel()}
                />
                <button className="secondary-button" onClick={ctx.onAddLabel}>
                  <Plus size={14} />
                  {zh ? "添加" : "Add"}
                </button>
              </div>
              <div className="row-actions">
                <button
                  className="primary-button"
                  disabled={ctx.saving}
                  onClick={() =>
                    ctx.onSaveLabels(
                      node.metadata.name,
                      node.metadata.namespace ?? "",
                    )
                  }
                >
                  <Save size={15} />
                  {ctx.saving
                    ? zh
                      ? "保存中..."
                      : "Saving..."
                    : zh
                      ? "保存"
                      : "Save"}
                </button>
                <button className="secondary-button" onClick={ctx.onCancelEdit}>
                  {zh ? "取消" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <div className="label-list">
              {Object.entries(labels).length === 0 ? (
                <small className="muted">{zh ? "无标签" : "No labels"}</small>
              ) : (
                Object.entries(labels).map(([k, v]) => (
                  <span key={k} className="label-chip" title={`${k}=${v}`}>
                    <code>{k}</code>
                    <i>{v}</i>
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

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

  const saveLabels = async (nodeName: string, namespace: string) => {
    setSaving(true);
    setError("");
    try {
      const patch = { metadata: { labels: labelDraft } };
      const resp = await fetch(
        `/api/v1/rlinf.io/v1alpha1/nodes/${nodeName}?namespace=${encodeURIComponent(namespace)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json" },
          body: JSON.stringify(patch),
        },
      );
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

  const nodesByCategory = useMemo(() => {
    const groups: Record<NodeCategory, CRDNode[]> = {
      cloud: [],
      edge: [],
      robot: [],
      unknown: [],
    };
    for (const n of nodes) {
      groups[getNodeCategory(n)].push(n);
    }
    return groups;
  }, [nodes]);

  const activeCats = (["cloud", "edge", "robot", "unknown"] as const).filter(
    (cat) => nodesByCategory[cat].length > 0,
  );

  const sharedProps = {
    zh,
    c,
    editingNode,
    labelDraft,
    newLabelKey,
    newLabelValue,
    saving,
    onStartEdit: startEdit,
    onCancelEdit: cancelEdit,
    onSaveLabels: saveLabels,
    onAddLabel: addLabel,
    onRemoveLabel: removeLabel,
    onUpdateLabel: updateLabel,
    onNewLabelKey: setNewLabelKey,
    onNewLabelValue: setNewLabelValue,
  };

  const selectedNodeObj =
    nodes.find((n) => n.metadata.name === selectedNode) ?? null;

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
              ? "按节点分类管理节点标签，标签用于任务调度和节点选择。"
              : "Manage node labels by category. Labels are used for task scheduling and node selection."}
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

      {loading ? (
        <p className="muted">{zh ? "加载中..." : "Loading..."}</p>
      ) : activeCats.length === 0 ? (
        <p className="muted">{zh ? "暂无节点" : "No nodes found"}</p>
      ) : (
        <div className="node-admin-layout">
          <div
            className="node-category-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${activeCats.length}, 1fr)`,
              gap: 16,
            }}
          >
            {activeCats.map((cat) => (
              <NodeCategoryColumn
                key={cat}
                cat={cat}
                catNodes={nodesByCategory[cat]}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                {...sharedProps}
              />
            ))}
          </div>
          {selectedNodeObj && (
            <NodeDetailPanel node={selectedNodeObj} {...sharedProps} />
          )}
        </div>
      )}
    </div>
  );
}

const adminNavItems: {
  id: string;
  icon: typeof Activity;
  zh: string;
  en: string;
}[] = [
  { id: "clusters-overview", icon: Network, zh: "集群概览", en: "Clusters" },
  { id: "create-cluster", icon: Shield, zh: "创建集群", en: "Create Cluster" },
  { id: "clusters-nodes", icon: Server, zh: "节点管理", en: "Nodes" },
  { id: "jobs", icon: Boxes, zh: "任务管理", en: "Jobs" },
  { id: "api", icon: Braces, zh: "接口参考", en: "API Reference" },
  { id: "config", icon: Settings, zh: "系统配置", en: "Config" },
];

function AdminLogin({
  copy: c,
  lang,
  onLangChange,
  theme,
  onThemeChange,
  onLogin,
}: {
  copy: Copy;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onLogin: () => void;
}) {
  const zh = lang === "zh";
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin@123");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(zh ? "请输入账号和密码" : "Please enter username and password");
      return;
    }
    onLogin();
  };

  return (
    <div className={"admin-login-page theme-" + theme}>
      <div className="admin-login-topbar">
        <div className="admin-brand">
          <img src="/rlark-logo.png" alt="RLark" className="brand-logo" />
          <div className="admin-brand-text">
            <strong>RLark</strong>
            <small>ADMIN</small>
          </div>
        </div>
        <div className="topbar-actions">
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
        </div>
      </div>
      <div className="admin-login-body">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <div className="admin-login-logo">
            <Shield size={32} />
          </div>
          <h2>{zh ? "管理后台登录" : "Admin Login"}</h2>
          <p className="muted">
            {zh ? "请输入管理员账号和密码" : "Enter your admin credentials"}
          </p>
          <div className="admin-login-field">
            <label>{zh ? "账号" : "Username"}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div className="admin-login-field">
            <label>{zh ? "密码" : "Password"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="cert-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button type="submit" className="primary-button admin-login-btn">
            {zh ? "登录" : "Sign In"}
          </button>
          <a className="admin-login-back" href="/">
            <ArrowRight size={13} />
            {zh ? "返回前台" : "Back to Console"}
          </a>
        </form>
      </div>
    </div>
  );
}

function AdminApp() {
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminPage, setAdminPage] = useState(() => {
    const p = window.location.pathname
      .replace(/^\/admin\/?/, "")
      .replace(/\/+$/, "");
    const valid = [
      "clusters-overview",
      "create-cluster",
      "clusters-nodes",
      "jobs",
      "api",
      "config",
    ];
    return valid.includes(p) ? p : "clusters-overview";
  });
  const c = copy[lang];
  const zh = lang === "zh";

  const navigate = (id: string) => {
    setAdminPage(id);
    const path = id === "clusters-overview" ? "/admin" : `/admin/${id}`;
    if (id === "create-cluster")
      window.history.pushState({}, "", "/admin/create-cluster");
    else window.history.pushState({}, "", path);
  };

  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname
        .replace(/^\/admin\/?/, "")
        .replace(/\/+$/, "");
      const valid = [
        "clusters-overview",
        "create-cluster",
        "clusters-nodes",
        "jobs",
        "api",
        "config",
      ];
      setAdminPage(valid.includes(p) ? p : "clusters-overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  if (!loggedIn) {
    return (
      <AdminLogin
        copy={c}
        lang={lang}
        onLangChange={setLang}
        theme={theme}
        onThemeChange={setTheme}
        onLogin={() => setLoggedIn(true)}
      />
    );
  }
  return (
    <div className={"app-shell theme-" + theme + " admin-shell"}>
      <header className="topbar admin-topbar">
        <div className="admin-brand">
          <img src="/rlark-logo.png" alt="RLark" className="brand-logo" />
          <div className="admin-brand-text">
            <strong>RLark</strong>
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
      <aside className="sidebar admin-sidebar">
        <nav>
          {adminNavItems.map(({ id, icon: Icon, zh: zhLabel, en: enLabel }) => (
            <button
              key={id}
              className={adminPage === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{zh ? zhLabel : enLabel}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-area admin-main">
        {adminPage === "clusters-overview" && (
          <ClustersOverviewAdminPage copy={c} />
        )}
        {adminPage === "clusters-nodes" && <AdminPage copy={c} />}
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
        {adminPage === "api" && <ApiPage copy={c} />}
        {adminPage === "create-cluster" && (
          <CreateClusterPage copy={c} lang={lang} />
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
  );
}

function parseRoute() {
  const parts = window.location.pathname
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);
  const valid: Page[] = [
    "overview",
    "clusters",
    "jobs",
    "workflows",
    "domains",
  ];
  const top = (parts[0] as Page) ?? "overview";
  if (!valid.includes(top)) return { page: "overview" as Page, sub: "" };
  const sub = parts.slice(1).join("/");
  return { page: top, sub: decodeURIComponent(sub) };
}

export default function App() {
  const isAdmin = useIsAdminPath();
  const [{ page, sub }, setRoute] = useState(parseRoute);
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createWfOpen, setCreateWfOpen] = useState(false);
  const [cloneJob, setCloneJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [lang, setLang] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const c = copy[lang];
  const pageTitle = useMemo(() => c.nav[page], [c, page]);

  const navigate = (next: Page, name?: string) => {
    const sub = name ? encodeURIComponent(name) : "";
    setRoute({ page: next, sub });
    const path =
      next === "overview" && !sub ? "/" : `/${next}${sub ? "/" + sub : ""}`;
    window.history.pushState({}, "", path);
  };

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              className={page === id && !sub ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{c.nav[id]}</span>
              {id === "jobs" && (
                <em>{jobs.filter((j) => j.phase === "Running").length}</em>
              )}
            </button>
          ))}
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
        {page === "overview" && <Overview navigate={navigate} copy={c} />}{" "}
        {page === "clusters" && <ClustersPage copy={c} />}{" "}
        {page === "jobs" && (
          <JobsPage
            copy={c}
            selectedName={sub}
            onSelect={(name?: string) => navigate("jobs", name)}
            onCreate={() => {
              setCloneJob(null);
              setEditJob(null);
              setCreateOpen(true);
            }}
            onClone={(job) => {
              setCloneJob(job);
              setEditJob(null);
              setCreateOpen(true);
            }}
            onEdit={(job) => {
              setEditJob(job);
              setCloneJob(null);
              setCreateOpen(true);
            }}
          />
        )}{" "}
        {page === "domains" && (
          <DomainsPage
            copy={c}
            selectedName={sub}
            onSelect={(name?: string) => navigate("domains", name)}
          />
        )}
        {page === "workflows" && (
          <WorkflowsPage
            copy={c}
            selectedName={sub}
            onSelect={(name?: string) => navigate("workflows", name)}
            onCreate={() => setCreateWfOpen(true)}
            onJobClick={(name) => navigate("jobs", name)}
          />
        )}
      </main>
      {createOpen && (
        <CreateJobModal
          onClose={() => {
            setCreateOpen(false);
            setCloneJob(null);
            setEditJob(null);
          }}
          copy={c}
          cloneJob={cloneJob}
          editJob={editJob}
        />
      )}
      {createWfOpen && (
        <CreateWorkflowModal onClose={() => setCreateWfOpen(false)} copy={c} />
      )}
    </div>
  );
}
