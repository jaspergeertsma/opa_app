
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Provide dummy values if missing to prevent startup crash. 
// Validated in handler later.
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeKey = supabaseServiceKey || 'placeholder-key'

export const supabaseAdmin = createClient(safeUrl, safeKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
