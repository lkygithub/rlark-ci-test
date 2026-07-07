//go:build linux

package container

import (
	"context"
	"fmt"
	"os"

	"github.com/moby/sys/mountinfo"
)

func (a *containerNetworkAdapter) getProcessNetworkInfo(ctx context.Context, pid int32) (string, string, error) {
	f, err := os.Open(fmt.Sprintf("/proc/%d/mountinfo", pid))
	if err != nil {
		return "", "", fmt.Errorf("open mountinfo for pid %d: %w", pid, err)
	}
	defer f.Close()

	mounts, err := mountinfo.GetMountsFromReader(f, mountinfo.SingleEntryFilter("/etc/resolv.conf"))
	if err != nil {
		return "", "", fmt.Errorf("parse mountinfo for pid %d: %w", pid, err)
	}
	if len(mounts) == 0 {
		return "", "", fmt.Errorf("no /etc/resolv.conf mount found for pid %d", pid)
	}

	podUID, ok := podUIDFromResolvSource(mounts[0].Source)
	if ok {
		return "pod", podUID, nil
	}

	return "", "", fmt.Errorf("unsupported container runtime (resolv.conf source: %s)", mounts[0].Source)
}