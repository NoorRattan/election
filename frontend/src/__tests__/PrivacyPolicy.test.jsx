/**
 * Unit tests for PrivacyPolicy page component.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import PrivacyPolicy from '../pages/PrivacyPolicy';

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>
  );
}

describe('PrivacyPolicy page', () => {
  it('page has exactly one h1 element containing "Privacy"', () => {
    renderPage();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/privacy/i);
  });

  it('page renders a "Privacy Policy" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /privacy policy/i, level: 1 })).toBeInTheDocument();
  });

  it('page includes section heading "What We Collect"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /what we collect/i })).toBeInTheDocument();
  });

  it('page includes section heading "Your Rights"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /your rights/i })).toBeInTheDocument();
  });

  it('page includes section heading "Third-Party Services"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /third-party services/i })).toBeInTheDocument();
  });

  it('"Back to Home" navigation link is present', () => {
    renderPage();
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
  });

  it('all external links have rel="noopener noreferrer"', () => {
    renderPage();
    const allLinks = screen.queryAllByRole('link');
    const externalLinks = allLinks.filter(
      (link) => link.getAttribute('href')?.startsWith('http')
    );
    externalLinks.forEach((link) => {
      const rel = link.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  });

  it('all external links have target="_blank"', () => {
    renderPage();
    const allLinks = screen.queryAllByRole('link');
    const externalLinks = allLinks.filter(
      (link) => link.getAttribute('href')?.startsWith('http')
    );
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('document title contains "Privacy" after render', () => {
    renderPage();
    expect(document.title).toMatch(/privacy/i);
  });

  it('page includes section heading "Analytics"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
  });
});
