import { Server } from "../App";
import "./ServerLoadingPage.css";

interface Props {
  server: Server;
  onRemove: (id: string) => void;
}

export default function ServerLoadingPage({ server, onRemove }: Props) {
  return (
    <div className="slp-root">
      <div className="slp-card">
        <div className="slp-icon" style={{ background: server.iconColor }}>
          {server.iconLetter}
        </div>
        <div className="slp-name">{server.name}</div>
        <div className="slp-url">{server.url}</div>

        <div className="slp-dots">
          <span /><span /><span />
        </div>

        <p className="slp-hint">Loading Sharkord…</p>

        <button className="slp-remove" onClick={() => onRemove(server.id)}>
          Remove server
        </button>
      </div>
    </div>
  );
}
