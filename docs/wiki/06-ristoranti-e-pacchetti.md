# 6. Ristoranti e pacchetti

> Stato: fatto

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
CASALE – CENA – sab 10 ottobre 2026
Opera: DOCUFILM
Coperti: 12

- Gruppo Sicilia (10)
- ROSSI MARIO (2) – 333 1234567 – 1 celiaco
```

Righe in ordine alfabetico; telefono e note compaiono solo se presenti. Le prenotazioni annullate non compaiono. Sezioni senza coperti non vengono mostrate.

## Condividi e stampa

- **Condividi**: usa il menu di condivisione del telefono (`navigator.share`) con il testo dell'elenco di **quel**
  ristorante → WhatsApp, email, SMS…
- Dove la condivisione non c'è (molti desktop): il testo viene **copiato negli appunti** con un messaggio di conferma.
- **Stampa**: pulsante in alto (`window.print()`); la stampa esce a tutta larghezza, in nero su bianco, senza menu,
  pulsanti e messaggi.
- Se l'evento non ha pacchetti ristorante la pagina mostra "Nessun pacchetto ristorante per questo evento".
- In alto un link riporta alla pagina dell'evento.
- Entrambe richiedono **HTTPS** in produzione (vedi [Deploy homelab](13-deploy-homelab.md)).

I pacchetti degli ordini LiveTicket entrano nell'elenco con l'etichetta «LiveTicket» (nella pagina) o il suffisso « – LiveTicket» (testo condiviso) e contano nei coperti.

## Incasso ristorante

`pacchetti · prezzo_pacchetto_ristorante` (27 € di default), mostrato per ristorante nel riepilogo evento.
Vedi [Tariffe e incassi](04-tariffe-e-incassi.md).

Nel riepilogo evento i coperti di ogni ristorante/pasto sono il totale più due righe «Prenotati» (lista Prenota) e «LiveTicket» (se ce ne sono); gli incassi per ristorante restano solo della lista.
