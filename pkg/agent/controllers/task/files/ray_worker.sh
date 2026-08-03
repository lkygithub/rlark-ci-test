#!/bin/bash
set -e

export RLINF_NODE_RANK=$((RLARK_NODE_RANK_START + ${POD_NAME##*-}))

if [ -n "$WAIT_NETWORK_SCRIPT" ]; then
    bash "$WAIT_NETWORK_SCRIPT" "network"
fi

# Phase 1: Prepare script (executed before Ray starts)
if [ -n "$RLARK_PREPARE_SCRIPT" ]; then
    echo "Executing prepare script..."
    eval "$RLARK_PREPARE_SCRIPT"
fi

# Phase 2: Connect to Ray head and block
if ! command -v ray >/dev/null 2>&1; then
    echo "Error: Ray CLI is not found. Please ensure Ray is installed." >&2
    exit 1
fi

TEMP_DIR=/tmp/ray
if [ -n "$RAY_TEMP_DIR" ]; then
    TEMP_DIR=$RAY_TEMP_DIR
fi

echo "Connecting to Ray head at $RLARK_HEAD_ADDRESS:${RLARK_RAY_PORT}..."

# Wait for head DNS to be resolvable and port to be reachable
# CoreDNS may be flaky, retry aggressively
RETRY=0
while [ $RETRY -lt 120 ]; do
    HEAD_IP=$(getent hosts "$RLARK_HEAD_ADDRESS" 2>/dev/null | awk '{print $1}' | head -1)
    if [ -n "$HEAD_IP" ]; then
        echo "HEAD IP: $HEAD_IP"
        if timeout 1 bash -c "echo > /dev/tcp/$HEAD_IP/${RLARK_RAY_PORT}" 2>/dev/null; then
            echo "Head is reachable at $HEAD_IP:${RLARK_RAY_PORT}"
            break
        fi
    fi
    RETRY=$((RETRY + 1))
    echo "Waiting for head to be reachable at $RLARK_HEAD_ADDRESS:${RLARK_RAY_PORT}... (attempt $RETRY)"
    sleep 1
done

ray start --address="${HEAD_IP:-$RLARK_HEAD_ADDRESS}:${RLARK_RAY_PORT}" --temp-dir $TEMP_DIR --block &
RAY_WORKER_PID=$!

cleanup() {
    trap - EXIT INT TERM
    echo "Stopping Ray worker..."
    ray stop --force >/dev/null 2>&1 || true
    if [ -n "$RAY_WORKER_PID" ]; then
        wait "$RAY_WORKER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

set +e
wait "$RAY_WORKER_PID"
WORKER_EXIT_CODE=$?
set -e

echo "Ray worker process exited with code $WORKER_EXIT_CODE"
exit 0
