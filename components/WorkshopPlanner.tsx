'use client'

import '../app/workshop/[id]/planner.css'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PointerEvent } from 'react'
import type { WorkshopRow } from '../lib/types'

type BolkType = 'activity' | 'pause' | 'info'

type Bolk = {
  id: string
  title: string
  duration: number
  notes: string
  type: BolkType
}

type PlannerData = {
  startTime: string
  endTime: string
  bolker: Bolk[]
}

type PlannerState = PlannerData & {
  title: string
}

function parseTime(str: string) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime(totalMin: number) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function computeSlots(bolker: Bolk[], startTime: string) {
  let cursor = parseTime(startTime)
  return bolker.map((b) => {
    const start = cursor
    cursor += b.duration
    return { ...b, startMin: start, endMin: cursor }
  })
}

const TYPES: Array<{ value: BolkType; label: string }> = [
  { value: 'activity', label: 'Aktivitet' },
  { value: 'pause', label: 'Pause' },
  { value: 'info', label: 'Info' },
]

const TYPE_STYLE: Record<BolkType, { bg: string; border: string; chip: string; chipText: string; bar: string }> = {
  activity: { bg: '#fff', border: '#e8e8e8', chip: '#111', chipText: '#fff', bar: '#111' },
  pause: { bg: '#FFF8EE', border: '#F5D9A8', chip: '#E07A00', chipText: '#fff', bar: '#E07A00' },
  info: { bg: '#EEF4FF', border: '#BAD0FB', chip: '#2563EB', chipText: '#fff', bar: '#2563EB' },
}

const DEFAULT_DATA: PlannerData = {
  startTime: '09:00',
  endTime: '15:00',
  bolker: [
    { id: uid(), title: 'Intro og velkommen', duration: 15, notes: '', type: 'activity' },
    { id: uid(), title: 'Kontekst og mål', duration: 30, notes: '', type: 'activity' },
    { id: uid(), title: 'Pause', duration: 15, notes: '', type: 'pause' },
    { id: uid(), title: 'Gruppearbeid', duration: 60, notes: '', type: 'activity' },
    { id: uid(), title: 'Oppsummering', duration: 20, notes: '', type: 'info' },
  ],
}

function useDragSort(items: Bolk[], onReorder: (next: Bolk[]) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const dragging = useRef(false)
  const itemEls = useRef<Array<HTMLDivElement | null>>([])

  function getIndexAtY(y: number) {
    for (let i = 0; i < itemEls.current.length; i++) {
      const el = itemEls.current[i]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (y >= r.top && y <= r.bottom) return i
    }
    return null
  }

  function gripProps(idx: number) {
    return {
      onPointerDown(e: PointerEvent<HTMLDivElement>) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        setDragIdx(idx)
        setOverIdx(idx)
      },
      onPointerMove(e: PointerEvent<HTMLDivElement>) {
        if (!dragging.current) return
        e.preventDefault()
        const hit = getIndexAtY(e.clientY)
        if (hit !== null) setOverIdx(hit)
      },
      onPointerUp() {
        if (!dragging.current) return
        dragging.current = false
        const from = dragIdx
        const to = overIdx
        setDragIdx(null)
        setOverIdx(null)
        if (from !== null && to !== null && from !== to) {
          const next = [...items]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          onReorder(next)
        }
      },
      onPointerCancel() {
        dragging.current = false
        setDragIdx(null)
        setOverIdx(null)
      },
      style: { touchAction: 'none' as const, cursor: dragIdx !== null ? 'grabbing' : 'grab' },
    }
  }

  function setRef(el: HTMLDivElement | null, idx: number) {
    itemEls.current[idx] = el
  }

  return { dragIdx, overIdx, gripProps, setRef }
}

type BolkCardProps = {
  bolk: Bolk & { startMin: number; endMin: number }
  onUpdate: (id: string, patch: Partial<Bolk>) => void
  onDelete: (id: string) => void
  isDragging: boolean
  isOver: boolean
  gripProps: ReturnType<typeof useDragSort>['gripProps'] extends (idx: number) => infer R ? R : never
}

function BolkCard({ bolk, onUpdate, onDelete, isDragging, isOver, gripProps }: BolkCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const s = TYPE_STYLE[bolk.type] || TYPE_STYLE.activity
  const type = bolk.type || 'activity'

  return (
    <div className={`card${isDragging ? ' dragging' : ''}${isOver ? ' over' : ''}`} style={{ background: s.bg, borderColor: s.border }}>
      <div className="card-inner">
        <div className="card-top">
          <span className="time-chip" style={{ background: s.chip, color: s.chipText }}>{formatTime(bolk.startMin)}</span>
          <input className="card-title" value={bolk.title} onChange={(e) => onUpdate(bolk.id, { title: e.target.value })} placeholder="Navn på bolk…" />
          <div className="grip" aria-label="Flytt bolk" {...gripProps}>
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none">{[0, 6, 12].map((y) => [0, 6].map((x) => <circle key={`${x}${y}`} cx={x + 3} cy={y + 3} r="2" fill="currentColor" />))}</svg>
          </div>
        </div>
        <div className="card-bottom">
          <div className="type-tabs">{TYPES.map((t) => <button key={t.value} className={`type-tab${type === t.value ? ' active' : ''}`} style={type === t.value ? { background: s.chip, color: s.chipText, borderColor: s.chip } : {}} onClick={() => onUpdate(bolk.id, { type: t.value })}>{t.label}</button>)}</div>
          <div className="card-actions">
            <div className="dur-pill">
              <button className="dur-btn" onClick={() => onUpdate(bolk.id, { duration: Math.max(5, bolk.duration - 5) })}>−</button>
              <span className="dur-val">{bolk.duration} min</span>
              <button className="dur-btn" onClick={() => onUpdate(bolk.id, { duration: bolk.duration + 5 })}>+</button>
            </div>
            <button className="link-btn" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Skjul' : 'Notat'}</button>
            {confirmDelete ? (
              <div className="del-confirm"><span className="del-confirm-label">Slette?</span><button className="del-yes" onClick={() => onDelete(bolk.id)}>Ja</button><button className="del-no" onClick={() => setConfirmDelete(false)}>Nei</button></div>
            ) : (
              <button className="del-btn" aria-label="Slett bolk" onClick={() => setConfirmDelete(true)}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
        </div>
        {expanded && <textarea className="bolk-notes" value={bolk.notes} onChange={(e) => onUpdate(bolk.id, { notes: e.target.value })} placeholder="Notater om bolken…" rows={3} />}
      </div>
      <div className="dur-bar"><div className="dur-bar-fill" style={{ width: `${Math.min(100, (bolk.duration / 120) * 100)}%`, background: s.bar }} /></div>
    </div>
  )
}

export default function WorkshopPlanner({ workshop }: { workshop: WorkshopRow }) {
  const router = useRouter()
  const initialData = (workshop.data ?? {}) as Partial<PlannerData>
  const [state, setState] = useState<PlannerState>(() => ({
    title: workshop.title,
    startTime: initialData.startTime || DEFAULT_DATA.startTime,
    endTime: initialData.endTime || DEFAULT_DATA.endTime,
    bolker: Array.isArray(initialData.bolker) && initialData.bolker.length > 0 ? (initialData.bolker as Bolk[]) : DEFAULT_DATA.bolker,
  }))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [shareLabel, setShareLabel] = useState('Del lenke')
  const initialRender = useRef(true)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }

    const timeout = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const response = await fetch(`/api/workshops/${workshop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.title,
            data: {
              startTime: state.startTime,
              endTime: state.endTime,
              bolker: state.bolker,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('save_failed')
        }

        setSaveStatus('saved')
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } catch (err) {
        console.error('Save failed:', err)
        setSaveStatus('error')
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [state, workshop.id])

  useEffect(() => () => {
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
  }, [])

  async function handleShareLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareLabel('Kopiert!')
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
      shareTimeoutRef.current = setTimeout(() => {
        setShareLabel('Del lenke')
      }, 2000)
    } catch {
      alert(url)
    }
  }

  function handleBackToPrograms() {
    router.refresh()
    router.push('/')
  }

  const withSlots = computeSlots(state.bolker, state.startTime)
  const totalUsed = state.bolker.reduce((s, b) => s + b.duration, 0)
  const totalAvail = parseTime(state.endTime) > parseTime(state.startTime) ? parseTime(state.endTime) - parseTime(state.startTime) : 0
  const overflow = totalUsed > totalAvail
  const diff = Math.abs(totalUsed - totalAvail)
  const pct = totalAvail > 0 ? Math.min(100, (totalUsed / totalAvail) * 100) : 0

  const { dragIdx, overIdx, gripProps, setRef } = useDragSort(state.bolker, (bolker) => setState((s) => ({ ...s, bolker })))

  return <div className="shell"><div className="app"><main><div className={`save-status${saveStatus === 'error' ? ' error' : ''}`}>{saveStatus === 'saving' ? 'Lagrer…' : saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil ved lagring' : ''}</div><div className="top-bar"><button type="button" className="back-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={handleBackToPrograms}>← Alle programmer</button><button className={`share-btn${shareLabel === 'Kopiert!' ? ' copied' : ''}`} onClick={handleShareLink}>{shareLabel}</button></div><div className="tag">WORKSHOPPROGRAM</div><input className="title-input" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} placeholder="Navn på workshop…" /><div className="time-card"><div className="time-card-label">Tidsramme</div><div className="time-fields"><div className="tf"><span className="tf-label">Start</span><input type="time" className="tf-input" value={state.startTime} onChange={(e) => setState((s) => ({ ...s, startTime: e.target.value }))} /></div><span className="tf-sep">→</span><div className="tf"><span className="tf-label">Slutt</span><input type="time" className="tf-input" value={state.endTime} onChange={(e) => setState((s) => ({ ...s, endTime: e.target.value }))} /></div></div></div>{totalAvail > 0 && <div className="status-row"><div className="prog-wrap"><div className={`prog-label ${overflow ? 'err' : diff === 0 ? 'ok' : ''}`}>{overflow ? `${diff} min over tidsrammen` : diff === 0 ? 'Fyller tidsrammen' : `${diff} min ledig`}</div><div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%`, background: overflow ? '#b91c1c' : '#111' }} /></div></div><div className="prog-time">{totalUsed}<span>/{totalAvail}m</span></div></div>}<div className="sec-head"><span className="sec-title">Program</span><span className="sec-count">{state.bolker.length} bolker</span></div><div className="cards">{withSlots.map((bolk, idx) => <div key={bolk.id} ref={(el) => setRef(el, idx)}><BolkCard bolk={bolk} onUpdate={(id: string, patch: Partial<Bolk>) => setState((s) => ({ ...s, bolker: s.bolker.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))} onDelete={(id: string) => setState((s) => ({ ...s, bolker: s.bolker.filter((b) => b.id !== id) }))} isDragging={dragIdx === idx} isOver={overIdx === idx && dragIdx !== idx} gripProps={gripProps(idx)} /></div>)}</div><button className="add-btn" onClick={() => setState((s) => ({ ...s, bolker: [...s.bolker, { id: uid(), title: '', duration: 30, notes: '', type: 'activity' }] }))}>+ Legg til bolk</button><div className="footer"><button className="reset-btn" onClick={() => { if (confirm('Nullstille programmet?')) setState({ ...DEFAULT_DATA, title: workshop.title }) }}>Nullstill</button></div></main></div></div>
}
