export type Phase =
  "Running" | "Pending" | "Succeeded" | "Failed" | "Online" | "Offline";

export type ClusterType = "Cloud" | "Embodied";
export type NodeKind = "CloudCompute" | "EmbodiedCompute" | "Robot";
export type JobType = "RL" | "DataCollection" | "Evaluation" | "Custom";

export interface Cluster {
  id: string;
  name: string;
  type: ClusterType;
  region: string;
  location: string;
  phase: Phase;
  cloudNodes: number;
  embodiedNodes: number;
  robots: number;
  gpuModels: string[];
  robotModels: string[];
  cpuUsage: number;
  gpuUsage: number;
  robotUsage: number;
  runningJobs: number;
  description: string;
}

export interface NodeItem {
  id: string;
  name: string;
  cluster: string;
  kind: NodeKind;
  phase: Phase;
  address: string;
  model: string;
  cpu: number;
  memory: number;
  gpu: string;
  robotState?: string;
  cameraUrl?: string;
  telemetryUrl?: string;
  controlUrl?: string;
  battery?: number;
  tasks: number;
}

export interface Worker {
  id: string;
  name: string;
  jobId: string;
  role: string;
  node: string;
  phase: Phase;
  cpu: number;
  memory: number;
  gpu?: string;
  latency?: string;
  fps?: number;
  webTerminalUrl?: string;
  logs: string[];
}

export interface Job {
  id: string;
  name: string;
  type: JobType;
  phase: Phase;
  owner: string;
  cluster: string;
  target: string;
  workers: number;
  runningWorkers: number;
  startedAt: string;
  duration: string;
  progress: number;
  defaultRoles: string[];
  image: string;
  command: string;
  env: Array<{ key: string; value: string }>;
  mounts: Array<{ objectStorage: string; mountPath: string }>;
  headerRole: string;
  headerWorker: string;
  sshAddress: string;
  domain?: string;
  resources: Array<{
    role: string;
    cluster: string;
    nodeSelector: string;
    replicas: number;
    cpu: string;
    memory: string;
    gpu: string;
    image: string;
    prepareScript: string;
    env: Array<{ key: string; value: string }>;
    mounts: Array<{ objectStorage: string; mountPath: string }>;
  }>;
  taskStatuses: Array<{
    name: string;
    phase: string;
    message: string;
    observedNodes?: string[];
  }>;
}

export interface Domain {
  id: string;
  name: string;
  cidr: string;
  ipAllocations: Array<{ ip: string; job: string; task: string; pod: string }>;
  createdAt: string;
}

export const clusters: Cluster[] = [
  {
    id: "cloud-east-a",
    name: "云训练集群 East-A",
    type: "Cloud",
    region: "华东 · cn-shanghai",
    location: "上海",
    phase: "Online",
    cloudNodes: 42,
    embodiedNodes: 0,
    robots: 0,
    gpuModels: ["NVIDIA H800", "NVIDIA A100"],
    robotModels: [],
    cpuUsage: 64,
    gpuUsage: 78,
    robotUsage: 0,
    runningJobs: 7,
    description: "承载强化学习训练和大规模 rollout 的主力云 GPU 集群。",
  },
  {
    id: "cloud-north-b",
    name: "云评测集群 North-B",
    type: "Cloud",
    region: "华北 · cn-beijing",
    location: "北京",
    phase: "Online",
    cloudNodes: 18,
    embodiedNodes: 0,
    robots: 0,
    gpuModels: ["NVIDIA L40S", "NVIDIA A10"],
    robotModels: [],
    cpuUsage: 42,
    gpuUsage: 51,
    robotUsage: 0,
    runningJobs: 3,
    description: "用于离线回归评测、仿真评测和批量指标聚合。",
  },
  {
    id: "robot-lab-sh",
    name: "上海具身实验集群",
    type: "Embodied",
    region: "上海机器人实验室",
    location: "上海",
    phase: "Online",
    cloudNodes: 0,
    embodiedNodes: 9,
    robots: 26,
    gpuModels: ["Jetson Orin", "RTX 4090 Edge"],
    robotModels: ["Unitree G1", "Franka Panda", "AgileX Scout"],
    cpuUsage: 55,
    gpuUsage: 46,
    robotUsage: 68,
    runningJobs: 5,
    description: "连接实验室内真机、边缘算力和传感器通道的具身实验集群。",
  },
  {
    id: "robot-warehouse-hz",
    name: "杭州仓储真机场",
    type: "Embodied",
    region: "杭州 · Warehouse A2",
    location: "杭州",
    phase: "Online",
    cloudNodes: 0,
    embodiedNodes: 6,
    robots: 18,
    gpuModels: ["Jetson AGX Orin"],
    robotModels: ["Robodog OT-T12", "AMR Forklift"],
    cpuUsage: 48,
    gpuUsage: 39,
    robotUsage: 72,
    runningJobs: 2,
    description: "面向仓储巡检、导航采集和 AMR 任务的现场真机场。",
  },
];

export const nodes: NodeItem[] = [
  {
    id: "gpu-cloud-01",
    name: "gpu-cloud-01",
    cluster: "云训练集群 East-A",
    kind: "CloudCompute",
    phase: "Online",
    address: "10.20.0.11",
    model: "H800 SXM · 8 GPU",
    cpu: 62,
    memory: 71,
    gpu: "6 / 8",
    tasks: 14,
  },
  {
    id: "gpu-cloud-03",
    name: "gpu-cloud-03",
    cluster: "云训练集群 East-A",
    kind: "CloudCompute",
    phase: "Online",
    address: "10.20.0.13",
    model: "A100 80G · 8 GPU",
    cpu: 78,
    memory: 69,
    gpu: "8 / 8",
    tasks: 18,
  },
  {
    id: "eval-l40s-07",
    name: "eval-l40s-07",
    cluster: "云评测集群 North-B",
    kind: "CloudCompute",
    phase: "Online",
    address: "10.32.4.17",
    model: "L40S · 4 GPU",
    cpu: 44,
    memory: 52,
    gpu: "2 / 4",
    tasks: 6,
  },
  {
    id: "edge-orin-02",
    name: "edge-orin-02",
    cluster: "上海具身实验集群",
    kind: "EmbodiedCompute",
    phase: "Online",
    address: "192.168.7.42",
    model: "Jetson Orin",
    cpu: 56,
    memory: 61,
    gpu: "1 / 1",
    tasks: 4,
  },
  {
    id: "robot-g1-12",
    name: "robot-g1-12",
    cluster: "上海具身实验集群",
    kind: "Robot",
    phase: "Online",
    address: "192.168.7.112",
    model: "Unitree G1",
    cpu: 38,
    memory: 45,
    gpu: "0 / 1",
    robotState: "执行抓取序列",
    cameraUrl: "rtsp://192.168.7.112/front-camera",
    telemetryUrl: "ws://192.168.7.112/telemetry",
    controlUrl: "grpc://192.168.7.112:9090/control",
    battery: 82,
    tasks: 1,
  },
  {
    id: "robot-dog-08",
    name: "robot-dog-08",
    cluster: "杭州仓储真机场",
    kind: "Robot",
    phase: "Online",
    address: "172.18.4.88",
    model: "Robodog OT-T12",
    cpu: 41,
    memory: 48,
    gpu: "0 / 1",
    robotState: "巡检中",
    cameraUrl: "rtsp://172.18.4.88/inspection-cam",
    telemetryUrl: "ws://172.18.4.88/state",
    controlUrl: "grpc://172.18.4.88:9090/control",
    battery: 67,
    tasks: 1,
  },
  {
    id: "robot-franka-03",
    name: "robot-franka-03",
    cluster: "上海具身实验集群",
    kind: "Robot",
    phase: "Offline",
    address: "192.168.7.203",
    model: "Franka Panda",
    cpu: 0,
    memory: 0,
    gpu: "0 / 1",
    robotState: "维护中",
    cameraUrl: "rtsp://192.168.7.203/wrist-camera",
    telemetryUrl: "ws://192.168.7.203/telemetry",
    controlUrl: "grpc://192.168.7.203:9090/control",
    battery: 0,
    tasks: 0,
  },
];

export const jobs: Job[] = [
  {
    id: "rl-bimanual-042",
    name: "双臂装配强化学习",
    type: "RL",
    phase: "Running",
    owner: "Baodong Wu",
    cluster: "云训练集群 East-A + 上海具身实验集群",
    target: "Unitree G1 / Franka Panda",
    workers: 24,
    runningWorkers: 21,
    startedAt: "今天 09:42",
    duration: "2h 18m",
    progress: 68,
    defaultRoles: ["Learner", "Rollout Worker", "Env Worker", "Evaluator"],
    image: "registry.rlark.ai/rl/policy-trainer:v0.42",
    command:
      "python train.py --config /mnt/config/bimanual.yaml --enable-robot-channel",
    env: [
      { key: "WANDB_PROJECT", value: "bimanual-assembly" },
      { key: "RLARK_JOB_ID", value: "rl-bimanual-042" },
    ],
    mounts: [
      {
        objectStorage: "s3://rlark-datasets/bimanual",
        mountPath: "/mnt/dataset",
      },
      {
        objectStorage: "s3://rlark-checkpoints/policy",
        mountPath: "/mnt/checkpoints",
      },
    ],
    headerRole: "Learner",
    headerWorker: "learner-0",
    sshAddress: "ssh learner-0@ssh.rlark.ai -p 32242",
    resources: [
      {
        role: "Learner",
        cluster: "云训练集群 East-A",
        nodeSelector: "gpu=h800",
        replicas: 1,
        cpu: "32",
        memory: "256Gi",
        gpu: "4",
        image: "registry.rlark.ai/rl/policy-trainer:v0.42",
        prepareScript: "",
        env: [{ key: "WANDB_PROJECT", value: "bimanual-assembly" }],
        mounts: [
          {
            objectStorage: "s3://rlark-datasets/bimanual",
            mountPath: "/mnt/dataset",
          },
        ],
      },
      {
        role: "Env Worker",
        cluster: "上海具身实验集群",
        nodeSelector: "robot=unitree-g1",
        replicas: 6,
        cpu: "4",
        memory: "16Gi",
        gpu: "0",
        image: "registry.rlark.ai/rl/env-worker:v0.42",
        prepareScript: "",
        env: [{ key: "ROBOT_MODEL", value: "unitree-g1" }],
        mounts: [
          {
            objectStorage: "s3://rlark-datasets/bimanual",
            mountPath: "/mnt/dataset",
          },
        ],
      },
    ],
    taskStatuses: [],
  },
  {
    id: "collect-warehouse-017",
    name: "仓储巡检数据采集",
    type: "DataCollection",
    phase: "Running",
    owner: "Chen Lin",
    cluster: "杭州仓储真机场",
    target: "Robodog OT-T12",
    workers: 12,
    runningWorkers: 10,
    startedAt: "今天 10:08",
    duration: "1h 41m",
    progress: 57,
    defaultRoles: [
      "Collector",
      "Robot Operator",
      "Uploader",
      "Quality Checker",
    ],
    image: "registry.rlark.ai/data/collector:v1.8",
    command: "python collect.py --route A2 --camera front --upload-interval 60",
    env: [{ key: "DATASET_NAME", value: "warehouse-a2" }],
    mounts: [
      {
        objectStorage: "s3://rlark-datasets/warehouse-a2",
        mountPath: "/mnt/output",
      },
    ],
    headerRole: "Collector",
    headerWorker: "collector-dog-08",
    sshAddress: "ssh collector-dog-08@ssh.rlark.ai -p 32288",
    resources: [
      {
        role: "Robot Operator",
        cluster: "杭州仓储真机场",
        nodeSelector: "robot=robodog",
        replicas: 8,
        cpu: "2",
        memory: "8Gi",
        gpu: "0",
        image: "registry.rlark.ai/data/collector:v1.8",
        prepareScript: "",
        env: [{ key: "DATASET_NAME", value: "warehouse-a2" }],
        mounts: [
          {
            objectStorage: "s3://rlark-datasets/warehouse-a2",
            mountPath: "/mnt/output",
          },
        ],
      },
    ],
    taskStatuses: [],
  },
  {
    id: "eval-nav-088",
    name: "导航策略回归评测",
    type: "Evaluation",
    phase: "Pending",
    owner: "Ming Zhao",
    cluster: "云评测集群 North-B",
    target: "AgileX Scout",
    workers: 8,
    runningWorkers: 0,
    startedAt: "—",
    duration: "—",
    progress: 8,
    defaultRoles: ["Evaluator", "Scenario Runner", "Metrics Aggregator"],
    image: "registry.rlark.ai/eval/nav-evaluator:v2.1",
    command: "python evaluate.py --suite nav-regression --report /mnt/report",
    env: [{ key: "EVAL_SUITE", value: "nav-regression" }],
    mounts: [
      { objectStorage: "s3://rlark-reports/nav", mountPath: "/mnt/report" },
    ],
    headerRole: "Evaluator",
    headerWorker: "eval-shadow",
    sshAddress: "pending until scheduled",
    resources: [
      {
        role: "Evaluator",
        cluster: "云评测集群 North-B",
        nodeSelector: "gpu=l40s",
        replicas: 2,
        cpu: "8",
        memory: "64Gi",
        gpu: "1",
        image: "registry.rlark.ai/eval/nav-evaluator:v2.1",
        prepareScript: "",
        env: [{ key: "EVAL_SUITE", value: "nav-regression" }],
        mounts: [
          { objectStorage: "s3://rlark-reports/nav", mountPath: "/mnt/report" },
        ],
      },
    ],
    taskStatuses: [],
  },
  {
    id: "custom-handeye-006",
    name: "手眼标定自定义任务",
    type: "Custom",
    phase: "Succeeded",
    owner: "Yue Zhang",
    cluster: "上海具身实验集群",
    target: "Franka Panda",
    workers: 5,
    runningWorkers: 0,
    startedAt: "昨天 18:06",
    duration: "42m",
    progress: 100,
    defaultRoles: ["Calibration Driver", "Camera Worker", "Robot Worker"],
    image: "registry.rlark.ai/custom/handeye:v0.6",
    command: "python calibrate.py --robot franka --camera wrist",
    env: [{ key: "CALIBRATION_MODE", value: "hand-eye" }],
    mounts: [
      {
        objectStorage: "s3://rlark-calibration/franka",
        mountPath: "/mnt/calibration",
      },
    ],
    headerRole: "Calibration Driver",
    headerWorker: "calibration-driver-0",
    sshAddress: "ssh calibration-driver-0@ssh.rlark.ai -p 32301",
    resources: [
      {
        role: "Calibration Driver",
        cluster: "上海具身实验集群",
        nodeSelector: "robot=franka",
        replicas: 1,
        cpu: "4",
        memory: "16Gi",
        gpu: "0",
        image: "registry.rlark.ai/custom/handeye:v0.6",
        prepareScript: "",
        env: [{ key: "CALIBRATION_MODE", value: "hand-eye" }],
        mounts: [
          {
            objectStorage: "s3://rlark-calibration/franka",
            mountPath: "/mnt/calibration",
          },
        ],
      },
    ],
    taskStatuses: [],
  },
];

export const workers: Worker[] = [
  {
    id: "learner-0",
    name: "learner-0",
    jobId: "rl-bimanual-042",
    role: "Learner",
    node: "gpu-cloud-03",
    phase: "Running",
    cpu: 71,
    memory: 64,
    gpu: "4 GPU",
    latency: "32ms",
    webTerminalUrl: "https://terminal.rlark.ai/w/learner-0",
    logs: [
      "loaded checkpoint policy-v41",
      "batch reward mean=0.72",
      "sync rollout buffer ok",
    ],
  },
  {
    id: "rollout-0",
    name: "rollout-0",
    jobId: "rl-bimanual-042",
    role: "Rollout Worker",
    node: "gpu-cloud-01",
    phase: "Running",
    cpu: 58,
    memory: 49,
    gpu: "2 GPU",
    latency: "41ms",
    webTerminalUrl: "https://terminal.rlark.ai/w/rollout-0",
    logs: ["env shard connected", "episode 1842 done", "pushing trajectories"],
  },
  {
    id: "env-g1-12",
    name: "env-g1-12",
    jobId: "rl-bimanual-042",
    role: "Env Worker",
    node: "robot-g1-12",
    phase: "Running",
    cpu: 38,
    memory: 45,
    fps: 28,
    latency: "68ms",
    webTerminalUrl: "https://terminal.rlark.ai/w/env-g1-12",
    logs: [
      "robot channel ready",
      "gripper state normal",
      "executing grasp sequence",
    ],
  },
  {
    id: "eval-shadow",
    name: "eval-shadow",
    jobId: "rl-bimanual-042",
    role: "Evaluator",
    node: "eval-l40s-07",
    phase: "Pending",
    cpu: 12,
    memory: 19,
    gpu: "0 GPU",
    webTerminalUrl: "https://terminal.rlark.ai/w/eval-shadow",
    logs: ["waiting for learner checkpoint"],
  },
  {
    id: "collector-dog-08",
    name: "collector-dog-08",
    jobId: "collect-warehouse-017",
    role: "Robot Operator",
    node: "robot-dog-08",
    phase: "Running",
    cpu: 41,
    memory: 48,
    fps: 24,
    latency: "54ms",
    webTerminalUrl: "https://terminal.rlark.ai/w/collector-dog-08",
    logs: [
      "route segment A2 started",
      "lidar stream healthy",
      "uploaded 126 samples",
    ],
  },
  {
    id: "uploader-0",
    name: "uploader-0",
    jobId: "collect-warehouse-017",
    role: "Uploader",
    node: "edge-orin-02",
    phase: "Running",
    cpu: 46,
    memory: 53,
    webTerminalUrl: "https://terminal.rlark.ai/w/uploader-0",
    logs: ["compressing rosbag chunk", "upload speed 82MB/s"],
  },
];

export const activity = [
  {
    time: "12:04",
    type: "running",
    title: "双臂装配强化学习 Worker 已扩容至 24 个",
    meta: "rl-bimanual-042 · Job",
  },
  {
    time: "11:58",
    type: "success",
    title: "robot-g1-12 具身通道连接正常",
    meta: "上海具身实验集群 · Robot",
  },
  {
    time: "11:46",
    type: "warning",
    title: "collector-dog-08 发生一次低电量告警",
    meta: "杭州仓储真机场 · Worker",
  },
  {
    time: "11:32",
    type: "error",
    title: "robot-franka-03 进入维护状态",
    meta: "上海具身实验集群 · Robot",
  },
];
