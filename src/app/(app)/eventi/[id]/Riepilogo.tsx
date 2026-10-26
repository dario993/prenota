import {
  riepilogoEvento, formattaEuro, NOMI_PAGAMENTI, NOMI_RISTORANTI, NOMI_PASTI, PAGAMENTI, RISTORANTI, PASTI,
  type Prenotazione, type PrezziPacchetto, type Tariffa,
} from "@/lib/calcoli";
import { BarraCapienza } from "@/components/BarraCapienza";

// Una riga etichetta / cifra; `sotto`: voce di dettaglio rientrata e in grigio.
const Riga = ({ testo, valore, testId, sotto = false, totale = false }:
  { testo: React.ReactNode; valore: React.ReactNode; testId?: string; sotto?: boolean; totale?: boolean }) => (
  <div className={`flex justify-between gap-3 border-t border-line py-1.5 ${totale ? "font-semibold" : ""}`}>
    <dt className={sotto ? "pl-3 text-ink-muted" : ""}>{testo}</dt>
    <dd className={`tabular-nums ${totale ? "" : "font-medium"}`} data-testid={testId}>{valore}</dd>
  </div>
);

const Riquadro = ({ id, titolo, destra, children, className = "" }:
  { id: string; titolo: string; destra?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section aria-labelledby={id} className={`rounded-lg border border-line p-5 ${className}`}>
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-body font-semibold">{titolo}</h2>
      <span className="text-label font-normal text-ink-muted">{destra}</span>
    </div>
    {children}
  </section>
);

// Tre riquadri: la sala (persone, barra della capienza, stati), i biglietti per tariffa con l'incasso del teatro, i ristoranti.
// `prenotazioni`: quelle che contano (niente annullate né invii falliti); `tutte` per contare annullate e senza stato.
export function Riepilogo({ prenotazioni, tutte, capienza, tariffe, prezzi }: {
  prenotazioni: Prenotazione[]; tutte: Prenotazione[]; capienza: number; tariffe: Tariffa[]; prezzi: PrezziPacchetto;
}) {
  const r = riepilogoEvento(prenotazioni, capienza, tariffe);
  const oltre = r.postiLiberi < 0;
  const prezzo = (id: string) => tariffe.find((t) => t.id === id)?.prezzo;
  const coperti = RISTORANTI.flatMap((k) => PASTI.filter((p) => r.ristoranti[k][p] > 0).map((p) => ({ k, p })));
  const senzaStato = prenotazioni.filter((p) => !p.contrassegno && !p.in_attesa).length;
  const inAttesa = prenotazioni.filter((p) => p.in_attesa).length;
  const annullate = tutte.filter((p) => p.contrassegno === "annullato").length;
  return (
    <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Riquadro id="r-sala" titolo="Sala" className="md:col-span-2 xl:col-span-1" destra={oltre
        ? <span className="font-medium text-warning"><span data-testid="liberi">−{-r.postiLiberi}</span> oltre capienza</span>
        : <><span data-testid="liberi" className="tabular-nums">{r.postiLiberi}</span> {r.postiLiberi === 1 ? "posto libero" : "posti liberi"}</>}>
        <div className="mb-1 flex items-baseline gap-2">
          <span className={`text-[34px] font-medium leading-[38px] tracking-tight tabular-nums ${oltre ? "text-warning" : "text-accent"}`} data-testid="persone">{r.persone}</span>
          <span className="text-ink-muted tabular-nums">persone su {r.capienza}</span>
        </div>
        <BarraCapienza persone={r.persone} capienza={r.capienza} />
        <dl className="mt-4 text-label font-normal">
          <Riga testo="Prenotazioni attive" valore={prenotazioni.length} />
          <Riga testo="Senza stato" valore={senzaStato} />
          {inAttesa > 0 && <Riga testo="In attesa di invio" valore={inAttesa} />}
          <Riga testo="Annullate" valore={annullate} />
        </dl>
      </Riquadro>
      <Riquadro id="r-biglietti" titolo="Biglietti" destra="persone">
        <dl className="text-label font-normal">
          {r.perTariffa.length === 0 && !r.pacchetti && <p className="border-t border-line py-1.5 text-ink-muted">Nessun biglietto prenotato</p>}
          {r.perTariffa.map((v) => (
            <Riga key={v.tariffa_id} valore={v.quantita}
              testo={<>{v.nome} {prezzo(v.tariffa_id) !== undefined && <span className="text-ink-muted tabular-nums">{formattaEuro(prezzo(v.tariffa_id)!)}</span>}</>} />
          ))}
          {r.pacchetti > 0 && (
            <Riga valore={r.pacchetti} testo={<>Pacchetti <span className="text-ink-muted tabular-nums">
              {formattaEuro(prezzi.prezzo_pacchetto_teatro + prezzi.prezzo_pacchetto_ristorante)}</span></>} />
          )}
          <Riga totale testo="Incasso teatro previsto" valore={formattaEuro(r.incassoTeatro)} testId="teatro" />
        </dl>
        {/* solo i pagamenti scelti in almeno una prenotazione; importo = teatro + ristorante */}
        {PAGAMENTI.some((k) => r.pagamenti[k].prenotazioni > 0) && (
          <dl className="mt-3 text-label font-normal">
            {PAGAMENTI.filter((k) => r.pagamenti[k].prenotazioni > 0).map((k) => (
              <Riga key={k} testId={`pagamento-${k}`} valore={formattaEuro(r.pagamenti[k].importo)}
                testo={<>{NOMI_PAGAMENTI[k]} <span className="text-ink-muted tabular-nums">
                  {r.pagamenti[k].prenotazioni} {r.pagamenti[k].prenotazioni === 1 ? "prenotazione" : "prenotazioni"}</span></>} />
            ))}
          </dl>
        )}
      </Riquadro>
      <Riquadro id="r-ristoranti" titolo="Ristoranti" destra="coperti">
        <dl className="text-label font-normal">
          {coperti.length === 0 && <p className="border-t border-line py-1.5 text-ink-muted">Nessun pacchetto ristorante</p>}
          {coperti.map(({ k, p }) => (
            <Riga key={k + p} testo={`${NOMI_RISTORANTI[k]} ${NOMI_PASTI[p].toLowerCase()}`} valore={r.ristoranti[k][p]} />
          ))}
          {coperti.length > 0 && RISTORANTI.filter((k) => r.ristoranti[k].incasso > 0).map((k) => (
            <Riga key={k} sotto testo={NOMI_RISTORANTI[k]} valore={formattaEuro(r.ristoranti[k].incasso)} />
          ))}
          <Riga totale testo="Incasso pacchetti previsto" valore={formattaEuro(r.incassoRistorante)} testId="ristorante" />
        </dl>
        <p className="mt-2 text-caption text-ink-muted">Importi previsti, non incassati.</p>
      </Riquadro>
    </div>
  );
}
