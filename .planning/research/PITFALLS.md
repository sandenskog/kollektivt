# Domain Pitfalls

**Domain:** Realtids-kollektivtrafik webbapp (SL/Stockholm)
**Researched:** 2026-03-06

## Critical Pitfalls

Misstag som orsakar omskrivningar eller allvarliga problem.

### Pitfall 1: Adress-till-hållplats kräver geocoding -- SL:s API har ingen adresssökning

**What goes wrong:** Utvecklare antar att SL:s API kan ta en adress och returnera närliggande hållplatser. SL:s `/v1/sites`-endpoint returnerar en lista på alla hållplatser (med lat/lon), men det finns ingen adresssökning inbyggd. Man kan söka på hållplatsnamn, men inte på gatuadresser. En adress-till-koordinat-tjänst (geocoding) behövs som separat steg.

**Why it happens:** Sammanblandning av "platsuppslag" (hållplatssökning) med geocoding (adress till koordinat). SL:s API löser bara det första problemet.

**Consequences:** Hela användarflödet kraschar -- "skriv in din adress" fungerar inte utan en extern geocoding-tjänst. Stor omskrivning av arkitekturen om man upptäcker detta sent.

**Prevention:**
- Implementera tvåstegsflöde tidigt: (1) Geocoda adressen till lat/lon via extern tjänst (Nominatim/OpenStreetMap gratis, eller Google Geocoding), (2) Filtrera SL:s hållplatslista på avstånd från koordinaten.
- Alternativ: Skippa adressinmatning helt och låt användaren söka på hållplatsnamn direkt (enklare, men sämre UX).
- Tredje alternativ: Använd webbläsarens Geolocation API för "hållplatser nära mig" utan adressinmatning.

**Detection:** Försöker skicka en gatuadress till SL:s API och får noll resultat eller felmeddelande.

**Phase:** Fas 1 (grundläggande arkitektur) -- detta är en arkitektonisk beslutspunkt som påverkar hela appens flöde.

---

### Pitfall 2: CORS-blockering vid direktanrop till SL:s API

**What goes wrong:** SL:s `transport.integration.sl.se` API sätter CORS-headers, men beteendet kan vara inkonsekvent. Den befintliga appen fungerar idag (direkt fetch från webbläsaren), men CORS-policy kan ändras utan förvarning eftersom API:et inte har något formellt SLA eller garantier för frontend-konsumtion.

**Why it happens:** API:et är designat som ett öppet data-API utan API-nycklar, men SL/Trafiklab kontrollerar CORS-headern på serversidan. Ändrad CORS-policy = alla frontend-appar slutar fungera omedelbart.

**Consequences:** Appen slutar fungera helt utan att koden ändrats. Användaren ser bara felmeddelanden. Kräver en proxy-server för att lösa, vilket bryter mot "ren frontend"-kravet.

**Prevention:**
- Bygg in en tunn proxy-fallback redan från start (t.ex. en enkel Nginx-proxy på Synology som vidarebefordrar till SL:s API). Kostar minimal ansträngning men ger en livlina.
- Övervaka CORS-headern i API-svar (`Access-Control-Allow-Origin`).
- Felhantering som visar tydligt meddelande "API:et är tillfälligt otillgängligt" istället för tyst krasch.

**Detection:** `fetch()` kastar ett `TypeError: Failed to fetch` eller `CORS error` i browserkonsolen. Lätt att testa med `curl -I` och granska headers.

**Phase:** Fas 1 (infrastruktur) -- bestäm CORS-strategi innan resten byggs.

---

### Pitfall 3: Polling-intervall som skapar onödig last och stale data

**What goes wrong:** Befintlig app pollar var 30:e sekund med `setInterval`. Problem uppstår i flera dimensioner: (1) Pollning fortsätter i bakgrundsflikar vilket slösar bandbredd och API-anrop, (2) användaren ser stale data i 29 sekunder efter att en avgång passerat, (3) vid flera bevakade hållplatser multipliceras API-anrop (N hållplatser x varje intervall).

**Why it happens:** `setInterval` är den enklaste lösningen men den naivaste. Webbläsare throttlar `setInterval` i bakgrundsflikar (ner till 1 gång/minut i Chrome), men anropen slutar inte helt.

**Consequences:** Onödig API-belastning kan leda till att SL rate-limitar eller blockerar IP-adressen. Användare med många hållplatser kan generera dussintals anrop per minut. Data känns "gammal" precis innan nästa uppdatering.

**Prevention:**
- Använd `document.visibilitychange` för att pausa/resumera pollning när fliken är dold.
- Batch-anrop: SL:s API tillåter att hämta avgångar per site. Gruppera hållplatser som delar site-ID.
- Visa "uppdateras om X sekunder" eller en countdown istället för bara senaste uppdateringstid.
- Överväg kortare intervall (15s) nära avgångstid och längre intervall (60s) för avlägsna avgångar.

**Detection:** Öppna DevTools Network-fliken och lämna appen öppen i en bakgrundsflik. Räkna API-anrop efter 10 minuter.

**Phase:** Fas 2 (realtidsuppdateringar) -- detta behöver inte vara perfekt i MVP men bör designas rätt.

---

### Pitfall 4: localStorage-schema utan versionshantering

**What goes wrong:** Användares sparade hållplatsval i localStorage fungerar tills datastrukturen ändras. Utan schemaversion kraschar appen vid uppgraderingar eftersom gammal data inte matchar ny kodlogik.

**Why it happens:** localStorage lagrar strängar. Utvecklare serialiserar objekt med `JSON.stringify` men tänker inte på bakåtkompatibilitet. En ny property i objektet, en ändrad nyckel, eller en borttagen property gör att gamla sparade data inte kan parsas korrekt.

**Consequences:** Appen kraschar för alla befintliga användare vid deploy. Enda lösningen är att be användare rensa sin localStorage manuellt -- extremt dålig UX.

**Prevention:**
- Lägg till en `version`-property i localStorage-schemat från dag 1.
- Skriv migreringsfunktioner: `if (saved.version < 2) { migrateV1toV2(saved) }`.
- Wrappa alla localStorage-reads i try/catch med fallback till default-värden.
- Testa migrering explicit: spara gammal data, ladda ny kod, verifiera.

**Detection:** Deploy en ändring i datastruktur, öppna appen i en webbläsare som har gammal data. Kraschar den?

**Phase:** Fas 1 (datamodell) -- bestäm schema och versionshantering innan första sparningen.

## Moderate Pitfalls

### Pitfall 5: SL:s site-ID vs stop-ID förvirring

**What goes wrong:** SL:s API har koncepten "site" (övergripande plats, t.ex. "Vega station" = site 9733) och "stop area" / "stop point" (specifik perrong/hållplats). Utvecklare blandar ihop dessa och anropar fel endpoint eller filtrerar på fel ID. Det leder till att man missar avgångar, visar avgångar från fel hållplats, eller får dubbletter.

**Prevention:**
- Dokumentera begreppsmodellen tydligt: site > stop_area > stop_point.
- Använd `/v1/sites/{id}/departures` (site-nivå) för att få alla avgångar från en plats, filtrera sedan i klienten.
- Testa med hållplatser som har flera stop areas (t.ex. stora stationer som Slussen) för att säkerställa korrekt beteende.

**Phase:** Fas 1 -- datamodellförståelse.

---

### Pitfall 6: Felhantering som döljer API-problem

**What goes wrong:** Generiska felmeddelanden som "Kunde inte hämta avgångar" (som i befintlig kod) ger användaren ingen information. Är det nätverksfel? Är SL:s API nere? Har hållplatsen inga avgångar just nu (natt)?

**Prevention:**
- Differentierad felhantering: nätverksfel vs HTTP-fel vs tom data vs CORS-fel.
- "Inga avgångar" (tom lista från API:et) ska visas annorlunda från "Kunde inte kontakta SL" (nätverksfel).
- Visa senast hämtade data med en "datan kan vara inaktuell"-varning vid tillfälliga fel istället för att tömma skärmen.
- Implementera retry-logik med exponential backoff vid tillfälliga fel.

**Phase:** Fas 2 -- efter grundläggande data-fetching.

---

### Pitfall 7: Geocoding-API rate limits och kostnad

**What goes wrong:** Om man väljer Google Geocoding API för adresssökning: det kostar pengar efter gratiskvoten. Nominatim (OpenStreetMap) är gratis men har strikt rate limit (1 request/sekund) och kräver caching. Utan hantering av detta slutar adresssökningen fungera under belastning eller genererar oväntade kostnader.

**Prevention:**
- Nominatim kräver en tydlig User-Agent och max 1 req/s. Implementera debounce (300-500ms) på adressinmatning.
- Cacha geocoding-resultat i localStorage -- samma adress ska inte geocodas två gånger.
- Om Google: sätt billing alerts och en max-budget.
- Bygg UI:t så att användaren kan välja hållplats direkt (utan geocoding) som alternativ.

**Phase:** Fas 1 -- val av geocoding-strategi.

---

### Pitfall 8: Responsiv design som inte fungerar på riktigt smala skärmar

**What goes wrong:** Avgångsinformation har tre delar: linje-badge, destination, tid. På smala skärmar (320px, äldre iPhones) klipps destinationsnamn av, tider hamnar utanför viewporten, eller rader rastar i oläslig ordning. Befintlig kod har `text-overflow: ellipsis` men ingen mobiltest under 480px.

**Prevention:**
- Testa på 320px bredd (iPhone SE) tidigt.
- Prioritera information: linje + tid är viktigast, destination kan förkortas aggressivt.
- Undvik horisontell scroll -- om det inte syns i viewporten finns det inte.
- Överväg en alternativ mobilayout där destination visas under linjenumret istället för bredvid.

**Phase:** Fas 3 (design/responsivitet).

---

### Pitfall 9: direction_code är magisk och odokumenterad

**What goes wrong:** Befintlig kod filtrerar på `direction_code === 2` för tåg mot Stockholm och `direction_code === 1` för buss 840 mot Nacka. Dessa magiska siffror (1 eller 2) är inte konsekvent dokumenterade och kan variera mellan hållplatser. En hållplats kan ha direction_code 1 = "mot centrum" medan en annan har 1 = "från centrum".

**Prevention:**
- Filtrera aldrig enbart på direction_code. Kombinera med destination-namn eller line designation.
- Alternativt: hämta alla avgångar och låt användaren filtrera per riktning/destination i UI:t.
- Bygg en "setup wizard" där användaren ser alla avgångar och väljer vilka riktningar de bryr sig om, istället för att hårdkoda riktning.

**Phase:** Fas 2 -- när dynamisk hållplatsval implementeras.

## Minor Pitfalls

### Pitfall 10: Font-laddning blockerar rendering

**What goes wrong:** `@import url('https://fonts.googleapis.com/css2?family=Nunito...')` i CSS blockerar rendering. Användaren ser en vit sida i 100-500ms medan typsnittet laddas.

**Prevention:**
- Använd `<link rel="preload" as="style">` eller `font-display: swap`.
- Överväg att hosta fonten lokalt (self-host) för snabbare laddning.

**Phase:** Fas 3 (optimering).

---

### Pitfall 11: Ingen offline-indikation

**What goes wrong:** Användaren tappar nätverk (i tunnelbanan, ironiskt nog) och appen visar gamla data utan att indikera att den inte uppdateras. Användaren tror avgångarna stämmer men de kan vara 10 minuter gamla.

**Prevention:**
- Lyssna på `navigator.onLine` och `online/offline` events.
- Visa tydlig banner "Du är offline -- datan kan vara inaktuell".
- Visa ålder på data: "Uppdaterad 3 min sedan" som blir rött efter >2 minuter.

**Phase:** Fas 2 (realtidsuppdateringar).

---

### Pitfall 12: Hållplatssökning som returnerar för många resultat

**What goes wrong:** Om man söker "nära mig" med en radie på 1km i centrala Stockholm kan man få 50+ hållplatser. Utan filtrering/gruppering blir UI:t oanvändbart.

**Prevention:**
- Begränsa till max 10-15 närmaste hållplatser i sökresultat.
- Gruppera närliggande stopp (t.ex. busshållplatser på båda sidor av gatan) under ett namn.
- Visa avstånd till varje hållplats för att hjälpa användaren välja.

**Phase:** Fas 1 (hållplatsval-flödet).

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Adressökning & hållplatsval | Geocoding-API saknas i SL:s stack (Pitfall 1, 7) | Välj geocoding-strategi (Nominatim vs Geolocation API) innan implementation |
| CORS & API-anslutning | CORS-policy kan ändras (Pitfall 2) | Bygg proxy-fallback, testa CORS tidigt |
| localStorage-persistens | Schema-evolution kraschar appen (Pitfall 4) | Versionerat schema med migreringsfunktioner från start |
| Realtidsuppdateringar | Onödig polling, stale data (Pitfall 3) | Visibility API, batching, adaptivt intervall |
| Riktningsfiltrering | direction_code fungerar inte generiskt (Pitfall 9) | Låt användaren välja destination i UI istället för hårdkodning |
| Responsiv design | Avgångsrader passar inte smala skärmar (Pitfall 8) | Testa 320px tidigt, prioritera linje + tid |
| Felhantering | Generiska fel döljer orsak (Pitfall 6) | Differentierade felmeddelanden, retry-logik, visa senast kända data |

## Sources

- Analys av befintlig `index.html` i projektet (hårdkodade hållplatser, direction_code, setInterval-mönster)
- SL Transport API (`transport.integration.sl.se/v1`) -- testad endpoints `/sites` och `/sites/{id}/departures`
- Trafiklab.se -- API-katalog och dokumentation
- Nominatim/OpenStreetMap användningspolicy (training data, MEDIUM confidence)
- Generell erfarenhet av realtids-transit-appar och localStorage-mönster (training data, MEDIUM confidence)
