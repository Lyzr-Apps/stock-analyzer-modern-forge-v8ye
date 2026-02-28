'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FiPlus, FiX } from 'react-icons/fi'

interface WatchlistPanelProps {
  watchlist: string[]
  onAddTicker: (ticker: string) => void
  onRemoveTicker: (ticker: string) => void
}

export default function WatchlistPanel({ watchlist, onAddTicker, onRemoveTicker }: WatchlistPanelProps) {
  const [tickerInput, setTickerInput] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const ticker = tickerInput.trim().toUpperCase()
    if (!ticker) {
      setError('Enter a ticker symbol')
      return
    }
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      setError('Ticker must be 1-5 uppercase letters')
      return
    }
    if (watchlist.includes(ticker)) {
      setError('Ticker already in watchlist')
      return
    }
    onAddTicker(ticker)
    setTickerInput('')
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="font-serif text-sm tracking-widest uppercase text-muted-foreground mb-6 font-normal">
        Watchlist
      </h2>

      <div className="flex gap-2 mb-4">
        <Input
          value={tickerInput}
          onChange={(e) => { setTickerInput(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. AAPL"
          className="font-sans text-sm tracking-wider bg-background border-border"
          maxLength={5}
        />
        <Button
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="px-4 tracking-wider text-xs uppercase font-sans border-border hover:bg-secondary"
        >
          <FiPlus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive mb-3 font-sans">{error}</p>
      )}

      {watchlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-sans text-center leading-relaxed">
            Add your first stock ticker to begin tracking
          </p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {watchlist.map((ticker) => (
            <Card key={ticker} className="border border-border bg-card shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="font-serif text-base tracking-wider font-normal">{ticker}</span>
                <button
                  onClick={() => onRemoveTicker(ticker)}
                  className="text-muted-foreground hover:text-destructive transition-colors duration-200 p-1"
                  aria-label={`Remove ${ticker}`}
                >
                  <FiX size={14} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground font-sans">
          {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'} tracked
        </p>
      </div>
    </div>
  )
}
