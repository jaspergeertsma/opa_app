const { createClient } = require('@supabase/supabase-js');

// Config
const supabaseUrl = 'https://pandqesnxpdvbsyclbts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbmRxZXNueHBkdmJzeWNsYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDIwNjYsImV4cCI6MjA4NTU3ODA2Nn0.JIPq72WBmE4BFsYDW3KsqnabUOzLb-GmegteCtEUpgM'
const supabase = createClient(supabaseUrl, supabaseKey);

// Data extracted from image
const scheduleName = 'Oud Papier 2026';
const year = 2026;

// Dates from header (dd MMM yyyy -> YYYY-MM-DD)
const dates = [
    '2026-01-10', // 10 jan 2026
    '2026-02-07', // 7 feb 2026
    '2026-03-07', // 7 mar 2026
    '2026-04-04', // 4 apr 2026
    '2026-05-02', // 2 may 2026
    '2026-05-30', // 30 may 2026
    '2026-06-27', // 27 jun 2026
    // Zomervakantie skipped
    '2026-08-29', // 29 aug 2026
    '2026-09-19', // 19 sep 2026
    '2026-10-17', // 17 oct 2026
    '2026-11-14', // 14 nov 2026
    '2026-12-12'  // 12 dec 2026
];

// Volunteer Data & Assignments
// Format: { name, phone, email, roles: [role_date_1, role_date_2, ...] }
// Roles match the index of 'dates' array. null = no assignment.
// Multiple roles like "L1/R" are split into separate entries if needed or handled as primary.
// Assuming "L1/L2" means they fill both slots or it's a split? The DB takes singular roles.
// For now, I'll pick the first one or create logic. 
// "R" -> Reserve (mapped to R1 or R2? Usually R1 is fine).
// "L1/L2" -> I will assign L1, user can adjust manually.
// "V1/V2" -> I will assign V1.

const volunteersData = [
    {
        name: 'Fam. Geertsma', phone: '06-30400746', email: 'jaspergeertsma@gmail.com',
        schedule: ['V1', 'L1', null, 'L1', null, 'L2', 'V2', 'R', 'L1', 'L2', 'L2', 'V1']
    },

    {
        name: 'Fam. Simon', phone: '06-53389559', email: 'marlsimon@live.nl',
        schedule: [null, null, 'R', null, 'L1', null, 'R', null, null, 'L2', 'V2', null]
    },

    {
        name: 'Fam. Top', phone: '06-26336838', email: 'ericagrift@hotmail.com',
        schedule: ['R', null, 'V1', null, 'R', 'L1', null, 'L2', null, 'V2', null, 'R']
    },

    {
        name: 'Fam. Kommer', phone: '06-13104506', email: 'alinebakker93@gmail.com',
        schedule: [null, 'L2', null, 'V1', 'R', null, 'L1', null, 'V2', null, 'R', null]
    },

    {
        name: 'Fam. Koopman', phone: '06-40464444', email: 'biavandenhazel@hotmail.com',
        schedule: [null, null, 'R', null, 'V1', null, null, 'V2', null, 'R', null, 'L1']
    },

    {
        name: 'Fam. Brendeke', phone: '06-44360230', email: 'gesinebrendeke@gmail.com',
        schedule: ['L1', null, 'L2', 'R', null, 'V1', null, null, 'R', null, null, 'V2']
    },

    {
        name: 'Fam. van de Ridder', phone: '06-13751424', email: 'hjvanderidder@gmail.com',
        schedule: [null, 'R', 'L1', null, null, 'V2', null, 'R', null, 'V1', null, 'L2']
    },

    {
        name: 'Fam. Hilbers', phone: '06-40035697', email: 'Fam.hilbers@gmail.com',
        schedule: ['L2', null, null, null, 'V2', null, 'R', null, 'V1', null, 'L1', null]
    },

    {
        name: 'Fam. Brussee', phone: '06-11655304', email: 'jbrusseejr@hotmail.com',
        schedule: ['R', null, null, 'V2', null, 'R', null, 'V1', null, 'L1', null, null]
    },

    {
        name: 'Fam. Bos', phone: '06-53622692', email: 'cbos@ceesbos.nl',
        schedule: [null, null, 'V2', null, null, 'R', null, 'L1', 'R', null, 'V1', null]
    },

    {
        name: 'Fam. Wassink', phone: '06-29572296', email: 'gewa3000@hotmail.com',
        schedule: ['V2', null, null, null, 'L2', null, 'V1', null, null, 'R', null, 'R']
    },

    {
        name: 'Fam. Doppenberg', phone: '06-10867863', email: 'w.doppenberg80@hetnet.nl',
        schedule: [null, 'V1', null, 'R', null, null, null, null, null, null, null, null]
    } // 'V1/V2' -> mapped to V1
];

// Map complex codes to DB allowed roles
const roleMap = {
    'V1': 'V1', 'V2': 'V2',
    'L1': 'L1', 'L2': 'L2',
    'R': 'R1',  // Default R to R1
    'L1/R': 'L1',
    'L1/L2': 'L1',
    'V2/L2': 'V2',
    'V1/V2': 'V1',
    'L2/R': 'L2'
};


async function importData() {
    console.log("🚀 Starting import for:", scheduleName);

    // 1. Create Schedule
    const { data: schedule, error: schedError } = await supabase
        .from('schedules')
        .insert({ name: scheduleName, year: year, is_active: true })
        .select()
        .single();

    if (schedError) {
        console.error("❌ Schedule create failed:", schedError);
        // Try fetching existing
        const { data: existing } = await supabase.from('schedules').select().eq('year', year).single();
        if (existing) {
            console.log("⚠️  Using existing schedule:", existing.id);
            return processSchedule(existing.id);
        }
        return;
    }

    console.log("✅ Schedule created:", schedule.id);
    await processSchedule(schedule.id);
}

async function processSchedule(scheduleId) {
    // 2. Create Dates
    const dateIdMap = []; // index -> uuid

    for (const dateStr of dates) {
        const { data: dateRec, error } = await supabase
            .from('schedule_dates')
            .insert({ schedule_id: scheduleId, date: dateStr })
            .select()
            .single();

        if (error) {
            console.error(`❌ Failed to insert date ${dateStr}:`, error.message);
        } else {
            dateIdMap.push(dateRec.id);
            console.log(`📅 Date created: ${dateRec.date}`);
        }
    }

    // 3. Process Volunteers & Assignments
    for (const v of volunteersData) {
        // Find or create volunteer
        let volunteerId;

        // Check by email
        const { data: existingV } = await supabase
            .from('volunteers')
            .select('id')
            .eq('email', v.email)
            .single();

        if (existingV) {
            volunteerId = existingV.id;
            // Update name/phone just in case? No, preserve existing.
            console.log(`👤 Found volunteer: ${v.name}`);
        } else {
            const { data: newV, error: vError } = await supabase
                .from('volunteers')
                .insert({
                    name: v.name,
                    email: v.email,
                    notes: `Phone: ${v.phone}` // Store phone in notes for now as we lack a column
                })
                .select()
                .single();

            if (vError) {
                console.error(`❌ Failed to create volunteer ${v.name}:`, vError.message);
                continue;
            }
            volunteerId = newV.id;
            console.log(`➕ Created volunteer: ${v.name}`);
        }

        // Create Assignments
        for (let i = 0; i < v.schedule.length; i++) {
            const rawRole = v.schedule[i];
            if (!rawRole) continue; // No duty

            const dbRole = roleMap[rawRole] || 'V1'; // Fallback
            const dateId = dateIdMap[i];

            if (!dateId) {
                console.warn(`⚠️  No date ID for index ${i} (Role: ${rawRole})`);
                continue;
            }

            const { error: assignError } = await supabase
                .from('assignments')
                .insert({
                    schedule_date_id: dateId,
                    volunteer_id: volunteerId,
                    role: dbRole
                });

            if (assignError) {
                console.error(`  ❌ Assignment failed (${v.name} on ${dates[i]}):`, assignError.message);
            } else {
                // console.log(`  ✅ Assigned ${v.name} to ${dbRole} on ${dates[i]}`);
            }
        }
    }
    console.log("🏁 Import finished!");
}

importData();
