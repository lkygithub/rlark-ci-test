import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Terminal,
  KeyRound,
  RefreshCw,
  Copy as CopyIcon,
  Check,
  Info,
} from "lucide-react";
import type { Copy } from "../i18n";

interface SSHKeyItem {
  index: number;
  user: string;
  public_key: string;
  added_at: string;
}

export function SSHKeysPage({ copy: c }: { copy: Copy }) {
  const zh = c.nav.overview === "总览";
  const [keys, setKeys] = useState<SSHKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState(
    () => sessionStorage.getItem("rlark-user-name") || "user",
  );
  const [newKey, setNewKey] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const fetchKeys = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/ssh-user-keys");
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setKeys(data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAdd = async () => {
    if (!newUser.trim() || !newKey.trim()) return;
    setAdding(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/ssh-user-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: newUser.trim(),
          public_key: newKey.trim(),
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setNewKey("");
      setShowAdd(false);
      fetchKeys();
    } catch (e) {
      setError(String(e));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (user: string, index: number) => {
    if (
      !confirm(
        zh
          ? `确认删除 ${user} 的第 ${index + 1} 个公钥？`
          : `Delete key ${index + 1} for ${user}?`,
      )
    )
      return;
    try {
      const resp = await fetch(
        `/api/v1/ssh-user-keys/${index}?user=${encodeURIComponent(user)}`,
        { method: "DELETE" },
      );
      if (!resp.ok) throw new Error(await resp.text());
      fetchKeys();
    } catch (e) {
      setError(String(e));
    }
  };

  const sshCommand = `ssh -J ${newUser}@<server>:2222 root@<pod-name>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sshCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-content resource-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Terminal size={13} />
            {zh ? "SSH 公钥" : "SSH Keys"}
          </span>
          <h2>{zh ? "SSH 公钥管理" : "SSH Key Management"}</h2>
          <p>
            {zh
              ? "上传 SSH 公钥后，即可通过 SSH 代理登录连接到任务 Pod。"
              : "Upload your SSH public key, then connect to task pods via SSH proxy."}
          </p>
        </div>
        <div className="section-actions">
          <button
            className="secondary-button"
            onClick={fetchKeys}
            title={zh ? "刷新" : "Refresh"}
          >
            <RefreshCw size={15} />
          </button>
          <button
            className="primary-button"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus size={16} />
            {zh ? "添加公钥" : "Add Key"}
          </button>
        </div>
      </div>

      <section
        className="storage-overview-grid"
        aria-label={zh ? "SSH 概况" : "SSH Overview"}
      >
        <div className="storage-overview-card purple">
          <span>
            <KeyRound size={18} />
          </span>
          <div>
            <small>{zh ? "已添加公钥" : "Added Keys"}</small>
            <strong>{keys.length}</strong>
            <em>{zh ? "个公钥可用" : "public keys available"}</em>
          </div>
        </div>
        <div className="storage-overview-card green">
          <span>
            <Terminal size={18} />
          </span>
          <div>
            <small>{zh ? "连接用户" : "SSH User"}</small>
            <strong>{newUser}</strong>
            <em>{zh ? "用于 SSH 代理登录" : "for SSH proxy login"}</em>
          </div>
        </div>
        <div className="storage-overview-card orange">
          <span>
            <Terminal size={18} />
          </span>
          <div>
            <small>{zh ? "连接命令" : "Connect Command"}</small>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <code
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 280,
                }}
              >
                {sshCommand}
              </code>
              <button
                className="icon-button"
                title={zh ? "复制" : "Copy"}
                onClick={handleCopy}
                style={{ flexShrink: 0 }}
              >
                {copied ? <Check size={14} /> : <CopyIcon size={14} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showAdd && (
        <section className="table-panel" style={{ marginBottom: 20 }}>
          <div className="storage-table-heading">
            <div>
              <strong>{zh ? "添加 SSH 公钥" : "Add SSH Public Key"}</strong>
              <small>
                {zh
                  ? "粘贴你的公钥内容，支持 ssh-ed25519、ssh-rsa 等格式"
                  : "Paste your public key. Supports ssh-ed25519, ssh-rsa, etc."}
              </small>
            </div>
          </div>
          <div
            className="storage-create-form"
            style={{ background: "transparent", padding: "18px 20px" }}
          >
            <div className="form-section">
              <strong>{zh ? "公钥信息" : "Key Info"}</strong>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  {zh ? "用户名" : "Username"}
                  <input
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="user"
                  />
                </label>
              </div>
              <div
                className="form-grid"
                style={{ marginTop: 16, gridTemplateColumns: "1fr" }}
              >
                <label>
                  {zh ? "公钥内容" : "Public Key"}
                  <textarea
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... or ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB..."
                    rows={4}
                  />
                </label>
              </div>
            </div>
            {error && (
              <p className="error-text" style={{ margin: "0 0 12px" }}>
                {error}
              </p>
            )}
            <div
              className="form-actions"
              style={{
                position: "static",
                margin: 0,
                padding: 0,
                borderTop: "none",
                background: "transparent",
                backdropFilter: "none",
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowAdd(false);
                  setNewKey("");
                  setError("");
                }}
              >
                {zh ? "取消" : "Cancel"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleAdd}
                disabled={adding || !newKey.trim()}
              >
                <Plus size={16} />
                {adding
                  ? zh
                    ? "添加中…"
                    : "Adding…"
                  : zh
                    ? "确认添加"
                    : "Add"}
              </button>
            </div>
          </div>
        </section>
      )}

      <div
        className="ssh-tip-banner"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 16,
          padding: "12px 14px",
          border: "1px solid rgba(124, 58, 237, 0.15)",
          borderRadius: 12,
          background: "rgba(124, 58, 237, 0.04)",
        }}
      >
        <Info
          size={16}
          style={{ flexShrink: 0, marginTop: 1, color: "var(--blue)" }}
        />
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
          {zh
            ? "请确保任务 Pod 的 authorized_keys 中包含你上传的公钥，且 Pod 内 sshd 已启动并允许公钥认证。连接时使用 root 用户登录 Pod。"
            : "Ensure your uploaded public key is present in the task Pod's authorized_keys, and that sshd is running with public key authentication enabled. Use root user to connect to the Pod."}
        </div>
      </div>

      {error && !showAdd && (
        <div className="cert-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <section className="table-panel">
        <div className="storage-table-heading">
          <div>
            <strong>{zh ? "公钥列表" : "SSH Keys"}</strong>
            <small>
              {zh
                ? "管理用于 SSH 登录的公钥"
                : "Manage public keys for SSH access"}
            </small>
          </div>
          <span>{zh ? `共 ${keys.length} 项` : `${keys.length} items`}</span>
        </div>
        {loading ? (
          <p className="muted" style={{ padding: "20px" }}>
            {zh ? "加载中…" : "Loading…"}
          </p>
        ) : keys.length === 0 ? (
          <p className="muted" style={{ padding: "20px" }}>
            {zh ? "暂无公钥" : "No SSH keys found"}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{zh ? "用户" : "User"}</th>
                <th>{zh ? "公钥" : "Public Key"}</th>
                <th>{zh ? "添加时间" : "Added"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const keyId = `${k.user}-${k.index}`;
                const isCopied = copiedKey === keyId;
                return (
                  <tr key={keyId}>
                    <td style={{ fontWeight: 500 }}>{k.user}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <code
                          title={k.public_key}
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: 12,
                            maxWidth: 360,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "help",
                          }}
                        >
                          {k.public_key}
                        </code>
                        <button
                          className="icon-button"
                          title={zh ? "复制公钥" : "Copy key"}
                          onClick={() => {
                            navigator.clipboard.writeText(k.public_key);
                            setCopiedKey(keyId);
                            setTimeout(() => setCopiedKey(""), 2000);
                          }}
                          style={{ flexShrink: 0 }}
                        >
                          {isCopied ? (
                            <Check size={14} />
                          ) : (
                            <CopyIcon size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="muted">{k.added_at || "—"}</td>
                    <td>
                      <button
                        className="icon-button danger"
                        title={zh ? "删除" : "Delete"}
                        onClick={() => handleDelete(k.user, k.index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
