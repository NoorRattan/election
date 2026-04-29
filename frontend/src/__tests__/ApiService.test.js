import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMock = vi.hoisted(() => {
  const requestHandlers = [];
  const responseErrorHandlers = [];

  const instance = {
    interceptors: {
      request: {
        use: vi.fn((handler) => requestHandlers.push(handler)),
      },
      response: {
        use: vi.fn((_success, error) => responseErrorHandlers.push(error)),
      },
    },
    get: vi.fn((url, config) => Promise.resolve({ data: { method: 'get', url, config } })),
    post: vi.fn((url, body) => Promise.resolve({ data: { method: 'post', url, body } })),
    put: vi.fn((url, body) => Promise.resolve({ data: { method: 'put', url, body } })),
    delete: vi.fn((url) => Promise.resolve({ data: { method: 'delete', url } })),
  };

  return {
    create: vi.fn(() => instance),
    instance,
    requestHandlers,
    responseErrorHandlers,
  };
});

const firebaseMock = vi.hoisted(() => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create,
  },
}));

vi.mock('../firebase', () => ({
  auth: firebaseMock.auth,
}));

describe('API service groups', () => {
  let services;

  beforeEach(async () => {
    vi.clearAllMocks();
    firebaseMock.auth.currentUser = null;
    firebaseMock.auth.signOut = vi.fn();
    window.history.replaceState(null, '', '/');
    services = await import('../services/api');
  });

  it('creates an axios instance with the API base URL and JSON headers', () => {
    expect(axiosMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      })
    );
  });

  it('attaches a Firebase bearer token when a current user exists', async () => {
    firebaseMock.auth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('token-123'),
    };

    const config = await axiosMock.requestHandlers[0]({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer token-123');
  });

  it('normalizes network errors without a response', async () => {
    const error = {};

    await expect(axiosMock.responseErrorHandlers[0](error)).rejects.toMatchObject({
      message: 'Network error. Please check your connection and try again.',
    });
  });

  it('calls typed endpoint helpers with expected paths and payloads', async () => {
    await services.topicsApi.getAll({ country: 'UK' });
    expect(axiosMock.instance.get).toHaveBeenCalledWith('/topics', { params: { country: 'UK' } });

    await services.topicsApi.getBySlug('voter-registration');
    expect(axiosMock.instance.get).toHaveBeenCalledWith('/topics/voter-registration');

    await services.timelineApi.getEvents('UK', 'local', 'London');
    expect(axiosMock.instance.get).toHaveBeenCalledWith('/timeline', {
      params: { country: 'UK', level: 'local', state_province: 'London' },
    });

    await services.quizApi.submitAnswers('topic-1', [{ question_id: 'q1', selected_index: 0 }]);
    expect(axiosMock.instance.post).toHaveBeenCalledWith('/quiz/submit', {
      topic_id: 'topic-1',
      answers: [{ question_id: 'q1', selected_index: 0 }],
    });

    await services.userApi.deleteAccount();
    expect(axiosMock.instance.delete).toHaveBeenCalledWith('/user/account');

    await services.chatApi.sendMessage('hello', 'session-1', 'UK', 'en-GB');
    expect(axiosMock.instance.post).toHaveBeenCalledWith('/chat', {
      message: 'hello',
      session_id: 'session-1',
      country: 'UK',
      language_code: 'en-GB',
    });

    await services.feedbackApi.submit('useful', 'content', 'UK');
    expect(axiosMock.instance.post).toHaveBeenCalledWith('/feedback', {
      message: 'useful',
      category: 'content',
      country: 'UK',
    });
  });
});
