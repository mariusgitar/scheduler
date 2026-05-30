'use client'

import '../app/workshop/[id]/planner.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { BolkType, CustomCategory, WorkshopRow } from '../lib/types'

type Bolk = {
  id: string
  title: string
  duration: number
  notes: string
  type: BolkType
  categoryId?: string
}

type PlannerData = {
  startTime: string
  endTime: string
  bolker: Bolk[]
  categories: CustomCategory[]
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

function computeSectionDurations(
  bolker: Bolk[]
): Record<string, number> {
  const result: Record<string, number> = {}
  let currentSectionId: string | null = null
  for (const b of bolker) {
    if (b.type === 'section') {
      currentSectionId = b.id
      result[b.id] = 0
    } else if (currentSectionId) {
      result[currentSectionId] += b.duration
    }
  }
  return result
}

function getParentSection(bolker: Bolk[], bolkId: string) {
  let currentSectionId: string | null = null
  for (const b of bolker) {
    if (b.type === 'section') currentSectionId = b.id
    if (b.id === bolkId) return b.type === 'section' ? null : currentSectionId
  }
  return null
}

function computeSlots(bolker: Bolk[], startTime: string) {
  let cursor = parseTime(startTime)
  return bolker.map((b) => {
    if (b.type === 'section') {
      return {
        ...b,
        startMin: cursor,
        endMin: cursor,
      }
    }

    const start = cursor
    cursor += b.duration
    return { ...b, startMin: start, endMin: cursor }
  })
}

const TYPES: Array<{ value: BolkType; label: string }> = [
  { value: 'activity', label: 'Aktivitet' },
  { value: 'pause', label: 'Pause' },
  { value: 'info', label: 'Info' },
  { value: 'section', label: 'Seksjon' },
]

const BOLK_TYPES = TYPES.filter((t) => t.value !== 'section')

export const PRESET_COLORS = [
  '#E07A00', '#2563EB', '#15803D',
  '#7C3AED', '#DB2777', '#0891B2',
  '#92400E', '#374151'
]

const TYPE_STYLE: Record<BolkType, { bg: string; border: string; chip: string; chipText: string; bar: string }> = {
  activity: { bg: '#fff', border: '#e8e8e8', chip: '#111', chipText: '#fff', bar: '#111' },
  pause: { bg: '#FFF8EE', border: '#F5D9A8', chip: '#E07A00', chipText: '#fff', bar: '#E07A00' },
  info: { bg: '#EEF4FF', border: '#BAD0FB', chip: '#2563EB', chipText: '#fff', bar: '#2563EB' },
  section: { bg: '#F8F8F8', border: '#d0d0d0', chip: '#555', chipText: '#fff', bar: '#555' },
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
  categories: [],
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


function getCategoryStyle(categories: CustomCategory[], categoryId?: string) {
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return null

  return {
    bg: '#fff',
    border: category.color,
    chip: category.color,
    chipText: '#fff',
    bar: category.color,
  }
}

function CategoryManager({
  categories,
  onAdd,
  onDelete,
  onClose,
}: {
  categories: CustomCategory[]
  onAdd: (cat: CustomCategory) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  function handleAdd() {
    const trimmed = label.trim()
    if (!trimmed) return
    onAdd({ id: uid(), label: trimmed, color })
    setLabel('')
    setColor(PRESET_COLORS[0])
  }

  return (
    <div className="cat-manager">
      <div className="cat-manager-header">
        <button type="button" className="link-btn" onClick={onClose}>
          ✕ Lukk
        </button>
      </div>
      {categories.length > 0 && (
        <div className="cat-list">
          {categories.map((category) => (
            <div className="cat-pill" key={category.id}>
              <span className="cat-dot" style={{ background: category.color }} />
              <span>{category.label}</span>
              <button type="button" className="cat-del" aria-label={`Slett ${category.label}`} onClick={() => onDelete(category.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="cat-new">
        <div className="color-options" aria-label="Velg kategorifarge">
          {PRESET_COLORS.map((preset) => (
            <button
              type="button"
              key={preset}
              className={`color-opt${color === preset ? ' selected' : ''}`}
              style={{ background: preset }}
              aria-label={`Velg farge ${preset}`}
              onClick={() => setColor(preset)}
            />
          ))}
        </div>
        <input
          className="cat-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Navn på kategori…"
        />
        <button type="button" className="cat-add-btn" disabled={!label.trim()} onClick={handleAdd}>
          Legg til
        </button>
      </div>
    </div>
  )
}

function CategoryManagerToggle({
  categories,
  onAdd,
  onDelete,
}: {
  categories: CustomCategory[]
  onAdd: (cat: CustomCategory) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="cat-manager-wrapper">
      <button type="button" className="cat-manager-toggle" onClick={() => setOpen((v) => !v)}>
        Kategorier {open ? '▲' : '▼'}
      </button>
      {open && (
        <CategoryManager
          categories={categories}
          onAdd={onAdd}
          onDelete={onDelete}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

type BolkCardProps = {
  bolk: Bolk & { startMin: number; endMin: number }
  categories: CustomCategory[]
  isIndented?: boolean
  onUpdate: (id: string, patch: Partial<Bolk>) => void
  onDelete: (id: string) => void
  onAddCategory: (cat: CustomCategory) => void
  onDeleteCategory: (id: string) => void
  isDragging: boolean
  isOver: boolean
  gripProps: ReturnType<typeof useDragSort>['gripProps'] extends (idx: number) => infer R ? R : never
}

function BolkCard({
  bolk,
  categories,
  onUpdate,
  onDelete,
  onAddCategory,
  onDeleteCategory,
  isDragging,
  isOver,
  gripProps,
  isIndented,
}: BolkCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingDuration, setEditingDuration] = useState(false)
  const [draftDuration, setDraftDuration] = useState('')
  const categoryStyle = getCategoryStyle(categories, bolk.categoryId)
  const s = categoryStyle || TYPE_STYLE[bolk.type] || TYPE_STYLE.activity
  const type = bolk.type || 'activity'

  function handleAddCategoryFromRow() {
    setShowCategoryManager((v) => !v)
  }

  function startDurationEdit() {
    setDraftDuration(String(bolk.duration))
    setEditingDuration(true)
  }

  function commitDuration() {
    const val = parseInt(draftDuration)
    if (!isNaN(val) && val > 0) {
      onUpdate(bolk.id, { duration: val })
    }
    setEditingDuration(false)
  }

  return (
    <div className={`card${isIndented ? ' indented' : ''}${isDragging ? ' dragging' : ''}${isOver ? ' over' : ''}`} style={{ background: s.bg, borderColor: s.border }}>
      <div className="card-inner">
        <div className="card-top">
          <span className="time-chip" style={{ background: s.chip, color: s.chipText }}>{formatTime(bolk.startMin)}</span>
          <input className="card-title" value={bolk.title} onChange={(e) => onUpdate(bolk.id, { title: e.target.value })} placeholder="Navn på bolk…" />
          <div className="grip" aria-label="Flytt bolk" {...gripProps}>
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none">{[0, 6, 12].map((y) => [0, 6].map((x) => <circle key={`${x}${y}`} cx={x + 3} cy={y + 3} r="2" fill="currentColor" />))}</svg>
          </div>
        </div>
        <div className="card-bottom">
          <div className="type-tabs">
            {BOLK_TYPES.map((t) => {
              const active = !bolk.categoryId && type === t.value
              const style = TYPE_STYLE[t.value]
              return <button key={t.value} className={`type-tab${active ? ' active' : ''}`} style={active ? { background: style.chip, color: style.chipText, borderColor: style.chip } : {}} onClick={() => onUpdate(bolk.id, { type: t.value, categoryId: undefined })}>{t.label}</button>
            })}
            {categories.map((category) => {
              const active = bolk.categoryId === category.id
              return <button key={category.id} className={`type-tab${active ? ' active' : ''}`} style={active ? { background: category.color, color: '#fff', borderColor: category.color } : {}} onClick={() => onUpdate(bolk.id, { type: 'activity', categoryId: category.id })}>{category.label}</button>
            })}
            <button type="button" className="type-tab" aria-label="Legg til kategori" onClick={handleAddCategoryFromRow}>+</button>
          </div>
          {showCategoryManager && (
            <CategoryManager
              categories={categories}
              onAdd={onAddCategory}
              onDelete={onDeleteCategory}
              onClose={() => setShowCategoryManager(false)}
            />
          )}
          <div className="card-actions">
            <div className="dur-pill">
              <button className="dur-btn" onClick={() => onUpdate(bolk.id, { duration: Math.max(5, bolk.duration - 5) })}>−</button>
              {editingDuration ? (
                <input
                  type="number"
                  className="dur-edit"
                  value={draftDuration}
                  autoFocus
                  onChange={(e) => setDraftDuration(e.target.value)}
                  onBlur={commitDuration}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDuration()
                    if (e.key === 'Escape') setEditingDuration(false)
                  }}
                />
              ) : (
                <span className="dur-val" onClick={startDurationEdit}>{bolk.duration} min</span>
              )}
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



type SectionCardProps = {
  bolk: Bolk
  onUpdate: (id: string, patch: Partial<Bolk>) => void
  onDelete: (id: string) => void
  isDragging: boolean
  isOver: boolean
  gripProps: ReturnType<typeof useDragSort>['gripProps'] extends (idx: number) => infer R ? R : never
  totalDuration: number
}

function SectionCard({ bolk, onUpdate, onDelete, isDragging, isOver, gripProps, totalDuration }: SectionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={`card section-card${isDragging ? ' dragging' : ''}${isOver ? ' over' : ''}`}>
      <div className="section-inner">
        <div className="grip" aria-label="Flytt seksjon" {...gripProps}>
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none">{[0, 6, 12].map((y) => [0, 6].map((x) => <circle key={`${x}${y}`} cx={x + 3} cy={y + 3} r="2" fill="currentColor" />))}</svg>
        </div>
        <input className="section-name" value={bolk.title} onChange={(e) => onUpdate(bolk.id, { title: e.target.value })} placeholder="Seksjonsnavn…" />
        <div className="section-duration">{totalDuration} min totalt</div>
        {confirmDelete ? (
          <div className="del-confirm"><span className="del-confirm-label">Slette?</span><button className="del-yes" onClick={() => onDelete(bolk.id)}>Ja</button><button className="del-no" onClick={() => setConfirmDelete(false)}>Nei</button></div>
        ) : (
          <button className="del-btn" aria-label="Slett seksjon" onClick={() => setConfirmDelete(true)}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function WorkshopPlanner({ workshop }: { workshop: WorkshopRow }) {
  function parseData(raw: unknown): Partial<PlannerData> {
    if (!raw) return {}
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch {
        return {}
      }
    }
    return raw as Partial<PlannerData>
  }

  const initialData = parseData(workshop.data)
  const [state, setState] = useState<PlannerState>(() => ({
    title: workshop.title,
    startTime: initialData.startTime || DEFAULT_DATA.startTime,
    endTime: initialData.endTime || DEFAULT_DATA.endTime,
    bolker: Array.isArray(initialData.bolker) && initialData.bolker.length > 0 ? (initialData.bolker as Bolk[]) : DEFAULT_DATA.bolker,
    categories: Array.isArray(initialData.categories)
      ? initialData.categories
      : [],
  }))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [colleagueLabel, setColleagueLabel] = useState('Del med kolleger')
  const [participantLabel, setParticipantLabel] = useState('Del med deltakere')
  const initialRender = useRef(true)
  const isNavigating = useRef(false)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savePayload = useMemo(
    () => ({
      title: state.title,
      data: {
        startTime: state.startTime,
        endTime: state.endTime,
        bolker: state.bolker,
        categories: state.categories,
      },
    }),
    [state.title, state.startTime, state.endTime, state.bolker, state.categories]
  )

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    if (isNavigating.current) return

    const timeout = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const response = await fetch(`/api/workshops/${workshop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload),
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
  }, [savePayload, workshop.id])

  useEffect(() => () => {
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
  }, [])

  async function handleShareColleague() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setColleagueLabel('Kopiert!')
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
      shareTimeoutRef.current = setTimeout(() => {
        setColleagueLabel('Del med kolleger')
      }, 2000)
    } catch {
      alert(window.location.href)
    }
  }

  async function handleShareParticipant() {
    const participantUrl = `${window.location.origin}/workshop/view/${workshop.read_token}`
    try {
      await navigator.clipboard.writeText(participantUrl)
      setParticipantLabel('Kopiert!')
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
      shareTimeoutRef.current = setTimeout(() => {
        setParticipantLabel('Del med deltakere')
      }, 2000)
    } catch {
      alert(participantUrl)
    }
  }

  function handleBackToPrograms() {
    isNavigating.current = true
    window.location.href = '/'
  }

  function addCategory(cat: CustomCategory) {
    setState((s) => ({
      ...s,
      categories: [...s.categories, cat],
    }))
  }

  function deleteCategory(id: string) {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      bolker: s.bolker.map((b) =>
        b.categoryId === id
          ? { ...b, categoryId: undefined }
          : b
      ),
    }))
  }

  const withSlots = computeSlots(state.bolker, state.startTime)
  const sectionDurations = computeSectionDurations(state.bolker)
  const totalUsed = state.bolker.reduce((sum, b) => sum + b.duration, 0)
  const totalAvail = parseTime(state.endTime) > parseTime(state.startTime) ? parseTime(state.endTime) - parseTime(state.startTime) : 0
  const overflow = totalUsed > totalAvail
  const diff = Math.abs(totalUsed - totalAvail)
  const pct = totalAvail > 0 ? Math.min(100, (totalUsed / totalAvail) * 100) : 0

  const { dragIdx, overIdx, gripProps, setRef } = useDragSort(state.bolker, (bolker) => setState((s) => ({ ...s, bolker })))

  return <div className="shell"><div className="app"><main><div className={`save-status${saveStatus === 'error' ? ' error' : ''}`}>{saveStatus === 'saving' ? 'Lagrer…' : saveStatus === 'saved' ? 'Lagret' : saveStatus === 'error' ? 'Feil ved lagring' : ''}</div><div className="top-bar"><button type="button" className="back-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={handleBackToPrograms}>← Alle programmer</button><div className="share-btns"><button className={`share-btn${colleagueLabel === 'Kopiert!' ? ' copied' : ''}`} onClick={handleShareColleague}>{colleagueLabel}</button><button className={`share-btn${participantLabel === 'Kopiert!' ? ' copied' : ''}`} onClick={handleShareParticipant}>{participantLabel}</button></div></div><div className="tag">WORKSHOPPROGRAM</div><input className="title-input" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} placeholder="Navn på workshop…" /><div className="time-card"><div className="time-card-label">Tidsramme</div><div className="time-fields"><div className="tf"><span className="tf-label">Start</span><input type="time" className="tf-input" value={state.startTime} onChange={(e) => setState((s) => ({ ...s, startTime: e.target.value }))} /></div><span className="tf-sep">→</span><div className="tf"><span className="tf-label">Slutt</span><input type="time" className="tf-input" value={state.endTime} onChange={(e) => setState((s) => ({ ...s, endTime: e.target.value }))} /></div></div></div>{totalAvail > 0 && <div className="status-row"><div className="prog-wrap"><div className={`prog-label ${overflow ? 'err' : diff === 0 ? 'ok' : ''}`}>{overflow ? `${diff} min over tidsrammen` : diff === 0 ? 'Fyller tidsrammen' : `${diff} min ledig`}</div><div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%`, background: overflow ? '#b91c1c' : '#111' }} /></div></div><div className="prog-time">{totalUsed}<span>/{totalAvail}m</span></div></div>}<CategoryManagerToggle categories={state.categories} onAdd={addCategory} onDelete={deleteCategory} /><div className="sec-head"><span className="sec-title">Program</span><span className="sec-count">{state.bolker.length} bolker</span></div><div className="cards">{withSlots.map((bolk, idx) => { const parentSectionId = getParentSection(state.bolker, bolk.id); const isIndented = bolk.type !== 'section' && !!parentSectionId; return <div key={bolk.id} ref={(el) => setRef(el, idx)} >{bolk.type === 'section' ? <SectionCard bolk={bolk} onUpdate={(id: string, patch: Partial<Bolk>) => setState((s) => ({ ...s, bolker: s.bolker.map((b) => b.id === id ? { ...b, ...patch, duration: 0, type: 'section', categoryId: undefined } : b) }))} onDelete={(id: string) => setState((s) => ({ ...s, bolker: s.bolker.filter((b) => b.id !== id) }))} isDragging={dragIdx === idx} isOver={overIdx === idx && dragIdx !== idx} gripProps={gripProps(idx)} totalDuration={sectionDurations[bolk.id] || 0} /> : <BolkCard bolk={bolk} categories={state.categories} onAddCategory={addCategory} onDeleteCategory={deleteCategory} onUpdate={(id: string, patch: Partial<Bolk>) => setState((s) => ({ ...s, bolker: s.bolker.map((b) => { if (b.id !== id) return b; const next = { ...b, ...patch }; return next.type === 'section' ? { ...next, duration: 0, categoryId: undefined } : next }) }))} onDelete={(id: string) => setState((s) => ({ ...s, bolker: s.bolker.filter((b) => b.id !== id) }))} isDragging={dragIdx === idx} isOver={overIdx === idx && dragIdx !== idx} gripProps={gripProps(idx)} isIndented={isIndented} />}</div>})}</div><div className="add-btns"><button className="add-btn" onClick={() => setState((s) => ({ ...s, bolker: [...s.bolker, { id: uid(), title: '', duration: 30, notes: '', type: 'activity' }] }))}>+ Legg til bolk</button><button className="add-btn" onClick={() => setState((s) => ({ ...s, bolker: [...s.bolker, { id: uid(), title: '', duration: 0, notes: '', type: 'section' }] }))}>+ Legg til seksjon</button></div><div className="footer"><button className="reset-btn" onClick={() => { if (confirm('Nullstille programmet?')) setState({ ...DEFAULT_DATA, title: workshop.title }) }}>Nullstill</button></div></main></div></div>
}
