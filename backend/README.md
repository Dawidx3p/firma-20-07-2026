# Bielik dla KAIROX

`bielik-worker.mjs` wdrażamy przez Wrangler z tego repozytorium. Moduł
`js/chat-reference.mjs` dopisuje odnośniki niezależnie od modelu.
Widget jest dodany do głównych podstron KAIROX. Strony demonstracyjne w podfolderach
nie zostały zmienione. `js/chat-config.js` zawiera tylko publiczny adres i Site Key.

## Wdrożenie krok po kroku

1. Cloudflare → Turnstile → Add widget: nazwa KAIROX, hostnames `kairox.pl`
   i `www.kairox.pl`, tryb Managed, pre-clearance wyłączone.
2. Publiczny **Site Key** wpisz w `turnstileSiteKey` w `js/chat-config.js`.
3. Worker → Settings → Variables and Secrets: zachowaj sekrety `HF_TOKEN`
   i `CHAT_TEST_KEY`; dodaj **Secret** `TURNSTILE_SECRET_KEY` z widgetu.
   Secret Key nie trafia do kodu strony ani do repozytorium.
4. Limity dodaj przez oficjalne narzędzie Wrangler — te bindingi nie są obecnie
   widoczne w panelu Cloudflare. Konfiguracja jest w `backend/wrangler.jsonc`:

   | Nazwa | Namespace ID (unikalne na koncie) | Limit | Period |
   | --- | --- | --- | --- |
   | CHAT_IP_LIMITER | 734101 | 5 | 60 sekund |
   | CHAT_SITE_LIMITER | 734102 | 30 | 60 sekund |

   Z katalogu `backend` uruchom `npx --yes wrangler@4 login`, potem
   `npx --yes wrangler@4 deploy`. Plik konfiguracyjny nie zawiera sekretów;
   istniejące sekrety tego Workera pozostają w Cloudflare. Namespace ID
   zmień, jeśli masz już inne limitery z tymi numerami. Konfigurację Workera
   utrzymuj odtąd w tym pliku, aby kolejne deploye zachowały limity.
5. Publikuj przez Wrangler (krok 4), który dołącza moduły. Samo wklejenie
   pojedynczego pliku w Edit code nie wystarcza.
6. Worker → Variables: dodaj **Text** `PUBLIC_CHAT_ENABLED` = `true` i Deploy.
   Przy Wrangler ustaw tę wartość w `vars` konfiguracji i ponownie deploy.
7. Opublikuj zmienione pliki strony, w tym `js/chat-config.js`, `js/chat.js`
   i `css/chat.css`, w jej dotychczasowym hostingu. Worker nie hostuje strony.
8. Na `kairox.pl` otwórz „Zapytaj AI”, rozpocznij rozmowę, przejdź Turnstile
   i wyślij przykładowe pytanie. `CHAT_TEST_KEY` nie jest potrzebne na stronie.

## Zabezpieczenia i zakres

- Prywatny formularz pod adresem Workera i POST `/chat` nadal wymagają
  `CHAT_TEST_KEY`. Publiczny widget używa osobnej trasy `/public-chat`.
- Publiczne zapytania wymagają poprawnego Origin, kompletu konfiguracji,
  tokenu Turnstile przy rozpoczęciu sesji, właściwego hostname i action `kairox_chat`.
  Sam Origin/CORS nie zabezpiecza API przed skryptami — robi to również
  weryfikacja Turnstile po stronie serwera.
- Po poprawnej weryfikacji Worker wystawia podpisaną sesję na 10 minut.
  Podpis HMAC jest związany z Origin i IP; kluczem jest sekret `CHAT_TEST_KEY`
  (minimum 32 znaki). Sesja pozostaje w pamięci karty i nie trafia do modelu.
  Kolejne pytania nie odnawiają jej ważności. Po wygaśnięciu, zmianie IP
  lub odświeżeniu strony potrzebna jest ponowna weryfikacja Turnstile.
  Limity są sprawdzane również przy korzystaniu z sesji.
- Limity: 5 żądań/minutę na IP (wspólne IP mogą współdzielić limit),
  30 wywołań modelu/minutę dla strony; **liczniki są lokalne dla punktu
  Cloudflare i przybliżone**, nie stanowią globalnego limitu kosztów.
  Budżet HF i dostępne środki trzeba kontrolować osobno w panelu dostawcy.
- `PUBLIC_CHAT_ENABLED=false` wyłącza publiczny czat bez usuwania widgetu.
- Brak konfiguracji lub awaria limitera blokuje model, bez ścieżki obejścia.
- Maksymalnie 2000 znaków pytania, 24 KB całego żądania, 180 tokenów odpowiedzi.
- Model dostaje najwyżej dwie ostatnie pary pytanie/odpowiedź po 1000 znaków.
  Użytkownik nie może podmienić modelu, instrukcji systemowej ani limitu tokenów.
  Historia od klienta jest niezaufana; instrukcje nie gwarantują braku halucynacji.
- Rozmowa pozostaje w pamięci karty, bez localStorage i własnej bazy rozmów.
  Odświeżenie, przejście na inną podstronę lub „Nowa rozmowa” usuwa historię.
- Nie zapisujemy pytań do logów w kodzie. Providerzy mają własne zasady
  przetwarzania i retencji; brak własnej bazy nie oznacza braku retencji u nich.
- Treści czatu są oznaczone do maskowania w Clarity; odpowiedzi są wstawiane
  jako tekst i bezpiecznie utworzone elementy pogrubienia oraz linków.
  Linki są ograniczone do znanych podstron KAIROX; HTML od modelu pozostaje tekstem.

## Wersja testowa i prywatność

Obecny dostawca to Public AI przez Hugging Face. Widget ujawnia dostawców
przed rozpoczęciem rozmowy i prosi o niewpisywanie danych osobowych/poufnych.
Public AI nie daje takich samych gwarancji jak komercyjny kontrakt produkcyjny.
Nie traktuj tej wersji jako obsługi poufnych spraw klientów. Przed stałym
uruchomieniem dla klientów sprawdź zgodność polityki prywatności KAIROX
z rzeczywistym użyciem dostawców i ewentualnie zmień dostawcę API.

Wiedza o ofercie jest w `SYSTEM` w Workerze. Ceny pochodzą z bieżącego
`modele-wspolpracy.html`; po zmianie oferty trzeba zaktualizować także Worker.

## Weryfikacja

`node --test backend/bielik-worker.test.mjs` sprawdza atrapami dostawców m.in.
blokowanie nieautoryzowanych zapytań, CORS, limity, walidację Turnstile,
rozmiar wejścia, historię i ukrywanie sekretów/błędów dostawcy.
Rzeczywisty Turnstile, bindingi oraz połączenie z modelem sprawdź po wdrożeniu.

## Dokumentacja dostawców

- https://huggingface.co/docs/inference-providers/en/providers/publicai
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://publicai.co/tc

## Kontakt po rozmowie o usłudze

Po 10 sekundach widget może pokazać jednorazową zachętę do rozmowy. Stan
wyświetlenia/zamknięcia jest zapamiętywany w sessionStorage dla tej karty
(bez treści rozmowy). Wcześniejsze otwarcie czatu lub wypełnianie formularza
pomija zachętę. Dymek nie wywołuje modelu; kliknięcie otwiera ekran rozpoczęcia.

Widget liczy udane pytania o konkretną usługę w pamięci karty. Po drugim pytaniu
wyświetla propozycję zostawienia kontaktu; proste dopytania odwołują się do
poprzednio nazwanej usługi. Ogólna lista/porównanie usług nie wybiera usługi.
To rozpoznawanie po nazwach i frazach, nie pełna analiza znaczenia rozmowy.
„Nie teraz” nie wywołuje wysyłki i wyłącza kolejne prośby o tę samą usługę.
„Nowa rozmowa” zeruje liczniki.

Po wyborze „Tak, zostawiam kontakt” klient wypełnia oddzielny formularz w czacie:
imię opcjonalnie, e-mail lub telefon i akceptacja informacji o przetwarzaniu danych.
Wysyłka używa wspólnego `js/contact-service.mjs` i tego samego endpointu Formspree
co `formularz-kontaktowy.html`. Zgłoszenie ma `source=chat`, nazwę usługi oraz
krótką informację o zainteresowaniu. Nie wysyłamy całej rozmowy; dane kontaktowe
nie trafiają do endpointu Bielika. Sukces jest pokazywany dopiero po odpowiedzi
2xx Formspree. Przy błędzie pola pozostają do poprawienia/ponowienia.

## Krótki kontekst (24.10.2026)

Instrukcja systemowa została skrócona z 8229 do 2424 znaków (o 70,5%). Zawiera
ceny, podstawowe zakresy, zasady Partnerstwa i 7 projektów, w tym Bieg Rzeczy,
Czysty Układ oraz Słój i Forma. Szczegóły oferty zastępują odnośniki do strony.
Odpowiedź ma mieć 1–3 zdania; limit generowania wynosi 180 zamiast 300 tokenów.
Nie zmieniono modelu, historii rozmowy, limitów ani weryfikacji użytkownika.

To zmniejsza rozmiar wejścia i maksymalną długość generowania. Nie jest pomiarem
przyspieszenia: opóźnienia dostawcy nadal mogą występować, a widget pokazuje
odpowiedź po jej pełnym wygenerowaniu (`stream: false`). Testy lokalne używają
atrap dostawców i nie potwierdzają czasu ani jakości odpowiedzi żywego modelu.

## Linkowanie do treści

Odpowiedź dotycząca treści strony ma kończyć się osobnym akapitem
„Więcej informacji znajdziesz tu: https://…”. Model wybiera adres z mapy 35
publicznych podstron: oferta, artykuły, projekty wraz z podstronami i polityki.
Może wskazać podaną kotwicę konkretnej sekcji. Powitania pozostają bez linku.
Prywatny Printer, komponenty techniczne, 404 i kopie `/koncepcja/` nie są w mapie.
Nie jest to dostęp do przeglądania stron ani dodatkowa wiedza o ich treści.

Pełny kontekst z mapą adresów ma 3288 znaków, około 60% mniej niż pierwotne
8229. Limit odpowiedzi pozostaje na 180 tokenach. `js/chat-format.mjs` dopuszcza
te same publiczne adresy i zamienia pełny URL w klikalny link.

## Początkowe podpowiedzi czatu

`js/chat-suggestions.mjs` zawiera 20 pytań zredagowanych z copywriterem.
Przy otwarciu pustego czatu przeglądarka losuje trzy różne pytania bez wywołania
modelu ani Turnstile. Trwająca rozmowa lub wpisany tekst zachowują bieżący zestaw.
„Nowa rozmowa” losuje kolejny zestaw. Podpowiedzi po odpowiedzi nadal zależą od tematu.
Kliknięcie pytania na ekranie początkowym rozpoczyna zwykły proces weryfikacji,
a po jej powodzeniu wysyła wybrane pytanie do Bielika. Samo otwarcie czatu i
losowanie niczego nie wysyłają do dostawcy modelu.

## Link niezależny od limitu modelu

Worker dopisuje akapit „Więcej informacji znajdziesz tu: …” po odebraniu odpowiedzi
od dostawcy. To nie zużywa limitu 180 tokenów. Urwany dopisek jest zastępowany
pełnym adresem. Dobór używa reguł tematycznych pytania, kontekstu dopytania,
dołączonego poprawnego linku lub odpowiedzi. Nie jest analizą znaczenia każdego
możliwego pytania; rozpoznane porównania usług kierują do modeli współpracy.
Powitania nie dostają odnośnika. Model ma pisać tylko treść odpowiedzi.

### Tematy rozmowy i lokalne podpowiedzi

`js/chat-topics.mjs` zawiera katalog copywritera: 56 tematów i 224 pytania (po 4).
Każdy connector ma publiczną ścieżkę oraz pytania. Do promptu modelu trafia tylko
mapa connectorów i ścieżek, bez katalogu pytań. Model zaczyna odpowiedź od
`[connector:partnership]`, po czym podaje krótki tekst. `js/chat-response.mjs`
usuwa znaczniki z tekstu, sprawdza klucz w katalogu i zwraca osobne pola
`reply` oraz `connector`. Sam znacznik bez tekstu jest błędem odpowiedzi.

Link z katalogu jest dopisywany po generowaniu, poza limitem 180 tokenów.
Przeglądarka zamienia adres w odnośnik otwierany w nowej karcie. Dla rozpoznanych
klikniętych pytań aplikacja zachowuje ich temat również przy błędnym/brakującym
znaczniku modelu. Przy pozostałych brakujących znacznikach stosuje dotychczasowe
rozpoznanie z pytania, historii i odpowiedzi; nie zastępuje to klasyfikacji modelu.

`js/chat-suggestions.mjs` losuje do 3 unikalnych pytań z wybranego tematu,
pomijając zadane pytania obecne w krótkiej historii. Po wyczerpaniu tej puli
podpowiedzi może być mniej. Otwarcie/reset czatu nadal losuje 3 pytania
z osobnej puli 20 pytań startowych. Losowanie nie wykonuje wywołań AI.
Nieznany connector nie jest używany jako URL ani wyświetlany w wiadomości.

Po zmianach frontendowych odświeżono wersję `chat.js`, importów i arkusza stylów,
aby przeglądarki nie zachowywały starszego renderowania odpowiedzi.

Testy (dostawcy modelu i weryfikacji są symulowani):

```sh
node --test backend/bielik-worker.test.mjs js/chat-response.test.mjs js/chat-reference.test.mjs js/chat-format.test.mjs js/chat-suggestions.test.mjs js/chat-contact.test.mjs
```
