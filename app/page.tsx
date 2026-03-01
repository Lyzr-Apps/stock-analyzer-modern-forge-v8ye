'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import { updateScheduleMessage } from '@/lib/scheduler'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FiPlay, FiRefreshCw } from 'react-icons/fi'

import Header from './sections/Header'
import WatchlistPanel from './sections/WatchlistPanel'
import AnalysisDisplay from './sections/AnalysisDisplay'
import SettingsDrawer from './sections/SettingsDrawer'
import ScheduleManager from './sections/ScheduleManager'

const AGENT_ID = '69a2885363d7518fcdafa1e0'
const INITIAL_SCHEDULE_ID = '69a2885a25d4d77f732f17bc'

interface StockAnalysis {
  ticker: string
  company_name: string
  current_price: string
  daily_change: string
  percent_change: string
  context: string
}

interface AnalysisEntry {
  id: string
  date: string
  stocks: StockAnalysis[]
  market_overview: string
  key_highlights: string[]
  email_status: string
  forward_outlook: string
  analysis_date: string
  stockCount: number
  status: 'sent' | 'failed' | 'pending'
}

const SAMPLE_HISTORY: AnalysisEntry[] = [
  {
    id: 'sample-1',
    date: 'Feb 28, 2026 - 7:00 AM ET',
    stocks: [
      { ticker: 'AAPL', company_name: 'Apple Inc.', current_price: '$198.45', daily_change: '+$3.21', percent_change: '+1.64%', context: 'Strong iPhone demand in emerging markets driving continued growth. Services revenue hit a new all-time high last quarter.' },
      { ticker: 'TSLA', company_name: 'Tesla, Inc.', current_price: '$245.80', daily_change: '-$5.10', percent_change: '-2.03%', context: 'Facing increased competition in EV market. New factory delays weighing on near-term outlook despite strong long-term demand.' },
      { ticker: 'MSFT', company_name: 'Microsoft Corp.', current_price: '$425.30', daily_change: '+$7.85', percent_change: '+1.88%', context: 'Azure cloud revenue grew 29% YoY. AI integration across product suite creating new revenue streams.' },
    ],
    market_overview: 'Markets opened mixed with the S&P 500 up 0.3% as investors digest mixed economic data. The Federal Reserve minutes signaled a cautious approach to rate cuts, while strong corporate earnings continue to support equity valuations.',
    key_highlights: [
      'S&P 500 approaching all-time highs amid strong tech earnings',
      'Federal Reserve signals patience on rate cuts through mid-year',
      'AI infrastructure spending continues to accelerate across major tech firms',
      'Consumer sentiment index shows modest improvement for February',
    ],
    email_status: 'Sent successfully',
    forward_outlook: 'Watch for key inflation data release on Friday which could shift market expectations on rate policy. Tech earnings season continues next week with several semiconductor firms reporting.',
    analysis_date: '2026-02-28',
    stockCount: 3,
    status: 'sent',
  },
]

function parseAgentResponse(result: AIAgentResponse) {
  if (!result.success) return null
  const response = result.response
  let data: Record<string, unknown> | null = null
  const rawResult = response?.result
  if (typeof rawResult === 'string') {
    try { data = JSON.parse(rawResult) } catch { data = null }
  } else if (rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult)) {
    data = rawResult as Record<string, unknown>
  }
  if (data) {
    if (typeof data.text === 'string') {
      try {
        const parsed = JSON.parse(data.text as string)
        if (parsed?.stocks || parsed?.market_overview) return parsed
      } catch { /* ignore */ }
    }
    if (data.stocks || data.market_overview) return data
  }
  if (result.raw_response) {
    try {
      const parsed = JSON.parse(result.raw_response)
      const inner = parsed?.response?.result || parsed?.result || parsed
      if (inner?.stocks || inner?.market_overview) return inner
    } catch { /* ignore */ }
  }
  if (response?.message) {
    try {
      const parsed = JSON.parse(response.message)
      if (parsed?.stocks || parsed?.market_overview) return parsed
    } catch { /* ignore */ }
  }
  return data
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-serif mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm font-sans">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-sans tracking-wider uppercase"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [recipientEmail, setRecipientEmail] = useState('')
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisEntry[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [scheduleId, setScheduleId] = useState(INITIAL_SCHEDULE_ID)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('stock_watchlist')
    if (stored) { try { setWatchlist(JSON.parse(stored)) } catch { /* ignore */ } }
    const storedEmail = localStorage.getItem('stock_email')
    if (storedEmail) setRecipientEmail(storedEmail)
    const storedHistory = localStorage.getItem('stock_history')
    if (storedHistory) { try { setAnalysisHistory(JSON.parse(storedHistory)) } catch { /* ignore */ } }
    const storedTime = localStorage.getItem('stock_last_analysis')
    if (storedTime) setLastAnalysisTime(storedTime)
    const storedScheduleId = localStorage.getItem('stock_schedule_id')
    if (storedScheduleId) setScheduleId(storedScheduleId)
  }, [])

  const persistWatchlist = useCallback((list: string[]) => {
    setWatchlist(list)
    if (typeof window !== 'undefined') localStorage.setItem('stock_watchlist', JSON.stringify(list))
  }, [])

  const persistHistory = useCallback((history: AnalysisEntry[]) => {
    setAnalysisHistory(history)
    if (typeof window !== 'undefined') localStorage.setItem('stock_history', JSON.stringify(history))
  }, [])

  const handleAddTicker = (ticker: string) => {
    persistWatchlist([...watchlist, ticker])
  }

  const handleRemoveTicker = (ticker: string) => {
    persistWatchlist(watchlist.filter((t) => t !== ticker))
  }

  const handleSaveEmail = async (email: string) => {
    setIsSavingEmail(true)
    setSaveStatus(null)
    setRecipientEmail(email)
    if (typeof window !== 'undefined') localStorage.setItem('stock_email', email)
    try {
      const scheduleMessage = JSON.stringify({
        stocks: watchlist,
        recipientEmail: email,
        instruction: 'Run morning stock analysis for the configured watchlist and send email summary',
      })
      const result = await updateScheduleMessage(scheduleId, scheduleMessage)
      if (result.success && result.newScheduleId) {
        setScheduleId(result.newScheduleId)
        if (typeof window !== 'undefined') localStorage.setItem('stock_schedule_id', result.newScheduleId)
        setSaveStatus('Settings saved successfully')
      } else {
        setSaveStatus(result.error ?? 'Failed to sync schedule')
      }
    } catch {
      setSaveStatus('Failed to save settings')
    }
    setIsSavingEmail(false)
  }

  const handleRunAnalysis = async () => {
    if (watchlist.length === 0) {
      setAnalysisStatus('Add stocks to your watchlist first')
      return
    }
    if (!recipientEmail) {
      setAnalysisStatus('Configure email in settings first')
      return
    }
    setIsAnalyzing(true)
    setAnalysisStatus(null)
    try {
      const message = JSON.stringify({
        stocks: watchlist,
        recipientEmail: recipientEmail,
      })
      const result = await callAIAgent(message, AGENT_ID)
      const parsed = parseAgentResponse(result)
      const now = new Date()
      const dateStr = now.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
      const newEntry: AnalysisEntry = {
        id: `analysis-${now.getTime()}`,
        date: dateStr,
        stocks: Array.isArray(parsed?.stocks) ? parsed.stocks : [],
        market_overview: parsed?.market_overview ?? '',
        key_highlights: Array.isArray(parsed?.key_highlights) ? parsed.key_highlights : [],
        email_status: parsed?.email_status ?? (result.success ? 'Sent' : 'Failed'),
        forward_outlook: parsed?.forward_outlook ?? '',
        analysis_date: parsed?.analysis_date ?? now.toISOString().split('T')[0],
        stockCount: watchlist.length,
        status: result.success ? 'sent' : 'failed',
      }
      const updated = [newEntry, ...analysisHistory]
      persistHistory(updated)
      setLastAnalysisTime(dateStr)
      if (typeof window !== 'undefined') localStorage.setItem('stock_last_analysis', dateStr)
      setAnalysisStatus(result.success ? 'Analysis complete' : 'Analysis completed with issues')
    } catch {
      setAnalysisStatus('Analysis failed. Please try again.')
    }
    setIsAnalyzing(false)
  }

  const handleClearHistory = () => {
    persistHistory([])
    setLastAnalysisTime(null)
    if (typeof window !== 'undefined') localStorage.removeItem('stock_last_analysis')
  }

  const displayedHistory = showSample ? SAMPLE_HISTORY : analysisHistory
  const emailConfigured = recipientEmail.includes('@') && recipientEmail.includes('.')

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header
          lastAnalysisTime={showSample ? 'Feb 28, 2026 - 7:00 AM ET' : lastAnalysisTime}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 flex flex-col">
          <div className="px-8 py-4 flex items-center justify-between border-b border-border bg-card/50">
            <div className="flex items-center gap-6">
              <Button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || watchlist.length === 0}
                className="tracking-wider uppercase text-xs font-sans bg-primary text-primary-foreground hover:bg-primary/90 px-6"
              >
                {isAnalyzing ? (
                  <>
                    <FiRefreshCw size={13} className="mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiPlay size={13} className="mr-2" />
                    Run Analysis Now
                  </>
                )}
              </Button>
              {analysisStatus && (
                <span className={`text-xs font-sans ${analysisStatus.includes('complete') ? 'text-green-700' : 'text-destructive'}`}>
                  {analysisStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground font-sans tracking-wider uppercase cursor-pointer">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={setShowSample}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row">
            <div className="w-full lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border p-8">
              <WatchlistPanel
                watchlist={showSample ? ['AAPL', 'TSLA', 'MSFT'] : watchlist}
                onAddTicker={handleAddTicker}
                onRemoveTicker={handleRemoveTicker}
              />
            </div>

            <div className="w-full lg:w-3/5 p-8 flex flex-col">
              <div className="flex-1 mb-8">
                <AnalysisDisplay
                  analysisHistory={displayedHistory}
                  onClearHistory={handleClearHistory}
                />
              </div>

              <div className="border-t border-border pt-8">
                <ScheduleManager
                  emailConfigured={emailConfigured}
                  scheduleId={scheduleId}
                  onScheduleIdChange={setScheduleId}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-border px-8 py-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-sans tracking-wider">
                Powered by Market Pulse AM
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Provider: Perplexity (sonar-pro) / Tools: Gmail
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs text-muted-foreground font-sans">
                {isAnalyzing ? 'Processing' : 'Ready'}
              </span>
            </div>
          </div>
        </footer>

        <SettingsDrawer
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          recipientEmail={recipientEmail}
          onSaveEmail={handleSaveEmail}
          isSavingEmail={isSavingEmail}
          saveStatus={saveStatus}
        />
      </div>
    </ErrorBoundary>
  )
}
