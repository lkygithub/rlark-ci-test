import { useEffect, useMemo, useState } from "react";
import { CircleDot, CloudCog } from "lucide-react";
import type { Job } from "./data";
import { copy, type Lang, type Theme } from "./i18n";
import { navItems } from "./constants";
import type { Page } from "./types";
import { useIsAdminPath, parseRoute } from "./utils/route";
import { Logo, Header } from "./components/shared";
import { Overview } from "./pages/Overview";
import { ClustersPage } from "./pages/Clusters";
import { JobsPage } from "./pages/Jobs";
import { WorkflowsPage, CreateWorkflowModal } from "./pages/Workflows";
import {
  StorageClassesPage,
  StorageClassCreatePage,
  StorageClassFilesPage,
} from "./pages/Storage";
import { CreateJobModal } from "./pages/CreateJob";
import { UserLogin } from "./pages/Login";
import { AdminApp } from "./admin/AdminApp";

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
