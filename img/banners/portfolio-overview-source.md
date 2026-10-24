# Portfolio KAIROX — jeden baner, pełny format

Kompozycja SVG przygotowana w kodzie, bez generowania obrazów i bez zewnętrznych zasobów. Dwie proporcje tej samej koncepcji: desktop 1600 × 180, mobile 390 × 156. Każda pokrywa pełne pole banera. Lewa część celowo rezerwuje kontrastowe miejsce na dostępny tekst HTML, prawa pokazuje montaż rzeczywistych screenów siedmiu projektów. Trzy najnowsze znajdują się na pierwszym planie: Bieg Rzeczy, Czysty Układ, Słój i Forma. W drugim: Galeria Klik, My Trip World, Archiwum Śledcze, AMO. Bez drobnych podpisów.

W obu SVG osadzono jako data URI pełne, oryginalne screenshoty WebP 1440 × 900 px. Bez zmniejszania, ponownej kompresji ani generowania widoków. Oryginalne WebP zachowują więcej szczegółów niż poprzednie miniatury JPEG 360 px / jakość 52. Każdy SVG jest samodzielnym obrazem. Kompozycja, geometria, kolory, wymiary SVG i pole tekstowe pozostały identyczne; zmieniono wyłącznie dane osadzonych obrazów.

Cała kompozycja jest jednym linkiem do `/realizacje.html`. Nagłówek HTML: „A gdyby Twoja strona wyglądała tak?”. Pod nim wyłącznie mała wskazówka: „Kliknij w baner i zobacz więcej →”. Brak wizualnego buttona. Zamknięcie osobno, 44 × 44 px.

Fikcyjne marki koncepcyjne zachowują oznaczenia w portfolio; baner nie przedstawia ich jako klientów.

## Weryfikacja źródeł — 2026-10-25

Każde z 7 osadzeń w każdym wariancie zostało odkodowane i porównane bajt po bajcie z plikiem źródłowym: 14/14 zgodnych. Kontrola struktury SVG po zastąpieniu data URI wspólnym znacznikiem potwierdziła identyczną kompozycję przed i po zmianie.

| Źródło 1440 × 900 | Bajty | SHA-256 |
| --- | ---: | --- |
| `img/projects/screens/galeria-klik-desktop.webp` | 69328 | `7cf6f3ad5bcb29536d2a1dc0af0f87ad83f04d7acacb882acd86488ff1e23d10` |
| `img/projects/screens/my-trip-world-desktop.webp` | 81218 | `89234f187b52633872afb3b07e7e4f8fa9a0c6b6e158d029f5ea322f98ec1f0f` |
| `img/projects/screens/archiwum-sledcze-desktop.webp` | 63334 | `8260a09e06c4ac275ddf74fff40822081523865e5fc9efff73e772e4221a7dc6` |
| `img/projects/screens/amo-desktop.webp` | 86278 | `6b0a00101d85d0fc552c91a2fa8c35aefc97b80661647838b58bec5a917bf2c0` |
| `img/projects/screens/bieg-rzeczy-desktop.webp` | 89868 | `569705f6a15c11d67980c1eebff1ab3f3cf88465f30c4a6bd7063ac2228f9b8f` |
| `img/projects/screens/czysty-uklad-desktop.webp` | 93202 | `b5a8466a1df03e6aaec6fe6d582aee548291bfe185671245e9b5913ddec26739` |
| `img/projects/screens/sloj-i-forma-desktop.webp` | 58536 | `7c17230a5a039c4247a7c7c5c6ef6763408e506f7de6489acbd3ebedfcb4b33d` |

Rozmiary SVG: desktop 726949 B; mobile 726835 B. Przeglądarka wybiera jeden wariant przez picture/source.
