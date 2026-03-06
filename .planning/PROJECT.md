# Kollektivt

## What This Is

En öppen webbapp för realtidsavgångar i Stockholms kollektivtrafik. Användaren skriver in sin adress, får förslag på närliggande hållplatser, väljer vilka de vill bevaka, och ser realtidsavgångar samt störningsinformation. Vem som helst kan använda den för valfri plats i SL:s trafiknät.

## Core Value

Användaren ska snabbt kunna se nästa avgång från sina valda hållplatser — utan konfigurationskrångel, utan inloggning, utan fördröjning.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Användaren kan skriva in en adress och få förslag på närliggande hållplatser
- [ ] Användaren kan välja vilka hållplatser de vill bevaka
- [ ] Användaren ser realtidsavgångar från valda hållplatser (buss + tåg)
- [ ] Avgångarna uppdateras automatiskt i realtid
- [ ] Förseningar visas tydligt (schedulerad vs förväntad tid)
- [ ] Aktiva störningar/avvikelser visas för valda linjer
- [ ] Användarens val sparas i webbläsaren (localStorage)
- [ ] Responsiv design som fungerar på mobil, tablet och desktop
- [ ] Rent frontend — inga servrar, pratar direkt med SL:s API

### Out of Scope

- Inloggning/konton — localStorage räcker, ingen synk mellan enheter
- Resplanering — appen visar avgångar, inte reseförslag
- Separata vyer för iPad/Nest Hub — en responsiv design istället
- Backend/server — allt körs i webbläsaren
- Kartor — fokus på avgångslista, inte geografisk vy

## Context

Projektet är en ombyggnad av en befintlig statisk HTML-sida som visar hardkodade avgångar från Vega-området (pendeltåg, buss 810, buss 840). Nuvarande app fungerar men är låst till en plats och svår att bygga vidare på — allt ligger i en enda HTML-fil.

SL:s transport-API (`transport.integration.sl.se/v1`) används redan idag för realtidsdata och kräver ingen API-nyckel. För adress-till-hållplats behövs SL:s platsuppslag-API eller liknande.

Det finns redan en bakgrundsbild (`bg.jpg`) och en visuell stil med Nunito-typsnitt, glasmorfism-kort och mjuka färger.

## Constraints

- **API**: SL:s öppna API:er — inga API-nycklar eller autentisering
- **Hosting**: Statiska filer på Synology NAS via Docker, hostas på `kollektivt.sandenskog.se` (reverse proxy sätts upp på NAS:en)
- **Tech**: Rent frontend, inga build-steg krävs men moderna verktyg är okej
- **Design**: Minimalistisk, ljus design — visuell styling görs i slutfasen

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ren frontend utan backend | Enklare hosting, inga API-nycklar behövs, SL:s API är öppet | — Pending |
| localStorage för persistens | Inget behov av synk mellan enheter, undviker komplexitet med konton | — Pending |
| Responsiv design istället för separata vyer | Enklare underhåll, en kodbas för alla enheter | — Pending |

---
*Last updated: 2026-03-06 after initialization*
