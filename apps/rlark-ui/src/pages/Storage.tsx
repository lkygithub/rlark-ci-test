import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type StorageClass,
  storageClasses,
  type StorageProvider,
} from "../data";
import { copy, type Copy } from "../i18n";

export function StorageClassesPage({
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

export function StorageClassDetailPage({
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
      <div className="node-detail-body">
        <div className="node-detail-section">
          <span className="node-detail-label">{c.storageClass.basicInfo}</span>
          <div className="node-detail-grid">
            <div>
              <span className="muted">{c.storageClass.provider}</span>
              <strong>{storageClass.provider}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.bucket}</span>
              <strong>{storageClass.bucket}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.region}</span>
              <strong>{storageClass.region || "—"}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.createdAt}</span>
              <strong>{storageClass.createdAt || "—"}</strong>
            </div>
          </div>
        </div>
        <div className="node-detail-section">
          <span className="node-detail-label">{c.storageClass.connection}</span>
          <div className="node-detail-grid">
            <div>
              <span className="muted">{c.storageClass.endpoint}</span>
              <strong>{storageClass.endpoint || "—"}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.pathStyle}</span>
              <strong>{storageClass.pathStyle ? (zh ? "启用" : "Enabled") : (zh ? "禁用" : "Disabled")}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.clusters}</span>
              <strong>{storageClass.clusters.join(", ") || "—"}</strong>
            </div>
            <div>
              <span className="muted">{c.storageClass.description}</span>
              <strong>{storageClass.description || "—"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorageClassCreatePage({
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

export function StorageClassFilesPage({
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
