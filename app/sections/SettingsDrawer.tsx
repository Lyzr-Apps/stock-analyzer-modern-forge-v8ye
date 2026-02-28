'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail: string
  onSaveEmail: (email: string) => Promise<void>
  isSavingEmail: boolean
  saveStatus: string | null
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'UTC', label: 'UTC' },
]

export default function SettingsDrawer({
  isOpen,
  onClose,
  recipientEmail,
  onSaveEmail,
  isSavingEmail,
  saveStatus,
}: SettingsDrawerProps) {
  const [email, setEmail] = useState(recipientEmail)
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York')

  useEffect(() => {
    setEmail(recipientEmail)
  }, [recipientEmail])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('stock_timezone') : null
    if (stored) setSelectedTimezone(stored)
  }, [])

  const handleSave = async () => {
    if (!email || !email.includes('@')) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('stock_timezone', selectedTimezone)
    }
    await onSaveEmail(email)
  }

  const isValidEmail = email.includes('@') && email.includes('.')

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-lg flex flex-col transition-transform duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-sm tracking-widest uppercase font-normal">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Close settings"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-3">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Recipient Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="font-sans text-sm bg-background border-border"
            />
            <p className="text-xs text-muted-foreground font-sans">
              Analysis reports will be sent to this address
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Delivery Time
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value="7:00 AM"
                readOnly
                className="font-sans text-sm bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
              />
              <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">Weekdays</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Schedule is fixed to weekdays at 7:00 AM
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Timezone
            </Label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="font-sans text-sm bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="font-sans text-sm">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {saveStatus && (
            <div className={`flex items-center gap-2 p-3 text-sm font-sans ${saveStatus.includes('success') || saveStatus.includes('saved') ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
              {saveStatus.includes('success') || saveStatus.includes('saved') ? (
                <FiCheck size={14} />
              ) : (
                <FiAlertCircle size={14} />
              )}
              {saveStatus}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!isValidEmail || isSavingEmail}
            className="w-full tracking-wider uppercase text-xs font-sans bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSavingEmail ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </>
  )
}
