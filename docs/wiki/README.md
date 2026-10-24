# Wiki – Prenota

Documentazione della web app per le prenotazioni degli spettacoli teatrali.
**Va aggiornata a ogni modifica dell'app** (vedi [Manutenzione della wiki](#manutenzione-della-wiki)).

> Stato: app completa; ogni pagina riporta in alto il proprio stato (tutte «fatto»). Unica verifica ancora aperta:
> il primo `docker build` / deploy sull'homelab (pagina 13).

## Categorie e pagine

### 1. Prodotto
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 1 | [Panoramica](01-panoramica.md) | fatto | Cos'è l'app, per chi è, cosa fa e cosa non fa, glossario |

### 2. Guida d'uso
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 2 | [Manuale operatore](02-manuale-operatore.md) | fatto | Inserire e modificare prenotazioni, ricerca, elenco ristoranti, uso senza rete |
| 3 | [Manuale admin](03-manuale-admin.md) | fatto | Locali, opere e tariffario, eventi, utenti |

### 3. Regole di business
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 4 | [Tariffe e incassi](04-tariffe-e-incassi.md) | fatto | Tipi di biglietto, pacchetto 22 + 27 €, prezzi congelati, formule ed esempi |
| 5 | [Capienza e posti](05-capienza-e-posti.md) | fatto | Conteggio persone, avviso oltre capienza, posti in testo libero |
| 6 | [Ristoranti e pacchetti](06-ristoranti-e-pacchetti.md) | fatto | Giamaica / Casale, pranzo / cena, elenco e condivisione |

### 4. Tecnica
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 7 | [Architettura](07-architettura.md) | fatto | Stack e versioni, cartelle, flusso dei dati |
| 8 | [Database](08-database.md) | fatto | Tabelle, vincoli, migrazioni |
| 9 | [Autenticazione e ruoli](09-autenticazione-e-ruoli.md) | fatto | Login, sessioni, permessi admin / operatore |
| 10 | [Offline](10-offline.md) | fatto | Coda delle nuove prenotazioni, invio automatico, service worker |
| 11 | [Interfaccia e stile](11-interfaccia-e-stile.md) | fatto | Design system applicato: token, tipografia, layout, componenti |

### 5. Operatività
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 12 | [Sviluppo e test](12-sviluppo-e-test.md) | fatto | Setup locale senza Docker, comandi, test, checklist nel browser |
| 13 | [Deploy homelab](13-deploy-homelab.md) | fatto, primo build sull'homelab da provare | Docker, compose, HTTPS, backup |

### 6. Storia
| # | Pagina | Stato | Contenuto |
|---|---|---|---|
| 14 | [Decisioni e roadmap](14-decisioni-e-roadmap.md) | – | Scelte fatte, limiti noti, evoluzioni |
| 15 | [Registro modifiche](15-registro-modifiche.md) | – | Storico delle modifiche |

## Documenti di progetto

- Design iniziale: [`docs/superpowers/specs/2026-10-24-prenota-design.md`](../superpowers/specs/2026-10-24-prenota-design.md)

## Manutenzione della wiki

Quando si modifica l'app, nello stesso commit:

1. aggiornare la pagina interessata (es. nuovo campo nel form → *Manuale operatore* + *Database*);
2. aggiornare lo stato in testa alla pagina (da implementare → in corso → fatto);
3. aggiungere una riga al [Registro modifiche](15-registro-modifiche.md);
4. se cambia qualcosa di essenziale (comandi, struttura, regole), aggiornare anche `CLAUDE.md` nella root.
