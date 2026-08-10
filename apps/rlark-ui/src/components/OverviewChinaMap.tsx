import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CloudCog,
  MapPin,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Server,
  Workflow,
} from "lucide-react";
import type { Copy } from "../i18n";
import type { Page } from "../types";

type Position = [number, number];
type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Position[][] | Position[][][];
};
type Feature = {
  properties?: { name?: string; adcode?: number | string };
  geometry: Geometry;
};
type FeatureCollection = { features: Feature[] };

const VIEWBOX = {
  width: 800,
  height: 520,
  minLon: 73,
  maxLon: 135,
  minLat: 18,
  maxLat: 54,
};

const cityResources = [
  { name: "北京市", lon: 116.41, lat: 39.9, nodes: 56, clusters: 2 },
  { name: "上海市", lon: 121.47, lat: 31.23, nodes: 48, clusters: 2 },
  { name: "杭州市", lon: 120.15, lat: 30.27, nodes: 28, clusters: 1 },
  { name: "深圳市", lon: 114.06, lat: 22.54, nodes: 26, clusters: 1 },
  { name: "广州市", lon: 113.26, lat: 23.13, nodes: 24, clusters: 1 },
  { name: "成都市", lon: 104.06, lat: 30.67, nodes: 21, clusters: 1 },
  { name: "重庆市", lon: 106.55, lat: 29.56, nodes: 22, clusters: 1 },
  { name: "武汉市", lon: 114.31, lat: 30.59, nodes: 26, clusters: 1 },
  { name: "西安市", lon: 108.94, lat: 34.34, nodes: 19, clusters: 1 },
  { name: "南京市", lon: 118.8, lat: 32.06, nodes: 20, clusters: 1 },
  { name: "青岛市", lon: 120.38, lat: 36.07, nodes: 16, clusters: 1 },
  { name: "长沙市", lon: 112.94, lat: 28.23, nodes: 21, clusters: 1 },
];

const cityConnections = [
  [0, 1],
  [0, 8],
  [8, 5],
  [5, 6],
  [6, 11],
  [11, 7],
  [7, 9],
  [9, 2],
  [2, 1],
  [1, 10],
  [7, 3],
  [3, 4],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 11],
  [1, 5],
  [1, 8],
  [1, 3],
  [2, 5],
  [2, 8],
  [3, 5],
  [3, 8],
  [3, 10],
  [4, 6],
  [4, 8],
  [4, 10],
  [5, 9],
  [5, 10],
  [6, 9],
  [6, 10],
  [7, 10],
  [9, 4],
  [10, 11],
] as const;

const stats = [
  { key: "clusters", zh: "集群分布", en: "Clusters", value: 10 },
  { key: "nodes", zh: "节点分布", en: "Nodes", value: 307 },
  { key: "jobs", zh: "任务分布", en: "Jobs", value: 8 },
  { key: "cloud", zh: "云算力节点", en: "Cloud nodes", value: 69 },
  { key: "edge", zh: "端算力节点", en: "Edge nodes", value: 97 },
  { key: "robot", zh: "端真机节点", en: "Robot nodes", value: 141 },
];

function project(lon: number, lat: number) {
  return {
    x:
      ((lon - VIEWBOX.minLon) / (VIEWBOX.maxLon - VIEWBOX.minLon)) *
      VIEWBOX.width,
    y:
      ((VIEWBOX.maxLat - lat) / (VIEWBOX.maxLat - VIEWBOX.minLat)) *
      VIEWBOX.height,
  };
}

function ringPath(ring: Position[]) {
  return (
    ring
      .map(([lon, lat], index) => {
        const { x, y } = project(lon, lat);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

function geometryPath(geometry: Geometry) {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as Position[][]]
      : (geometry.coordinates as Position[][][]);
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join(" ");
}

function connectionPath(fromIndex: number, toIndex: number) {
  const fromCity = cityResources[fromIndex];
  const toCity = cityResources[toIndex];
  const from = project(fromCity.lon, fromCity.lat);
  const to = project(toCity.lon, toCity.lat);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlX = (from.x + to.x) / 2 - dy * 0.16;
  const controlY = (from.y + to.y) / 2 + dx * 0.16;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function clampPan(pan: { x: number; y: number }, zoom: number) {
  const maxX = 36 + (zoom - 1) * VIEWBOX.width * 0.34;
  const maxY = 28 + (zoom - 1) * VIEWBOX.height * 0.34;
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
}

export function OverviewChinaMap({
  navigate,
  copy: c,
}: {
  navigate: (
    page: Page,
    name?: string,
    options?: { query?: Record<string, string | undefined> },
  ) => void;
  copy: Copy;
}) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const hasDraggedRef = useRef(false);
  const zh = c.nav.overview === "总览";

  const updateZoom = (nextZoom: number) => {
    const normalized = Math.max(1, Math.min(1.8, Number(nextZoom.toFixed(1))));
    setZoom(normalized);
    setPan((current) => clampPan(current, normalized));
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    let alive = true;
    fetch("/china-provinces.geojson")
      .then((response) => response.json())
      .then((data: FeatureCollection) => {
        if (alive) {
          setFeatures(
            data.features.filter(
              (feature) => feature.properties?.adcode !== "100000_JD",
            ),
          );
        }
      })
      .catch(() => setFeatures([]));
    return () => {
      alive = false;
    };
  }, []);

  const provincePaths = useMemo(
    () =>
      features.map((feature) => ({
        name: feature.properties?.name ?? "",
        path: geometryPath(feature.geometry),
      })),
    [features],
  );

  return (
    <section className="panel overview-china-panel">
      <div className="overview-china-heading">
        <div>
          <span className="overview-demo-badge">
            {zh ? "演示数据" : "Demo data"}
          </span>
          <h3>{zh ? "资源与任务分布" : "Resource and task distribution"}</h3>
          <p>
            {zh
              ? "跨集群、跨地域、跨具身型号的运行态势"
              : "Runtime posture across clusters, regions and embodied models"}
          </p>
        </div>
        <div className="overview-china-legend">
          <span className="cloud">
            <CloudCog size={14} />
            {zh ? "云算力节点" : "Cloud"}
          </span>
          <span className="edge">
            <Server size={14} />
            {zh ? "端算力节点" : "Edge"}
          </span>
          <span className="robot">
            <Bot size={14} />
            {zh ? "端真机节点" : "Robot"}
          </span>
        </div>
      </div>

      <div className="overview-china-layout">
        <div
          className={`overview-china-map${dragging ? " is-dragging" : ""}`}
          ref={mapRef}
          onPointerDown={(event) => {
            if ((event.target as Element).closest(".overview-map-controls"))
              return;
            hasDraggedRef.current = false;
            dragRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              panX: pan.x,
              panY: pan.y,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!dragRef.current || !mapRef.current) return;
            const rect = mapRef.current.getBoundingClientRect();
            const deltaX =
              (event.clientX - dragRef.current.clientX) *
              (VIEWBOX.width / rect.width);
            const deltaY =
              (event.clientY - dragRef.current.clientY) *
              (VIEWBOX.height / rect.height);
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)
              hasDraggedRef.current = true;
            setPan(
              clampPan(
                {
                  x: dragRef.current.panX + deltaX,
                  y: dragRef.current.panY + deltaY,
                },
                zoom,
              ),
            );
          }}
          onPointerUp={(event) => {
            dragRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
          onPointerCancel={() => {
            dragRef.current = null;
            setDragging(false);
          }}
        >
          <div
            className="overview-map-controls"
            aria-label={zh ? "地图缩放" : "Map zoom"}
          >
            <button
              type="button"
              aria-label={zh ? "放大地图" : "Zoom in"}
              disabled={zoom >= 1.8}
              onClick={() => updateZoom(zoom + 0.2)}
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              aria-label={zh ? "缩小地图" : "Zoom out"}
              disabled={zoom <= 1}
              onClick={() => updateZoom(zoom - 0.2)}
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              aria-label={zh ? "复位地图" : "Reset map"}
              disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              onClick={resetMap}
            >
              <RotateCcw size={13} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <svg
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            role="img"
            aria-label={
              zh ? "中国节点城市分布地图" : "China node city distribution map"
            }
          >
            <g
              className="china-map-viewport"
              transform={`translate(${pan.x} ${pan.y}) translate(${VIEWBOX.width / 2} ${VIEWBOX.height / 2}) scale(${zoom}) translate(${-VIEWBOX.width / 2} ${-VIEWBOX.height / 2})`}
            >
              <g className="china-provinces">
                {provincePaths.map((province, index) => (
                  <path key={`${province.name}-${index}`} d={province.path}>
                    <title>{province.name}</title>
                  </path>
                ))}
              </g>
              <g className="china-city-links" aria-hidden="true">
                {cityConnections.map(([from, to], index) => {
                  const path = connectionPath(from, to);
                  return (
                    <g key={`${from}-${to}`}>
                      <path className="city-link-line" d={path} />
                      <circle
                        className={`link-particle particle-${index % 3}`}
                        r="2.7"
                      >
                        <animateMotion
                          path={path}
                          dur={`${2.8 + (index % 4) * 0.65}s`}
                          begin={`${index * -0.42}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  );
                })}
              </g>
              <g className="china-city-pins">
                {cityResources.map((city, index) => {
                  const point = project(city.lon, city.lat);
                  return (
                    <g
                      key={city.name}
                      className={`china-city-pin pin-${index % 3}`}
                      transform={`translate(${point.x} ${point.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${city.name} ${city.nodes} ${zh ? "个节点" : "nodes"}`}
                      onClick={() => {
                        if (!hasDraggedRef.current)
                          navigate("clusters-nodes", undefined, {
                            query: { city: city.name },
                          });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          navigate("clusters-nodes", undefined, {
                            query: { city: city.name },
                          });
                      }}
                    >
                      <circle className="pin-halo" r="14" />
                      <circle className="pin-core" r="6" />
                      <circle className="pin-badge" cx="11" cy="-11" r="10" />
                      <text
                        className="pin-value"
                        x="11"
                        y="-7.5"
                        textAnchor="middle"
                      >
                        {city.nodes}
                      </text>
                      <text
                        className="pin-label"
                        x="0"
                        y="27"
                        textAnchor="middle"
                      >
                        {city.name.replace("市", "")}
                      </text>
                      <g
                        className="china-city-tooltip"
                        transform={`translate(${point.x > 660 ? -134 : point.x < 135 ? 12 : -62} ${point.y < 80 ? 24 : -72})`}
                        pointerEvents="none"
                      >
                        <rect width="124" height="54" rx="9" />
                        <text className="tooltip-city" x="10" y="18">
                          {city.name}
                        </text>
                        <text className="tooltip-detail" x="10" y="36">
                          {city.nodes} {zh ? "个节点" : "nodes"} ·{" "}
                          {city.clusters} {zh ? "个集群" : "clusters"}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
          {provincePaths.length === 0 && (
            <div className="overview-map-loading">
              {zh ? "地图加载中…" : "Loading map…"}
            </div>
          )}
          <div className="overview-map-caption">
            <Network size={15} />
            <span>
              <strong>{zh ? "全国调度视图" : "Nationwide scheduling"}</strong>
              <small>
                {zh ? "覆盖 12 个城市 · Mock 数据" : "12 cities · Mock data"}
              </small>
            </span>
          </div>
        </div>

        <aside className="overview-china-aside">
          <div className="overview-map-stats">
            {stats.map((item) => (
              <button
                className={item.key}
                key={item.key}
                onClick={() =>
                  navigate(
                    item.key === "jobs"
                      ? "jobs"
                      : item.key === "clusters"
                        ? "clusters-management"
                        : "clusters-nodes",
                    undefined,
                    item.key === "cloud" ||
                      item.key === "edge" ||
                      item.key === "robot"
                      ? { query: { category: item.key } }
                      : undefined,
                  )
                }
              >
                <small>{zh ? item.zh : item.en}</small>
                <strong>{item.value}</strong>
              </button>
            ))}
          </div>
          <button
            className="overview-cross-region"
            onClick={() => navigate("jobs")}
          >
            <span>
              <Workflow size={15} />
              {zh ? "跨域任务" : "Cross-region jobs"}
            </span>
            <strong>
              {zh
                ? "3 个任务正在跨集群调度"
                : "3 jobs scheduled across clusters"}
            </strong>
            <small>
              {zh
                ? "覆盖 5 个城市、6 个集群"
                : "5 cities and 6 clusters covered"}
            </small>
          </button>
          <div className="overview-city-summary">
            {cityResources.slice(0, 3).map((city) => (
              <button
                key={city.name}
                onClick={() =>
                  navigate("clusters-nodes", undefined, {
                    query: { city: city.name },
                  })
                }
              >
                <MapPin size={13} />
                <span>
                  <strong>{city.name}</strong>
                  <small>
                    {city.clusters} {zh ? "个集群" : "clusters"}
                  </small>
                </span>
                <b>{city.nodes}</b>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
