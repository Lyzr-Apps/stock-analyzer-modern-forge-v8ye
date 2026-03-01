'use client'

import { FiSettings } from 'react-icons/fi'

interface HeaderProps {
  lastAnalysisTime: string | null
  onOpenSettings: () => void
}

export default function Header({ lastAnalysisTime, onOpenSettings }: HeaderProps) {
  return (
    <header className="border-b border-border px-8 py-6 flex items-center justify-between bg-card">
      <div>
        <h1 className="font-serif text-2xl tracking-widest uppercase font-light text-foreground">
          Market Pulse AM
        </h1>
        {lastAnalysisTime && (
          <p className="text-xs text-muted-foreground tracking-wider mt-1 font-sans">
            Last analysis: {lastAnalysisTime}
          </p>
        )}
        {!lastAnalysisTime && (
          <p className="text-xs text-muted-foreground tracking-wider mt-1 font-sans">
            No analysis run yet
          </p>
        )}
      </div>
      <button
        onClick={onOpenSettings}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
        aria-label="Settings"
      >
        <FiSettings size={20} />
      </button>
    </header>
  )
}
