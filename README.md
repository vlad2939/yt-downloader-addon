# Home Assistant Add-on: YT Downloader

[![Open your Home Assistant instance and show the add-on store.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fvlad2939%2Fyt-downloader-addon)

![Supports aarch64](https://img.shields.io/badge/aarch64-yes-green.svg) ![Supports amd64](https://img.shields.io/badge/amd64-yes-green.svg) ![Supports armhf](https://img.shields.io/badge/armhf-yes-green.svg) ![Supports armv7](https://img.shields.io/badge/armv7-yes-green.svg) ![Supports i386](https://img.shields.io/badge/i386-yes-green.svg)

Acesta este un repository custom de addon-uri pentru Home Assistant care conține aplicația **YT Downloader**.

Aplicația este o interfață web simplă și elegantă integrată direct în Home Assistant (cu suport Ingress pentru Side Panel) pentru descărcarea videoclipurilor de pe YouTube la multiple rezoluții, inclusiv 4K.

## Funcționalități
* **Integrare Side Panel (Ingress)**: Utilizează Add-on-ul direct din bara laterală a Home Assistant, fără porturi publice expuse sau tab-uri adiționale, ca și cum ar fi o pagină nativă.
* Listează și separă multiple rezoluții disponibile: Formate Video + Audio (inclusiv 1440p / 2160p 4K).
* Fără reclame, integrat nativ, sigur de folosit.
* Videoclipurile se descarcă local pe dispozitivul de pe care accesezi vizualizarea Home Assistant (Laptop, PC, etc.), fără a ocupa spațiu pe server-ul/NUC-ul tău. Mentine SSD-ul NUC-ului tau curat!

## Adăugarea repository-ului în Home Assistant

Pentru a putea instala acest addon, trebuie mai întâi să adaugi acest repository in magazinul instanței tale de Home Assistant.

**Metoda 1: Adăugarea prin My Home Assistant (Automata)** 
Apasă pe badge-ul albastru "My Home Assistant" de mai sus.

**Metoda 2: Manual:**
1. Deschide interfața Home Assistant.
2. Navighează către **Settings** (Setări) -> **Add-ons** (Suplimente).
3. Apasă pe **Add-on Store** (Magazin de suplimente) - butonul din dreapta jos.
4. Dă click pe meniul cu cele 3 puncte (sus-dreapta) și alege **Repositories** (Depozite).
5. Introdu URL-ul acestui depozit:
   `https://github.com/vlad2939/yt-downloader-addon`
6. Apasă pe **Add**.

## Instalarea Add-on-ului
1. După adăugarea depozitului, închide fereastra pop-up și derulează la sfârșitul paginii **Add-on Store** pentru a găsi noul depozit.
2. Selectează **YT Downloader**.
3. Apasă pe **Install**. *Atenție: Acest proces de instalare presupune "building" pe NUC-ul tău, așa că instalarea poate dura câteva minute.*
4. După instalare, bifează următoarele:
   * **Start on boot**
   * **Show in sidebar** *(foarte important pentru a vedea aplicația în stânga în meniul HA!)*
5. Apasă pe **Start**.

Bucură-te de descărcări ușoare și rapide!
