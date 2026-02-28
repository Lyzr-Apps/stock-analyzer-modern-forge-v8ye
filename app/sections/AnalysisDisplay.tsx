'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiChevronDown, FiChevronRight, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

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

interface AnalysisDisplayProps {
  analysisHistory: AnalysisEntry[]
  onClearHistory: () => void
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-serif font-normal text-sm mt-3 mb-1 tracking-wide">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-serif font-normal text-base mt-3 mb-1 tracking-wide">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-serif font-normal text-lg mt-4 mb-2 tracking-wide">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm font-sans">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm font-sans">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm font-sans">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium">{part}</strong> : part
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent': return 'bg-green-100 text-green-800 border-green-200'
    case 'failed': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
}

function isPositiveChange(change: string): boolean {
  if (!change) return false
  const num = parseFloat(change.replace(/[^-\d.]/g, ''))
  return !isNaN(num) && num >= 0
}

export default function AnalysisDisplay({ analysisHistory, onClearHistory }: AnalysisDisplayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-sm tracking-widest uppercase text-muted-foreground font-normal">
          Analysis History
        </h2>
        {analysisHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-muted-foreground hover:text-foreground tracking-wider uppercase font-sans transition-colors duration-200"
          >
            Clear
          </button>
        )}
      </div>

      {analysisHistory.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              No analyses yet
            </p>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              Run an analysis to see results here
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-2">
            {analysisHistory.map((entry) => (
              <Card key={entry.id} className="border border-border bg-card shadow-none">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {expandedId === entry.id ? (
                        <FiChevronDown size={14} className="text-muted-foreground" />
                      ) : (
                        <FiChevronRight size={14} className="text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-sans font-normal">{entry.date}</p>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">
                          {entry.stockCount} {entry.stockCount === 1 ? 'stock' : 'stocks'} analyzed
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs tracking-wider uppercase font-sans border ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </Badge>
                  </button>

                  {expandedId === entry.id && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-5">
                      {entry.market_overview && (
                        <div>
                          <h4 className="font-serif text-xs tracking-widest uppercase text-muted-foreground mb-2">Market Overview</h4>
                          <div className="text-sm font-sans text-foreground">{renderMarkdown(entry.market_overview)}</div>
                        </div>
                      )}

                      {Array.isArray(entry.key_highlights) && entry.key_highlights.length > 0 && (
                        <div>
                          <h4 className="font-serif text-xs tracking-widest uppercase text-muted-foreground mb-2">Key Highlights</h4>
                          <ul className="space-y-1">
                            {entry.key_highlights.map((h, i) => (
                              <li key={i} className="text-sm font-sans text-foreground flex items-start gap-2">
                                <span className="text-primary mt-1 shrink-0">--</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(entry.stocks) && entry.stocks.length > 0 && (
                        <div>
                          <h4 className="font-serif text-xs tracking-widest uppercase text-muted-foreground mb-2">Stock Details</h4>
                          <div className="space-y-2">
                            {entry.stocks.map((stock, i) => (
                              <div key={i} className="border border-border p-3 bg-secondary/30">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-serif text-sm tracking-wider font-normal">{stock?.ticker ?? 'N/A'}</span>
                                    <span className="text-xs text-muted-foreground font-sans">{stock?.company_name ?? ''}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isPositiveChange(stock?.daily_change ?? '') ? (
                                      <FiTrendingUp size={14} className="text-green-600" />
                                    ) : (
                                      <FiTrendingDown size={14} className="text-red-600" />
                                    )}
                                    <span className="font-sans text-sm font-normal">{stock?.current_price ?? '--'}</span>
                                    <span className={`text-xs font-sans ${isPositiveChange(stock?.daily_change ?? '') ? 'text-green-600' : 'text-red-600'}`}>
                                      {stock?.daily_change ?? ''} ({stock?.percent_change ?? ''})
                                    </span>
                                  </div>
                                </div>
                                {stock?.context && (
                                  <p className="text-xs text-muted-foreground font-sans mt-1 leading-relaxed">{stock.context}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.forward_outlook && (
                        <div>
                          <h4 className="font-serif text-xs tracking-widest uppercase text-muted-foreground mb-2">Forward Outlook</h4>
                          <div className="text-sm font-sans text-foreground">{renderMarkdown(entry.forward_outlook)}</div>
                        </div>
                      )}

                      {entry.email_status && (
                        <p className="text-xs text-muted-foreground font-sans">
                          Email: {entry.email_status}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
