import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  Network,
  Pencil,
  Plus,
  TerminalSquare,
  Trash2,
  Video,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  type Job,
  type Phase,
  type PodInfo,
  type Worker as WorkerItem,
} from "../data";
import type { Copy as CopyType, Lang } from "../i18n";
import type { CRDJob } from "../types";
import { useAutoRefresh } from "../hooks";
import { crdToJob } from "../utils/crd";
import { PageToolbar, Pagination, StatusBadge } from "../components/shared";
import { TerminalModal } from "../components/terminal";

export function JobsPage({
  copy: c,
  selectedName,
  onSelect,
  onCreate,
  onClone,
  onEdit,
}: {
  copy: CopyType;
  selectedName: string;
  onSelect: (name?: string) => void;
  onCreate: () => void;
  onClone: (job: Job) => void;
  onEdit: (job: Job) => void;
}) {
  const zh = c.nav.overview === "总览";
  const [query, setQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<"All" | Phase>("All");
  const [realJobs, setRealJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchJobs = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/rlinf.io/v1alpha1/jobs");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: CRDJob[] = data.items ?? [];
      setRealJobs(items.map(crdToJob));
    } catch (e) {
      setRealJobs([]);
      setError(e instanceof Error ? e.message : String(e));
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
  const filtered = allJobs.filter((j) => {
    const queryHit = `${j.name} ${j.type} ${j.target}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const phaseHit = phaseFilter === "All" || j.phase === phaseFilter;
    return queryHit && phaseHit;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedJobs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [query, phaseFilter, pageSize]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
        filterValue={phaseFilter}
        onFilterChange={(value) => setPhaseFilter(value as "All" | Phase)}
        filterOptions={[
          { value: "All", label: zh ? "全部状态" : "All statuses" },
          { value: "Running", label: c.status.Running },
          { value: "Pending", label: c.status.Pending },
          { value: "Succeeded", label: c.status.Succeeded },
          { value: "Failed", label: c.status.Failed },
        ]}
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
                <td colSpan={8}>
                  <div className="table-empty-state">
                    <span>
                      <Workflow size={22} />
                    </span>
                    <strong>{zh ? "还没有任务" : "No jobs yet"}</strong>
                    <small>
                      {zh
                        ? "创建强化学习、数据采集、评测或自定义任务。"
                        : "Create an RL, data collection, evaluation, or custom job."}
                    </small>
                    <button className="secondary-button" onClick={onCreate}>
                      <Plus size={15} />
                      {c.common.createJob}
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {pagedJobs.map((job) => (
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
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        zh={zh}
      />
    </div>
  );
}

export function JobDetailPage({
  job,
  copy: c,
  onBack,
}: {
  job: Job;
  copy: CopyType;
  onBack: () => void;
}) {
  const zh = c.nav.overview === "总览";
  const [activeTab, setActiveTab] = useState<"config" | "workers" | "logs">(
    "config",
  );
  const [taskNodes, setTaskNodes] = useState<Record<string, string>>({});
  const [tensorBoardProxy, setTensorBoardProxy] = useState<string>("");
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
      let tbProxy = "";
      for (const item of items) {
        const taskName = item.metadata?.name ?? "";
        const observedNodes = item.status?.observedNodes ?? [];
        nodeMap[taskName] = observedNodes.join(", ") || "—";
        if (item.status?.tensorBoardProxy) {
          tbProxy = item.status.tensorBoardProxy;
        }
      }
      setTaskNodes(nodeMap);
      setTensorBoardProxy(tbProxy);
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
          <JobConfigSummary job={job} tensorBoardProxy={tensorBoardProxy} />
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

export function JobConfigSummary({
  job,
  tensorBoardProxy,
}: {
  job: Job;
  tensorBoardProxy?: string;
}) {
  const zh = navigator.language.startsWith("zh");
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
      {tensorBoardProxy && (
        <div>
          <span>Tensorboard</span>
          <a
            href={tensorBoardProxy}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ExternalLink size={15} />
            {zh ? "打开 TensorBoard" : "Open TensorBoard"}
          </a>
        </div>
      )}
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

export function WorkerRow({
  worker,
  copy: c,
  pods,
  domainIPMap,
}: {
  worker: WorkerItem;
  copy: CopyType;
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
