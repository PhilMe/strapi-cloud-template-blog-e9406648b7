# COBI Bilder Download Anleitung

## Schritt 1: Bilder herunterladen

Bitte lade die Produktbilder von cobibricks.com manuell herunter:

| Set Nr. | Name | cobibricks.com Link |
|---------|------|---------------------|
| 4833 | USS Enterprise (CV-6) | https://cobibricks.com/product/uss-enterprise-cv-6,3322 |
| 4836 | Bismarck | https://cobibricks.com/product/battleship-bismarck,13624 |
| 4837 | Battleship Missouri (BB-63) | https://cobibricks.com/product/battleship-missouri-bb-63,9694 |
| 2559 | Tiger I | https://cobibricks.com/product/panzerkampfwagen-vi-tiger-ausf-e,3315 |
| 2587 | Panther G | https://cobibricks.com/product/panzerkampfwagen-v-panther-ausf-g,3311 |
| 2572 | T-34/85 | https://cobibricks.com/product/t-3485,3313 |
| 5749 | B-17G Flying Fortress | https://cobibricks.com/product/b-17g-flying-fortress,14022 |
| 5741 | Messerschmitt Bf 109 F-2 | https://cobibricks.com/product/messerschmitt-bf-109-f-2,3318 |
| 5728 | Supermarine Spitfire Mk.IX | https://cobibricks.com/product/supermarine-spitfire-mk-ix,3319 |
| 2295 | Willys MB & Trailer | https://cobibricks.com/product/willys-mb-trailer,3324 |

### So geht's:
1. Öffne den Link in deinem Browser
2. Rechtsklick auf das Hauptproduktbild (Box-Bild)
3. "Bild speichern unter..." wählen
4. Speichere das Bild im Ordner `cobipedia-cms/scripts/images/`
5. Benenne das Bild nach der Set-Nummer: z.B. `4837.jpg`

## Schritt 2: Bilder hochladen

Nach dem Download führe das Upload-Skript aus:

```bash
cd /path/to/cobipedia-cms
STRAPI_TOKEN=dein_token npm install form-data
STRAPI_TOKEN=dein_token node scripts/upload-images.js
```

Das Skript wird:
- Alle Bilder im `scripts/images/` Ordner finden
- Sie in Strapi hochladen
- Die Sets mit den Bildern verknüpfen

## Dateibenennung

Die Bilder müssen nach der Set-Nummer benannt werden:
- `4833.jpg` oder `4833.png`
- `4837.jpg` oder `4837.png`
- usw.

Das Skript erkennt .jpg, .png und .webp Dateien.
