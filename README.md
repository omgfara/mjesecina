# Mjesečina

Web aplikacija na bosanskom jeziku za praćenje menstrualnog ciklusa.

## Mogućnosti

- **Ciklus:** prsten s fazama (menstruacija, folikularna, ovulacija, lutealna), današnji dan i mjesec koji prati ciklus
- **Prognoza:** sljedeća menstruacija, procijenjena ovulacija i plodni dani
- **Kalendar:** stvarne i predviđene menstruacije, ovulacija, plodni dani
- **Dnevnik:** jačina krvarenja, raspoloženje, društvene i fizičke aktivnosti, pilula (aktivna / šećerna / nisam uzela), bolovi, koža, kosa, stolica, probava, bilješka
- **Analiza:** najčešći simptomi, simptomi po fazama, dužina ciklusa, jačina krvarenja, pregled pilule
- **Nebo koje prati fazu:** boje, čestice, zvijezde i mjesečina u pozadini mijenjaju se s fazom ciklusa
- **Ikona koja prati fazu:** favicon i ikona za početni ekran prikazuju današnju fazu mjeseca
- Svijetla i tamna tema (prati sistem), prilagođeno telefonu

## Pokretanje

Nema build koraka. Otvori `index.html` u pregledniku ili pokreni lokalni server:

```bash
python3 -m http.server 8000
# zatim otvori http://localhost:8000
```

## Objava na GitHub Pages

1. Napravi repozitorij i pošalji fajlove (`git init`, `git add .`, `git commit`, `git push`).
2. Na GitHubu: **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Odaberi granu `main` i folder `/ (root)`, pa **Save**.
4. Stranica će biti dostupna na `https://TVOJE-IME.github.io/NAZIV-REPOZITORIJA/`.

## Struktura

```
index.html        struktura stranice
css/style.css     izgled, teme, animacije
js/app.js         izračun ciklusa, dnevnik, analiza
favicon.svg       ikona
```

## Privatnost

Svi podaci se spremaju samo u `localStorage` tvog preglednika. Ništa se ne šalje na server.
Brisanjem podataka preglednika brišu se i zabilješke.

## Napomena

Aplikacija je dnevnik i procjena, a ne medicinski savjet.
