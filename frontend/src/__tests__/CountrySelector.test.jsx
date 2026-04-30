import { render, screen, fireEvent } from '@testing-library/react'
import CountrySelector from '../components/CountrySelector'
import { CountryProvider } from '../contexts/CountryContext'

function renderSelector(onSelect = () => {}) {
  return render(
    <CountryProvider>
      <CountrySelector onSelect={onSelect} />
    </CountryProvider>
  )
}

describe('CountrySelector', () => {
  it('renders 3 country cards', () => {
    renderSelector()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('container has role=radiogroup', () => {
    renderSelector()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('calls onSelect when UK card is clicked', () => {
    const onSelect = vi.fn()
    renderSelector(onSelect)
    fireEvent.click(screen.getByText('United Kingdom'))
    expect(onSelect).toHaveBeenCalledWith('UK')
  })

  it('selected card has aria-checked=true', () => {
    renderSelector()
    fireEvent.click(screen.getByText('United States'))
    const usCard = screen.getByRole('radio', { name: /united states/i })
    expect(usCard).toHaveAttribute('aria-checked', 'true')
  })
})
