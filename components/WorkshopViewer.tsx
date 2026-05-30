'use client'

import '../app/workshop/view/viewer.css'
import type { CustomCategory, WorkshopRow } from '../lib/types'

type BolkType = 'activity' | 'pause' | 'info' | 'section'

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

function parseTime(str: string) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime(totalMin: number) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function computeSectionDurations(bolker: Bolk[]): Record<string, number> {
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

const TYPE_STYLE: Record<BolkType, { bg: string; border: string; chip: string; chipText: string; bar: string }> = {
  activity: { bg: '#fff', border: '#e8e8e8', chip: '#111', chipText: '#fff', bar: '#111' },
  pause: { bg: '#FFF8EE', border: '#F5D9A8', chip: '#E07A00', chipText: '#fff', bar: '#E07A00' },
  info: { bg: '#EEF4FF', border: '#BAD0FB', chip: '#2563EB', chipText: '#fff', bar: '#2563EB' },
  section: { bg: '#F8F8F8', border: '#d0d0d0', chip: '#555', chipText: '#fff', bar: '#555' },
}

const DEFAULT_DATA: PlannerData = {
  startTime: '09:00',
  endTime: '15:00',
  bolker: [],
  categories: [],
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
  const categories = Array.isArray(initialData.categories) ? initialData.categories : []
  const slots = computeSlots(bolker, startTime)
  const sectionDurations = computeSectionDurations(bolker)

  return (
    <div className="viewer-shell">
      <div className="viewer-app">
        <p className="viewer-eyebrow">
          Workshopprogram
        </p>
        <h1 className="viewer-title">
          {workshop.title}
        </h1>
        <p className="viewer-time">
          {startTime} – {endTime}
        </p>

        <div className="viewer-sec-head">
          <span className="viewer-sec-title">
            Program
          </span>
        </div>

        <div className="viewer-cards">
          {slots.map((bolk) => {
            if (bolk.type === 'section') {
              return (
                <div key={bolk.id}
                  className="viewer-card viewer-section">
                  <div className="viewer-section-inner">
                    <span className="viewer-section-name">
                      {bolk.title}
                    </span>
                    <span className="viewer-section-duration">
                      {sectionDurations[bolk.id] || 0} min
                    </span>
                  </div>
                </div>
              )
            }

            const categoryStyle = getCategoryStyle(
              categories, bolk.categoryId
            )
            const s = categoryStyle ||
              TYPE_STYLE[bolk.type] ||
              TYPE_STYLE.activity
            const isIndented = !!getParentSection(
              bolker, bolk.id
            )

            return (
              <div key={bolk.id}
                className={`viewer-card${isIndented ? ' indented' : ''}`}
                style={{
                  background: s.bg,
                  borderColor: s.border
                }}>
                <div className="viewer-card-inner">
                  <div className="viewer-card-top">
                    <span className="viewer-time-chip"
                      style={{
                        background: s.chip,
                        color: s.chipText
                      }}>
                      {formatTime(bolk.startMin)}
                    </span>
                    <span className="viewer-card-title">
                      {bolk.title}
                    </span>
                    <span className="viewer-card-duration">
                      {bolk.duration} min
                    </span>
                  </div>
                  {bolk.notes && (
                    <div className="viewer-notes">
                      {bolk.notes}
                    </div>
                  )}
                </div>
                <div className="viewer-dur-bar">
                  <div className="viewer-dur-fill"
                    style={{
                      width: `${Math.min(100,
                        (bolk.duration / 120) * 100
                      )}%`,
                      background: s.bar
                    }} />
                </div>
              </div>
            )
          })}
        </div>

        <p className="viewer-powered">
          Workshop Agenda
        </p>
      </div>
    </div>
  )
}
