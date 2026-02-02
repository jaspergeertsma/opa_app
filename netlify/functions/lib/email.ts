
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
// Assuming a verified domain or use standard 'onboarding@resend.dev' for testing if not set
export const resend = new Resend(resendApiKey)

export const sendReminderEmail = async (
    to: string,
    subject: string,
    html: string,
    cc: string[] = []
) => {
    if (!resendApiKey) {
        console.log('Mock Email:', { to, subject, cc })
        return { id: 'mock', error: null }
    }

    try {
        const data = await resend.emails.send({
            from: 'Oud Papier <planner@oudpapier.school>', // Update this with verified domain
            to,
            cc,
            subject,
            html,
        })
        return { data, error: null }
    } catch (error) {
        console.error('Email Error:', error)
        return { data: null, error }
    }
}
