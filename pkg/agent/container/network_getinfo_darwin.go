//go:build darwin

package container

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"
)

func (a *containerNetworkAdapter) getProcessNetworkInfo(ctx context.Context, pid int32) (string, string, error) {
	f, err := os.Open(fmt.Sprintf("/proc/%d/mountinfo", pid))
	if err != nil {
		return "", "", fmt.Errorf("open mountinfo for pid %d: %w", pid, err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, " - ", 2)
		if len(parts) != 2 {
			continue
		}

		leftFields := strings.Fields(parts[0])
		rightFields := strings.Fields(parts[1])

		if len(leftFields) < 5 || len(rightFields) < 2 {
			continue
		}

		if leftFields[4] != "/etc/resolv.conf" {
			continue
		}

		podUID, ok := podUIDFromResolvSource(rightFields[1])
		if ok {
			return "pod", podUID, nil
		}

		return "", "", fmt.Errorf("unsupported container runtime (resolv.conf source: %s)", rightFields[1])
	}
	if err := scanner.Err(); err != nil {
		return "", "", fmt.Errorf("scan mountinfo for pid %d: %w", pid, err)
	}

	return "", "", fmt.Errorf("no /etc/resolv.conf mount found for pid %d", pid)
}