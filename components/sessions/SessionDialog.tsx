'use client'

import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormEvent, useState } from 'react'
import { Id, Doc } from '@/convex/_generated/dataModel'
import { fireVoidParticles } from '@/lib/particles'
import { track } from '@vercel/analytics'
import { Sprout } from 'lucide-react'

interface SessionDialogProps {
  session?: Doc<'sessions'>
  trigger?: React.ReactNode
  hasWorld: boolean
  initialDate?: Date | number | string
}

function formatToDDMMYYYY(dateObjOrIso: Date | string | number | undefined): string {
  if (!dateObjOrIso) return ''
  const d = new Date(dateObjOrIso)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDDMMYYYY(str: string): { iso: string; valid: boolean } {
  const trimmed = str.trim()
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return { iso: '', valid: false }
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
    return { iso: '', valid: false }
  }
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { iso: '', valid: false }
  }
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { iso, valid: true }
}

export default function SessionDialog({ session, trigger, hasWorld, initialDate }: SessionDialogProps) {
  const createSession = useMutation(api.sessions.createSession)
  const updateSession = useMutation(api.sessions.updateSession)
  const deleteSession = useMutation(api.sessions.deleteSession)
  const userCharacters = useQuery(api.characters.listCharacters)
  const worldName = useQuery(api.worlds.getWorldByOwner) // Fetch the current world details to display the name

  const [displayDate, setDisplayDate] = useState(() => {
    if (session?.date) {
      return formatToDDMMYYYY(session.date)
    }
    if (initialDate) {
      return formatToDDMMYYYY(initialDate)
    }
    return ''
  })
  const [timeHour, setTimeHour] = useState(() => {
    if (session?.date) {
      const d = new Date(session.date)
      return String(d.getHours()).padStart(2, '0')
    }
    if (initialDate) {
      const d = new Date(initialDate)
      if (d.getHours() !== 0 || d.getMinutes() !== 0) {
        return String(d.getHours()).padStart(2, '0')
      }
    }
    return ''
  })
  const [timeMinute, setTimeMinute] = useState(() => {
    if (session?.date) {
      const d = new Date(session.date)
      return String(d.getMinutes()).padStart(2, '0')
    }
    if (initialDate) {
      const d = new Date(initialDate)
      if (d.getHours() !== 0 || d.getMinutes() !== 0) {
        return String(d.getMinutes()).padStart(2, '0')
      }
    }
    return '00'
  })
  // const [world, setWorld] = useState('') // Removed: world is now derived
  const [level, setLevel] = useState(session?.level?.toString() || '1')
  const [maxPlayers, setMaxPlayers] = useState(session?.maxPlayers?.toString() || '4')
  const [gmCharacter, setGmCharacter] = useState<Id<'characters'> | ''>(session?.gmCharacter || '')
  const [location, setLocation] = useState(session?.location || '')
  const [system, setSystem] = useState<'PF' | 'DnD'>(session?.system || 'PF')
  const [planning, setPlanning] = useState(session?.planning || false)
  const [isPrivate, setIsPrivate] = useState(session?.isPrivate || false)
  const [isIntro, setIsIntro] = useState(session?.isIntro || false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setErrors({})
    }
    if (open) {
      if (session) {
        if (session.date) {
            const d = new Date(session.date)
            setDisplayDate(formatToDDMMYYYY(d))
            setTimeHour(String(d.getHours()).padStart(2, '0'))
            setTimeMinute(String(d.getMinutes()).padStart(2, '0'))
        } else {
            setDisplayDate('')
            setTimeHour('')
            setTimeMinute('00')
        }
        
        // setWorld(session.world) // Removed: world is now derived
        const sessIntro = session.isIntro || false
        setIsIntro(sessIntro)
        setLevel(sessIntro ? (session.system === 'PF' ? '1' : '3') : (session.level?.toString() || ''))
        setMaxPlayers(session.maxPlayers.toString())
        setGmCharacter(session.gmCharacter || '')
        setLocation(session.location || '')
        setSystem(session.system || 'PF')
        setPlanning(session.planning || false)
        setIsPrivate(session.isPrivate || false)
      } else {
        if (initialDate) {
          const d = new Date(initialDate)
          setDisplayDate(formatToDDMMYYYY(d))
          if (typeof initialDate === 'number' || (typeof initialDate === 'object' && initialDate instanceof Date)) {
            if (d.getHours() !== 0 || d.getMinutes() !== 0) {
              setTimeHour(String(d.getHours()).padStart(2, '0'))
              setTimeMinute(String(d.getMinutes()).padStart(2, '0'))
            } else {
              setTimeHour('')
              setTimeMinute('00')
            }
          } else {
            setTimeHour('')
            setTimeMinute('00')
          }
        } else {
          setDisplayDate('')
          setTimeHour('')
          setTimeMinute('00')
        }
        // setWorld('') // Removed: world is now derived
        setIsIntro(false)
        setLevel('1')
        setMaxPlayers('4')
        setGmCharacter('')
        setLocation('')
        setSystem('PF')
        setPlanning(false)
        setIsPrivate(false)
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    let sessionDateTime: number | undefined = undefined;

    if (!planning) {
        if (!displayDate) {
          newErrors.date = "Date (DD/MM/YYYY) is required"
        } else {
          const parsed = parseDDMMYYYY(displayDate)
          if (!parsed.valid) {
            newErrors.date = "Please enter a valid date in DD/MM/YYYY format (e.g. 30/09/2026)"
          } else if (timeHour && timeMinute) {
            sessionDateTime = new Date(`${parsed.iso}T${timeHour}:${timeMinute}`).getTime()
            if (isNaN(sessionDateTime)) sessionDateTime = undefined
          }
        }
        if (!timeHour) {
          newErrors.time = "Arrival hour is required"
        }
    } else {
      if (displayDate) {
        const parsed = parseDDMMYYYY(displayDate)
        if (parsed.valid && timeHour && timeMinute) {
          sessionDateTime = new Date(`${parsed.iso}T${timeHour}:${timeMinute}`).getTime()
          if (isNaN(sessionDateTime)) sessionDateTime = undefined
        }
      }
    }
    
    const maxPlayersNum = parseInt(maxPlayers)
    if (isNaN(maxPlayersNum) || maxPlayersNum < 1) {
      newErrors.maxPlayers = "At least 1 player required"
    } else if (maxPlayersNum > 20) {
      newErrors.maxPlayers = "Max 20 players"
    }

    const levelNum = isIntro ? (system === 'PF' ? 1 : 3) : parseInt(level)
    if (!isIntro && level && levelNum !== 0 && (isNaN(levelNum) || levelNum < 1 || levelNum > 20)) {
      newErrors.level = "Level must be 1-20"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    let levelValue: number | undefined = isIntro ? (system === 'PF' ? 1 : 3) : parseInt(level)
    if (!isIntro && (isNaN(levelValue) || levelValue === 0)) {
      levelValue = undefined
    }

    const gmCharId = gmCharacter === '' ? undefined : gmCharacter as Id<'characters'>
    const locationVal = location === '' ? undefined : location

    setIsSubmitting(true)
    try {
      if (session) {
        await updateSession({
          sessionId: session._id,
          date: sessionDateTime,
          world: session.world, // Use existing session world
          level: levelValue,
          maxPlayers: maxPlayersNum,
          characters: session.characters,
          gmCharacter: gmCharId,
          location: locationVal,
          system: system,
          planning: planning,
          isPrivate: isPrivate,
          isIntro: isIntro,
        })
        track('session_updated', { worldName: worldName?.name, system, planning, isPrivate, isIntro });
      } else {
        // Trigger particle effect at the mouse position for new sessions
        if ('clientX' in event.nativeEvent) {
            const e = event.nativeEvent as MouseEvent;
            fireVoidParticles(e.clientX, e.clientY);
        }

        await createSession({
          date: sessionDateTime,
          // world, // Removed: world is now derived
          level: levelValue,
          maxPlayers: maxPlayersNum,
          characters: [],
          gmCharacter: gmCharId,
          location: locationVal,
          system: system,
          planning: planning,
          isPrivate: isPrivate,
          isIntro: isIntro,
        })
        track('session_created', { worldName: worldName?.name, system, planning, isPrivate, isIntro });
      }
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (session) {
      await deleteSession({ sessionId: session._id })
      track('session_deleted', { worldName: worldName?.name });
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={!hasWorld}>
            {session ? 'Edit' : 'New Session'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'Create a New Session'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-primary/20">
            <input 
              type="checkbox" 
              id="planning-toggle" 
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={planning}
              onChange={(e) => setPlanning(e.target.checked)}
            />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="planning-toggle"
                    className="text-sm font-bold leading-none cursor-pointer"
                >
                    Planning Phase
                </label>
                <p className="text-[10px] text-muted-foreground">
                    Gauge interest before setting a firm date. Signups will be disabled.
                </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-amber-500/20">
            <input 
              type="checkbox" 
              id="private-toggle" 
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="private-toggle"
                    className="text-sm font-bold leading-none cursor-pointer flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                >
                    <span>🔒 Private Session (Unlisted)</span>
                </label>
                <p className="text-[10px] text-muted-foreground">
                    Private sessions are not listed in the public session list. Players can only join when added manually by you.
                </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-emerald-500/20">
            <input 
              type="checkbox" 
              id="intro-toggle" 
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
              checked={isIntro}
              onChange={(e) => {
                const checked = e.target.checked
                setIsIntro(checked)
                if (checked) {
                  setLevel(system === 'PF' ? '1' : '3')
                  if (errors.level) setErrors({ ...errors, level: '' })
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="intro-toggle"
                    className="text-sm font-bold leading-none cursor-pointer flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                >
                    <Sprout className="h-4 w-4 shrink-0" />
                    <span>Intro Session (New Players)</span>
                </label>
                <p className="text-[10px] text-muted-foreground leading-normal">
                    For new players and beginners. No quest is required, and level is fixed to Level 1 (Pathfinder) or Level 3 (D&D).
                </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">System</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={system}
              onChange={(e) => {
                const newSystem = e.target.value as 'PF' | 'DnD'
                setSystem(newSystem)
                if (isIntro) {
                  setLevel(newSystem === 'PF' ? '1' : '3')
                }
              }}
            >
              <option value="PF">Pathfinder</option>
              <option value="DnD">Dungeons & Dragons</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">World</label>
            <Input
              value={worldName?.name || 'Loading World...'} // Display world name
              disabled // World name is not editable here
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Level {isIntro && "(Fixed for Intro)"}</label>
                <p className="text-[10px] text-muted-foreground -mt-1 italic">
                  {isIntro ? `Fixed at Level ${system === 'PF' ? '1' : '3'} for ${system === 'PF' ? 'Pathfinder' : 'D&D'}` : 'Level can be 0 or empty to set TBD'}
                </p>
                <Input
                type="number"
                min="0"
                max="20"
                placeholder={isIntro ? (system === 'PF' ? '1' : '3') : "TBD"}
                value={isIntro ? (system === 'PF' ? '1' : '3') : level}
                disabled={isIntro}
                onChange={(e) => {
                  setLevel(e.target.value)
                  if (errors.level) setErrors({ ...errors, level: '' })
                }}
                className={errors.level ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.level && <p className="text-[10px] text-destructive font-medium">{errors.level}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Max Players</label>
                <Input
                type="number"
                min="1"
                max="20"
                value={maxPlayers}
                onChange={(e) => {
                  setMaxPlayers(e.target.value)
                  if (errors.maxPlayers) setErrors({ ...errors, maxPlayers: '' })
                }}
                required
                className={errors.maxPlayers ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.maxPlayers && <p className="text-[10px] text-destructive font-medium">{errors.maxPlayers}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Award GM XP to: (only visible to you)</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={gmCharacter}
              onChange={(e) => setGmCharacter(e.target.value as Id<'characters'> | '')}
            >
              <option value="">-- No GM Character --</option>
              {userCharacters?.map((char) => (
                <option key={char._id} value={char._id}>
                  {char.name} (Lvl {char.lvl}{char.system ? ` - ${char.system}` : ''})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Location (Google Maps Link)</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="https://goo.gl/maps/..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date (DD/MM/YYYY) {planning && "(Optional)"}</label>
            <Input
              type="text"
              placeholder="DD/MM/YYYY (e.g. 30/09/2026)"
              value={displayDate}
              onChange={(e) => {
                setDisplayDate(e.target.value)
                if (errors.date) setErrors({ ...errors, date: '' })
              }}
              required={!planning}
              className={errors.date ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.date && <p className="text-[10px] text-destructive font-medium">{errors.date}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Arrival Time (24h) {planning && "(Optional)"}</label>
              <span className="text-[10px] text-muted-foreground">HH:mm (24-hour)</span>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-1 italic">
                Session starts 30 minutes after.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground font-medium">Hour (00-23)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={timeHour}
                  onChange={(e) => {
                    setTimeHour(e.target.value)
                    if (errors.time) setErrors({ ...errors, time: '' })
                  }}
                  disabled={planning}
                >
                  <option value="">-- Hour --</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = String(i).padStart(2, '0')
                    return (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground font-medium">Minute</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={timeMinute}
                  onChange={(e) => {
                    setTimeMinute(e.target.value)
                    if (errors.time) setErrors({ ...errors, time: '' })
                  }}
                  disabled={planning}
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.time && <p className="text-[10px] text-destructive font-medium">{errors.time}</p>}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between items-center sm:gap-2 pt-4">
            {session && (
              <Button type="button" variant="destructive" onClick={handleDelete} className="w-full sm:w-auto mt-2 sm:mt-0">
                Delete
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={(!planning && (!displayDate || !timeHour)) || !maxPlayers || isSubmitting}>
                {isSubmitting ? (session ? 'Updating...' : 'Creating...') : (session ? 'Update' : 'Create')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
