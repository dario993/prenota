import {
  riepilogoEvento, formattaEuro, NOMI_RISTORANTI, NOMI_PASTI, RISTORANTI, PASTI, type Prenotazione,
} from "@/lib/calcoli";

const Riga = ({ testo, valore, testId, rientro = false }: { testo: string; valore: React.ReactNode; testId?: string; rientro?: boolean }) => (
  <div className={`flex justify-between gap-3 lg:flex-col lg:justify-start lg:gap-0 ${rientro ? "pl-3 text-ink-muted lg:pl-0" : ""}`}>
    <dt className="lg:text-caption lg:text-ink-muted">{testo}</dt>
    <dd className="tabular-nums lg:text-heading" data-testid={testId}>{valore}</dd>
  </div>
);

export function Riepilogo({ prenotazioni, capienza }: { prenotazioni: Prenotazione[]; capienza: number }) {
  const r = riepilogoEvento(prenotazioni, capienza);
  const oltre = r.postiLiberi < 0;
  const tipi = [["Adulti", r.perTipo.adulti], ["Ridotti", r.perTipo.ridotti], ["Bambini", r.perTipo.bambini],
    ["Pacchetti", r.perTipo.pacchetti], ["Omaggi", r.perTipo.omaggi]] as const;
  const coperti = RISTORANTI.flatMap((k) => PASTI.filter((p) => r.ristoranti[k][p] > 0).map((p) => ({ k, p })));
  return (
    <section aria-label="Riepilogo" className="rounded-lg bg-surface-sunken p-4 lg:flex lg:flex-wrap lg:items-start lg:gap-x-8 lg:gap-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-label text-ink-muted">Persone</div>
          <div className="text-figure tabular-nums" data-testid="persone">{r.persone}</div>
          <div className="text-caption text-ink-muted">su {r.capienza}</div>
        </div>
        <div>
          <div className="text-label text-ink-muted">Posti liberi</div>
          <div className={`text-figure tabular-nums ${oltre ? "text-warning" : ""}`} data-testid="liberi">
            {oltre ? `−${-r.postiLiberi}` : r.postiLiberi}
          </div>
          {oltre && <div className="text-label text-warning">oltre capienza</div>}
        </div>
      </div>
      <dl className="mt-4 space-y-1 border-t border-line pt-4 lg:grid lg:auto-cols-max lg:grid-flow-col lg:gap-x-6 lg:space-y-0 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        {tipi.map(([n, v]) => <Riga key={n} testo={n} valore={v} />)}
      </dl>
      {coperti.length > 0 && (
        <div className="mt-4 border-t border-line pt-4 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <h2 className="mb-1 text-label text-ink-muted">Coperti</h2>
          <dl className="space-y-1 lg:grid lg:auto-cols-max lg:grid-flow-col lg:gap-x-6 lg:space-y-0">
            {coperti.map(({ k, p }) => (
              <Riga key={k + p} testo={`${NOMI_RISTORANTI[k]} ${NOMI_PASTI[p].toLowerCase()}`} valore={r.ristoranti[k][p]} />
            ))}
          </dl>
        </div>
      )}
      <div className="mt-4 border-t border-line pt-4 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <dl className="space-y-1 lg:grid lg:auto-cols-max lg:grid-flow-col lg:gap-x-6 lg:space-y-0">
          <Riga testo="Incasso teatro" valore={formattaEuro(r.incassoTeatro)} testId="teatro" />
          <Riga testo="Incasso pacchetti" valore={formattaEuro(r.incassoRistorante)} testId="ristorante" />
          {RISTORANTI.filter((k) => r.ristoranti[k].incasso > 0).map((k) => (
            <Riga key={k} testo={NOMI_RISTORANTI[k]} valore={formattaEuro(r.ristoranti[k].incasso)} rientro />
          ))}
        </dl>
        <p className="mt-2 text-caption text-ink-muted">Importi previsti, non incassati.</p>
      </div>
    </section>
  );
}
