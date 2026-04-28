/**
 * Unit tests for AccessibilityStatement page component.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import AccessibilityStatement from '../pages/AccessibilityStatement';

function renderPage() {
  return render(
    <MemoryRouter>
      <AccessibilityStatement />
    </MemoryRouter>
  );
}

describe('AccessibilityStatement page', () => {
  it('page has exactly one h1 containing "Accessibility"', () => {
    renderPage();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/accessibility/i);
  });

  it('section heading "Our Commitment" is present', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /our commitment/i })).toBeInTheDocument();
  });

  it('section heading "Technical Specification" is present', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /technical specification/i })
    ).toBeInTheDocument();
  });

  it('section heading "Known Limitations" is present', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /known limitations/i })).toBeInTheDocument();
  });

  it('section heading "Testing Approach" is present', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /testing approach/i })).toBeInTheDocument();
  });

  it('section heading "Feedback and Contact" is present', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /feedback and contact/i })).toBeInTheDocument();
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

  it('document title contains "Accessibility" after render', () => {
    renderPage();
    expect(document.title).toMatch(/accessibility/i);
  });

  it('page mentions "WCAG 2.1" in content', () => {
    renderPage();
    expect(screen.getAllByText(/WCAG 2\.1/)[0]).toBeInTheDocument();
  });
});
