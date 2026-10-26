# 4. Tariffe e incassi

> Stato: fatto

## Tariffe

Ogni opera ha un **tariffario libero** (Admin → Opere): tariffe con nome e prezzo, per esempio per CHIARA DI DIO
Adulti 28 €, Ridotti gruppi 22 €, Bambini 12 €, Omaggi 0 €, Associato 5 €. Ogni persona occupa un posto,
qualunque sia la tariffa (anche a 0 €). Una tariffa può essere **nascosta**: non compare quando si prenota ma le
prenotazioni che la usano contano normalmente.

Il **pacchetto** è a parte: `prezzo_pacchetto_teatro` + `prezzo_pacchetto_ristorante` (22 + 27 = 49 €), con
ristorante e pasto. Il pacchetto **sostituisce** il biglietto normale: una persona col pacchetto conta solo come
pacchetto.

## Prezzi congelati

Quando una prenotazione viene salvata la prima volta, l'app **copia** il prezzo di ogni tariffa usata (e le quote del
pacchetto) in quel momento. Se poi l'admin cambia il tariffario, le prenotazioni già fatte mantengono i loro importi.
In modifica, le tariffe già presenti tengono il prezzo copiato; una tariffa **aggiunta** in modifica prende il prezzo
attuale, che da lì resta congelato.

## Formule

Per una prenotazione (prezzi = quelli congelati):

```
persone            = Σ quantità delle tariffe + pacchetti
incasso_teatro     = Σ quantità·prezzo delle tariffe + pacchetti·p_pacchetto_teatro
incasso_ristorante = pacchetti·p_pacchetto_ristorante
totale             = incasso_teatro + incasso_ristorante
```

Per un evento: somma su tutte le prenotazioni. L'incasso ristorante si mostra anche diviso per Giamaica e Casale.

I biglietti LiveTicket contano nelle righe per tariffa e nei pacchetti del riepilogo, ma «Incasso teatro previsto», «Incasso pacchetti previsto» e i totali per pagamento sono **solo della lista Prenota**; gli incassi LiveTicket stanno nella riga a parte «Incasso LiveTicket» (prezzi congelati dell'ordine, commissione di 1,50 € mai conteggiata).

Gli importi sono **previsti** (l'app non registra i pagamenti). Internamente sono interi in **centesimi**, per
evitare errori di arrotondamento; a video sono in euro con virgola (`49,00 €`).

## Esempio

Tariffario: Adulti 15 €, Ridotti gruppi 12 €, Bambini 8 €, Omaggi 0 €, pacchetto 22 + 27 €.
Prenotazione: 2 Adulti, 1 Bambini, 2 pacchetti (Casale, cena), 1 Omaggi.

| Voce | Calcolo | Importo |
|---|---|---|
| Persone | 2 + 1 + 2 + 1 | 6 |
| Incasso teatro | 2·15 + 1·8 + 2·22 | 82,00 € |
| Incasso ristorante (Casale) | 2·27 | 54,00 € |
| Totale | 82 + 54 | 136,00 € |

Codice: `src/lib/calcoli.ts` (funzioni pure, con test).
