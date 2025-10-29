/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { MCPRequest } from "./request";

// 1. 单台 MCP 服务器配置
export interface MCPServerItem {
  command?: string;
  args?: string[];
  transport?: 'stdio' | 'sse' | 'streamable_http';
  [key: string]: any;   // 兼容后续扩展字段（env、cwd 等）
}

// 2. 服务器集合：键 = 任意服务器名
export interface MCPServers {
  [serverName: string]: MCPServerItem;
}

// 3. 根配置（后端返回的 config 字段）
export interface MCPConfig {
  mcpServers?: MCPServers;
}

export interface MCPResponse {
  code: string
  data: {
    mcp_config: MCPConfig
    message: string
  }
}

export interface MCPSaveResult {
  code: string
  data: {
    tools: string[]
    message: string
  }
}

export const mcpApi = {
  getMCP(params: any) {
    return MCPRequest<MCPResponse>({
      url: 'mcp',
      method: 'get',
      mock: false,
      data: params
    })
  },
  updateMCP(servers?: MCPServers) {
    //为请求载荷增加一层mcpServers字段，以便与后端匹配
    const cfg: MCPConfig = {mcpServers: servers ?? {}}
    return MCPRequest<MCPSaveResult>({
      url: 'mcp',
      method: 'post',
      mock: false,
      data: cfg
    })
  }
}
  