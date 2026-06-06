import { contextBridge, ipcRenderer } from 'electron'

import {
  GOALS_EXTRACT_CHANNEL,
  REFLECTION_QUESTIONS_EXTRACT_CHANNEL,
  TODO_EXTRACT_CHANNEL,
} from '../shared/ipcChannels'
import type {
  ExtractGoalsRequest,
  ExtractGoalsResponse,
  ExtractReflectionQuestionsRequest,
  ExtractReflectionQuestionsResponse,
} from '../shared/reflections'
import type { ExtractTodosRequest, ExtractTodosResponse } from '../shared/todos'

const freehandApi = {
  extractTodos: (request: ExtractTodosRequest): Promise<ExtractTodosResponse> =>
    ipcRenderer.invoke(
      TODO_EXTRACT_CHANNEL,
      request,
    ) as Promise<ExtractTodosResponse>,
  extractGoals: (request: ExtractGoalsRequest): Promise<ExtractGoalsResponse> =>
    ipcRenderer.invoke(
      GOALS_EXTRACT_CHANNEL,
      request,
    ) as Promise<ExtractGoalsResponse>,
  extractReflectionQuestions: (
    request: ExtractReflectionQuestionsRequest,
  ): Promise<ExtractReflectionQuestionsResponse> =>
    ipcRenderer.invoke(
      REFLECTION_QUESTIONS_EXTRACT_CHANNEL,
      request,
    ) as Promise<ExtractReflectionQuestionsResponse>,
}

contextBridge.exposeInMainWorld('freehand', freehandApi)
