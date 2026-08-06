import { cn } from '@/lib/cn'

/**
 * Read-only analytics for the organisers.
 *
 * Deliberately server-rendered from `lib/analytics-queries` — there is no
 * client-side charting library here, just a few divs sized by percentage. At
 * this data volume that is both lighter and easier to read than a chart
 * dependency, and it keeps the admin bundle small on a phone at the courts.
 */
export default function AnalyticsPanel({ data }) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface-2/40 px-5 py-10 text-center">
        <p className="font-display text-2xl text-fg-muted">Analítica no disponible</p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-fg-subtle">
          Falta la tabla de visitas. Ejecuta{' '}
          <code className="font-mono text-[12px]">supabase/migrations/0004_analytics.sql</code>{' '}
          en el editor SQL de Supabase y vuelve a cargar esta página.
        </p>
      </div>
    )
  }

  const { totals, timeline, pages, devices, browsers, os, countries, referrers, peak, directShare, days } = data
  const maxDay = Math.max(1, ...timeline.map(d => d.views))

  return (
    <div className="space-y-6">
      {/* ── Headline numbers ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visitas (24 h)"    value={totals.views24h}    sub={`${totals.visitors24h} visitantes`} />
        <Stat label="Visitas (7 días)"  value={totals.views7d}     sub={`${totals.visitors7d} visitantes`} />
        <Stat label={`Visitas (${days} días)`} value={totals.views} sub={`${totals.visitors} visitantes únicos`} />
        <Stat label="Páginas / visitante" value={totals.viewsPerVisitor} sub={`Hora punta: ${String(peak.hour).padStart(2, '0')}:00`} />
      </div>

      {/* ── Daily trend ── */}
      <Card title="Visitas por día" note={`Últimos ${days} días · barra completa = ${maxDay}`}>
        <div className="flex h-28 items-end gap-[3px]">
          {timeline.map(d => (
            <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.views} visitas, ${d.visitors} visitantes`}>
              <div
                className="w-full rounded-t bg-accent/25 transition-colors group-hover:bg-accent/45"
                style={{ height: `${Math.max(2, (d.views / maxDay) * 100)}%` }}
              />
              <div
                className="absolute bottom-0 w-full rounded-t bg-accent"
                style={{ height: `${Math.max(1, (d.visitors / maxDay) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-fg-subtle">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" /> Visitantes únicos</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent/25" /> Visitas</span>
          <span className="ml-auto tabular font-mono">{timeline[0]?.date} → {timeline.at(-1)?.date}</span>
        </div>
      </Card>

      {/* ── Pages ── */}
      <Card title="Páginas más visitadas">
        <BarList items={pages.map(p => ({ label: p.name, meta: p.label, count: p.count, pct: p.pct }))} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Dispositivos">
          <BarList items={devices} />
        </Card>
        <Card title="Navegadores">
          <BarList items={browsers} />
        </Card>
        <Card title="Sistema operativo">
          <BarList items={os} />
        </Card>
        <Card title="Países">
          <BarList items={countries} />
        </Card>
      </div>

      <Card
        title="Cómo llegan los visitantes"
        note={`${directShare}% entra directamente o desde una app sin referente`}
      >
        {referrers.length > 0
          ? <BarList items={referrers} />
          : <p className="py-4 text-center text-[12.5px] text-fg-subtle">
              Todavía no hay referentes registrados. Los enlaces compartidos por
              WhatsApp o Instagram suelen llegar sin referente y cuentan como tráfico directo.
            </p>}
      </Card>

      <p className="rounded-xl border border-hairline bg-surface-2/40 px-4 py-3 text-[11.5px] leading-relaxed text-fg-subtle">
        <span className="font-medium text-fg-muted">Sobre estos datos.</span>{' '}
        No se guardan direcciones IP ni cookies. El identificador de visitante es
        un hash con sal que cambia cada medianoche, así que «visitantes únicos»
        significa únicos <em>por día</em> y nadie puede ser seguido de un día
        para otro. Las páginas de administración no se registran. Para métricas
        de rendimiento y una vista más detallada de audiencia, el proyecto
        también envía datos a Vercel Analytics y Speed Insights.
      </p>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-xs">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <p className="tabular mt-1.5 font-display text-3xl text-fg">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-fg-muted">{sub}</p>}
    </div>
  )
}

function Card({ title, note, children }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-display text-lg text-fg">{title.toUpperCase()}</h3>
        {note && <p className="text-[11px] text-fg-subtle">{note}</p>}
      </div>
      {children}
    </div>
  )
}

function BarList({ items }) {
  if (!items?.length) {
    return <p className="py-3 text-center text-[12px] text-fg-subtle">Sin datos todavía.</p>
  }
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <ul className="space-y-1.5">
      {items.map(item => (
        <li key={item.label + (item.meta ?? '')} className="relative">
          <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface-2/40">
            <div
              className="absolute inset-y-0 left-0 bg-accent/12"
              style={{ width: `${(item.count / max) * 100}%` }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-2 px-2.5 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg">{item.label}</span>
              {item.meta && item.meta !== item.label && (
                <span className="hidden truncate font-mono text-[10px] text-fg-subtle sm:block">{item.meta}</span>
              )}
              <span className="tabular shrink-0 font-mono text-[11px] text-fg-muted">{item.count}</span>
              <span className={cn('tabular w-9 shrink-0 text-right font-mono text-[11px]', 'text-fg-subtle')}>
                {item.pct}%
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
