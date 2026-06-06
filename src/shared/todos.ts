export type ExtractedTodo = {
  id: string
  text: string
}

export type ExtractTodosRequest = {
  draftText: string
}

export type ExtractTodosResponse = {
  todos: ExtractedTodo[]
}
