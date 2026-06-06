export type ExtractedGoal = {
  id: string
  text: string
  rationale: string
}

export type ExtractGoalsRequest = {
  draftText: string
}

export type ExtractGoalsResponse = {
  goals: ExtractedGoal[]
}

export type ExtractedReflectionQuestion = {
  id: string
  text: string
}

export type ExtractReflectionQuestionsRequest = {
  draftText: string
}

export type ExtractReflectionQuestionsResponse = {
  questions: ExtractedReflectionQuestion[]
}
