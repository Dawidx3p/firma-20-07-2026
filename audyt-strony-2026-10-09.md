# Audyt KAIROX — 9 października 2026

Strona ma spójny wygląd, czytelne ceny i działającą drogę do kontaktu. Największy potencjał poprawy jest w skróceniu tej drogi, zachowaniu kontekstu wybranej usługi oraz usunięciu kilku konkretnych błędów technicznych. Nie ma obecnie uzasadnienia do przebudowy całej witryny.

## Zakres i sposób weryfikacji

Przejrzałem kod głównych stron, formularza, czatu i obsługi zgód. Sprawdziłem opublikowane widoki strony głównej, formularza, audytu, metody, partnerstwa, modeli współpracy, realizacji i artykułów. Kontrole responsywności obejmowały szerokości 320, 390, 574 i 1440 px w różnych częściach audytu.

„Potwierdzone” oznacza obserwację w przeglądarce lub jednoznaczny mechanizm w kodzie. Propozycje dotyczące skuteczności sprzedaży są hipotezami UX — bez danych analitycznych nie można określić ich wpływu na liczbę zapytań.

## 1. Poprawki techniczne w pierwszej kolejności

| Priorytet | Problem i dowód | Zalecana poprawka | Zakres |
|---|---|---|---|
| Wysoki | **Błędny canonical modeli współpracy.** Kod i publiczna strona wskazują `https://twojadomena.pl/modele-wspolpracy.html`. | Zmienić na właściwy adres KAIROX. Ujednolicić canonical także na pozostałych stronach, w tym dla `/`, `/index.html` i adresów z parametrem wersji. | Mały |
| Wysoki | **Utrata wybranej usługi przed kontaktem.** „Zapytaj o Start” i „Zapytaj o landing” otwierają ten sam pusty formularz. `sourcePage` zapisuje adres formularza, więc nie identyfikuje strony wejścia. | Przekazywać usługę i stronę źródłową, pokazać wybrany temat w formularzu oraz uwzględnić go w zgłoszeniu. Mechanizm przenoszenia adresu strony przez `?website=` już istnieje. | Mały/średni |
| Wysoki | **Możliwe ponowne wysłanie formularza podczas oczekiwania.** `validateForm()` może ponownie odblokować przycisk po edycji e-maila, telefonu lub zgody, mimo trwającego wysyłania. Brakuje blokady w samym handlerze. Potwierdzone w kodzie; bez wysyłania zgłoszeń do Formspree. | Dodać stan `submitting`, uwzględnić go w walidacji i na początku obsługi submit. | Mały |
| Średni | **Ponowne zaakceptowanie analityki nie przywraca zgód w tej samej stronie.** Sekwencja akceptacja → odmowa → akceptacja kończy się wcześniejszym powrotem z `loadAnalytics()`, ponieważ `analyticsLoaded` pozostaje `true`. Brakuje aktualizacji zgody na `granted`. | Rozdzielić jednorazowe ładowanie skryptów i aktualizację bieżącej zgody GA/Clarity. Sprawdzić pełną sekwencję zmian. | Mały |
| Średni | **Menu mobilne nie zamyka się przez Escape.** Potwierdzone w opublikowanej stronie. | Dodać Escape oraz powrót fokusu do przycisku menu. Sprawdzić przechodzenie klawiaturą. | Mały |

Źródła: [canonical](/Users/test/Documents/code/firma/modele-wspolpracy.html:34), [formularz](/Users/test/Documents/code/firma/js/contact-page.js:24), [zgody](/Users/test/Documents/code/firma/js/consent.js:123), [menu](/Users/test/Documents/code/firma/js/main.js:51).

Canonical jest sygnałem wyboru adresu przez wyszukiwarkę; brak tego znacznika sam w sobie nie oznacza braku indeksacji. Błędna domena wymaga jednak poprawy. [Dokumentacja Google](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## 2. Kontakt powinien być prostszy na telefonie

W widoku 390 × 844 pierwszy ekran formularza zajmuje wstęp i opis trzech kroków. Pola znajdują się niżej, a przycisk wysłania około 1819 px od początku dokumentu. Strona formularza ma około 2254 px wysokości.

Proponuję skrócić wstęp na telefonie i umieścić formularz przed opisem procesu albo dodać od razu widoczny odnośnik „Przejdź do formularza”. Logo na tej stronie jest tekstem bez linku — warto umożliwić prosty powrót na stronę główną.

Pozostałe poprawki formularza:

- Dostosować „Preferowaną formę kontaktu” do dostępnych danych. Obecnie można podać wyłącznie telefon, pozostawiając domyślną preferencję „E-mail”; podobny domyślny wybór występuje w zgłoszeniu z czatu.
- Zamiast samego „Sprawdź zaznaczone pola” podać konkretny powód błędu przy danym polu. Powiązać komunikaty przez `aria-describedby` i ustawiać `aria-invalid`.
- Pozostawić trwałe potwierdzenie wysłania z informacją o następnym kroku. Obecne przekierowanie po 1,8 s szybko usuwa potwierdzenie.
- Dodać rzeczywisty deklarowany czas odpowiedzi, jeśli zespół może go dotrzymać.

## 3. Strona główna: mniej powtórzeń, więcej konkretów

Główna strona w widoku 390 × 844 ma około 13 820 px wysokości. Główny przycisk jest widoczny już na pierwszym ekranie — problemem jest przede wszystkim długość dalszej opowieści i powtarzanie argumentów o komunikowaniu wartości.

Proponuję skrócić powtarzające się sekcje i szybciej pokazać: co wykonujemy, dla jakiej sytuacji, przykłady prac, orientacyjny zakres i następny krok. Pierwszy nagłówek może być konkretniejszy, np.:

> Tworzymy strony i landing page’e, które jasno wyjaśniają Twoją ofertę i prowadzą do kontaktu.

Przy realizacjach warto opisywać **problem → decyzję projektową → zastosowanie dla podobnego biznesu**, zamiast głównie listy funkcji. Obecne oznaczenia projektów własnych i koncepcyjnych są dobrym elementem: zachować je i nie dopisywać nieudokumentowanych wyników klientów.

Na stronie głównej można pokazać dwie wybrane realizacje, a pozostałe przez „Zobacz wszystkie”. To propozycja do porównania z obecnym układem, nie potwierdzony sposób zwiększenia konwersji.

## 4. Oferta, czat i prywatność powinny mówić to samo

- Ceny są widoczne, ale brakuje jasnego określenia, czy podane kwoty są netto czy brutto. Uzupełnić zgodnie z faktycznym sposobem rozliczenia.
- FAQ zawiera czasy realizacji wszystkich modeli, natomiast instrukcja Bielika zawiera czas jedynie audytu. Uzupełnić krótką bazę wiedzy i docelowo utrzymywać ceny, zakresy, terminy oraz linki w jednym źródle danych.
- Trzy propozycje pytań w czacie są dobierane lokalnie według reguł, a nie generowane przez model. Można rozwijać je o temat odpowiedzi, realizacje i artykuły; najpierw warto sprawdzić, czy użytkownicy je wybierają.
- Pełna polityka prywatności opisuje Formspree i analitykę, lecz nie opisuje przepływu wiadomości przez Cloudflare oraz dostawcę odpowiedzi AI. Uzupełnić dokument zgodnie z faktycznym działaniem czatu, odróżniając wiadomości do AI od danych formularza. To stwierdzenie brakującego opisu, nie ocena zgodności prawnej.

Źródła: [instrukcja Bielika](/Users/test/Documents/code/firma/backend/bielik-worker.mjs:5), [propozycje pytań](/Users/test/Documents/code/firma/js/chat-suggestions.mjs:13), [polityka prywatności](/Users/test/Documents/code/firma/polityka-prywatnosci.html).

## 5. Mierzenie wyników i utrzymanie

Nie znalazłem własnych zdarzeń mierzących skuteczne wysłanie formularza ani pozyskanie kontaktu z czatu. Dodać pomiar sukcesu zgłoszenia i kluczowych CTA po zgodzie na analitykę, bez danych osobowych w zdarzeniach. Dzięki temu późniejsze zmiany można oceniać na podstawie działania użytkowników.

Powtarzane menu i stopki oraz rozbudowany wspólny CSS utrudniają drobne poprawki. W następnym etapie warto wprowadzić współdzielone fragmenty generowanych stron i uporządkować style według komponentów. Nie wymaga to przenoszenia strony do dużego frameworka.

## Co działa dobrze i granice audytu

- W 16 głównych plikach HTML występuje po jednym H1; lokalna kontrola odnośników do plików nie wykazała brakujących zasobów.
- `robots.txt` i mapa strony wskazują właściwą domenę.
- W oglądanych sześciu głównych podstronach nie pojawiły się błędy konsoli.
- Ceny, modele współpracy i oznaczenia charakteru realizacji są dostępne dla użytkownika.
- Obrazy realizacji mają umiarkowane rozmiary, ładowanie lazy i kontenery rezerwujące proporcje. Nie ma podstaw, by na podstawie samego kodu ogłaszać poważny problem z ich wydajnością.

Nie wykonywałem prawdziwego wysłania formularza, audytu prawnego, kontroli wszystkich zewnętrznych odnośników ani pomiaru Core Web Vitals/Lighthouse. Nie mam danych z Search Console i konwersji. Nie nadaję stronie wyniku wydajności ani nie szacuję wzrostu liczby kontaktów.

**Rekomendowana kolejność:** canonical → blokada wysyłania i poprawa preferencji kontaktu → przenoszenie wybranej usługi → krótszy formularz na mobile → zgody i opis prywatności → pomiar konwersji → skrócenie treści głównej i rozwój realizacji.

Audyt nie zmienił kodu ani opublikowanej witryny.

## Status poprawek po audycie

W kolejnych, osobno zleconych etapach przygotowano lokalnie:

- poprawny canonical i adresy kanoniczne głównych podstron;
- przenoszenie usługi i źródła do formularza oraz blokadę powtórnej wysyłki;
- krótszy wstęp mobilny, formularz przed opisem procesu i logo z odnośnikiem;
- konkretne komunikaty walidacji, preferencje dopasowane do danych i trwałe potwierdzenie wysłania;
- poprawną sekwencję zmiany zgody, obsługę okna zgód klawiaturą i menu zamykane przez Escape;
- pomiar udanych zgłoszeń i głównych CTA po zgodzie, z ograniczonymi kategoriami danych;
- opis przepływu czatu w dokumentach prywatności;
- ceny brutto i orientacyjne terminy wszystkich modeli w wiedzy Bielika;
- konkretniejszy nagłówek, dwa przykłady na stronie głównej i objaśnienia zastosowania czterech realizacji;
- odnośnik pomijający nawigację oraz poprawkę szerokości kart modeli na ekranie 320 px.

Weryfikacja: 32 testy automatyczne, lokalne przejście z oferty do formularza,
walidacja i preferencje kontaktu, Escape, obsługa zgód klawiaturą oraz widoki
320/390/574/1440 px. Pierwsze pole formularza jest w pierwszym ekranie
390 × 844 (około 517 px od góry); szerokość formularza nie przekracza widoku.
Sprawdzono lokalne pliki i kotwice odnośników oraz brak błędów konsoli w podglądzie.

Zmiany nie są opublikowane. Zaktualizowana wiedza Bielika wymaga osobnego
wdrożenia pliku `backend/bielik-worker.mjs` do istniejącego Workera.
Wspólne generowanie menu/stopki pozostaje propozycją późniejszego porządkowania
projektu; bieżące poprawki zachowują strukturę statycznej witryny.
