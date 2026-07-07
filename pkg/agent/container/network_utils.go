package container

import "strings"

// podUIDFromResolvSource 尝试从容器的 resolv.conf 挂载来源路径中提取 Kubernetes Pod UID。
// mountSource 格式应为 .../pods/<pod-uid>/etc/resolv.conf，其中 <pod-uid> 是标准 UUID。
// 不管 /var/lib/kubelet 是不是软链或重挂载，只要路径尾缀匹配即可识别。
func podUIDFromResolvSource(mountSource string) (string, bool) {
	const suffix = "/etc/resolv.conf"
	if !strings.HasSuffix(mountSource, suffix) {
		return "", false
	}
	// 去掉尾缀后得到 .../pods/<uuid>
	beforeEtc := strings.TrimSuffix(mountSource, suffix)

	// 从后往前找 "/"，取最后一个 segment 作为 podUID
	lastSlash := strings.LastIndex(beforeEtc, "/")
	if lastSlash < 0 {
		return "", false
	}
	podUID := beforeEtc[lastSlash+1:]

	// 检查倒数第二个 segment 是否为 "pods"
	beforeLast := beforeEtc[:lastSlash]
	secondLastSlash := strings.LastIndex(beforeLast, "/")
	if secondLastSlash < 0 {
		return "", false
	}
	segment := beforeLast[secondLastSlash+1:]
	if segment != "pods" {
		return "", false
	}

	// 校验 UUID 格式：8-4-4-4-12 十六进制
	if !isUUID(podUID) {
		return "", false
	}

	return podUID, true
}

// isUUID 校验标准 UUID 格式 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i := 0; i < 36; i++ {
		ch := s[i]
		switch {
		case i == 8 || i == 13 || i == 18 || i == 23:
			if ch != '-' {
				return false
			}
		default:
			if !((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
				return false
			}
		}
	}
	return true
}