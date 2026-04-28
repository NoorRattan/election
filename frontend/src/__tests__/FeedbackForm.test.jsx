/**
 * Unit tests for FeedbackForm component.
 *
 * Mocks: feedbackApi.submit
 * Wraps component in: MemoryRouter + CountryProvider
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

import FeedbackForm from '../components/feedback/FeedbackForm';
import { CountryProvider } from '../contexts/CountryContext';

// ── Mock API ───────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  feedbackApi: {
    submit: vi.fn(),
  },
}));

// Import after mock so the mock is applied
import { feedbackApi } from '../services/api';

// ── Helper ─────────────────────────────────────────────────────────────────
function renderWithProviders(ui, { country = null } = {}) {
  // Seed localStorage country if needed
  if (country) {
    localStorage.setItem('electra_country', country);
  } else {
    localStorage.removeItem('electra_country');
  }

  return render(
    <MemoryRouter>
      <CountryProvider>
        {ui}
      </CountryProvider>
    </MemoryRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message textarea with accessible label', () => {
    renderWithProviders(<FeedbackForm />);
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
  });

  it('renders category select with accessible label', () => {
    renderWithProviders(<FeedbackForm />);
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
  });

  it('renders character counter showing "0 / 2000 characters" initially', () => {
    renderWithProviders(<FeedbackForm />);
    expect(screen.getByText(/0 \/ 2000 characters/i)).toBeInTheDocument();
  });

  it('character counter updates as user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    const textarea = screen.getByRole('textbox', { name: /message/i });
    await user.type(textarea, 'Hello');

    expect(screen.getByText(/5 \/ 2000 characters/i)).toBeInTheDocument();
  });

  it('submit button is present and labelled "Send Feedback"', () => {
    renderWithProviders(<FeedbackForm />);
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument();
  });

  it('clicking Submit with empty message shows validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    const error = await screen.findByRole('alert');
    expect(error).toBeInTheDocument();
    expect(feedbackApi.submit).not.toHaveBeenCalled();
  });

  it('clicking Submit with valid data calls feedbackApi.submit with correct args', async () => {
    feedbackApi.submit.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm country="UK" />);

    const textarea = screen.getByRole('textbox', { name: /message/i });
    await user.type(textarea, 'This is valid feedback.');

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    await waitFor(() => {
      expect(feedbackApi.submit).toHaveBeenCalledWith(
        'This is valid feedback.',
        'suggestion', // default category
        'UK'
      );
    });
  });

  it('successful submit shows thank-you message', async () => {
    feedbackApi.submit.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Great app!');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    await screen.findByText(/thank you for your feedback/i);
    expect(screen.queryByRole('textbox', { name: /message/i })).not.toBeInTheDocument();
  });

  it('429 response shows "Too many requests" error message', async () => {
    feedbackApi.submit.mockRejectedValueOnce({ response: { status: 429 } });
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Rate limit test.');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    await screen.findByText(/too many requests/i);
  });

  it('other API error shows generic error message', async () => {
    feedbackApi.submit.mockRejectedValueOnce(new Error('Network Error'));
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Network error test.');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    await screen.findByText(/something went wrong/i);
  });

  it('if onClose prop is provided, Cancel button is visible', () => {
    const onClose = vi.fn();
    renderWithProviders(<FeedbackForm onClose={onClose} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('clicking Cancel calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('textarea has aria-describedby pointing to character counter id', () => {
    renderWithProviders(<FeedbackForm />);
    const textarea = screen.getByRole('textbox', { name: /message/i });
    const describedBy = textarea.getAttribute('aria-describedby');
    expect(describedBy).toContain('feedback-char-count');
  });

  it('after successful submit, focus moves to success message heading', async () => {
    feedbackApi.submit.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<FeedbackForm />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Focus test.');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    const heading = await screen.findByRole('heading', { name: /thank you/i });
    expect(heading).toBeInTheDocument();
    // Focus should have moved to heading (tabIndex=-1 set in component)
    await waitFor(() => {
      expect(document.activeElement?.textContent).toMatch(/thank you/i);
    });
  });
});
