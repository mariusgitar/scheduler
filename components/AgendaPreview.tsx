'use client'

import { useEffect, useMemo, useState } from 'react'

type PreviewType = 'activity' | 'pause' | 'info'

type PreviewBolk = {
  id: string
  title: string
  duration: number
  type: PreviewType
}

const BASE_BOLKER: PreviewBolk[] = [
  { id: 'intro', title: 'Intro og velkommen', duration: 15, type: 'activity' },
  { id: 'context', title: 'Kontekst og mål', duration: 30, type: 'activity' },
  { id: 'break', title: 'Pause', duration: 15, type: 'pause' },
  { id: 'group', title: 'Gruppearbeid', duration: 45, type: 'activity' },
  { id: 'summary', title: 'Oppsummering', duration: 20, type: 'info' },
]

type PreviewTypeStyle = {
  bg: string
  border: string
  chip: string
  chipText: string
  bar: string
}

const TYPE_STYLE: Record<PreviewType, PreviewTypeStyle> = {
  activity: { bg: '#fff', border: '#e8e8e8', chip: '#111', chipText: '#fff', bar: '#111' },
  pause: { bg: '#FFF8EE', border: '#F5D9A8', chip: '#E07A00', chipText: '#fff', bar: '#E07A00' },
  info: { bg: '#EEF4FF', border: '#BAD0FB', chip: '#2563EB', chipText: '#fff', bar: '#2563EB' },
}

const START_MINUTES = 9 * 60
const LOOP_DURATION = 12000

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

function getPreviewState(phase: number) {
  const bolker = BASE_BOLKER.map((bolk) => ({ ...bolk }))

  if (phase >= 1) {
    const context = bolker.find((bolk) => bolk.id === 'context')
    if (context) context.duration = 35
  }

  if (phase >= 2) {
    const context = bolker.find((bolk) => bolk.id === 'context')
    if (context) context.type = 'pause'
  }

  if (phase >= 4) {
    const groupIndex = bolker.findIndex((bolk) => bolk.id === 'group')
    const breakIndex = bolker.findIndex((bolk) => bolk.id === 'break')

    if (groupIndex > -1 && breakIndex > -1) {
      const [group] = bolker.splice(groupIndex, 1)
      bolker.splice(breakIndex, 0, group)
    }
  }

  return bolker
}

function getStepLabel(phase: number) {
  if (phase === 1) return '+5 min på Kontekst og mål'
  if (phase === 2) return 'Type endret til pause'
  if (phase === 3) return 'Gruppearbeid flyttes'
  if (phase >= 4) return 'Ny rekkefølge lagret'

  return 'Bygg programmet visuelt'
}

export default function AgendaPreview() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timeouts: Array<ReturnType<typeof setTimeout>> = []

    function scheduleCycle(delay = 0) {
      timeouts.push(setTimeout(() => setPhase(0), delay))
      timeouts.push(setTimeout(() => setPhase(1), delay + 2200))
      timeouts.push(setTimeout(() => setPhase(2), delay + 4600))
      timeouts.push(setTimeout(() => setPhase(3), delay + 7000))
      timeouts.push(setTimeout(() => setPhase(4), delay + 8500))
      timeouts.push(setTimeout(() => scheduleCycle(), delay + LOOP_DURATION))
    }

    scheduleCycle()

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  const previewBolker = useMemo(() => {
    let nextStart = START_MINUTES

    return getPreviewState(phase).map((bolk) => {
      const previewBolk = {
        ...bolk,
        startTime: formatTime(nextStart),
      }

      nextStart += bolk.duration

      return previewBolk
    })
  }, [phase])

  const totalDuration = useMemo(() => {
    return previewBolker.reduce((sum, bolk) => sum + bolk.duration, 0)
  }, [previewBolker])

  return (
    <section className="preview-wrap" aria-label="Animert forhåndsvisning av agenda">
      <div className="preview-label">Preview</div>
      <div className="preview-panel">
        <div className="preview-summary">
          <div>
            <span className="preview-summary-kicker">Tidsramme</span>
            <strong>
              {formatTime(START_MINUTES)} → {formatTime(START_MINUTES + totalDuration)}
            </strong>
          </div>
          <span className="preview-step">{getStepLabel(phase)}</span>
        </div>

        <div className="preview-section-head">
          <span>Program</span>
          <span>{previewBolker.length} bolker</span>
        </div>

        <div className="preview-cards">
          {previewBolker.map((bolk) => {
            const style = TYPE_STYLE[bolk.type]
            const isDurationTarget = bolk.id === 'context' && phase === 1
            const isTypeTarget = bolk.id === 'context' && phase === 2
            const isDragging = bolk.id === 'group' && phase === 3
            const isDropTarget = bolk.id === 'break' && phase === 3

            return (
              <article
                className={`preview-card${isDurationTarget ? ' duration-target' : ''}${
                  isTypeTarget ? ' type-target' : ''
                }${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`}
                style={{ backgroundColor: style.bg, borderColor: style.border }}
                key={bolk.id}
              >
                <div className="preview-card-inner">
                  <div className="preview-card-top">
                    <span
                      className="preview-chip"
                      style={{ backgroundColor: style.chip, color: style.chipText }}
                    >
                      {bolk.startTime}
                    </span>
                    <span className="preview-title">{bolk.title}</span>
                    <span className="preview-grip" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>

                  <div className="preview-type-tabs">
                    {(['activity', 'pause', 'info'] as const).map((typeName) => {
                      const active = bolk.type === typeName
                      const typeStyle = TYPE_STYLE[typeName]
                      const labels: Record<PreviewType, string> = {
                        activity: 'Aktivitet',
                        pause: 'Pause',
                        info: 'Info',
                      }

                      return (
                        <span
                          className={`preview-type-tab${active ? ' active' : ''}`}
                          style={
                            active
                              ? {
                                  backgroundColor: typeStyle.chip,
                                  borderColor: typeStyle.chip,
                                  color: typeStyle.chipText,
                                }
                              : {}
                          }
                          key={typeName}
                        >
                          {labels[typeName]}
                        </span>
                      )
                    })}
                    <span className="preview-type-tab preview-plus-tab">+</span>
                  </div>

                  <div className="preview-card-actions">
                    <div className="preview-dur-pill">
                      <span className="preview-dur-btn">−</span>
                      <span className="preview-dur-val">{bolk.duration} min</span>
                      <span className={`preview-dur-btn${isDurationTarget ? ' pressed' : ''}`}>
                        +
                      </span>
                    </div>
                    <span className="preview-note">Notat</span>
                  </div>
                </div>
                <div className="preview-dur-bar">
                  <div
                    className="preview-dur-fill"
                    style={{
                      width: `${Math.min(100, (bolk.duration / 90) * 100)}%`,
                      backgroundColor: style.bar,
                    }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
