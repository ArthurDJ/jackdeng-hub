// A server component: next-intl's useTranslations works here too.
import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { cardStages, type DiagramBox, type DiagramStage } from '@/lib/projectDiagrams'

interface ProjectDiagramProps {
  slug: string
  stages: DiagramStage[]
  /** Card cover: one line, no notes, decorative. */
  mini?: boolean
}

export function ProjectDiagram({ slug, stages, mini = false }: ProjectDiagramProps) {
  const t = useTranslations('projectDiagrams')

  const box = (b: DiagramBox, self: boolean) => (
    <div key={b.id} className={`ds-diagram-box${self ? ' ds-diagram-self' : ''}`}>
      <span className="ds-diagram-label">{t(`${slug}.${b.id}`)}</span>
      {!mini && b.note && <span className="ds-diagram-note">{t(`${slug}.${b.id}Note`)}</span>}
    </div>
  )

  const row = (
    <div className={mini ? 'ds-diagram ds-diagram-mini' : 'ds-diagram'}>
      {(mini ? cardStages(stages) : stages).map((stage, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="ds-diagram-arrow" aria-hidden="true" />}
          {'box' in stage ? (
            box(stage.box, Boolean(stage.self))
          ) : mini && !stage.cardBoxes ? (
            box({ id: stage.group }, Boolean(stage.self))
          ) : (
            <div className={`ds-diagram-group${stage.self ? ' ds-diagram-self' : ''}`}>
              <span className="ds-diagram-group-label">{t(`${slug}.${stage.group}`)}</span>
              <div className="ds-diagram-group-boxes">
                {stage.boxes.map((b) => box(b, false))}
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )

  if (mini) {
    return (
      <div aria-hidden="true" className="ds-diagram-cover print:hidden!">
        {row}
      </div>
    )
  }
  return (
    <figure style={{ margin: '0 0 2rem' }}>
      {row}
      <figcaption style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
        {t('caption')}
      </figcaption>
    </figure>
  )
}
