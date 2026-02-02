import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Smoke Test', () => {
    it('renders login page by default (redirects from /)', () => {
        render(<App />)
        // Check if we are redirected to login (which shows the App title)
        const titleElement = screen.getByText('Oud Papier Planner')
        expect(titleElement).toBeInTheDocument()
    })
})
