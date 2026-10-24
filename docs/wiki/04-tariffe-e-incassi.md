# 4. Tariffe e incassi

> Stato: fatto

## Tipi di biglietto

| Tipo | Prezzo | Occupa posto |
|---|---|---|
| Adulto | `prezzo_adulto` dell'opera | sì |
| Ridotto gruppi | `prezzo_ridotto` | sì |
| Bambino | `prezzo_bambino` | sì |
| Pacchetto | `prezzo_pacchetto_teatro` + `prezzo_pacchetto_ristorante` (22 + 27 = 49 €) | sì |
| Omaggio | 0 € | sì |

Il pacchetto **sostituisce** il biglietto normale: una persona col pacchetto conta solo come pacchetto.

## Prezzi congelati

Quando una prenotazione viene salvata la prima volta, l'app **copia sulla prenotazione** i prezzi dell'opera in quel
momento. Se poi l'admin cambia il tariffario, le prenotazioni già fatte mantengono i loro importi.
Le modifiche successive a una prenotazione (es. cambio quantità) usano i prezzi già copiati.

## Formule

Per una prenotazione (prezzi = quelli congelati):

```
persone            = adulti + ridotti + bambini + pacchetti + omaggi
incasso_teatro     = adulti·p_adulto + ridotti·p_ridotto + bambini·p_bambino + pacchetti·p_pacchetto_teatro
incasso_ristorante = pacchetti·p_pacchetto_ristorante
totale             = incasso_teatro + incasso_ristorante
```

Per un evento: somma su tutte le prenotazioni. L'incasso ristorante si mostra anche diviso per Giamaica e Casale.

Gli importi sono **previsti** (l'app non registra i pagamenti). Internamente sono interi in **centesimi**, per
evitare errori di arrotondamento; a video sono in euro con virgola (`49,00 €`).

## Esempio

Tariffario: adulto 15 €, ridotto 12 €, bambino 8 €, pacchetto 22 + 27 €.
Prenotazione: 2 adulti, 1 bambino, 2 pacchetti (Casale, cena), 1 omaggio.

| Voce | Calcolo | Importo |
|---|---|---|
| Persone | 2 + 1 + 2 + 1 | 6 |
| Incasso teatro | 2·15 + 1·8 + 2·22 | 82,00 € |
| Incasso ristorante (Casale) | 2·27 | 54,00 € |
| Totale | 82 + 54 | 136,00 € |

Codice: `src/lib/calcoli.ts` (funzioni pure, con test).
