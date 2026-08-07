import {
  Bell,
  ChevronDown,
  Languages,
  ListFilter,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Activity,
} from "lucide-react";
import type { Phase } from "../data";
import type { Copy, Lang, Theme } from "../i18n";
import type { ResourceRow } from "../types";

export function Logo() {
  return (
    <div className="brand">
      <img src="/rlark-logo.png" alt="RLark" className="brand-logo" />
    </div>
  );
}

export function StatusBadge({ phase, copy: c }: { phase: Phase; copy: Copy }) {
  return (
    <span className={"status status-" + phase.toLowerCase()}>
      <i />
      {c.status[phase]}
    </span>
  );
}

export function Header({
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

export function MetricCard({
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

export function Gauge({ value, label }: { value: number; label: string }) {
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

export function PageToolbar({
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

export function ResourceDistribution({
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
