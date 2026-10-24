# 6. Ristoranti e pacchetti

> Stato: da implementare

## Regole

- Ristoranti: **GIAMAICA** e **CASALE** (lista fissa nel codice).
- Pasti: **PRANZO** e **CENA**.
- Se una prenotazione ha **pacchetti > 0**, ristorante **e** pasto sono obbligatori; se pacchetti = 0 restano vuoti
  (vincolo anche nel database).
- Una prenotazione ha **un** ristorante e **un** pasto: un gruppo diviso si inserisce come più prenotazioni.
- Coperti al ristorante = numero di **pacchetti** (adulti/bambini senza pacchetto non mangiano al ristorante).

## Elenco per ristorante

Pagina `/eventi/[id]/ristoranti`, per ciascun ristorante e pasto:

```
CASALE – CENA – Sab 10 ottobre 2026
Opera: DOCUFILM
Coperti: 12

- ROSSI MARIO (2) – 333 1234567 – 1 celiaco
- Gruppo Sicilia (10)
```

Sezioni senza coperti non vengono mostrate.

## Condividi e stampa

- **Condividi**: usa il menu di condivisione del telefono (`navigator.share`) con il testo dell'elenco di **quel**
  ristorante → WhatsApp, email, SMS…
- Dove la condivisione non c'è (molti desktop): il testo viene **copiato negli appunti** con un messaggio di conferma.
- **Stampa**: `window.print()` con uno stile di stampa pulito (senza menu).
- Entrambe richiedono **HTTPS** in produzione (vedi [Deploy homelab](13-deploy-homelab.md)).

## Incasso ristorante

`pacchetti · prezzo_pacchetto_ristorante` (27 € di default), mostrato per ristorante nel riepilogo evento.
Vedi [Tariffe e incassi](04-tariffe-e-incassi.md).
