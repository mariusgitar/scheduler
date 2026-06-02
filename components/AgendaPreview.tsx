'use client'

import { useEffect, useMemo, useState } from 'react'

const DEMO_BOLKER = [
  {
    id: '1',
    title: 'Introduksjon',
    duration: 15,
    type: 'activity',
    chip: '#111',
    chipText: '#fff',
  },
  {
    id: '2',
    title: 'Gruppearbeid',
    duration: 45,
    type: 'activity',
    chip: '#111',
    chipText: '#fff',
  },
  {
    id: '3',
    title: 'Pause',
    duration: 15,
    type: 'pause',
    chip: '#E07A00',
    chipText: '#fff',
  },
  {
    id: '4',
    title: 'Presentasjon',
    duration: 30,
    type: 'info',
    chip: '#2563EB',
    chipText: '#fff',
  },
]

const START_MINUTES = 9 * 60
const UPDATED_FIRST_DURATION = 30
const LOOP_DURATION = 6000

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

export default function AgendaPreview() {
  const [cycle, setCycle] = useState(0)
  const [visibleCount, setVisibleCount] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(DEMO_BOLKER[0].duration)
  const [appliedFirstDuration, setAppliedFirstDuration] = useState(DEMO_BOLKER[0].duration)
  const [durationUpdating, setDurationUpdating] = useState(false)
  const [timeUpdating, setTimeUpdating] = useState(false)

  useEffect(() => {
    const timeouts: Array<ReturnType<typeof setTimeout>> = []
    const intervals: Array<ReturnType<typeof setInterval>> = []

    setVisibleCount(0)
    setPreviewDuration(DEMO_BOLKER[0].duration)
    setAppliedFirstDuration(DEMO_BOLKER[0].duration)
    setDurationUpdating(false)
    setTimeUpdating(false)

    DEMO_BOLKER.forEach((_, index) => {
      timeouts.push(
        setTimeout(() => {
          setVisibleCount(index + 1)
        }, index * 300)
      )
    })

    timeouts.push(
      setTimeout(() => {
        setDurationUpdating(true)
        const startDuration = DEMO_BOLKER[0].duration
        const steps = UPDATED_FIRST_DURATION - startDuration
        let currentStep = 0

        intervals.push(
          setInterval(() => {
            currentStep += 1
            setPreviewDuration(startDuration + currentStep)

            if (currentStep >= steps) {
              intervals.forEach(clearInterval)
              setDurationUpdating(false)
            }
          }, 500 / steps)
        )
      }, 3000)
    )

    timeouts.push(
      setTimeout(() => {
        setAppliedFirstDuration(UPDATED_FIRST_DURATION)
        setTimeUpdating(true)
      }, 4000)
    )

    timeouts.push(
      setTimeout(() => {
        setTimeUpdating(false)
      }, 4400)
    )

    timeouts.push(
      setTimeout(() => {
        setVisibleCount(0)
      }, 5600)
    )

    timeouts.push(
      setTimeout(() => {
        setCycle((currentCycle) => currentCycle + 1)
      }, LOOP_DURATION)
    )

    return () => {
      timeouts.forEach(clearTimeout)
      intervals.forEach(clearInterval)
    }
  }, [cycle])

  const previewBolker = useMemo(() => {
    let nextStart = START_MINUTES

    return DEMO_BOLKER.map((bolk, index) => {
      const duration = index === 0 ? appliedFirstDuration : bolk.duration
      const previewBolk = {
        ...bolk,
        startTime: formatTime(nextStart),
        duration: index === 0 ? previewDuration : bolk.duration,
      }

      nextStart += duration

      return previewBolk
    })
  }, [appliedFirstDuration, previewDuration])

  const endTime = useMemo(() => {
    const totalDuration = DEMO_BOLKER.reduce((sum, bolk, index) => {
      return sum + (index === 0 ? appliedFirstDuration : bolk.duration)
    }, 0)

    return formatTime(START_MINUTES + totalDuration)
  }, [appliedFirstDuration])

  return (
    <section className="preview-wrap" aria-label="Animert forhåndsvisning av agenda">
      <div className="preview-label">Agenda-preview</div>
      <div className={`preview-time-row${timeUpdating ? ' updating' : ''}`}>
        {formatTime(START_MINUTES)} → {endTime}
      </div>
      <div className="preview-cards">
        {previewBolker.map((bolk, index) => (
          <article
            className={`preview-card${index < visibleCount ? ' visible' : ''}${
              timeUpdating ? ' updating' : ''
            }`}
            key={bolk.id}
          >
            <span
              className="preview-chip"
              style={{ backgroundColor: bolk.chip, color: bolk.chipText }}
            >
              {bolk.startTime}
            </span>
            <span className="preview-title">{bolk.title}</span>
            <span
              className={`preview-dur${
                index === 0 && durationUpdating ? ' updating' : ''
              }`}
            >
              {bolk.duration} min
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
