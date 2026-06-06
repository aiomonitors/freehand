import { contextBridge, ipcRenderer } from 'electron'

import { TODO_EXTRACT_CHANNEL } from '../shared/ipcChannels'
import type { ExtractTodosRequest, ExtractTodosResponse } from '../shared/todos'

const freehandApi = {
  extractTodos: (request: ExtractTodosRequest): Promise<ExtractTodosResponse> =>
    ipcRenderer.invoke(
      TODO_EXTRACT_CHANNEL,
      request,
    ) as Promise<ExtractTodosResponse>,
}

contextBridge.exposeInMainWorld('freehand', freehandApi)
