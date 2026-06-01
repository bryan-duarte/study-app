/**
 * Quiz Data Repository
 * Singleton pattern for centralized data access
 * Validates questions.json at boundary, returns domain types
 */

import {
  Question,
  QuestionDTO,
  ValidationError,
  validateQuestionDTO,
  toDomain,
} from '../types/question'

const QUESTIONS_FILE_PATH = '/questions.json'

interface DataState {
  readonly questions: readonly Question[]
  readonly isLoaded: boolean
}

const INITIAL_STATE: DataState = {
  questions: [],
  isLoaded: false,
}

class QuizRepository {
  private state: DataState = INITIAL_STATE

  private constructor() {}

  static readonly instance = new QuizRepository()

  private async fetchQuestionsData(): Promise<unknown> {
    const response = await fetch(QUESTIONS_FILE_PATH)

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.statusText}`)
    }

    return response.json()
  }

  private validateArray(value: unknown): readonly QuestionDTO[] {
    if (!Array.isArray(value)) {
      throw new ValidationError('Expected array of questions', 'questions', value)
    }

    if (value.length === 0) {
      throw new ValidationError('Questions array cannot be empty', 'questions', value)
    }

    return value.map((item, index) => {
      try {
        return validateQuestionDTO(item)
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ValidationError(
            error.message,
            `questions[${index}].${error.field}`,
            error.value
          )
        }
        throw error
      }
    })
  }

  async loadQuestions(): Promise<void> {
    if (this.state.isLoaded) {
      return
    }

    const rawData = await this.fetchQuestionsData()
    const validatedDTOs = this.validateArray(rawData)
    const domainQuestions = validatedDTOs.map(toDomain)

    this.state = {
      questions: domainQuestions,
      isLoaded: true,
    }
  }

  getAllQuestions(): readonly Question[] {
    if (!this.state.isLoaded) {
      throw new Error('QuizRepository not loaded. Call loadQuestions() first.')
    }

    return this.state.questions
  }

  getQuestionByIndex(index: number): Question {
    const questions = this.getAllQuestions()

    if (index < 0 || index >= questions.length) {
      throw new Error(
        `Question index ${index} out of bounds. Valid range: 0-${questions.length - 1}`
      )
    }

    return questions[index]
  }

  getQuestionsCount(): number {
    return this.getAllQuestions().length
  }

  reset(): void {
    this.state = INITIAL_STATE
  }
}

export const quizRepository = QuizRepository.instance
