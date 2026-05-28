'use client'

import '../app/workshop/[id]/planner.css'
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

function parseTime(str: string) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime(totalMin: number) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function computeSlots(bolker: Bolk[], startTime: string) {
  let cursor = parseTime(startTime)
  return bolker.map((b) => {
    const start = cursor
    cursor += b.duration
    return { ...b, startMin: start, endMin: cursor }
  })
}

const TYPE_STYLE: Record<BolkType, { bg: string; border: string; chip: string; chipText: string; bar: string }> = {
  activity: { bg: '#fff', border: '#e8e8e8', chip: '#111', chipText: '#fff', bar: '#111' },
  pause: { bg: '#FFF8EE', border: '#F5D9A8', chip: '#E07A00', chipText: '#fff', bar: '#E07A00' },
  info: { bg: '#EEF4FF', border: '#BAD0FB', chip: '#2563EB', chipText: '#fff', bar: '#2563EB' },
}

const DEFAULT_DATA: PlannerData = {
  startTime: '09:00',
  endTime: '15:00',
  bolker: [],
}

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

export default function WorkshopViewer({ workshop }: { workshop: WorkshopRow }) {
  const initialData = parseData(workshop.data)
  const startTime = initialData.startTime || DEFAULT_DATA.startTime
  const endTime = initialData.endTime || DEFAULT_DATA.endTime
  const bolker = Array.isArray(initialData.bolker) ? (initialData.bolker as Bolk[]) : DEFAULT_DATA.bolker
  const slots = computeSlots(bolker, startTime)

  return (
    <div className="planner-shell">
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="title">{workshop.title || 'Workshop'}</h1>
          <div className="sub">{startTime}–{endTime}</div>
        </div>
      </div>

      <div className="cards">
        {slots.map((bolk) => {
          const s = TYPE_STYLE[bolk.type] || TYPE_STYLE.activity
          return (
            <div key={bolk.id} className="card" style={{ background: s.bg, borderColor: s.border }}>
              <div className="card-inner">
                <div className="card-top">
                  <span className="time-chip" style={{ background: s.chip, color: s.chipText }}>{formatTime(bolk.startMin)}</span>
                  <div className="card-title" style={{ pointerEvents: 'none' }}>{bolk.title}</div>
                </div>
                {bolk.notes ? <div className="bolk-notes">{bolk.notes}</div> : null}
              </div>
              <div className="dur-bar"><div className="dur-bar-fill" style={{ width: `${Math.min(100, (bolk.duration / 120) * 100)}%`, background: s.bar }} /></div>
            </div>
          )
        })}
      </div>

      <p className="savehint" style={{ textAlign: 'center', opacity: 0.8 }}>Powered by Workshop Agenda</p>
    </div>
  )
}
