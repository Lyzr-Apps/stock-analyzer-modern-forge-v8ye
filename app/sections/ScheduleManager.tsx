'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  listSchedules,
  getScheduleLogs,
  pauseSchedule,
  resumeSchedule,
  cronToHuman,
} from '@/lib/scheduler'
import type { Schedule, ExecutionLog } from '@/lib/scheduler'
import { FiPlay, FiPause, FiClock, FiCalendar, FiRefreshCw, FiAlertCircle, FiCheck } from 'react-icons/fi'

const SCHEDULE_ID_INITIAL = '69a2885a25d4d77f732f17bc'

interface ScheduleManagerProps {
  emailConfigured: boolean
  scheduleId: string
  onScheduleIdChange: (newId: string) => void
}

export default function ScheduleManager({ emailConfigured, scheduleId, onScheduleIdChange }: ScheduleManagerProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const loadScheduleData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listSchedules()
      if (result.success && Array.isArray(result.schedules)) {
        const found = result.schedules.find((s) => s.id === scheduleId)
        setSchedule(found ?? null)
      }
      // Don't show error for initial load failures - schedule may not exist yet
    } catch {
      // Silently handle - schedule data is supplementary
    }

    try {
      const logsResult = await getScheduleLogs(scheduleId, { limit: 5 })
      if (logsResult.success && Array.isArray(logsResult.executions)) {
        setLogs(logsResult.executions)
      }
    } catch {
      // Silently handle - logs are supplementary
    }
    setLoading(false)
  }

  useEffect(() => {
    loadScheduleData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId])

  const handleToggle = async () => {
    if (!emailConfigured && !schedule?.is_active) {
      setStatusMsg('Configure email in settings before activating')
      return
    }
    setToggling(true)
    setStatusMsg(null)
    setError(null)
    try {
      const result = schedule?.is_active
        ? await pauseSchedule(scheduleId)
        : await resumeSchedule(scheduleId)

      if (result.success) {
        setStatusMsg(schedule?.is_active ? 'Schedule paused' : 'Schedule activated')
      } else {
        setError(result.error ?? 'Failed to toggle schedule')
      }
      await loadScheduleData()
    } catch {
      setError('Failed to toggle schedule')
    }
    setToggling(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div>
      <h2 className="font-serif text-sm tracking-widest uppercase text-muted-foreground mb-4 font-normal">
        Schedule
      </h2>

      <Card className="border border-border bg-card shadow-none mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${schedule?.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
              <span className="text-sm font-sans font-normal">
                {schedule?.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
            <Button
              onClick={handleToggle}
              disabled={toggling || loading || (!emailConfigured && !schedule?.is_active)}
              variant="outline"
              size="sm"
              className="tracking-wider text-xs uppercase font-sans border-border"
            >
              {toggling ? (
                <FiRefreshCw size={12} className="mr-1 animate-spin" />
              ) : schedule?.is_active ? (
                <FiPause size={12} className="mr-1" />
              ) : (
                <FiPlay size={12} className="mr-1" />
              )}
              {schedule?.is_active ? 'Pause' : 'Activate'}
            </Button>
          </div>

          {!emailConfigured && !schedule?.is_active && (
            <p className="text-xs text-destructive font-sans flex items-center gap-1">
              <FiAlertCircle size={12} />
              Configure email in settings to activate
            </p>
          )}

          {statusMsg && (
            <p className="text-xs font-sans flex items-center gap-1 text-green-700">
              <FiCheck size={12} />
              {statusMsg}
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive font-sans flex items-center gap-1">
              <FiAlertCircle size={12} />
              {error}
            </p>
          )}

          <div className="space-y-2 text-sm font-sans">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FiClock size={13} />
              <span className="text-xs">
                {schedule?.cron_expression ? cronToHuman(schedule.cron_expression) : 'Weekdays at 7:00'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FiCalendar size={13} />
              <span className="text-xs">
                Next: {formatDate(schedule?.next_run_time ?? null)}
              </span>
            </div>
            {schedule?.last_run_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiRefreshCw size={13} />
                <span className="text-xs">
                  Last: {formatDate(schedule.last_run_at)}
                  {schedule.last_run_success !== null && (
                    <span className={schedule.last_run_success ? ' text-green-600' : ' text-red-600'}>
                      {schedule.last_run_success ? ' (Success)' : ' (Failed)'}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <div>
          <h3 className="font-serif text-xs tracking-widest uppercase text-muted-foreground mb-3 font-normal">
            Recent Runs
          </h3>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 border border-border bg-secondary/20 text-xs font-sans">
                  <span className="text-muted-foreground">{formatDate(log.executed_at)}</span>
                  <Badge variant="outline" className={`text-xs font-sans border ${log.success ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <button
        onClick={loadScheduleData}
        disabled={loading}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground font-sans tracking-wider uppercase transition-colors duration-200 flex items-center gap-1"
      >
        <FiRefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
  )
}
