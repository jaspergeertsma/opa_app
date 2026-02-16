
import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.7'
import { format, nextSaturday, startOfDay } from 'npm:date-fns@3'
import { nl } from 'npm:date-fns@3/locale'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Get query params
        const url = new URL(req.url)
        const manualTriggerDate = url.searchParams.get('date')

        console.log('Running reminder check...', manualTriggerDate ? `(Manual: ${manualTriggerDate})` : '(Scheduled)')

        // 1. Determine Target Date
        let targetDateStr: string
        let targetDate: Date

        if (manualTriggerDate) {
            targetDateStr = manualTriggerDate
            targetDate = new Date(manualTriggerDate)
        } else {
            const today = startOfDay(new Date())
            targetDate = nextSaturday(today)
            targetDateStr = format(targetDate, 'yyyy-MM-dd')
        }

        console.log(`Checking for collection on ${targetDateStr}`)

        // 2. Fetch Settings
        const { data: settingsData } = await supabaseAdmin.from('app_settings').select('*')
        const settings: Record<string, string> = {}
        if (settingsData) {
            settingsData.forEach((row: any) => settings[row.key] = row.value)
        }

        const adminEmail = settings.admin_email || Deno.env.get('ADMIN_EMAIL') || 'admin@school.nl'
        const adminName = settings.admin_name || 'Oud Papier Team'
        const ccs = [adminEmail]
        if (settings.cc_email_1) ccs.push(settings.cc_email_1)
        if (settings.cc_email_2) ccs.push(settings.cc_email_2)

        // 3. Fetch Schedule & Assignments
        const { data: dateRows, error: dError } = await supabaseAdmin
            .from('schedule_dates')
            .select(`
        *,
        assignments(
          role,
          volunteer:volunteers(id, name, email, notes)
        )
      `)
            .eq('date', targetDateStr)

        if (dError || !dateRows || dateRows.length === 0) {
            console.log('No collection found for date:', targetDateStr)
            return new Response(JSON.stringify({ message: 'No collection found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const schDate = dateRows[0]

        // Anti-spam check
        if (!manualTriggerDate && schDate.reminder_sent_at) {
            console.log('Reminder already sent.')
            return new Response(JSON.stringify({ message: 'Already sent' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const assignments = schDate.assignments || []

        // Data Preparation Helpers
        const getPhone = (notes: string | null) => {
            if (!notes) return ''
            const match = notes.match(/(?:06|0|\+31)[-\s0-9]{8,}/)
            return match ? `(${match[0]})` : ''
        }

        const times: Record<string, string> = {
            'V1': '09:00 – 09:45 uur', 'V2': '09:45 – 10:30 uur',
            'L1': '10:30 – 11:15 uur', 'L2': '11:15 – 12:00 uur',
            'R1': '09:00 – 12:00 uur (Stand-by)', 'R2': '09:00 – 12:00 uur (Stand-by)'
        }

        const roleOrder = ['V1', 'V2', 'L1', 'L2']
        const serviceLines = roleOrder.map(role => {
            const people = assignments.filter((a: any) => a.role === role)
            if (people.length === 0) return `- Dienst ${role}: (Nog niet ingevuld)`

            return people.map((p: any) => {
                const phone = getPhone(p.volunteer?.notes)
                return `- Dienst ${role} van ${times[role] || ''}: ${p.volunteer?.name} ${phone}`
            }).join('\n')
        }).join('\n')

        const reserveLines = assignments
            .filter((a: any) => ['R1', 'R2'].includes(a.role))
            .map((p: any) => {
                const phone = getPhone(p.volunteer?.notes)
                return `- ${p.volunteer?.name} (E-mail: ${p.volunteer?.email}) ${phone}`
            }).join('\n')

        // 4. Send Loop
        const smtpHost = Deno.env.get('SMTP_HOST')
        const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')
        const smtpUser = Deno.env.get('SMTP_USER')
        const smtpPass = Deno.env.get('SMTP_PASS')

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('Missing SMTP configuration')
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })

        let sentCount = 0

        for (const assignment of assignments) {
            if (!assignment.volunteer?.email) continue

            const vol = assignment.volunteer
            const role = assignment.role

            const rawSubject = settings.subject_template || 'Oud papier – planning voor zaterdag {DATE}'
            const rawBody = settings.text_template || '...'

            const placeholders: Record<string, string> = {
                '{SALUTATION}': vol.name.split(' ')[0],
                '{DATE}': format(targetDate, 'd MMMM', { locale: nl }),
                '{ROLE}': role,
                '{TIME_START}': (times[role] || '').split(' – ')[0] || '',
                '{TIME_END}': (times[role] || '').split(' – ')[1]?.replace(' uur', '') || '',
                '{ALL_SERVICES_LIST}': serviceLines,
                '{RESERVES_LIST}': reserveLines || '(Geen reserves ingepland)',
                '{ADMIN_NAME}': adminName,
                '{ADMIN_EMAIL}': adminEmail
            }

            let subject = rawSubject
            let body = rawBody

            Object.entries(placeholders).forEach(([k, v]) => {
                subject = subject.replace(new RegExp(k, 'g'), v)
                body = body.replace(new RegExp(k, 'g'), v)
            })

            const htmlBody = body.replace(/\n/g, '<br/>')

            const isTest = !!manualTriggerDate
            const recipientEmail = isTest ? adminEmail : vol.email

            let finalSubject = subject
            let finalHtmlBody = htmlBody

            if (isTest) {
                finalSubject = `[TEST] ${subject}`
                finalHtmlBody = `<p style="color: red; font-weight: bold;">⚠️ TEST MODUS: Dit bericht zou verzonden zijn naar ${vol.name} (${vol.email})</p><hr>${htmlBody}`
            }

            console.log(`Sending ${isTest ? 'TEST' : ''} to ${recipientEmail}...`)

            try {
                const info = await transporter.sendMail({
                    from: `"Oud Papier Planner" <${smtpUser}>`,
                    to: recipientEmail,
                    cc: isTest ? [] : ccs,
                    subject: finalSubject,
                    html: finalHtmlBody,
                })

                sentCount++

                await supabaseAdmin.from('notification_logs').insert({
                    volunteer_id: vol.id,
                    schedule_date_id: schDate.id,
                    sent_at: new Date().toISOString(),
                    to_email: vol.email,
                    subject,
                    body_text: body,
                    status: 'sent',
                    provider_message_id: info.messageId
                })
            } catch (sendError: any) {
                console.error(`Failed to send to ${recipientEmail}:`, sendError)
                await supabaseAdmin.from('notification_logs').insert({
                    volunteer_id: vol.id,
                    schedule_date_id: schDate.id,
                    sent_at: new Date().toISOString(),
                    to_email: vol.email,
                    subject,
                    body_text: body,
                    status: 'failed',
                    error: sendError.message
                })
            }
        }

        if (sentCount > 0 && !manualTriggerDate) {
            await supabaseAdmin.from('schedule_dates').update({ reminder_sent_at: new Date().toISOString() }).eq('id', schDate.id)
        }

        return new Response(JSON.stringify({ message: 'Process finished', sent: sentCount, success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err: any) {
        console.error('CRITICAL ERROR:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
