import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../hooks/useQuiz';

vi.mock('../services/api', () => ({
  quizApi: {
    getQuestions: vi.fn(),
    submitAnswers: vi.fn(),
  },
}));

describe('useQuiz', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initial status is idle', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.status).toBe('idle');
  });

  it('status becomes active after loadQuiz resolves', async () => {
    const { quizApi } = await import('../services/api');
    quizApi.getQuestions.mockResolvedValueOnce({ questions: [{ id: 'q1', question: 'Q?', options: ['A','B','C','D'], country: ['ALL'] }] });
    const { result } = renderHook(() => useQuiz());
    await act(async () => { await result.current.loadQuiz('voter-registration'); });
    expect(result.current.status).toBe('active');
    expect(result.current.questions).toHaveLength(1);
  });

  it('selectAnswer updates selectedAnswers map', async () => {
    const { quizApi } = await import('../services/api');
    quizApi.getQuestions.mockResolvedValueOnce({ questions: [{ id: 'q1', question: 'Q?', options: ['A','B','C','D'], country: ['ALL'] }] });
    const { result } = renderHook(() => useQuiz());
    await act(async () => { await result.current.loadQuiz('test'); });
    act(() => { result.current.selectAnswer('q1', 2); });
    expect(result.current.selectedAnswers.get('q1')).toBe(2);
  });

  it('nextQuestion increments currentIndex', async () => {
    const { quizApi } = await import('../services/api');
    quizApi.getQuestions.mockResolvedValueOnce({ questions: [
      { id: 'q1', question: 'Q1?', options: ['A','B','C','D'], country: ['ALL'] },
      { id: 'q2', question: 'Q2?', options: ['A','B','C','D'], country: ['ALL'] },
    ]});
    const { result } = renderHook(() => useQuiz());
    await act(async () => { await result.current.loadQuiz('test'); });
    act(() => result.current.nextQuestion());
    expect(result.current.currentIndex).toBe(1);
  });

  it('status becomes results after submitQuiz', async () => {
    const { quizApi } = await import('../services/api');
    quizApi.getQuestions.mockResolvedValueOnce({ questions: [{ id: 'q1', question: 'Q?', options: ['A','B','C','D'], country: ['ALL'] }] });
    quizApi.submitAnswers.mockResolvedValueOnce({ score: 100, total: 1, correct: 1, results: [] });
    const { result } = renderHook(() => useQuiz());
    await act(async () => { await result.current.loadQuiz('test'); });
    act(() => result.current.selectAnswer('q1', 0));
    await act(async () => { await result.current.submitQuiz('test'); });
    expect(result.current.status).toBe('results');
  });

  it('status becomes error when loadQuiz fails', async () => {
    const { quizApi } = await import('../services/api');
    quizApi.getQuestions.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useQuiz());
    await act(async () => { await result.current.loadQuiz('test'); });
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBeTruthy();
  });
});
