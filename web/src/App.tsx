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
  Ban,
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
  File,
  FileText,
  Folder,
  FolderOpen,
  Gauge as GaugeIcon,
  HardDrive,
  KeyRound,
  Languages,
  LayoutDashboard,
  ListFilter,
  Moon,
  MoreHorizontal,
  Network,
  Package,
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
  Upload,
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
  type JobType,
  type NodeItem,
  type NodeKind,
  nodes,
  type Phase,
  type PodInfo,
  type StorageClass,
  type StorageClassCreateRequest,
  storageClasses,
  type StorageProvider,
  type Worker as WorkerItem,
} from "./data";
import { useAutoRefresh } from "./hooks";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

type Page =
  | "overview"
  | "clusters-overview"
  | "clusters-nodes"
  | "jobs"
  | "workflows"
  | "domains"
  | "storageClass"
  | "files"
  | "api";
type NavParent = {
  id: Page;
  icon: typeof LayoutDashboard;
  children?: { id: Page; icon: typeof LayoutDashboard }[];
};
const navItems: NavParent[] = [
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
  { id: "domains", icon: CloudCog },
  { id: "storageClass", icon: HardDrive },
];
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
      "clusters-overview": "集群概览",
      "clusters-nodes": "节点管理",
      clustersParent: "集群管理",
      clustersOverview: "集群概览",
      clustersNodes: "节点管理",
      jobs: "任务",
      workflows: "工作流",
      domains: "网络域",
      storageClass: "存储管理",
      files: "文件管理",
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
    storageClass: {
      eyebrow: "对象存储",
      title: "存储管理",
      desc: "管理对象存储配置，用于任务数据持久化和工作负载存储。",
      search: "搜索存储类...",
      createBtn: "创建存储类",
      createTitle: "创建存储类",
      provider: "提供商",
      bucket: "Bucket",
      endpoint: "Endpoint",
      region: "区域",
      clusters: "关联集群",
      description: "描述",
      pathStyle: "Path Style",
      connection: "连接信息",
      basicInfo: "基本信息",
      createdAt: "创建时间",
      createFailed: "创建存储类失败",
      deleteConfirm: "删除存储类",
      noData: "暂无存储类",
      accessKeyId: "Access Key ID",
      accessKeySecret: "Access Key Secret",
      name: "名称",
      namespace: "命名空间",
    },
    files: {
      eyebrow: "文件管理",
      title: "文件管理",
      desc: "管理存储类中的文件和目录",
      search: "搜索文件...",
      uploadBtn: "上传文件",
      uploadTitle: "上传文件",
      download: "下载",
      delete: "删除",
      deleteConfirm: "删除文件",
      noData: "暂无文件",
      fileName: "文件名",
      size: "大小",
      lastModified: "修改时间",
      actions: "操作",
      backToStorage: "返回存储管理",
      currentPath: "当前路径",
      selectFile: "选择文件",
      selectFolder: "选择文件夹",
      uploadSuccess: "上传成功",
      uploadFailed: "上传失败",
      deleteSuccess: "删除成功",
      deleteFailed: "删除失败",
      cluster: "集群",
      storageClass: "存储类",
      rootPath: "根目录",
      breadcrumbFiles: "文件",
    },
  },
  en: {
    nav: {
      overview: "Overview",
      "clusters-overview": "Clusters Overview",
      "clusters-nodes": "Nodes",
      clustersParent: "Clusters",
      clustersOverview: "Clusters Overview",
      clustersNodes: "Nodes",
      jobs: "Jobs",
      workflows: "Workflows",
      domains: "Domains",
      storageClass: "Storage",
      files: "Files",
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
    storageClass: {
      eyebrow: "Object Storage",
      title: "Storage",
      desc: "Manage object storage configurations for task data persistence and workload storage.",
      search: "Search storage classes...",
      createBtn: "Create Storage Class",
      createTitle: "Create Storage Class",
      provider: "Provider",
      bucket: "Bucket",
      endpoint: "Endpoint",
      region: "Region",
      clusters: "Clusters",
      description: "Description",
      pathStyle: "Path Style",
      connection: "Connection",
      basicInfo: "Basic Info",
      createdAt: "Created At",
      createFailed: "Failed to create storage class",
      deleteConfirm: "Delete storage class",
      noData: "No storage classes",
      accessKeyId: "Access Key ID",
      accessKeySecret: "Access Key Secret",
      name: "Name",
      namespace: "Namespace",
    },
    files: {
      eyebrow: "File Management",
      title: "File Management",
      desc: "Manage files and directories in the storage class",
      search: "Search files...",
      uploadBtn: "Upload Files",
      uploadTitle: "Upload Files",
      download: "Download",
      delete: "Delete",
      deleteConfirm: "Delete file",
      noData: "No files",
      fileName: "File Name",
      size: "Size",
      lastModified: "Last Modified",
      actions: "Actions",
      backToStorage: "Back to Storage",
      currentPath: "Current Path",
      selectFile: "Select File",
      selectFolder: "Select Folder",
      uploadSuccess: "Upload successful",
      uploadFailed: "Upload failed",
      deleteSuccess: "Delete successful",
      deleteFailed: "Delete failed",
      cluster: "Cluster",
      storageClass: "Storage Class",
      rootPath: "Root",
      breadcrumbFiles: "Files",
    },
  },
} as const;

type Copy = (typeof copy)[Lang];

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
  createLabel,
}: {
  title: string;
  lang: Lang;
  theme: Theme;
  copy: Copy;
  onLangChange: (lang: Lang) => void;
  onThemeChange: (theme: Theme) => void;
  onCreate: () => void;
  createLabel?: string;
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
          {createLabel ?? c.common.createJob}
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

  return <div className={"metric-card tone-" + tone}>{content}</div>;
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

interface ResourceRow {
  label: string;
  count: number;
  models: string;
  color: string;
}

function ResourceDistribution({
  copy: c,
  rows,
}: {
  copy: Copy;
  rows: ResourceRow[];
}) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div className="resource-split">
      {rows.map((row) => {
        const pct = Math.round((row.count / total) * 100);
        return (
          <div key={row.label} className={"resource-row " + row.color}>
            <div>
              <strong>{row.label}</strong>
              <small>
                {row.count} nodes{row.models ? " · " + row.models : ""}
              </small>
            </div>
            <span>
              <i style={{ width: pct + "%" }} />
            </span>
            <b>{pct}%</b>
          </div>
        );
      })}
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

  const cloudClusters = realClusters.filter((x) => x.type === "Cloud");
  const embodiedClusters = realClusters.filter((x) => x.type === "Embodied");
  const cloudNodeCount = realClusters.reduce((sum, x) => sum + x.cloudNodes, 0);
  const robotCount = realClusters.reduce((sum, x) => sum + x.robots, 0);
  const runningJobs = realJobs.filter((x) => x.phase === "Running").length;
  const gpuModelList = Array.from(
    new Set(realClusters.flatMap((x) => x.gpuModels)),
  );
  const robotModelList = Array.from(
    new Set(realClusters.flatMap((x) => x.robotModels)),
  );
  const gpuModels = gpuModelList.slice(0, 4).join(" / ") || (isZh ? "—" : "—");
  const robotModels =
    robotModelList.slice(0, 4).join(" / ") || (isZh ? "—" : "—");
  const regionCount = new Set(cloudClusters.map((x) => x.region)).size;
  const runningWorkerCount = realJobs.reduce((s, x) => s + x.runningWorkers, 0);

  const categoryCounts = useMemo(() => {
    const counts = { cloud: 0, edge: 0, robot: 0 };
    for (const n of realNodes) {
      const cat = getNodeCategory(n);
      if (cat === "cloud") counts.cloud++;
      else if (cat === "edge") counts.edge++;
      else if (cat === "robot") counts.robot++;
    }
    return counts;
  }, [realNodes]);

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

  const robotNodes = realNodes.filter((n) => getNodeCategory(n) === "robot");

  return (
    <div className="page-content overview-page">
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
          onClick={() => navigate("clusters-overview")}
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
          onClick={() => navigate("clusters-overview")}
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
          onClick={() => navigate("clusters-overview")}
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
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <span>{c.overview.compute}</span>
              <h3>{c.overview.computeDesc}</h3>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("clusters-overview")}
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
              onClick={() => navigate("clusters-overview")}
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

function ClustersPage({
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
  pvcStorageMap?: Record<string, string>;
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
      volumes?: Array<{
        name: string;
        hostPath?: { path: string };
        persistentVolumeClaim?: { claimName: string };
      }>;
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
    const devices = Object.entries(res)
      .filter(([k]) => k.startsWith("rlinf.io/"))
      .map(([name, quantity]) => ({ name, quantity: String(quantity) }));
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
      if (vol?.persistentVolumeClaim) {
        const claimName = vol.persistentVolumeClaim.claimName;
        const storageClass =
          t.kubernetes?.workload?.pvcStorageMap?.[claimName] ?? "";
        return {
          type: "storage" as const,
          objectStorage: storageClass,
          mountPath: vm.mountPath,
          hostPath: "",
        };
      }
      const hostPath = vol?.hostPath?.path ?? "";
      return {
        type: "host" as const,
        objectStorage: "",
        mountPath: vm.mountPath,
        hostPath,
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
      devices,
      image: c?.image ?? "",
      prepareScript: t.prepareScript ?? "",
      env: taskEnv,
      mounts: taskMounts,
      pvcStorageMap: t.kubernetes?.workload?.pvcStorageMap,
    };
  });
  const env =
    container?.env
      ?.filter((e) => e.name !== "RLARK_TASK_ROLE")
      .map((e) => ({
        key: e.name,
        value: e.value,
      })) ?? [];
  const mounts = (container?.volumeMounts ?? []).map((vm) => {
    const vol = tasks[0]?.kubernetes?.workload?.template.spec.volumes?.find(
      (v) => v.name === vm.name,
    );
    if (vol?.persistentVolumeClaim) {
      const claimName = vol.persistentVolumeClaim.claimName;
      const storageClass =
        tasks[0]?.kubernetes?.workload?.pvcStorageMap?.[claimName] ?? "";
      return {
        type: "storage" as const,
        objectStorage: storageClass,
        mountPath: vm.mountPath,
        hostPath: "",
      };
    }
    const hostPath = vol?.hostPath?.path ?? "";
    return {
      type: "host" as const,
      objectStorage: "",
      mountPath: vm.mountPath,
      hostPath,
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
    workers: tasks.length,
    runningWorkers: runningTasks,
    startedAt: crd.metadata.creationTimestamp ?? "—",
    duration: "—",
    progress:
      phase === "Succeeded"
        ? 100
        : Math.round((runningTasks / Math.max(tasks.length, 1)) * 100),
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

  const fetchJobs = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/jobs");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: CRDJob[] = data.items ?? [];
      setRealJobs(items.map(crdToJob));
    } catch {
      setRealJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchJobs, 10000);

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

  const allJobs = realJobs;
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
        onRefresh={() => fetchJobs()}
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
            {filtered.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={8}
                  style={{ textAlign: "center", padding: "32px" }}
                >
                  <small className="muted">{zh ? "暂无任务" : "No jobs"}</small>
                </td>
              </tr>
            )}
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
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [domainIPMap, setDomainIPMap] = useState<Record<string, string>>({});
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

  useAutoRefresh(
    async () => {
      const labelSelector = `rlinf.io/job=${job.name}`;
      const resp = await fetch(
        `/api/v1/rlinf.io/v1alpha1/tasks?labelSelector=${encodeURIComponent(labelSelector)}`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items = data.items ?? [];
      const nodeMap: Record<string, string> = {};
      for (const item of items) {
        const taskName = item.metadata?.name ?? "";
        const observedNodes = item.status?.observedNodes ?? [];
        nodeMap[taskName] = observedNodes.join(", ") || "—";
      }
      setTaskNodes(nodeMap);
    },
    10000,
    [job.name],
  );

  useEffect(() => {
    if (activeTab !== "workers") return;
    const taskNames = job.taskStatuses.map((ts) => {
      const childTaskName = ts.name.toLowerCase().replace(/\s+/g, "-");
      return `${job.name}-${childTaskName}`.toLowerCase().replace(/\s+/g, "-");
    });
    if (taskNames.length === 0) return;
    const labelSelector = `rlark.io/task-name in (${taskNames.join(",")})`;

    const domainsPromise = fetch(`/api/v1/rlinf.io/v1alpha1/domains`).then(
      (resp) =>
        resp.ok
          ? resp.json()
          : Promise.reject(new Error(`HTTP ${resp.status}`)),
    );

    const podsPromise = fetch(
      `/api/v1/rlinf.io/v1alpha1/pods?labelSelector=${encodeURIComponent(labelSelector)}`,
    ).then((resp) =>
      resp.ok ? resp.json() : Promise.reject(new Error(`HTTP ${resp.status}`)),
    );

    Promise.all([podsPromise, domainsPromise])
      .then(([podData, domainData]) => {
        const podItems = podData.items ?? [];
        const podList: PodInfo[] = podItems.map((item: any) => ({
          name: item.metadata?.name ?? "",
          namespace: item.metadata?.namespace ?? "",
          taskName: item.spec?.taskName ?? "",
          taskNamespace: item.spec?.taskNamespace ?? "",
          podName: item.spec?.podName ?? "",
          podNamespace: item.spec?.podNamespace ?? "",
          domain: item.spec?.domain ?? "",
          phase: item.status?.phase ?? "Pending",
          node: item.status?.node ?? "",
          ip: item.status?.ip ?? "",
          message: item.status?.message ?? "",
        }));
        setPods(podList);

        const domainItems = domainData.items ?? [];
        const ipMap: Record<string, string> = {};
        for (const d of domainItems) {
          const allocs = d.status?.ipAllocations ?? [];
          for (const a of allocs) {
            if (a.pod) ipMap[a.pod] = a.ip;
          }
        }
        setDomainIPMap(ipMap);
      })
      .catch(() => {});
  }, [activeTab, job.name, job.taskStatuses]);

  const fetchLogs = async (isInitial = true) => {
    if (activeTab !== "logs") return;
    if (isInitial) setLogsLoading(true);
    setLogsError(null);
    try {
      const resp = await fetch(
        `/api/v1/rlinf.io/v1alpha1/jobs/${encodeURIComponent(job.name)}/logs`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
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
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLogsLoading(false);
    }
  };

  useAutoRefresh(fetchLogs, 5000, [activeTab, job.name]);

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
      : [];
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
              {jobWorkers.map((worker) => {
                const childTaskName = worker.name
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                const jobChildName = `${job.name}-${childTaskName}`
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                const workerPods = pods.filter(
                  (p) => p.taskName === jobChildName,
                );
                return (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    copy={c}
                    pods={workerPods}
                    domainIPMap={domainIPMap}
                  />
                );
              })}
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

function TerminalModal({
  podCRName,
  podName,
  onClose,
}: {
  podCRName: string;
  podName: string;
  onClose: () => void;
}) {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRefInner = useRef<Terminal | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [transferStatus, setTransferStatus] = useState<string>("");

  useEffect(() => {
    if (!termRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      theme: { background: "#1a1a2e" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current);
    fitAddon.fit();
    termRefInner.current = term;

    term.writeln(`Connecting to ${podName} ...`);

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${location.host}/api/v1/rlinf.io/v1alpha1/pods/${encodeURIComponent(podCRName)}/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    let downloading = false;
    let downloadChunks: Uint8Array[] = [];
    let downloadName = "";

    ws.onopen = () => {
      term.writeln("\r\nConnected. Starting shell ...\r\n");
    };
    ws.onmessage = (e) => {
      if (typeof e.data === "string") {
        if (e.data.startsWith("{")) {
          let msg: { type?: string; name?: string; size?: number; success?: boolean; error?: string };
          try { msg = JSON.parse(e.data); } catch { term.write(e.data); return; }
          if (msg.type === "file-download-start") {
            downloading = true;
            downloadChunks = [];
            downloadName = msg.name || "download";
            setTransferStatus(`Downloading ${downloadName} (${msg.size || 0} bytes)...`);
            return;
          }
          if (msg.type === "file-download-end") {
            if (downloading) {
              const blob = new Blob(downloadChunks as BlobPart[], { type: "application/octet-stream" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = downloadName;
              a.click();
              URL.revokeObjectURL(url);
              downloading = false;
              downloadChunks = [];
              setTransferStatus("");
              term.writeln(`\r\n\x1b[32mDownloaded ${downloadName}.\x1b[0m`);
            }
            return;
          }
          if (msg.type === "file-transfer-done") {
            setTransferStatus("");
            if (msg.success) {
              term.writeln("\r\n\x1b[32mFile transfer complete.\x1b[0m");
            } else {
              term.writeln(`\r\n\x1b[31mFile transfer failed: ${msg.error || "unknown"}\x1b[0m`);
            }
            return;
          }
        }
        term.write(e.data);
      } else if (e.data instanceof ArrayBuffer) {
        if (downloading) {
          downloadChunks.push(new Uint8Array(e.data));
        } else {
          term.write(new Uint8Array(e.data));
        }
      }
    };
    ws.onerror = () => {
      term.writeln("\r\n\x1b[31mWebSocket error.\x1b[0m");
    };
    ws.onclose = () => {
      term.writeln("\r\n\x1b[33mConnection closed.\x1b[0m");
    };
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const onResize = () => fitAddon.fit();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ws.close();
      term.dispose();
      termRefInner.current = null;
    };
  }, [podCRName, podName]);

  const handleClose = () => {
    wsRef.current?.close();
    termRefInner.current?.dispose();
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const ws = wsRef.current;
    const destPath = `./${file.name}`;
    setTransferStatus(`Uploading ${file.name} (${file.size} bytes) to ${destPath}...`);

    ws.send(JSON.stringify({ type: "file-upload", path: destPath, size: file.size, mode: 0o644 }));

    const chunkSize = 32 * 1024;
    let offset = 0;
    const reader = new FileReader();

    const readChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          ws.send(reader.result);
          offset += reader.result.byteLength;
          if (offset < file.size) {
            readChunk();
          } else {
            ws.send(JSON.stringify({ type: "file-upload-end" }));
          }
        }
      };
      reader.readAsArrayBuffer(slice);
    };
    readChunk();
    e.target.value = "";
  };

  const [showDownloadInput, setShowDownloadInput] = useState(false);
  const [dlPath, setDlPath] = useState("");

  const handleDownloadSubmit = () => {
    if (!dlPath || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "file-download", path: dlPath }));
    setTransferStatus(`Requesting ${dlPath}...`);
    setShowDownloadInput(false);
    setDlPath("");
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal terminal-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <TerminalSquare size={13} />
              WebTerminal
            </span>
            <h2>{podName}</h2>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button className="icon-button" title="Upload file" onClick={handleUploadClick}>
              <Upload size={16} />
            </button>
            <button className="icon-button" title="Download file" onClick={() => setShowDownloadInput((v) => !v)}>
              <Download size={16} />
            </button>
            <button className="icon-button" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        {showDownloadInput && (
          <div style={{ display: "flex", gap: 8, padding: "8px 16px", background: "#16162a", borderBottom: "1px solid #2a2a4a" }}>
            <input
              type="text"
              value={dlPath}
              onChange={(e) => setDlPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDownloadSubmit()}
              placeholder="/path/to/file/in/pod"
              style={{ flex: 1, background: "#1a1a2e", border: "1px solid #3a3a5a", borderRadius: 4, color: "#e0e0f0", padding: "4px 8px", fontSize: 13 }}
            />
            <button className="secondary-button" onClick={handleDownloadSubmit}>Download</button>
          </div>
        )}
        {transferStatus && (
          <div style={{ padding: "4px 16px", background: "#1a1a2e", color: "#7cc7ff", fontSize: 12, borderBottom: "1px solid #2a2a4a" }}>
            {transferStatus}
          </div>
        )}
        <div className="modal-body">
          <div ref={termRef} className="terminal-container" />
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
        </div>
      </div>
    </div>
  );
}

function WorkerRow({
  worker,
  copy: c,
  pods,
  domainIPMap,
}: {
  worker: WorkerItem;
  copy: Copy;
  pods: PodInfo[];
  domainIPMap: Record<string, string>;
}) {
  const zh = c.nav.overview === "总览";
  const [sshOpen, setSshOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
            {pods.length > 0 && (
              <button
                className="icon-button"
                style={{ padding: 2, marginRight: 4 }}
                onClick={() => setExpanded(!expanded)}
              >
                <ChevronDown
                  size={14}
                  style={{
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s",
                  }}
                />
              </button>
            )}
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
            <button
              className="secondary-button terminal-button"
              disabled={pods.length === 0}
              onClick={() => setTerminalOpen(true)}
            >
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
      {expanded && pods.length > 0 && (
        <tr className="pod-detail-row">
          <td colSpan={7}>
            <div className="pod-subtable">
              <table>
                <thead>
                  <tr>
                    <th>Pod</th>
                    <th>Node</th>
                    <th>Pod IP</th>
                    <th>Domain</th>
                    <th>Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {pods.map((pod) => {
                    const domainIP =
                      domainIPMap[
                        `${pod.namespace}/${pod.podNamespace}/${pod.podName}`
                      ] ?? "";
                    return (
                      <tr key={pod.name}>
                        <td>
                          <code className="inline-code">{pod.podName}</code>
                        </td>
                        <td>{pod.node || "—"}</td>
                        <td>{pod.ip || "—"}</td>
                        <td>
                          {pod.domain ? (
                            <>
                              <Network size={13} style={{ marginRight: 4 }} />
                              {pod.domain}
                              {domainIP && (
                                <code
                                  className="inline-code"
                                  style={{ marginLeft: 6, fontSize: 12 }}
                                >
                                  {domainIP}
                                </code>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <StatusBadge phase={pod.phase as Phase} copy={c} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
      {terminalOpen && pods.length > 0 && (
        <TerminalModal
          podCRName={pods[0].name}
          podName={pods[0].podName}
          onClose={() => setTerminalOpen(false)}
        />
      )}
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

  const fetchDomains = async (isInitial = true) => {
    if (isInitial) setLoading(true);
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

  useAutoRefresh(fetchDomains, 10000);

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
        onRefresh={() => fetchDomains()}
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

  const fetchWorkflows = async (isInitial = true) => {
    if (isInitial) setLoading(true);
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

  useAutoRefresh(fetchWorkflows, 10000);

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
        onRefresh={() => fetchWorkflows()}
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
  clusterDisplayNames: string[] = [],
  jobName?: string,
): Record<string, RoleResource> {
  const rr: Record<string, RoleResource> = {};
  roles.forEach((role, index) => {
    const mounts = [
      {
        type: "host" as const,
        objectStorage: "",
        mountPath: "/mnt/dataset",
        hostPath: "/host/dataset",
      },
    ];
    rr[role] = {
      role,
      cluster: clusterDisplayNames[0] ?? "",
      nodeSelector: "",
      replicas: 0,
      cpu: "",
      memory: "",
      gpu: index === 0 ? "4" : "0",
      devices: [],
      image: "",
      prepareScript: "",
      envs: [{ key: "RLARK_TASK_ROLE", value: role }],
      mounts,
      pvcStorageMap: computePvcStorageMap(role, mounts, jobName),
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
  const {
    clusterDisplayNames,
    nodes: allNodes,
    loading: nodesLoading,
  } = useNodeLabels();
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [activeRoleTab, setActiveRoleTab] = useState<string>("");

  const [availableClusters, setAvailableClusters] = useState<Cluster[]>(
    clusters.slice(0, 4),
  );

  const [storageClasses, setStorageClasses] = useState<
    Array<{ name: string; description: string; bucket: string }>
  >([]);
  const [storageClassLoading, setStorageClassLoading] = useState(false);
  const [storageClassFetched, setStorageClassFetched] = useState(false);
  const [clustersLoaded, setClustersLoaded] = useState(false);
  const lastFetchedStorageClusterRef = useRef<string>("");

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
      roleResources: makeDefaultRoleResources(
        "RL",
        ROLE_TEMPLATES["RL"],
        clusterDisplayNames,
      ),
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
    fetch("/api/v1/clusters")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) => {
        const list: Cluster[] = (data.data ?? []).map((c: any) => ({
          id: c.id ?? c.name ?? "",
          name: c.name ?? c.id ?? "",
          type: c.type === "Embodied" ? "Embodied" : "Cloud",
          region: c.region ?? "",
          location: c.location ?? "",
          phase: c.phase ?? "Online",
          cloudNodes: c.cloudNodes ?? 0,
          embodiedNodes: c.embodiedNodes ?? 0,
          robots: c.robots ?? 0,
          gpuModels: c.gpuModels ?? [],
          robotModels: c.robotModels ?? [],
          cpuUsage: c.cpuUsage ?? 0,
          gpuUsage: c.gpuUsage ?? 0,
          robotUsage: c.robotUsage ?? 0,
          runningJobs: c.runningJobs ?? 0,
          description: c.description ?? "",
        }));
        const realList = list.length > 0 ? list : clusters.slice(0, 4);
        setAvailableClusters(realList);
        setClustersLoaded(list.length > 0);
        if (list.length > 0) {
          setJobs((prevJobs) =>
            prevJobs.map((job) => ({
              ...job,
              roleResources: Object.fromEntries(
                Object.entries(job.roleResources).map(([role, rr]) => {
                  const current = rr.cluster;
                  const match = list.find(
                    (c) => c.id === current || c.name === current,
                  );
                  return [
                    role,
                    { ...rr, cluster: match ? match.id : list[0].id },
                  ];
                }),
              ),
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeJobId && jobs.length > 0) setActiveJobId(jobs[0].id);
  }, [activeJobId, jobs]);

  const fetchStorageClasses = async (cluster?: string) => {
    if (storageClassLoading) return;
    const clusterKey = cluster ?? "";
    if (
      storageClassFetched &&
      lastFetchedStorageClusterRef.current === clusterKey
    )
      return;
    lastFetchedStorageClusterRef.current = clusterKey;
    setStorageClassLoading(true);
    setStorageClassFetched(false);
    try {
      const url = new URL(
        "/api/v1/storage/storageclass",
        window.location.origin,
      );
      if (cluster) {
        url.searchParams.set("clusters", cluster);
      }
      const resp = await fetch(url.pathname + url.search);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const list: Array<{ name: string; description: string; bucket: string }> =
        [];
      const data = result.data ?? {};
      for (const [key, value] of Object.entries(data)) {
        const item = value as any;
        list.push({
          name: item.name ?? key,
          description: item.description ?? "",
          bucket: item.bucket ?? "",
        });
      }
      setStorageClasses(list);
    } catch (e) {
      console.warn("Failed to fetch storage classes:", e);
    } finally {
      setStorageClassLoading(false);
      setStorageClassFetched(true);
    }
  };

  useEffect(() => {
    if (!activeRoleTab || !jobs.length) return;
    const job = jobs.find((j) => j.id === activeJobId);
    if (!job) return;
    const rr = job.roleResources[activeRoleTab];
    if (!rr) return;
    const hasStorageMount = rr.mounts.some((m) => m.type === "storage");
    if (hasStorageMount && rr.cluster) {
      fetchStorageClasses(rr.cluster);
    }
  }, [activeRoleTab, activeJobId, jobs]);

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
      roleResources: makeDefaultRoleResources(
        "RL",
        roles,
        clusterDisplayNames,
        name,
      ),
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
    field: "objectStorage" | "mountPath" | "type" | "hostPath",
    value: string,
  ) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    const mounts = rr.mounts.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    );
    const pvcStorageMap = computePvcStorageMap(role, mounts, activeJob.name);
    updateJob(activeJob.id, {
      roleResources: {
        ...activeJob.roleResources,
        [role]: { ...rr, mounts, pvcStorageMap },
      },
    });
  };

  const addRRMount = (role: string) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    const newMounts = [
      ...rr.mounts,
      {
        type: "storage" as const,
        objectStorage: "",
        mountPath: "",
        hostPath: "",
      },
    ];
    const pvcStorageMap = computePvcStorageMap(role, newMounts, activeJob.name);
    updateJob(activeJob.id, {
      roleResources: {
        ...activeJob.roleResources,
        [role]: { ...rr, mounts: newMounts, pvcStorageMap },
      },
    });
  };

  const removeRRMount = (role: string, index: number) => {
    if (!activeJob) return;
    const rr = activeJob.roleResources[role];
    if (!rr) return;
    const newMounts = rr.mounts.filter((_, i) => i !== index);
    const pvcStorageMap = computePvcStorageMap(role, newMounts, activeJob.name);
    updateJob(activeJob.id, {
      roleResources: {
        ...activeJob.roleResources,
        [role]: { ...rr, mounts: newMounts, pvcStorageMap },
      },
    });
  };

  const onJobTypeChange = (next: JobType) => {
    if (!activeJob) return;
    const newRoles = ROLE_TEMPLATES[next];
    const newRR = makeDefaultRoleResources(
      next,
      newRoles,
      clusterDisplayNames,
      activeJob.name,
    );
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
      cluster: clusterDisplayNames[0] ?? "",
      nodeSelector: "",
      replicas: 0,
      cpu: "",
      memory: "",
      gpu: "0",
      devices: [],
      image: "",
      prepareScript: "",
      envs: [{ key: "RLARK_TASK_ROLE", value: newRole }],
      mounts: [
        {
          type: "host" as const,
          objectStorage: "",
          mountPath: "/mnt/dataset",
          hostPath: "/host/dataset",
        },
      ],
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
                      <RoleNameInput role={role} onRename={renameRole} />
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
                              onChange={(e) => {
                                const newCluster = e.target.value;
                                updateRR(role, "cluster", newCluster);
                                if (
                                  rr.mounts.some((m) => m.type === "storage")
                                ) {
                                  fetchStorageClasses(newCluster);
                                }
                              }}
                            >
                              {availableClusters.map((cl) => (
                                <option key={cl.id} value={cl.id}>
                                  {cl.name}
                                </option>
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
                            cluster={rr.cluster}
                            nodes={allNodes}
                            loading={nodesLoading}
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
                        {(() => {
                          const clusterNodes = allNodes.filter((n) => {
                            const ns = n.metadata.namespace ?? "";
                            return ns === rr.cluster;
                          });
                          const deviceSet = new Set<string>();
                          for (const n of clusterNodes) {
                            const alloc = n.status?.allocatable ?? {};
                            for (const k of Object.keys(alloc)) {
                              if (k.startsWith("rlinf.io/")) deviceSet.add(k);
                            }
                          }
                          const availableDevices = Array.from(deviceSet).sort();
                          return (rr.devices ?? []).length > 0 || availableDevices.length > 0 ? (
                            <div className="form-section" style={{ marginTop: 12 }}>
                              <div className="form-section-head">
                                <small>{zh ? "设备资源" : "Device Resources"}</small>
                                {availableDevices.length > 0 && (
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    style={{ padding: "2px 10px", fontSize: 12 }}
                                    onClick={() => {
                                      const next = [...(rr.devices ?? []), { name: availableDevices[0] ?? "", quantity: "1" }];
                                      updateRR(role, "devices", next);
                                    }}
                                  >
                                    <Plus size={13} />
                                    {zh ? "添加" : "Add"}
                                  </button>
                                )}
                              </div>
                              {(rr.devices ?? []).map((dev, di) => (
                                <div key={di} className="device-row">
                                  <select
                                    value={dev.name}
                                    onChange={(e) => {
                                      const next = [...(rr.devices ?? [])];
                                      next[di] = { ...next[di], name: e.target.value };
                                      updateRR(role, "devices", next);
                                    }}
                                  >
                                    <option value="">{zh ? "选择设备" : "Select device"}</option>
                                    {availableDevices.map((d) => (
                                      <option key={d} value={d}>{d}</option>
                                    ))}
                                    {dev.name && !availableDevices.includes(dev.name) && (
                                      <option value={dev.name}>{dev.name}</option>
                                    )}
                                  </select>
                                  <input
                                    value={dev.quantity}
                                    onChange={(e) => {
                                      const next = [...(rr.devices ?? [])];
                                      next[di] = { ...next[di], quantity: e.target.value };
                                      updateRR(role, "devices", next);
                                    }}
                                    placeholder="1"
                                  />
                                  <button
                                    type="button"
                                    className="icon-button danger"
                                    onClick={() => {
                                      const next = (rr.devices ?? []).filter((_, j) => j !== di);
                                      updateRR(role, "devices", next);
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                        <div className="form-section" style={{ marginTop: 12 }}>
                          <div className="form-section-head">
                            <small>{zh ? "镜像" : "Image"}</small>
                          </div>
                          <input
                            value={rr.image}
                            onChange={(e) =>
                              updateRR(role, "image", e.target.value)
                            }
                            placeholder=""
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
                            <div className="mount-row" key={index}>
                              <select
                                value={mount.type}
                                onChange={(e) => {
                                  updateRRMount(
                                    role,
                                    index,
                                    "type",
                                    e.target.value,
                                  );
                                  if (e.target.value === "storage") {
                                    fetchStorageClasses(rr.cluster);
                                  }
                                }}
                              >
                                <option value="storage">
                                  {zh ? "对象存储" : "Object Storage"}
                                </option>
                                <option value="host">
                                  {zh ? "主机路径" : "Host Path"}
                                </option>
                              </select>
                              {mount.type === "storage" ? (
                                <select
                                  value={mount.objectStorage}
                                  onChange={(e) =>
                                    updateRRMount(
                                      role,
                                      index,
                                      "objectStorage",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">
                                    {storageClassFetched &&
                                    storageClasses.length === 0
                                      ? zh
                                        ? "无可用存储类"
                                        : "No storage classes"
                                      : zh
                                        ? "选择存储类"
                                        : "Select storage class"}
                                  </option>
                                  {storageClasses.map((sc) => (
                                    <option key={sc.name} value={sc.name}>
                                      {sc.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={mount.hostPath}
                                  onChange={(e) =>
                                    updateRRMount(
                                      role,
                                      index,
                                      "hostPath",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="/host/path"
                                />
                              )}
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
                                title={zh ? "删除" : "Delete"}
                              >
                                <Trash2 size={14} />
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
                onClick={() => {
                  if (step === 2 && activeJob) {
                    const roles = activeJob.roles;
                    const currentRole = activeRoleTab || roles[0];
                    const roleIdx = roles.indexOf(currentRole);
                    if (roleIdx >= 0 && roleIdx < roles.length - 1) {
                      setActiveRoleTab(roles[roleIdx + 1]);
                      return;
                    }
                    const jobIdx = jobs.findIndex((j) => j.id === activeJobId);
                    if (jobIdx >= 0 && jobIdx < jobs.length - 1) {
                      const nextJob = jobs[jobIdx + 1];
                      setActiveJobId(nextJob.id);
                      if (nextJob.roles.length > 0) {
                        setActiveRoleTab(nextJob.roles[0]);
                      }
                      return;
                    }
                  }
                  setStep(step + 1);
                }}
                disabled={step === 1 && !workflowName.trim()}
              >
                {step === 2 && activeJob && (() => {
                  const roles = activeJob.roles;
                  const currentRole = activeRoleTab || roles[0];
                  const roleIdx = roles.indexOf(currentRole);
                  const isLastRole = roleIdx < 0 || roleIdx === roles.length - 1;
                  const jobIdx = jobs.findIndex((j) => j.id === activeJobId);
                  const isLastJob = jobIdx < 0 || jobIdx === jobs.length - 1;
                  if (!isLastRole) return zh ? "下一个角色" : "Next Role";
                  if (!isLastJob) return zh ? "下一个任务" : "Next Job";
                  return zh ? "下一步" : "Next";
                })()}
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
  devices: Array<{ name: string; quantity: string }>;
  image: string;
  prepareScript: string;
  envs: Array<{ key: string; value: string }>;
  mounts: Array<{
    type: "host" | "storage";
    objectStorage: string;
    mountPath: string;
    hostPath: string;
  }>;
  pvcStorageMap?: Record<string, string>;
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
  let lastKey = "";
  for (const part of s.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx >= 0) {
      const k = part.slice(0, eqIdx).trim();
      const v = part.slice(eqIdx + 1).trim();
      if (k) {
        result[k] = v;
        lastKey = k;
      }
    } else if (lastKey) {
      result[lastKey] += "," + part.trim();
    }
  }
  return result;
}

function computePvcStorageMap(
  role: string,
  mounts: Array<{
    type: "host" | "storage";
    objectStorage: string;
    mountPath: string;
    hostPath: string;
  }>,
  jobName?: string,
): Record<string, string> | undefined {
  const roleSlug = role.toLowerCase().replace(/\s+/g, "-");
  const storageMounts = mounts.filter((m) => m.type === "storage");
  if (storageMounts.length === 0) return undefined;
  const map: Record<string, string> = {};
  const jobSlug = jobName ? jobName.toLowerCase().replace(/\s+/g, "-") : "";
  storageMounts.forEach((m) => {
    const volName =
      m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol";
    const claimName = jobSlug
      ? `pvc-${jobSlug}-${roleSlug}-${volName}`
      : `pvc-${roleSlug}-${volName}`;
    map[claimName] = m.objectStorage ?? "";
  });
  return map;
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
  const tasks = opts.roles
    .map((role) => {
      const res = opts.roleResources[role];
      if (!res?.image) return null;
      const isHead = role === opts.headerRole;
      const roleEnvs = res?.envs ?? [];
      const roleMounts = res?.mounts ?? [];
      const envVars = [
        ...roleEnvs
          .filter((e) => e.key !== "RLARK_TASK_ROLE")
          .map((e) => ({ name: e.key, value: e.value })),
        { name: "RLARK_TASK_ROLE", value: role },
      ];
      const taskName = role.toLowerCase().replace(/\s+/g, "-");
      const jobSlug = opts.name.toLowerCase().replace(/\s+/g, "-");

      const hostMounts = roleMounts.filter((m) => m.type === "host");
      const storageMounts = roleMounts.filter((m) => m.type === "storage");

      const containerVolumes = hostMounts.map((m) => ({
        name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
        hostPath: { path: m.hostPath || m.objectStorage },
      }));

      const storageVolumes = storageMounts.map((m) => {
        const volName =
          m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol";
        const claimName = `pvc-${jobSlug}-${taskName}-${volName}`;
        return {
          name: volName,
          persistentVolumeClaim: {
            claimName,
          },
        };
      });

      const pvcStorageMap =
        res?.pvcStorageMap ?? computePvcStorageMap(role, roleMounts, opts.name);

      const allVolumeMounts = roleMounts.map((m) => ({
        name: m.mountPath.replace(/\//g, "-").replace(/^-|-$/g, "") || "vol",
        mountPath: m.mountPath,
      }));

      return {
        name: taskName,
        head: isHead,
        agentType: "Kubernetes",
        role: mapTaskRole(role),
        nodeSelector: res ? parseNodeSelector(res.nodeSelector) : {},
        prepareScript: res?.prepareScript ?? "",
        ...(isHead ? { runScript: opts.runScript } : {}),
        kubernetes: {
          workload: {
            kind: "StatefulSet",
            replicas: res ? Number(res.replicas) : 1,
            ...(pvcStorageMap ? { pvcStorageMap } : {}),
            template: {
              spec: {
                containers: [
                  {
                    name: "main",
                    image: res?.image ?? "",
                    env: envVars.length > 0 ? envVars : undefined,
                    volumeMounts:
                      allVolumeMounts.length > 0 ? allVolumeMounts : undefined,
                    resources: res
                      ? {
                          requests: {
                            ...(res.cpu ? { cpu: res.cpu } : {}),
                            ...(res.memory ? { memory: res.memory } : {}),
                            ...(res.gpu && res.gpu !== "0"
                              ? { "nvidia.com/gpu": res.gpu }
                              : {}),
                            ...Object.fromEntries(
                              (res.devices ?? [])
                                .filter(
                                  (d) => d.name && d.quantity && d.quantity !== "0",
                                )
                                .map((d) => [d.name, d.quantity]),
                            ),
                          },
                          limits: {
                            ...(res.gpu && res.gpu !== "0"
                              ? { "nvidia.com/gpu": res.gpu }
                              : {}),
                            ...Object.fromEntries(
                              (res.devices ?? [])
                                .filter(
                                  (d) => d.name && d.quantity && d.quantity !== "0",
                                )
                                .map((d) => [d.name, d.quantity]),
                            ),
                          },
                        }
                      : undefined,
                  },
                ],
                volumes: [
                  ...(containerVolumes.length > 0 ? containerVolumes : []),
                  ...(storageVolumes.length > 0 ? storageVolumes : []),
                ],
              },
            },
          },
        },
      };
    })
    .filter(Boolean);

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
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  status?: {
    phase?: string;
    allocatable?: Record<string, string>;
  };
}

function parseNodeSelectorStr(s: string): Record<string, string> {
  const result: Record<string, string> = {};
  let lastKey = "";
  for (const part of s.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx >= 0) {
      const k = part.slice(0, eqIdx).trim();
      const v = part.slice(eqIdx + 1).trim();
      if (k) {
        result[k] = v;
        lastKey = k;
      }
    } else if (lastKey) {
      result[lastKey] += "," + part.trim();
    }
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
  const clusterNames = Array.from(
    new Set(
      nodes.map((n) => n.metadata.namespace).filter((v): v is string => !!v),
    ),
  );
  const clusterDisplayNames = clusterNames;
  return { nodes, loading, clusterNames, clusterDisplayNames };
}

function NodeSelectorPicker({
  value,
  onChange,
  zh,
  onMatchedCount,
  cluster,
  nodes,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  zh: boolean;
  onMatchedCount?: (n: number) => void;
  cluster?: string;
  nodes: CRDNodeLite[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectorMap = parseNodeSelectorStr(value);

  const clusterNodes = cluster
    ? nodes.filter((n) => n.metadata.namespace === cluster)
    : nodes;

  const labelMap: Record<string, Set<string>> = {};
  for (const n of clusterNodes) {
    const labels = n.metadata.labels ?? {};
    for (const [k, v] of Object.entries(labels)) {
      if (!k.startsWith("kubernetes.io/") && !k.startsWith("rlark.io/"))
        continue;
      if (k === "rlark.io/cluster-id")
        continue;
      if (!labelMap[k]) labelMap[k] = new Set();
      labelMap[k].add(v);
    }
  }

  const matchedNodes = clusterNodes.filter((n) => {
    const labels = n.metadata.labels ?? {};
    return Object.entries(selectorMap).every(([k, v]) => {
      const values = v.split(",");
      return labels[k] !== undefined && values.includes(labels[k]);
    });
  });

  const matchedCount =
    Object.keys(selectorMap).length === 0
      ? clusterNodes.length
      : matchedNodes.length;

  useEffect(() => {
    onMatchedCount?.(matchedCount);
  }, [matchedCount]);

  const toggleLabel = (key: string, val: string) => {
    const next = { ...selectorMap };
    const current = next[key] ? next[key].split(",") : [];
    const idx = current.indexOf(val);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(val);
    }
    if (current.length === 0) {
      delete next[key];
    } else {
      next[key] = current.join(",");
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
                          ((selectorMap[key] ?? "").split(",").includes(val)
                            ? "active"
                            : "")
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

function RoleNameInput({
  role,
  onRename,
}: {
  role: string;
  onRename: (old: string, newName: string) => void;
}) {
  const [draft, setDraft] = useState(role);
  useEffect(() => setDraft(role), [role]);
  return (
    <input
      value={draft}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== role) onRename(role, trimmed);
        else setDraft(role);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
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
  const {
    clusterDisplayNames,
    nodes: allNodes,
    loading: nodesLoading,
  } = useNodeLabels();
  const [availableClusters, setAvailableClusters] = useState<Cluster[]>(
    clusters.slice(0, 4),
  );
  const [storageClasses, setStorageClasses] = useState<
    { name: string; description: string; bucket: string }[]
  >([]);
  const [storageClassLoading, setStorageClassLoading] = useState(false);
  const [storageClassFetched, setStorageClassFetched] = useState(false);
  const [clustersLoaded, setClustersLoaded] = useState(false);
  const lastFetchedStorageClusterRef = useRef<string>("");

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
    fetch("/api/v1/clusters")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((data) => {
        const list: Cluster[] = (data.data ?? []).map((c: any) => ({
          id: c.id ?? c.name ?? "",
          name: c.name ?? c.id ?? "",
          type: c.type === "Embodied" ? "Embodied" : "Cloud",
          region: c.region ?? "",
          location: c.location ?? "",
          phase: c.phase ?? "Online",
          cloudNodes: c.cloudNodes ?? 0,
          embodiedNodes: c.embodiedNodes ?? 0,
          robots: c.robots ?? 0,
          gpuModels: c.gpuModels ?? [],
          robotModels: c.robotModels ?? [],
          cpuUsage: c.cpuUsage ?? 0,
          gpuUsage: c.gpuUsage ?? 0,
          robotUsage: c.robotUsage ?? 0,
          runningJobs: c.runningJobs ?? 0,
          description: c.description ?? "",
        }));
        const realList = list.length > 0 ? list : clusters.slice(0, 4);
        setAvailableClusters(realList);
        setClustersLoaded(list.length > 0);
        if (list.length > 0) {
          setRoleResources((prev) =>
            Object.fromEntries(
              Object.entries(prev).map(([role, rr]) => {
                const current = rr.cluster;
                const match = list.find(
                  (c) => c.id === current || c.name === current,
                );
                return [
                  role,
                  { ...rr, cluster: match ? match.id : list[0].id },
                ];
              }),
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchStorageClasses = async (cluster?: string) => {
    if (storageClassLoading) return;
    const clusterKey = cluster ?? "";
    if (
      storageClassFetched &&
      lastFetchedStorageClusterRef.current === clusterKey
    )
      return;
    lastFetchedStorageClusterRef.current = clusterKey;
    setStorageClassLoading(true);
    setStorageClassFetched(false);
    try {
      const url = new URL(
        "/api/v1/storage/storageclass",
        window.location.origin,
      );
      if (cluster) {
        url.searchParams.set("clusters", cluster);
      }
      const resp = await fetch(url.pathname + url.search);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && data.data) {
        const storageClassList = Object.values(data.data).map((sc: any) => ({
          name: sc.name,
          description: sc.description || "",
          bucket: sc.bucket || "",
        }));
        setStorageClasses(storageClassList);
      }
    } catch (e) {
      console.warn("Failed to fetch storage classes:", e);
    } finally {
      setStorageClassLoading(false);
      setStorageClassFetched(true);
    }
  };

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
        devices: res.devices?.map((d) => ({ ...d })) ?? [],
        image: res.image,
        prepareScript: res.prepareScript ?? "",
        envs: res.env.map((e) => ({ ...e })),
        mounts: res.mounts.map((m) => ({
          type: m.type ?? "host",
          objectStorage: m.objectStorage ?? "",
          mountPath: m.mountPath ?? "",
          hostPath: m.hostPath ?? m.objectStorage ?? "",
        })),
      };
    });
  }
  const defaultRoleResources: Record<string, RoleResource> = {};
  if (!sourceJob) {
    roles.forEach((role, index) => {
      defaultRoleResources[role] = {
        role,
        cluster: clusterDisplayNames[0] ?? "",
        nodeSelector: "",
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: index === 0 ? "4" : "0",
        devices: [],
        image: "",
        prepareScript: "",
        envs: [{ key: "RLARK_TASK_ROLE", value: role }],
        mounts: [
          {
            type: "host" as const,
            objectStorage: "",
            mountPath: "/mnt/dataset",
            hostPath: "/host/dataset",
          },
        ],
      };
    });
  }
  const [roleResources, setRoleResources] = useState<
    Record<string, RoleResource>
  >(sourceJob ? cloneRR : defaultRoleResources);
  const [activeRoleTab, setActiveRoleTab] = useState<string>(roles[0] ?? "");

  useEffect(() => {
    if (clusterDisplayNames.length === 0) return;
    setRoleResources((prev) => {
      let changed = false;
      const next: Record<string, RoleResource> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!v.cluster && clusterDisplayNames[0]) {
          next[k] = { ...v, cluster: clusterDisplayNames[0] };
          changed = true;
        } else {
          next[k] = v;
        }
      }
      return changed ? next : prev;
    });
  }, [clusterDisplayNames]);

  useEffect(() => {
    if (!activeRoleTab) return;
    const rr = roleResources[activeRoleTab];
    if (!rr) return;
    const hasStorageMount = rr.mounts.some((m) => m.type === "storage");
    if (hasStorageMount && rr.cluster) {
      fetchStorageClasses(rr.cluster);
    }
  }, [activeRoleTab, roleResources]);

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
        cluster: clusterDisplayNames[0] ?? "",
        nodeSelector: "",
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: index === 0 ? "4" : "0",
        devices: [],
        image: "",
        prepareScript: "",
        envs: [{ key: "RLARK_TASK_ROLE", value: role }],
        mounts: [
          {
            type: "host" as const,
            objectStorage: "",
            mountPath: "/mnt/dataset",
            hostPath: "/host/dataset",
          },
        ],
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
        cluster: clusterDisplayNames[0] ?? "",
        nodeSelector: "",
        replicas: 0,
        cpu: "",
        memory: "",
        gpu: "0",
        devices: [],
        image: "",
        prepareScript: "",
        envs: [],
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
    v: any,
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
    field: "objectStorage" | "mountPath" | "type" | "hostPath",
    v: string,
  ) => {
    setRoleResources((prev) => {
      const rr = prev[role];
      const next = [...rr.mounts];
      next[i] = { ...next[i], [field]: v };
      const pvcStorageMap = computePvcStorageMap(role, next, jobName);
      return { ...prev, [role]: { ...rr, mounts: next, pvcStorageMap } };
    });
  };
  const addRRMount = (role: string) => {
    setRoleResources((prev) => {
      const rr = prev[role];
      const newMounts = [
        ...rr.mounts,
        {
          type: "storage" as const,
          objectStorage: "",
          mountPath: "",
          hostPath: "",
        },
      ];
      const pvcStorageMap = computePvcStorageMap(role, newMounts, jobName);
      return { ...prev, [role]: { ...rr, mounts: newMounts, pvcStorageMap } };
    });
  };
  const removeRRMount = (role: string, i: number) => {
    setRoleResources((prev) => {
      const rr = prev[role];
      const newMounts = rr.mounts.filter((_, idx) => idx !== i);
      const pvcStorageMap = computePvcStorageMap(role, newMounts, jobName);
      return { ...prev, [role]: { ...rr, mounts: newMounts, pvcStorageMap } };
    });
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
                      <RoleNameInput role={role} onRename={renameRole} />
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
                            onChange={(e) => {
                              const newCluster = e.target.value;
                              updateRR(role, "cluster", newCluster);
                              if (rr.mounts.some((m) => m.type === "storage")) {
                                fetchStorageClasses(newCluster);
                              }
                            }}
                          >
                            {availableClusters.map((cl) => (
                              <option key={cl.id} value={cl.id}>
                                {cl.name}
                              </option>
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
                          cluster={rr.cluster}
                          nodes={allNodes}
                          loading={nodesLoading}
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
                      {(() => {
                        const clusterNodes = allNodes.filter((n) => {
                          const ns = n.metadata.namespace ?? "";
                          return ns === rr.cluster;
                        });
                        const deviceSet = new Set<string>();
                        for (const n of clusterNodes) {
                          const alloc = n.status?.allocatable ?? {};
                          for (const k of Object.keys(alloc)) {
                            if (k.startsWith("rlinf.io/")) deviceSet.add(k);
                          }
                        }
                        const availableDevices = Array.from(deviceSet).sort();
                        return (rr.devices ?? []).length > 0 || availableDevices.length > 0 ? (
                          <div className="form-section" style={{ marginTop: 12 }}>
                            <div className="form-section-head">
                              <small>{zh ? "设备资源" : "Device Resources"}</small>
                              {availableDevices.length > 0 && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  style={{ padding: "2px 10px", fontSize: 12 }}
                                  onClick={() => {
                                    const next = [...(rr.devices ?? []), { name: availableDevices[0] ?? "", quantity: "1" }];
                                    updateRR(role, "devices", next);
                                  }}
                                >
                                  <Plus size={13} />
                                  {zh ? "添加" : "Add"}
                                </button>
                              )}
                            </div>
                            {(rr.devices ?? []).map((dev, di) => (
                              <div key={di} className="device-row">
                                <select
                                  value={dev.name}
                                  onChange={(e) => {
                                    const next = [...(rr.devices ?? [])];
                                    next[di] = { ...next[di], name: e.target.value };
                                    updateRR(role, "devices", next);
                                  }}
                                >
                                  <option value="">{zh ? "选择设备" : "Select device"}</option>
                                  {availableDevices.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                  {dev.name && !availableDevices.includes(dev.name) && (
                                    <option value={dev.name}>{dev.name}</option>
                                  )}
                                </select>
                                <input
                                  value={dev.quantity}
                                  onChange={(e) => {
                                    const next = [...(rr.devices ?? [])];
                                    next[di] = { ...next[di], quantity: e.target.value };
                                    updateRR(role, "devices", next);
                                  }}
                                  placeholder="1"
                                />
                                <button
                                  type="button"
                                  className="icon-button danger"
                                  onClick={() => {
                                    const next = (rr.devices ?? []).filter((_, j) => j !== di);
                                    updateRR(role, "devices", next);
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}
                      <div className="form-section" style={{ marginTop: 12 }}>
                        <div className="form-section-head">
                          <small>{zh ? "镜像" : "Image"}</small>
                        </div>
                        <input
                          value={rr.image}
                          onChange={(e) =>
                            updateRR(role, "image", e.target.value)
                          }
                          placeholder=""
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
                          <div className="mount-row" key={index}>
                            <select
                              value={mount.type}
                              onChange={(e) => {
                                updateRRMount(
                                  role,
                                  index,
                                  "type",
                                  e.target.value,
                                );
                                if (e.target.value === "storage") {
                                  fetchStorageClasses(rr.cluster);
                                }
                              }}
                            >
                              <option value="storage">
                                {zh ? "对象存储" : "Object Storage"}
                              </option>
                              <option value="host">
                                {zh ? "主机路径" : "Host Path"}
                              </option>
                            </select>
                            {mount.type === "storage" ? (
                              <select
                                value={mount.objectStorage}
                                onChange={(e) =>
                                  updateRRMount(
                                    role,
                                    index,
                                    "objectStorage",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">
                                  {storageClassFetched &&
                                  storageClasses.length === 0
                                    ? zh
                                      ? "无可用存储类"
                                      : "No storage classes"
                                    : zh
                                      ? "选择存储类"
                                      : "Select storage class"}
                                </option>
                                {storageClasses.map((sc) => (
                                  <option key={sc.name} value={sc.name}>
                                    {sc.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={mount.hostPath}
                                onChange={(e) =>
                                  updateRRMount(
                                    role,
                                    index,
                                    "hostPath",
                                    e.target.value,
                                  )
                                }
                                placeholder="/host/path"
                              />
                            )}
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
                              title={zh ? "删除" : "Delete"}
                            >
                              <Trash2 size={14} />
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
                onClick={() => {
                  if (step === 2 && roles.length > 1) {
                    const idx = roles.indexOf(activeRoleTab || roles[0]);
                    if (idx >= 0 && idx < roles.length - 1) {
                      setActiveRoleTab(roles[idx + 1]);
                      return;
                    }
                  }
                  setStep(step + 1);
                }}
                disabled={step === 1 && roles.length === 0}
              >
                {step === 2 && roles.length > 1 && (activeRoleTab || roles[0]) !== roles[roles.length - 1]
                  ? (zh ? "下一个角色" : "Next Role")
                  : (zh ? "下一步" : "Next")}
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
  agent-image: rlark-agent:latest
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

function AddonsPage({ copy: c, lang }: { copy: Copy; lang: Lang }) {
  const zh = lang === "zh";
  const [clusters, setClusters] = useState<{ id: string; name: string }[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [installed, setInstalled] = useState<any[]>([]);
  const [clusterFilter, setClusterFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [installAddonName, setInstallAddonName] = useState("");
  const [configInstalled, setConfigInstalled] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/clusters")
      .then((r) => r.json())
      .then((data) => setClusters(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/v1/addons")
      .then((r) => r.json())
      .then((data) => setCatalog(data.data || []))
      .catch(() => {});
  }, []);

  const fetchInstalled = () => {
    const q = clusterFilter ? `?cluster=${clusterFilter}` : "";
    fetch(`/api/v1/installed-addons${q}`)
      .then((r) => r.json())
      .then((data) => setInstalled(data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchInstalled();
    const interval = setInterval(fetchInstalled, 5000);
    return () => clearInterval(interval);
  }, [clusterFilter]);

  useEffect(() => { setPage(1); }, [clusterFilter]);

  const phaseColor = (phase: string) => {
    switch (phase) {
      case "Ready":
        return "#26b985";
      case "Failed":
        return "#ef4444";
      case "Installing":
      case "Upgrading":
        return "#f59e35";
      default:
        return "#7f8998";
    }
  };

  const totalPages = Math.ceil(installed.length / pageSize);
  const pagedInstalled = installed.slice((page - 1) * pageSize, page * pageSize);

  if (installAddonName) {
    const addon = catalog.find((a) => a.name === installAddonName);
    if (addon) {
      return (
        <AddonInstallPage
          addon={addon}
          clusters={clusters}
          lang={lang}
          onBack={() => setInstallAddonName("")}
          onInstalled={() => {
            setInstallAddonName("");
            fetchInstalled();
          }}
        />
      );
    }
  }

  if (configInstalled) {
    const addon = catalog.find((a) => a.name === configInstalled.spec?.addonName);
    if (addon) {
      return (
        <AddonConfigPage
          addon={addon}
          installed={configInstalled}
          lang={lang}
          onBack={() => setConfigInstalled(null)}
          onSaved={() => {
            setConfigInstalled(null);
            fetchInstalled();
          }}
        />
      );
    }
  }

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Package size={13} />
            {zh ? "组件市场" : "Addons"}
          </span>
          <h2>{zh ? "组件市场" : "Addon Catalog"}</h2>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

      {/* Catalog grid */}
      <div className="addon-catalog-grid">
        {catalog.map((addon) => (
          <div key={addon.name} className="addon-card">
            <div className="addon-card-header">
              <Package size={18} />
              <div>
                <strong>{addon.displayName}</strong>
                <span className="addon-card-version">{addon.version}</span>
              </div>
            </div>
            <p className="addon-card-desc">{addon.description}</p>
            <div className="addon-card-footer">
              <span className="addon-card-category">{addon.category}</span>
              <button
                onClick={() => setInstallAddonName(addon.name)}
                style={{
                  padding: "4px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--blue)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {zh ? "安装" : "Install"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Installed addons table */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>
            {zh ? "已安装组件" : "Installed Addons"}
            <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
              ({installed.length})
            </span>
          </h3>
          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--line)",
              fontSize: 13,
            }}
          >
            <option value="">{zh ? "所有集群" : "All clusters"}</option>
            {clusters.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name || cl.id}
              </option>
            ))}
          </select>
        </div>
        {installed.length > 0 ? (
          <>
            <table className="addon-installed-table">
              <thead>
                <tr>
                  <th>{zh ? "组件" : "Addon"}</th>
                  <th>{zh ? "集群" : "Cluster"}</th>
                  <th>{zh ? "版本" : "Version"}</th>
                  <th>{zh ? "状态" : "Phase"}</th>
                  <th>{zh ? "信息" : "Message"}</th>
                  <th>{zh ? "操作" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {pagedInstalled.map((a) => (
                  <tr key={`${a.clusterId}-${a.metadata?.name}`}>
                    <td>{a.spec?.addonName}</td>
                    <td className="muted">{a.clusterId}</td>
                    <td>{a.status?.version || a.spec?.version || "-"}</td>
                    <td>
                      <span style={{ color: phaseColor(a.status?.phase) }}>
                        {a.status?.phase || "Pending"}
                      </span>
                    </td>
                    <td className="muted">{a.status?.message || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setConfigInstalled(a)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--line)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "var(--blue)",
                          }}
                        >
                          {zh ? "配置" : "Config"}
                        </button>
                        <button
                          onClick={() =>
                            fetch(`/api/v1/clusters/${a.clusterId}/addons/${a.metadata?.name}`, {
                              method: "DELETE",
                            })
                              .then((r) => { if (!r.ok) throw new Error("Uninstall failed"); return r.json(); })
                              .then(() => fetchInstalled())
                              .catch((e) => setError(e.message))
                          }
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--line)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "#ef4444",
                          }}
                        >
                          {zh ? "卸载" : "Uninstall"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    background: page <= 1 ? "#f5f5f5" : "#fff",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    fontSize: 12,
                  }}
                >
                  {zh ? "上一页" : "Prev"}
                </button>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    background: page >= totalPages ? "#f5f5f5" : "#fff",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    fontSize: 12,
                  }}
                >
                  {zh ? "下一页" : "Next"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            {zh ? "暂无已安装组件" : "No installed addons"}
          </p>
        )}
      </div>
    </div>
  );
}

function AddonInstallPage({
  addon,
  clusters,
  lang,
  onBack,
  onInstalled,
}: {
  addon: any;
  clusters: { id: string; name: string }[];
  lang: Lang;
  onBack: () => void;
  onInstalled: () => void;
}) {
  const zh = lang === "zh";
  const [installCluster, setInstallCluster] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    (addon.parameters || []).forEach((p: any) => {
      defaults[p.name] = p.default || "";
    });
    return defaults;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInstall = () => {
    if (!installCluster) return;
    setLoading(true);
    setError("");
    fetch(`/api/v1/clusters/${installCluster}/addons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addonName: addon.name,
        version: addon.version,
        values,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Install failed");
        return r.json();
      })
      .then(() => {
        setLoading(false);
        onInstalled();
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          color: "var(--blue)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 0,
          width: "fit-content",
        }}
      >
        ← {zh ? "返回组件市场" : "Back to catalog"}
      </button>

      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Package size={13} />
            {zh ? "安装组件" : "Install Addon"}
          </span>
          <h2>{addon.displayName}</h2>
          <p>{addon.description}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="addon-card-version">{addon.version}</span>
          <span className="addon-card-category">{addon.category}</span>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

      <div className="addon-install-form">
        <div className="form-section">
          <div className="form-section-head">
            <strong>{zh ? "目标集群" : "Target Cluster"}</strong>
            <span style={{ color: "#ef4444" }}>*</span>
          </div>
          <select
            value={installCluster}
            onChange={(e) => setInstallCluster(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          >
            <option value="">{zh ? "选择集群" : "Select cluster"}</option>
            {clusters.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name || cl.id}
              </option>
            ))}
          </select>
        </div>

        {(addon.parameters || []).length > 0 && (
          <div className="form-section">
            <div className="form-section-head">
              <strong>{zh ? "参数配置" : "Parameters"}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {addon.parameters.map((p: any) => (
                <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {p.displayName}
                    {p.required && <span style={{ color: "#ef4444" }}> *</span>}
                  </label>
                  {p.description && (
                    <span className="muted" style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                      {p.description}
                    </span>
                  )}
                  {p.type === "enum" ? (
                    <select
                      value={values[p.name] || ""}
                      onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 14,
                        boxSizing: "border-box",
                        width: "100%",
                      }}
                    >
                      {(p.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : p.type === "text" ? (
                    <textarea
                      value={values[p.name] || ""}
                      onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                      rows={8}
                      placeholder={p.description || ""}
                      className="addon-textarea"
                    />
                  ) : (
                    <input
                      type={p.type === "int" ? "number" : p.type === "bool" ? "checkbox" : "text"}
                      value={p.type === "bool" ? undefined : values[p.name] || ""}
                      checked={p.type === "bool" ? values[p.name] === "true" : undefined}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [p.name]: p.type === "bool" ? (e.target.checked ? "true" : "false") : e.target.value,
                        })
                      }
                      style={{
                        padding: p.type === "bool" ? undefined : "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 14,
                        boxSizing: "border-box",
                        width: p.type === "bool" ? undefined : "100%",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {zh ? "取消" : "Cancel"}
          </button>
          <button
            onClick={handleInstall}
            disabled={loading || !installCluster}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: loading || !installCluster ? "#ccc" : "var(--blue)",
              color: "#fff",
              cursor: loading || !installCluster ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? (zh ? "安装中..." : "Installing...") : zh ? "安装" : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddonConfigPage({
  addon,
  installed,
  lang,
  onBack,
  onSaved,
}: {
  addon: any;
  installed: any;
  lang: Lang;
  onBack: () => void;
  onSaved: () => void;
}) {
  const zh = lang === "zh";
  const clusterId = installed.clusterId;
  const addonName = installed.metadata?.name;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (addon.parameters || []).forEach((p: any) => {
      init[p.name] = installed.spec?.values?.[p.name] ?? p.default ?? "";
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    setLoading(true);
    setError("");
    fetch(`/api/v1/clusters/${clusterId}/addons/${addonName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addonName: addon.name,
        version: addon.version,
        values,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Update failed");
        return r.json();
      })
      .then(() => {
        setLoading(false);
        onSaved();
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          color: "var(--blue)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 0,
          width: "fit-content",
        }}
      >
        ← {zh ? "返回组件市场" : "Back to catalog"}
      </button>

      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Package size={13} />
            {zh ? "配置组件" : "Configure Addon"}
          </span>
          <h2>{addon.displayName}</h2>
          <p>{addon.description}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="addon-card-version">{addon.version}</span>
          <span className="addon-card-category">{addon.category}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {zh ? "集群" : "Cluster"}: <strong>{clusterId}</strong>
          </span>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

      <div className="addon-install-form">
        {(addon.parameters || []).length > 0 ? (
          <div className="form-section">
            <div className="form-section-head">
              <strong>{zh ? "参数配置" : "Parameters"}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {addon.parameters.map((p: any) => (
                <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {p.displayName}
                    {p.required && <span style={{ color: "#ef4444" }}> *</span>}
                  </label>
                  {p.description && (
                    <span className="muted" style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                      {p.description}
                    </span>
                  )}
                  {p.type === "enum" ? (
                    <select
                      value={values[p.name] || ""}
                      onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 14,
                        boxSizing: "border-box",
                        width: "100%",
                      }}
                    >
                      {(p.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : p.type === "text" ? (
                    <textarea
                      value={values[p.name] || ""}
                      onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                      rows={8}
                      placeholder={p.description || ""}
                      className="addon-textarea"
                    />
                  ) : (
                    <input
                      type={p.type === "int" ? "number" : p.type === "bool" ? "checkbox" : "text"}
                      value={p.type === "bool" ? undefined : values[p.name] || ""}
                      checked={p.type === "bool" ? values[p.name] === "true" : undefined}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [p.name]: p.type === "bool" ? (e.target.checked ? "true" : "false") : e.target.value,
                        })
                      }
                      style={{
                        padding: p.type === "bool" ? undefined : "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 14,
                        boxSizing: "border-box",
                        width: p.type === "bool" ? undefined : "100%",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            {zh ? "该组件无可配置参数" : "This addon has no configurable parameters"}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {zh ? "取消" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#ccc" : "var(--blue)",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? (zh ? "保存中..." : "Saving...") : zh ? "保存" : "Save"}
          </button>
        </div>
      </div>
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

  const fetchNodes = async (isInitial = true) => {
    if (isInitial) setLoading(true);
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

  useAutoRefresh(fetchNodes, 10000);

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
        <button className="secondary-button" onClick={() => fetchNodes()}>
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
  cordoning: boolean;
  onStartEdit: (node: CRDNode) => void;
  onToggleCordon: (node: CRDNode) => void;
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
  cordoning: boolean;
  onStartEdit: (node: CRDNode) => void;
  onToggleCordon: (node: CRDNode) => void;
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
        <div className="row-actions" style={{ gap: 4 }}>
          <button
            className={
              node.spec.unschedulable ? "primary-button" : "secondary-button"
            }
            disabled={ctx.cordoning}
            onClick={() => ctx.onToggleCordon(node)}
            title={
              node.spec.unschedulable
                ? zh
                  ? "取消调度限制"
                  : "Uncordon"
                : zh
                  ? "调度限制"
                  : "Cordon"
            }
          >
            <Ban size={14} />
            {node.spec.unschedulable
              ? zh
                ? "Uncordon"
                : "Uncordon"
              : zh
                ? "Cordon"
                : "Cordon"}
          </button>
          <button
            className="icon-button"
            onClick={() => ctx.onStartEdit(node)}
            title={zh ? "编辑标签" : "Edit Labels"}
          >
            <Pencil size={15} />
          </button>
        </div>
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
            <div className="node-detail-scroll">
            <table className="node-resource-table">
              <thead>
                <tr>
                  <th>{zh ? "资源类型" : "Resource Type"}</th>
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
          </div>
        )}

        <div className="node-detail-section">
          <span className="node-detail-label">{zh ? "标签" : "Labels"}</span>
          <div className="node-detail-scroll">
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
    </div>
  );
}

function AdminPage({ copy: c, selectedNode, onNavigate }: { copy: Copy; selectedNode: string; onNavigate: (sub?: string) => void }) {
  const zh = c.nav.overview === "总览";
  const [nodes, setNodes] = useState<CRDNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const [newLabelKey, setNewLabelKey] = useState("");
  const [newLabelValue, setNewLabelValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [cordoning, setCordoning] = useState(false);

  const fetchNodes = async (isInitial = true) => {
    if (isInitial) setLoading(true);
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

  useAutoRefresh(fetchNodes, 10000);

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

  const toggleCordon = async (node: CRDNode) => {
    setCordoning(true);
    setError("");
    try {
      const patch = { spec: { unschedulable: !node.spec.unschedulable } };
      const resp = await fetch(
        `/api/v1/rlinf.io/v1alpha1/nodes/${node.metadata.name}?namespace=${encodeURIComponent(node.metadata.namespace ?? "")}`,
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
          n.metadata.name === node.metadata.name
            ? {
                ...n,
                spec: { ...n.spec, unschedulable: !node.spec.unschedulable },
              }
            : n,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCordoning(false);
    }
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
    cordoning,
    onStartEdit: startEdit,
    onToggleCordon: toggleCordon,
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

  if (selectedNodeObj) {
    return (
      <div className="page-content resource-page node-detail-page">
        <div className="section-heading">
          <div>
            <button
              className="plain-button back-button"
              onClick={() => onNavigate()}
            >
              ← {zh ? "返回节点列表" : "Back"}
            </button>
            <span className="eyebrow">
              <Settings size={13} />
              {zh ? "节点详情" : "Node Detail"}
            </span>
          </div>
        </div>
        <NodeDetailPanel node={selectedNodeObj} {...sharedProps} />
      </div>
    );
  }

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
        <button className="secondary-button" onClick={() => fetchNodes()}>
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
                selectedNode={null}
                onSelectNode={(name) => onNavigate(name)}
                {...sharedProps}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type AdminNavItem = {
  id: string;
  icon: typeof Activity;
  zh: string;
  en: string;
  children?: AdminNavItem[];
};

const adminNavItems: AdminNavItem[] = [
  {
    id: "clusters",
    icon: Network,
    zh: "集群管理",
    en: "Clusters",
    children: [
      {
        id: "clusters-overview",
        icon: Network,
        zh: "集群概览",
        en: "Clusters",
      },
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(zh ? "请输入账号和密码" : "Please enter username and password");
      return;
    }
    setLoading(true);
    setError("");
    fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    })
      .then((resp) =>
        resp.ok
          ? resp.json()
          : Promise.reject(
              new Error(
                resp.status === 401
                  ? zh
                    ? "账号或密码错误"
                    : "Invalid credentials"
                  : `HTTP ${resp.status}`,
              ),
            ),
      )
      .then(() => {
        sessionStorage.setItem("rlark-admin-auth", "1");
        onLogin();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
          <button
            type="submit"
            className="primary-button admin-login-btn"
            disabled={loading}
          >
            {loading
              ? zh
                ? "登录中…"
                : "Signing in…"
              : zh
                ? "登录"
                : "Sign In"}
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
  const [loggedIn, setLoggedIn] = useState(
    () =>
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("rlark-admin-auth") === "1",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [adminPage, setAdminPage] = useState(() => {
    const p = window.location.pathname
      .replace(/^\/admin\/?/, "")
      .replace(/\/+$/, "");
    const parts = p.split("/").filter(Boolean);
    const valid = [
      "clusters-overview",
      "create-cluster",
      "clusters-nodes",
      "addons",
      "jobs",
      "domains",
      "api",
      "config",
      "storageClass",
    ];
    return valid.includes(parts[0]) ? parts[0] : "clusters-overview";
  });
  const [adminSub, setAdminSub] = useState(() => {
    const p = window.location.pathname
      .replace(/^\/admin\/?/, "")
      .replace(/\/+$/, "");
    const parts = p.split("/").filter(Boolean);
    return parts.length > 1 ? decodeURIComponent(parts.slice(1).join("/")) : "";
  });
  const c = copy[lang];
  const zh = lang === "zh";

  const adminPageTitle = useMemo(() => {
    const item = adminNavItems.find((i) => i.id === adminPage);
    return item ? (zh ? item.zh : item.en) : "";
  }, [adminPage, zh]);

  const navigate = (id: string, sub?: string) => {
    setAdminPage(id);
    setAdminSub(sub ?? "");
    let path = id === "clusters-overview" ? "/admin" : `/admin/${id}`;
    if (sub) path += "/" + encodeURIComponent(sub);
    window.history.pushState({}, "", path);
  };

  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname
        .replace(/^\/admin\/?/, "")
        .replace(/\/+$/, "");
      const parts = p.split("/").filter(Boolean);
      const valid = [
        "create-cluster",
        "clusters-nodes",
        "addons",
        "jobs",
        "domains",
        "api",
        "config",
        "storageClass",
      ];
      setAdminPage(valid.includes(parts[0]) ? parts[0] : "clusters-overview");
      setAdminSub(
        parts.length > 1 ? decodeURIComponent(parts.slice(1).join("/")) : "",
      );
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
    <div
      className={
        "app-shell theme-" + theme + (collapsed ? " sidebar-collapsed" : "")
      }
    >
      <aside className="sidebar">
        <Logo />
        <nav>
          <span className="nav-label">{zh ? "管理后台" : "Admin"}</span>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isParent = item.children && item.children.length > 0;
            const isActive = adminPage === item.id;
            const isChildActive = isParent
              ? item.children!.some((ch) => ch.id === adminPage)
              : false;
            const expanded = isParent && (isChildActive || isActive);
            return (
              <div key={item.id} className={isParent ? "nav-parent" : ""}>
                <button
                  className={
                    (isParent
                      ? isChildActive
                        ? "nav-parent-expanded"
                        : isActive
                          ? "active"
                          : ""
                      : isActive
                        ? "active"
                        : "") + (isParent ? " nav-parent-btn" : "")
                  }
                  onClick={() =>
                    isParent
                      ? navigate(item.children![0].id)
                      : navigate(item.id)
                  }
                >
                  <Icon size={18} />
                  <span>{zh ? item.zh : item.en}</span>
                </button>
                {isParent && expanded && (
                  <div className="nav-children">
                    {item.children!.map((ch) => {
                      const ChIcon = ch.icon;
                      return (
                        <button
                          key={ch.id}
                          className={adminPage === ch.id ? "active" : ""}
                          onClick={() => navigate(ch.id)}
                        >
                          <ChIcon size={16} />
                          <span>{zh ? ch.zh : ch.en}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card">
            <span>
              <CloudCog size={16} />
            </span>
            <div>
              <small>{c.common.env}</small>
              <strong>{c.common.production}</strong>
              <b className="env-meta">ADMIN</b>
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
          title={adminPageTitle}
          lang={lang}
          theme={theme}
          copy={c}
          onLangChange={setLang}
          onThemeChange={setTheme}
          onCreate={() => navigate("create-cluster")}
          createLabel={zh ? "创建集群" : "Create Cluster"}
        />
        {adminPage === "clusters-overview" && (
          <ClustersOverviewAdminPage copy={c} />
        )}
        {adminPage === "clusters-nodes" && (
          <AdminPage
            copy={c}
            selectedNode={adminSub}
            onNavigate={(sub?: string) => navigate("clusters-nodes", sub)}
          />
        )}
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
        {adminPage === "domains" && (
          <DomainsPage
            copy={c}
            selectedName={adminSub}
            onSelect={(name?: string) => navigate("domains", name)}
          />
        )}
        {adminPage === "api" && <ApiPage copy={c} />}
        {adminPage === "create-cluster" && (
          <CreateClusterPage copy={c} lang={lang} />
        )}
        {adminPage === "addons" && <AddonsPage copy={c} lang={lang} />}
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
        {adminPage === "storageClass" && (
          <StorageClassesPage
            copy={c}
            selectedName=""
            onSelect={() => {}}
            onCreate={() => navigate("storageClass")}
          />
        )}
      </main>
    </div>
  );
}

function UserLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请输入账号和密码");
      return;
    }
    setLoading(true);
    setError("");
    fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    })
      .then((resp) =>
        resp.ok
          ? resp.json()
          : Promise.reject(
              new Error(
                resp.status === 401 ? "账号或密码错误" : `HTTP ${resp.status}`,
              ),
            ),
      )
      .then(() => {
        sessionStorage.setItem("rlark-user-auth", "1");
        onLogin();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="admin-login-page theme-light">
      <div className="admin-login-body">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <div className="admin-login-logo">
            <Shield size={32} />
          </div>
          <h2>用户登录</h2>
          <p className="muted">请输入账号和密码</p>
          <div className="admin-login-field">
            <label>账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
              autoComplete="username"
            />
          </div>
          <div className="admin-login-field">
            <label>密码</label>
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
          <button
            type="submit"
            className="primary-button admin-login-btn"
            disabled={loading}
          >
            {loading ? "登录中…" : "登录"}
          </button>
          <a className="admin-login-back" href="/admin">
            <ArrowRight size={13} />
            管理后台
          </a>
        </form>
      </div>
    </div>
  );
}

function StorageClassesPage({
  copy: c,
  selectedName,
  onSelect,
  onCreate,
}: {
  copy: Copy;
  selectedName?: string;
  onSelect: (name?: string) => void;
  onCreate: () => void;
}) {
  const zh = c === copy.zh;
  const [realClasses, setRealClasses] = useState<StorageClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => realClasses.find((sc) => sc.name === selectedName),
    [realClasses, selectedName],
  );

  const fetchClasses = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/v1/storage/storageclass");
      if (resp.ok) {
        const data = await resp.json();
        const list: StorageClass[] = Object.values(data.data || {});
        setRealClasses(list);
      } else {
        setRealClasses(storageClasses);
      }
    } catch {
      setRealClasses(storageClasses);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => {
    if (!fetched) fetchClasses();
  }, [fetched]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(zh ? `确定删除存储类 "${name}" 吗?` : `Delete storage class "${name}"?`))
      return;
    try {
      const resp = await fetch(`/api/v1/storage/storageclass/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (resp.ok) fetchClasses();
    } catch (e) {
      console.error("Failed to delete storage class:", e);
    }
  };

  if (selected) {
    return (
      <StorageClassDetailPage
        copy={c}
        storageClass={selected}
        onBack={() => onSelect()}
      />
    );
  }

  const filtered = realClasses.filter(
    (sc) =>
      sc.name.toLowerCase().includes(search.toLowerCase()) ||
      sc.provider.toLowerCase().includes(search.toLowerCase()) ||
      sc.bucket.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page-content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <HardDrive size={13} />
            {c.storageClass.eyebrow}
          </span>
          <h2>{c.storageClass.title}</h2>
          <p>{c.storageClass.desc}</p>
        </div>
        <div className="section-actions">
          <button className="primary-button" onClick={onCreate}>
            <Plus size={17} />
            {c.storageClass.createBtn}
          </button>
        </div>
      </div>
      <div className="page-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={c.storageClass.search}
          />
        </div>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{c.storageClass.name}</th>
              <th>{c.storageClass.bucket}</th>
              <th>{c.storageClass.clusters}</th>
              <th>{c.storageClass.description}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                  {loading ? (zh ? "加载中..." : "Loading...") : c.storageClass.noData}
                </td>
              </tr>
            )}
            {filtered.map((sc) => (
              <tr key={sc.id} className="clickable" onClick={() => onSelect(sc.name)}>
                <td><strong>{sc.name}</strong></td>
                <td>{sc.bucket}</td>
                <td>{sc.clusters.join(", ") || "—"}</td>
                <td>{sc.description || "—"}</td>
                <td>
                  <button
                    className="btn-icon"
                    title={c.files.eyebrow}
                    onClick={(e) => {
                      e.stopPropagation();
                      const cluster = sc.clusters[0] || "";
                      if (!cluster) {
                        alert(zh ? "该存储类未关联集群" : "This storage class has no associated cluster");
                        return;
                      }
                      const url = `/files/${encodeURIComponent(cluster)}/${encodeURIComponent(sc.name)}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <FolderOpen size={14} />
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sc.id, sc.name);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StorageClassDetailPage({
  copy: c,
  storageClass,
  onBack,
}: {
  copy: Copy;
  storageClass: StorageClass;
  onBack: () => void;
}) {
  const zh = c === copy.zh;
  return (
    <div className="page-content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <HardDrive size={13} />
            {c.storageClass.eyebrow}
          </span>
          <h2>{storageClass.name}</h2>
          <p>
            {storageClass.provider} · {storageClass.bucket}
          </p>
        </div>
        <button className="secondary-button" onClick={onBack}>
          <ChevronLeft size={17} />
          {zh ? "返回" : "Back"}
        </button>
      </div>
      <div className="detail-grid">
        <div className="detail-item">
          <span>{c.storageClass.provider}</span>
          <strong>{storageClass.provider}</strong>
        </div>
        <div className="detail-item">
          <span>{c.storageClass.bucket}</span>
          <strong>{storageClass.bucket}</strong>
        </div>
        <div className="detail-item">
          <span>{c.storageClass.region}</span>
          <strong>{storageClass.region || "—"}</strong>
        </div>
        <div className="detail-item">
          <span>{c.storageClass.createdAt}</span>
          <strong>{storageClass.createdAt || "—"}</strong>
        </div>
      </div>
      <div className="detail-section">
        <small>{c.storageClass.connection}</small>
        <div className="detail-grid">
          <div className="detail-item">
            <span>{c.storageClass.endpoint}</span>
            <strong>{storageClass.endpoint || "—"}</strong>
          </div>
          <div className="detail-item">
            <span>{c.storageClass.pathStyle}</span>
            <strong>{storageClass.pathStyle ? (zh ? "启用" : "Enabled") : (zh ? "禁用" : "Disabled")}</strong>
          </div>
          <div className="detail-item">
            <span>{c.storageClass.clusters}</span>
            <strong>{storageClass.clusters.join(", ") || "—"}</strong>
          </div>
          <div className="detail-item">
            <span>{c.storageClass.description}</span>
            <strong>{storageClass.description || "—"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageClassCreatePage({
  copy: c,
  onBack,
}: {
  copy: Copy;
  onBack: () => void;
}) {
  const zh = c === copy.zh;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    namespace: "default",
    provider: "MinIO" as StorageProvider,
    clusters: [] as string[],
    endpoint: "",
    region: "",
    bucket: "",
    access_key_id: "",
    access_key_secret: "",
    path_style: false,
    description: "",
  });

  const providers: StorageProvider[] = [
    "AWS S3",
    "Google Cloud",
    "Azure Blob",
    "MinIO",
    "Aliyun OSS",
    "Tencent COS",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/storage/storageclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const msg = await resp.text();
        setError(c.storageClass.createFailed + ": " + msg);
        return;
      }
      onBack();
    } catch (err) {
      setError(c.storageClass.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <HardDrive size={13} />
            {c.storageClass.eyebrow}
          </span>
          <h2>{c.storageClass.createTitle}</h2>
          <p>{c.storageClass.desc}</p>
        </div>
        <button className="secondary-button" onClick={onBack}>
          <ChevronLeft size={17} />
          {zh ? "返回" : "Back"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <strong>{c.storageClass.basicInfo}</strong>
          <div className="form-grid">
            <label>
              {c.storageClass.name} *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={zh ? "my-storage-class" : "my-storage-class"}
              />
            </label>
            <label>
              {c.storageClass.namespace}
              <input
                value={form.namespace}
                onChange={(e) => setForm({ ...form, namespace: e.target.value })}
                placeholder="default"
              />
            </label>
            <label>
              {c.storageClass.provider} *
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value as StorageProvider })}
              >
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              {c.storageClass.clusters}
              <input
                value={form.clusters.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    clusters: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder={zh ? "cloud-east-a, robot-lab-sh" : "cloud-east-a, robot-lab-sh"}
              />
            </label>
          </div>
        </div>
        <div className="form-section">
          <strong>{c.storageClass.connection}</strong>
          <div className="form-grid">
            <label>
              {c.storageClass.endpoint} *
              <input
                required
                value={form.endpoint}
                onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                placeholder="https://s3.amazonaws.com"
              />
            </label>
            <label>
              {c.storageClass.region} *
              <input
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="us-east-1"
              />
            </label>
            <label>
              {c.storageClass.bucket} *
              <input
                required
                value={form.bucket}
                onChange={(e) => setForm({ ...form, bucket: e.target.value })}
                placeholder="my-bucket"
              />
            </label>
            <label>
              {c.storageClass.pathStyle}
              <input
                type="checkbox"
                checked={form.path_style}
                onChange={(e) => setForm({ ...form, path_style: e.target.checked })}
              />
            </label>
            <label>
              {c.storageClass.accessKeyId} *
              <input
                required
                value={form.access_key_id}
                onChange={(e) => setForm({ ...form, access_key_id: e.target.value })}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </label>
            <label>
              {c.storageClass.accessKeySecret} *
              <input
                required
                type="password"
                value={form.access_key_secret}
                onChange={(e) => setForm({ ...form, access_key_secret: e.target.value })}
                placeholder="••••••••••••"
              />
            </label>
          </div>
        </div>
        <div className="form-section">
          <label>
            {c.storageClass.description} *
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={zh ? "描述存储类的用途和特性" : "Describe the purpose and characteristics of the storage class"}
              rows={3}
            />
          </label>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            {zh ? "取消" : "Cancel"}
          </button>
          <button type="submit" className="primary-button" disabled={submitting}>
            <Plus size={17} />
            {submitting ? (zh ? "创建中..." : "Creating...") : c.storageClass.createBtn}
          </button>
        </div>
      </form>
    </div>
  );
}

function StorageClassFilesPage({
  copy: c,
  sub,
  onBack,
}: {
  copy: Copy;
  sub: string;
  onBack: () => void;
}) {
  const zh = c === copy.zh;
  const parts = sub.split("/");
  const cluster = decodeURIComponent(parts[0] || "");
  const name = decodeURIComponent(parts[1] || "");
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<any[]>([]);
  const [commonPrefixes, setCommonPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const fetchFiles = async () => {
    if (!cluster || !name) {
      setError(zh ? "参数错误：缺少集群或存储类名称" : "Error: missing cluster or storage class name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("prefix", prefix);
      params.set("maxKeys", "100");
      const resp = await fetch(
        `/api/v1/storage/storageclass/${encodeURIComponent(cluster)}/${encodeURIComponent(name)}/list?${params}`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setObjects(data.objects || []);
      setCommonPrefixes(data.common_prefixes || []);
    } catch (e: any) {
      setError(e?.message || (zh ? "加载文件列表失败" : "Failed to load file list"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [cluster, name, prefix]);

  const handleUpload = async (files: FileList) => {
    if (!cluster || !name) return;
    setUploading(true);
    setError("");
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        const key = prefix ? `${prefix}${file.name}` : file.name;
        formData.append("file", file, key);
        setUploadProgress(`${zh ? "上传中" : "Uploading"}: ${file.name} (${i + 1}/${files.length})`);
        const resp = await fetch(
          `/api/v1/storage/storageclass/${encodeURIComponent(cluster)}/${encodeURIComponent(name)}/upload`,
          { method: "POST", body: formData },
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Upload failed: ${resp.status}`);
        }
      }
      setUploadProgress("");
      fetchFiles();
    } catch (e: any) {
      setError(e?.message || (zh ? "上传失败" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const resp = await fetch(
        `/api/v1/storage/storageclass/${encodeURIComponent(cluster)}/${encodeURIComponent(name)}/object/${encodeURIComponent(key)}?expire=3600`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      alert(e?.message || (zh ? "获取下载链接失败" : "Failed to get download URL"));
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(zh ? `确定删除文件 "${key}" 吗?` : `Delete file "${key}"?`)) return;
    try {
      const resp = await fetch(
        `/api/v1/storage/storageclass/${encodeURIComponent(cluster)}/${encodeURIComponent(name)}/object/${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed: ${resp.status}`);
      }
      fetchFiles();
    } catch (e: any) {
      alert(e?.message || (zh ? "删除失败" : "Delete failed"));
    }
  };

  const navigateFolder = (folderPrefix: string) => {
    setPrefix(folderPrefix);
  };

  const goUp = () => {
    if (!prefix) return;
    const lastSlash = prefix.lastIndexOf("/");
    setPrefix(lastSlash >= 0 ? prefix.slice(0, lastSlash + 1) : "");
  };

  const filteredObjects = objects.filter((obj) =>
    obj.key.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPrefixes = commonPrefixes.filter((folder) =>
    folder.toLowerCase().includes(search.toLowerCase()),
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString(zh ? "zh-CN" : "en-US");
  };

  const breadcrumbs = () => {
    if (!prefix) return [<span key="root">{c.files.rootPath}</span>];
    const parts = prefix.split("/").filter(Boolean);
    const crumbs = [<span key="root" onClick={() => setPrefix("")}>{c.files.rootPath}</span>];
    let path = "";
    for (const part of parts) {
      path += part + "/";
      crumbs.push(
        <span key={path} onClick={() => setPrefix(path)}>
          {part}
        </span>,
      );
    }
    return crumbs;
  };

  return (
    <div className="page-content files-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <FolderOpen size={13} />
            {c.files.eyebrow}
          </span>
          <h2>{name || c.files.title}</h2>
          <p>
            {c.files.cluster}: {cluster || "—"} · {c.files.storageClass}: {name || "—"}
          </p>
        </div>
        <div className="section-actions">
          <button className="secondary-button" onClick={onBack}>
            <ChevronLeft size={17} />
            {c.files.backToStorage}
          </button>
        </div>
      </div>

      <div className="files-breadcrumb">
        <span className="breadcrumb-label">{c.files.currentPath}:</span>
        {breadcrumbs()}
      </div>

      <div className="page-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={c.files.search}
          />
        </div>
        <button
          className="primary-button"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) handleUpload(files);
            };
            input.click();
          }}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? uploadProgress || "..." : c.files.uploadBtn}
        </button>
        <button className="secondary-button" onClick={fetchFiles} disabled={loading}>
          <RefreshCw size={16} />
          {c.common.refresh}
        </button>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="table-card files-table">
        <table>
          <thead>
            <tr>
              <th>{c.files.fileName}</th>
              <th>{c.files.size}</th>
              <th>{c.files.lastModified}</th>
              <th>{c.files.actions}</th>
            </tr>
          </thead>
          <tbody>
            {prefix && (
              <tr className="clickable" onClick={goUp}>
                <td colSpan={4} style={{ color: "var(--blue)", fontWeight: 600 }}>
                  <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                  {zh ? "返回上级目录" : "Go up"}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                  {zh ? "加载中..." : "Loading..."}
                </td>
              </tr>
            )}
            {!loading && filteredPrefixes.map((folder) => {
              const folderName = folder.endsWith("/") ? folder.slice(0, -1) : folder;
              const displayName = prefix ? folderName.replace(prefix, "") : folderName;
              return (
                <tr key={folder} className="clickable" onClick={() => navigateFolder(folder)}>
                  <td>
                    <Folder size={16} style={{ display: "inline", marginRight: 8, color: "var(--blue)" }} />
                    <strong>{displayName}</strong>
                  </td>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <button className="btn-icon" title={zh ? "进入目录" : "Enter folder"}>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && filteredObjects.map((obj) => {
              const fileName = obj.key.split("/").pop() || obj.key;
              return (
                <tr key={obj.key}>
                  <td>
                    <FileText size={16} style={{ display: "inline", marginRight: 8, color: "#7c8492" }} />
                    <strong>{fileName}</strong>
                  </td>
                  <td>{formatSize(obj.size || 0)}</td>
                  <td>{formatDate(obj.last_modified)}</td>
                  <td>
                    <button
                      className="btn-icon"
                      title={c.files.download}
                      onClick={() => handleDownload(obj.key)}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      title={c.files.delete}
                      onClick={() => handleDelete(obj.key)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && filteredObjects.length === 0 && filteredPrefixes.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                  {c.files.noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
  const [userLoggedIn, setUserLoggedIn] = useState(
    () =>
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("rlark-user-auth") === "1",
  );
  const c = copy[lang];
  const pageTitle = useMemo(() => c.nav[page], [c, page]);

  const navigate = (next: Page, name?: string) => {
    const sub = name ? encodeURIComponent(name) : "";
    setRoute({ page: next, sub });
    let path: string;
    if (next === "overview" && !sub) {
      path = "/";
    } else if (next === "clusters-overview") {
      path = "/clusters";
    } else if (next === "clusters-nodes") {
      path = sub ? `/clusters/nodes/${sub}` : "/clusters/nodes";
    } else {
      path = `/${next}${sub ? "/" + sub : ""}`;
    }
    window.history.pushState({}, "", path);
  };

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (isAdmin) return <AdminApp />;
  if (!userLoggedIn) return <UserLogin onLogin={() => setUserLoggedIn(true)} />;

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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isParent = item.children && item.children.length > 0;
            const isActive = page === item.id && !sub;
            const isChildActive = isParent
              ? item.children!.some((ch) => ch.id === page)
              : false;
            const expanded = isParent && (isChildActive || isActive);

            return (
              <div key={item.id} className={isParent ? "nav-parent" : ""}>
                <button
                  className={
                    (isParent
                      ? isChildActive
                        ? "nav-parent-expanded"
                        : isActive
                          ? "active"
                          : ""
                      : isActive
                        ? "active"
                        : "") + (isParent ? " nav-parent-btn" : "")
                  }
                  onClick={() =>
                    isParent
                      ? navigate(item.children![0].id)
                      : navigate(item.id)
                  }
                >
                  <Icon size={18} />
                  <span>
                    {isParent ? c.nav.clustersParent : c.nav[item.id]}
                  </span>
                </button>
                {isParent && expanded && (
                  <div className="nav-children">
                    {item.children!.map((ch) => {
                      const ChIcon = ch.icon;
                      return (
                        <button
                          key={ch.id}
                          className={page === ch.id ? "active" : ""}
                          onClick={() => navigate(ch.id)}
                        >
                          <ChIcon size={16} />
                          <span>{c.nav[ch.id]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
        {page === "clusters-overview" && (
          <ClustersPage copy={c} initialView="clusters" />
        )}{" "}
        {page === "clusters-nodes" && (
          <ClustersPage
            copy={c}
            initialView="nodes"
            selectedNodeName={sub}
            onNavigate={(name?: string) => navigate("clusters-nodes", name)}
          />
        )}{" "}
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
        {page === "storageClass" && (
          <StorageClassesPage
            copy={c}
            selectedName={sub}
            onSelect={(name?: string) => navigate("storageClass", name)}
            onCreate={() => navigate("storageClass", "create")}
          />
        )}
        {page === "storageClass" && sub === "create" && (
          <StorageClassCreatePage
            copy={c}
            onBack={() => navigate("storageClass")}
          />
        )}
        {page === "files" && (
          <StorageClassFilesPage
            copy={c}
            sub={sub}
            onBack={() => navigate("storageClass")}
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
