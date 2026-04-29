import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

import { CountryProvider } from '../contexts/CountryContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Quiz from '../pages/Quiz';
import Timeline from '../pages/Timeline';
import TopicDetail from '../pages/TopicDetail';
import Topics from '../pages/Topics';

const timelineMock = vi.hoisted(() => ({
  state: {
    events: [],
    loading: false,
    error: null,
  },
}));

const topicsMock = vi.hoisted(() => ({
  state: {
    topics: [],
    loading: false,
    error: null,
  },
}));

const authMock = vi.hoisted(() => ({
  state: {
    user: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  },
}));

const quizMock = vi.hoisted(() => ({
  state: {
    status: 'idle',
    questions: [],
    currentIndex: 0,
    selectedAnswers: new Map(),
    results: null,
    errorMessage: '',
    loadQuiz: vi.fn(),
    selectAnswer: vi.fn(),
    nextQuestion: vi.fn(),
    submitQuiz: vi.fn(),
  },
}));

const apiMock = vi.hoisted(() => ({
  topicsApi: {
    getBySlug: vi.fn(),
  },
  userApi: {
    getProfile: vi.fn(),
    getProgress: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock('../hooks/useTimeline', () => ({
  useTimeline: () => timelineMock.state,
}));

vi.mock('../hooks/useTopics', () => ({
  useTopics: () => topicsMock.state,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authMock.state,
}));

vi.mock('../hooks/useQuiz', () => ({
  useQuiz: () => quizMock.state,
}));

vi.mock('../services/api', () => ({
  topicsApi: apiMock.topicsApi,
  userApi: apiMock.userApi,
}));

function renderWithProviders(ui, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CountryProvider>{ui}</CountryProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.title = '';
  vi.clearAllMocks();

  timelineMock.state = {
    events: [],
    loading: false,
    error: null,
  };
  topicsMock.state = {
    topics: [],
    loading: false,
    error: null,
  };
  authMock.state = {
    user: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  };
  quizMock.state = {
    status: 'idle',
    questions: [],
    currentIndex: 0,
    selectedAnswers: new Map(),
    results: null,
    errorMessage: '',
    loadQuiz: vi.fn(),
    selectAnswer: vi.fn(),
    nextQuestion: vi.fn(),
    submitQuiz: vi.fn(),
  };
});

describe('page smoke coverage', () => {
  it('Home renders country-specific CTAs and upcoming events', () => {
    localStorage.setItem('electra_country', 'UK');
    timelineMock.state = {
      events: [
        {
          id: 'future',
          name: 'Future Registration Deadline',
          date: '2099-06-01',
          type: 'deadline',
          description: 'Register before this date.',
          official_url: 'https://gov.uk',
        },
      ],
      loading: false,
      error: null,
    };

    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { name: /learn how elections work/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /explore topics/i })).toHaveAttribute('href', '/topics');
    expect(screen.getByText(/future registration deadline/i)).toBeVisible();
  });

  it('Topics renders mocked topic cards and category tabs', () => {
    topicsMock.state = {
      topics: [
        {
          slug: 'voter-registration',
          category: 'registration',
          country: ['UK'],
          title: 'Voter Registration',
        },
      ],
      loading: false,
      error: null,
    };

    renderWithProviders(<Topics />);

    expect(screen.getByRole('heading', { name: /explore topics/i })).toBeVisible();
    expect(screen.getByRole('tab', { name: /registration/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /voter registration/i })).toHaveAttribute(
      'href',
      '/topics/voter-registration'
    );
  });

  it('TopicDetail loads a topic and shows the unauthenticated quiz CTA', async () => {
    apiMock.topicsApi.getBySlug.mockResolvedValue({
      title: 'Voter Registration',
      country: ['UK'],
      prerequisites: ['eligibility'],
      content: '# Register to vote\n\nUse the official service.',
    });

    render(
      <MemoryRouter initialEntries={['/topics/voter-registration']}>
        <Routes>
          <Route path="/topics/:slug" element={<TopicDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /voter registration/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /sign in to take quiz/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('Timeline renders filters for the selected UK country', () => {
    localStorage.setItem('electra_country', 'UK');
    timelineMock.state = {
      events: [],
      loading: false,
      error: null,
    };

    renderWithProviders(<Timeline />);

    expect(screen.getByRole('heading', { name: /election timeline/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /all levels/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /^local$/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^state$/i })).not.toBeInTheDocument();
  });

  it('Quiz renders an active question for an authenticated user', () => {
    authMock.state = {
      ...authMock.state,
      user: { uid: 'user-1' },
      loading: false,
    };
    quizMock.state = {
      ...quizMock.state,
      status: 'active',
      questions: [
        {
          id: 'q1',
          question: 'What is a ballot?',
          options: ['A vote record', 'A tax form'],
        },
      ],
      currentIndex: 0,
      selectedAnswers: new Map(),
    };

    render(
      <MemoryRouter initialEntries={['/quiz/voter-registration']}>
        <Routes>
          <Route path="/quiz/:topicId" element={<Quiz />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /^quiz$/i })).toBeVisible();
    expect(screen.getByText(/what is a ballot/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /submit quiz/i })).toBeDisabled();
  });

  it('Login switches modes and validates mismatched signup passwords', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Login />, '/login');

    await user.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeVisible();

    await user.type(screen.getByLabelText(/email/i), 'voter@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret1');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret2');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i);
  });

  it('Profile loads account, progress, settings, and consent controls', async () => {
    apiMock.userApi.getProfile.mockResolvedValue({
      display_name: 'Ada Voter',
      email: 'ada@example.com',
      country: 'UK',
      age_group: '25-34',
      gdpr_consent_at: '2026-01-01T00:00:00.000Z',
      stats: {
        total_topics: 10,
        topics_completed: 4,
        average_quiz_score: 88,
      },
    });
    apiMock.userApi.getProgress.mockResolvedValue({
      progress: [{ topic_id: 'voter-registration', completed: true, quiz_score: 90 }],
    });
    apiMock.userApi.updateProfile.mockResolvedValue({});

    renderWithProviders(<Profile />, '/profile');

    expect(await screen.findByRole('heading', { name: /my profile/i })).toBeVisible();
    expect(screen.getByText(/ada@example.com/i)).toBeVisible();
    expect(screen.getByText(/4 of 10 topics completed/i)).toBeVisible();
    expect(screen.getByRole('switch', { name: /usage analytics/i })).toBeChecked();

    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } });
    await waitFor(() => {
      expect(apiMock.userApi.updateProfile).toHaveBeenCalledWith({ country: 'US' });
    });
  });

  it('NotFound provides recovery navigation', () => {
    renderWithProviders(<NotFound />, '/missing');

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /browse topics/i })).toHaveAttribute('href', '/topics');
  });
});
