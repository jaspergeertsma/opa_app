import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from './DashboardLayout'
import { BrowserRouter } from 'react-router-dom'

// Mock de AuthContext, anders redirect hij naar login
vi.mock('../auth/AuthContext', () => ({
    useAuth: () => ({
        session: { user: { id: '123', email: 'test@example.com' } },
        user: { email: 'test@example.com' },
        loading: false,
        signOut: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock package.json import
vi.mock('../../../package.json', () => ({
    default: { version: '9.9.9-test' }
}))

describe('DashboardLayout', () => {
    it('displays the app version from package.json in the sidebar', () => {
        render(
            <BrowserRouter>
                <DashboardLayout />
            </BrowserRouter>
        )

        // Zoek naar de tekst "v9.9.9-test"
        const versionElement = screen.getByText(/v9.9.9-test/i)
        expect(versionElement).toBeInTheDocument()
    })
})
