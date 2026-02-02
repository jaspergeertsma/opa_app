import { Volunteer, Role } from '../types'

export interface SchedulingResult {
    schedule_dates: {
        temp_id: string
        date: string
    }[]
    assignments: {
        role: Role
        volunteer_id: string
        date_temp_id: string
    }[]
}

// Weights
const WEIGHT_SHIFT = 1.0
const WEIGHT_RESERVE = 0.35

interface Candidate {
    id: string
    allow_double: boolean
    work_count: number
    reserve_count: number
    weighted_load: number
    role_counts: Record<Role, number> // New: Track specific roles
}

export function generateSchedule(
    year: number,
    dates: string[],
    availableVolunteers: Volunteer[]
): SchedulingResult {

    const scheduleResults: SchedulingResult = {
        schedule_dates: dates.map((d, i) => ({ temp_id: `d-${i}`, date: d })),
        assignments: []
    }

    // Initialize tracking
    const candidates: Candidate[] = availableVolunteers.map(v => ({
        id: v.id,
        allow_double: v.allow_double,
        work_count: 0,
        reserve_count: 0,
        weighted_load: 0,
        role_counts: { V1: 0, V2: 0, L1: 0, L2: 0, R1: 0, R2: 0 }
    }))

    const updateLoad = (c: Candidate, role: Role) => {
        c.role_counts[role]++

        if (role.startsWith('R')) {
            c.reserve_count++
        } else {
            c.work_count++
        }

        c.weighted_load = (c.work_count * WEIGHT_SHIFT) + (c.reserve_count * WEIGHT_RESERVE)
    }

    // --- PHASE A: WORK SHIFTS (V1, V2, L1, L2) ---
    const workRoles: Role[] = ['V1', 'V2', 'L1', 'L2']

    // Shuffle roles order slightly per day or stick to fixed? 
    // Fixed order V1->V2->L1->L2 is fine if our sorting logic is robust.

    for (const dateObj of scheduleResults.schedule_dates) {
        const assignedToday = new Set<string>()

        for (const role of workRoles) {
            // Sort Strategy:
            // 1. Lowest Total WORK count (primary fairness goal)
            // 2. Lowest count for THIS specific role (secondary fairness: rotation)
            // 3. Lowest Weighted Load (tiebreaker including reserves)
            // 4. Random tie-breaker (using ID + salt or just ID for determinism)

            candidates.sort((a, b) => {
                // 1. Total Work Balance
                if (a.work_count !== b.work_count) return a.work_count - b.work_count

                // 2. Specific Role Balance (Rotation)
                const roleCountDiff = a.role_counts[role] - b.role_counts[role]
                if (roleCountDiff !== 0) return roleCountDiff

                // 3. Overall Loas
                if (a.weighted_load !== b.weighted_load) return a.weighted_load - b.weighted_load

                return a.id.localeCompare(b.id) // deterministic tie-breaker
            })

            // Find best candidate not yet assigned today
            let best = candidates.find(c => !assignedToday.has(c.id))

            // Fallback: Double booking (if enabled)
            if (!best) {
                best = candidates
                    .filter(c => c.allow_double)
                    .sort((a, b) => a.weighted_load - b.weighted_load)
                [0]
            }

            if (best) {
                assignedToday.add(best.id)
                updateLoad(best, role)
                scheduleResults.assignments.push({
                    role,
                    volunteer_id: best.id,
                    date_temp_id: dateObj.temp_id
                })
            }
        }
    }

    // --- PHASE B: RESERVES (R1, R2) ---
    const reserveRoles: Role[] = ['R1', 'R2']

    for (const dateObj of scheduleResults.schedule_dates) {
        const workingTodayIds = new Set(
            scheduleResults.assignments
                .filter(a => a.date_temp_id === dateObj.temp_id)
                .map(a => a.volunteer_id)
        )

        for (const role of reserveRoles) {
            // Sort by Reserve Count first
            candidates.sort((a, b) => {
                if (a.reserve_count !== b.reserve_count) return a.reserve_count - b.reserve_count
                // Secondary: Try to balance specific reserve roles too? (R1 vs R2 not super important, but why not)
                if (a.role_counts[role] !== b.role_counts[role]) return a.role_counts[role] - b.role_counts[role]

                if (a.weighted_load !== b.weighted_load) return a.weighted_load - b.weighted_load
                return a.id.localeCompare(b.id)
            })

            let best = candidates.find(c => !workingTodayIds.has(c.id))

            if (!best) {
                // Fallback if everyone is working (extreme shortage) - pick least loaded worker
                best = candidates.sort((a, b) => a.weighted_load - b.weighted_load)[0]
            }

            if (best) {
                workingTodayIds.add(best.id)
                updateLoad(best, role)
                scheduleResults.assignments.push({
                    role,
                    volunteer_id: best.id,
                    date_temp_id: dateObj.temp_id
                })
            }
        }
    }

    return scheduleResults
}
