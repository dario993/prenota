# Prenota

Web app (mobile-first, ottimizzata anche desktop) per le prenotazioni degli spettacoli teatrali: locali, opere,
eventi, prenotazioni con pacchetti ristorante (Giamaica / Casale). Multi utente (admin / operatore).

**Documentazione completa: [docs/wiki/README.md](docs/wiki/README.md)** – leggerla prima di modificare l'app.
Design: `docs/superpowers/specs/2026-10-24-prenota-design.md`.

Stato: wiki scritta, codice non ancora iniziato.

## Regole del progetto

- Interfaccia, testi, nomi di variabili e commit in **italiano** (`feat: …`, `fix: …`, `docs: …`).
- Logica in moduli TS puri e testati (`src/lib/`); i componenti li collegano soltanto.
- Nessuna nuova dipendenza senza motivo forte.
- **Ogni modifica all'app aggiorna la wiki nello stesso commit** (pagina interessata + `docs/wiki/15-registro-modifiche.md`)
  e, se cambia qualcosa di essenziale, anche questo file.
