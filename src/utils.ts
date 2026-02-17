import { invoke } from '@tauri-apps/api/core';
import type { Server } from './types';

export const serverApi = {
  getServers: () => invoke<Server[]>('get_servers'),
  
  addServer: (server: Server) => invoke<Server>('add_server', { server }),
  
  updateServer: (server: Server) => invoke<Server>('update_server', { server }),
  
  deleteServer: (serverId: string) => invoke<void>('delete_server', { serverId }),
  
  setActiveServer: (serverId: string) => invoke<void>('set_active_server', { serverId }),
  
  getActiveServer: () => invoke<Server | null>('get_active_server'),
};

export const generateRandomColor = (): string => {
  const colors = [
    '#5865F2', // Blurple
    '#57F287', // Green
    '#FEE75C', // Yellow
    '#EB459E', // Fuchsia
    '#ED4245', // Red
    '#F26522', // Orange
    '#00D9FF', // Cyan
    '#A855F7', // Purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateServerId = (): string => {
  return `server_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
