import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChatWidget from '../components/chat/ChatWidget'
import { CountryProvider } from '../contexts/CountryContext'

vi.mock('../services/api', () => ({
  chatApi: {
    sendMessage: vi.fn(() => Promise.resolve({ reply: 'Test reply', suggested_topics: [] })),
  },
}))

function renderWidget() {
  return render(
    <MemoryRouter>
      <CountryProvider>
        <ChatWidget />
      </CountryProvider>
    </MemoryRouter>
  )
}

describe('ChatWidget', () => {
  it('renders the chat toggle button', () => {
    renderWidget()
    expect(screen.getByLabelText(/open chat assistant/i)).toBeInTheDocument()
  })

  it('opens the chat panel when button is clicked', () => {
    renderWidget()
    fireEvent.click(screen.getByLabelText(/open chat assistant/i))
    expect(screen.getByRole('dialog', { name: /chat assistant/i })).toBeInTheDocument()
  })

  it('panel has role=log for message list', () => {
    renderWidget()
    fireEvent.click(screen.getByLabelText(/open chat assistant/i))
    expect(screen.getByRole('log')).toBeInTheDocument()
  })

  it('calls chatApi.sendMessage when send button clicked', async () => {
    const { chatApi } = await import('../services/api')
    renderWidget()
    fireEvent.click(screen.getByLabelText(/open chat assistant/i))
    fireEvent.change(screen.getByPlaceholderText(/ask about elections/i), {
      target: { value: 'How do I vote?' },
    })
    fireEvent.click(screen.getByLabelText(/send message/i))
    await waitFor(() => expect(chatApi.sendMessage).toHaveBeenCalled())
  })
})
