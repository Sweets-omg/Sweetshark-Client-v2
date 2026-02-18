export interface Server {
  id: string;
  name: string;
  url: string;
  icon?: string; // Optional custom icon path
  keepLoaded?: boolean; // Whether to keep server loaded when switching
}

export interface ServersConfig {
  servers: Server[];
  activeServerId: string | null;
}
