import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, TerminalSquare, Upload, X } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

export function TerminalModal({
  podCRName,
  podName,
  onClose,
}: {
  podCRName: string;
  podName: string;
  onClose: () => void;
}) {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRefInner = useRef<Terminal | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [transferStatus, setTransferStatus] = useState<string>("");

  useEffect(() => {
    if (!termRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      theme: { background: "#1a1a2e" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current);
    fitAddon.fit();
    termRefInner.current = term;

    term.writeln(`Connecting to ${podName} ...`);

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${location.host}/api/v1/rlinf.io/v1alpha1/pods/${encodeURIComponent(podCRName)}/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "resize",
            rows: term.rows,
            cols: term.cols,
          }),
        );
      }
    };

    let downloading = false;
    let downloadChunks: Uint8Array[] = [];
    let downloadName = "";

    ws.onopen = () => {
      term.writeln("\r\nConnected. Starting shell ...\r\n");
      sendResize();
    };
    ws.onmessage = (e) => {
      if (typeof e.data === "string") {
        if (e.data.startsWith("{")) {
          let msg: {
            type?: string;
            name?: string;
            size?: number;
            success?: boolean;
            error?: string;
            message?: string;
          };
          try {
            msg = JSON.parse(e.data);
          } catch {
            term.write(e.data);
            return;
          }
          if (msg.type === "file-download-start") {
            downloading = true;
            downloadChunks = [];
            downloadName = msg.name || "download";
            setTransferStatus(
              `Downloading ${downloadName} (${msg.size || 0} bytes)...`,
            );
            return;
          }
          if (msg.type === "file-download-end") {
            if (downloading) {
              const blob = new Blob(downloadChunks as BlobPart[], {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = downloadName;
              a.click();
              URL.revokeObjectURL(url);
              downloading = false;
              downloadChunks = [];
              setTransferStatus("");
              term.writeln(`\r\n\x1b[32mDownloaded ${downloadName}.\x1b[0m`);
            }
            return;
          }
          if (msg.type === "file-transfer-done") {
            setTransferStatus("");
            if (msg.success) {
              term.writeln("\r\n\x1b[32mFile transfer complete.\x1b[0m");
            } else {
              term.writeln(
                `\r\n\x1b[31mFile transfer failed: ${msg.error || "unknown"}\x1b[0m`,
              );
            }
            return;
          }
          if (msg.type === "error") {
            term.writeln(
              `\r\n\x1b[31m${msg.message || msg.error || "unknown error"}\x1b[0m`,
            );
            return;
          }
        }
        term.write(e.data);
      } else if (e.data instanceof ArrayBuffer) {
        if (downloading) {
          downloadChunks.push(new Uint8Array(e.data));
        } else {
          term.write(new Uint8Array(e.data));
        }
      }
    };
    ws.onerror = () => {
      term.writeln("\r\n\x1b[31mWebSocket error.\x1b[0m");
    };
    ws.onclose = () => {
      term.writeln("\r\n\x1b[33mConnection closed.\x1b[0m");
    };
    const encoder = new TextEncoder();
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(encoder.encode(data));
      }
    });
    term.onResize(() => sendResize());

    const onResize = () => fitAddon.fit();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ws.close();
      term.dispose();
      termRefInner.current = null;
    };
  }, [podCRName, podName]);

  const handleClose = () => {
    wsRef.current?.close();
    termRefInner.current?.dispose();
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;
    const ws = wsRef.current;
    const destPath = `./${file.name}`;
    setTransferStatus(
      `Uploading ${file.name} (${file.size} bytes) to ${destPath}...`,
    );

    ws.send(
      JSON.stringify({
        type: "file-upload",
        path: destPath,
        size: file.size,
        mode: 0o644,
      }),
    );

    const chunkSize = 32 * 1024;
    let offset = 0;
    const reader = new FileReader();

    const readChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          ws.send(reader.result);
          offset += reader.result.byteLength;
          if (offset < file.size) {
            readChunk();
          } else {
            ws.send(JSON.stringify({ type: "file-upload-end" }));
          }
        }
      };
      reader.readAsArrayBuffer(slice);
    };
    readChunk();
    e.target.value = "";
  };

  const [showDownloadInput, setShowDownloadInput] = useState(false);
  const [dlPath, setDlPath] = useState("");

  const handleDownloadSubmit = () => {
    if (
      !dlPath ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;
    wsRef.current.send(JSON.stringify({ type: "file-download", path: dlPath }));
    setTransferStatus(`Requesting ${dlPath}...`);
    setShowDownloadInput(false);
    setDlPath("");
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal terminal-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              <TerminalSquare size={13} />
              WebTerminal
            </span>
            <h2>{podName}</h2>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              className="icon-button"
              title="Upload file"
              onClick={handleUploadClick}
            >
              <Upload size={16} />
            </button>
            <button
              className="icon-button"
              title="Download file"
              onClick={() => setShowDownloadInput((v) => !v)}
            >
              <Download size={16} />
            </button>
            <button className="icon-button" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        {showDownloadInput && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 16px",
              background: "#16162a",
              borderBottom: "1px solid #2a2a4a",
            }}
          >
            <input
              type="text"
              value={dlPath}
              onChange={(e) => setDlPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDownloadSubmit()}
              placeholder="/path/to/file/in/pod"
              style={{
                flex: 1,
                background: "#1a1a2e",
                border: "1px solid #3a3a5a",
                borderRadius: 4,
                color: "#e0e0f0",
                padding: "4px 8px",
                fontSize: 13,
              }}
            />
            <button className="secondary-button" onClick={handleDownloadSubmit}>
              Download
            </button>
          </div>
        )}
        {transferStatus && (
          <div
            style={{
              padding: "4px 16px",
              background: "#1a1a2e",
              color: "#7cc7ff",
              fontSize: 12,
              borderBottom: "1px solid #2a2a4a",
            }}
          >
            {transferStatus}
          </div>
        )}
        <div className="modal-body">
          <div ref={termRef} className="terminal-container" />
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
        </div>
      </div>
    </div>
  );
}
