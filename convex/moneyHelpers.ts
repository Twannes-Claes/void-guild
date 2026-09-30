import { MutationCtx } from './_generated/server'
import { Id } from './_generated/dataModel'

export function parseGpAmount(val: number | string | undefined | null): number {
    if (val === undefined || val === null) return 0
    if (typeof val === 'number') return val
    const clean = String(val).replace(/,/g, '')
    let totalGp = 0
    let matched = false
    const regex = /(\d+(?:\.\d+)?)\s*(pp|gp|sp|cp|platinum|gold|silver|copper)?/gi
    let match
    while ((match = regex.exec(clean)) !== null) {
        matched = true
        const num = parseFloat(match[1])
        const unit = (match[2] || 'GP').toUpperCase()
        if (unit === 'PP' || unit === 'PLATINUM') totalGp += num * 10
        else if (unit === 'GP' || unit === 'GOLD') totalGp += num
        else if (unit === 'SP' || unit === 'SILVER') totalGp += num / 10
        else if (unit === 'CP' || unit === 'COPPER') totalGp += num / 100
    }
    if (!matched) {
        const fallback = parseFloat(clean)
        if (!isNaN(fallback)) return fallback
    }
    return Math.round(totalGp * 100) / 100
}

/**
 * Adjusts a character's tracked purse currency by a delta in GP (positive for income, negative for expense).
 * Smart coin allocation preserves platinum pieces where possible and converts correctly across PP/GP/SP/CP.
 */
export async function adjustCharacterMoney(
    ctx: MutationCtx,
    characterId: Id<'characters'>,
    deltaGp: number
) {
    if (deltaGp === 0) return

    const deltaCp = Math.round(deltaGp * 100)
    if (deltaCp === 0) return

    const existingDetails = await ctx.db
        .query('characterDetails')
        .withIndex('by_characterId', (q) => q.eq('characterId', characterId))
        .first()

    let pp = existingDetails?.money?.pp || 0
    let gp = existingDetails?.money?.gp || 0
    let sp = existingDetails?.money?.sp || 0
    let cp = existingDetails?.money?.cp || 0

    if (deltaCp > 0) {
        // Gain: add GP and remaining SP/CP without disturbing PP
        const addGp = Math.floor(deltaCp / 100)
        const remCp = deltaCp % 100
        gp += addGp

        let newCp = cp + (remCp % 10)
        let newSp = sp + Math.floor(remCp / 10)
        if (newCp >= 10) {
            newSp += Math.floor(newCp / 10)
            newCp = newCp % 10
        }
        if (newSp >= 10) {
            gp += Math.floor(newSp / 10)
            newSp = newSp % 10
        }
        cp = newCp
        sp = newSp
    } else {
        // Expense: deduct from CP/SP/GP first, breaking PP only if necessary
        const subCp = Math.abs(deltaCp)
        const currentTotalCp = Math.round((pp * 1000) + (gp * 100) + (sp * 10) + cp)
        const newTotalCp = Math.max(0, currentTotalCp - subCp)

        if (newTotalCp === 0) {
            pp = 0
            gp = 0
            sp = 0
            cp = 0
        } else {
            const currentLowerCp = (gp * 100) + (sp * 10) + cp
            if (currentLowerCp >= subCp) {
                // Sufficient funds in GP/SP/CP, keep PP untouched
                const remLowerCp = currentLowerCp - subCp
                gp = Math.floor(remLowerCp / 100)
                sp = Math.floor((remLowerCp % 100) / 10)
                cp = remLowerCp % 10
            } else {
                // Break PP as needed
                pp = Math.floor(newTotalCp / 1000)
                const rem = newTotalCp % 1000
                gp = Math.floor(rem / 100)
                sp = Math.floor((rem % 100) / 10)
                cp = rem % 10
            }
        }
    }

    const totalInGold = Math.round(((pp * 10) + gp + (sp / 10) + (cp / 100)) * 100) / 100

    if (existingDetails) {
        await ctx.db.patch(existingDetails._id, {
            money: {
                pp,
                gp,
                sp,
                cp,
                totalInGold,
            },
            lastSyncedAt: Date.now(),
        })
    } else {
        const character = await ctx.db.get(characterId)
        if (character) {
            await ctx.db.insert('characterDetails', {
                characterId,
                name: character.name,
                level: character.lvl,
                xp: character.xp,
                class: character.class,
                ancestry: character.ancestry,
                money: {
                    pp,
                    gp,
                    sp,
                    cp,
                    totalInGold,
                },
                lastSyncedAt: Date.now(),
                system: character.system,
            })
        }
    }
}
