# Super Duper Octo Broccoli

Aplikacja do zarządzania złożonymi historiami i zależnościami przyczynowo-skutkowymi. Twórz węzły narracji, łącz je w logiczne sekwencje i wizualizuj jako interaktywny graf. Idealna dla pisarzy i projektantów gier.

## Demo

[Kliknij tutaj, aby zobaczyć działającą wersję](https://karolkalinowski.github.io/super-duper-octo-broccoli/)

## Wymagania

- Node.js (wersja 16 lub nowsza)
- npm/yarn
- Przeglądarka internetowa

## Uruchomienie lokalne

1. **Sklonuj repozytorium**

```bash
git clone https://github.com/karolkalinowski/super-duper-octo-broccoli.git
cd super-duper-octo-broccoli
```

2. **Zainstaluj zależności**

```bash
npm install
# lub
yarn install
```

3. **Uruchom aplikację**

```bash
npm run dev
# lub
yarn dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5173`

## Jak używać?

### 1. Zarządzanie projektami

- **Nowy projekt**: Kliknij "+ New Project" i nadaj nazwę
- **Import/Eksport**: Użyj przycisków chmury do backupu danych
- **Usuwanie/Kopiowanie**: Ikony kosza i kopiowania w karcie projektu

### 2. Tworzenie węzłów

- **Dodaj węzeł**: Przycisk "+ Add Node" w widoku projektu
- **Edytuj**: Kliknij ikonę ołówka w karcie węzła
- **Zależności**: Definiuj przyczyny w sekcji "Causes"
- **Tagi**: Dodawaj etykiety w polu "Tags"

### 3. Tryby widoku

- **Lista**: Sortuj przeciąganiem (włącz tryb sortowania przełącznikiem)
- **Graf**:
  - Przeciąganie: Przesuwaj cały graf przytrzymując LPM
  - Zoom: Kółko myszy
  - Edycja: Przeciągaj węzły bezpośrednio na canvasie

### 4. Logika aplikacji

- Kolejność węzłów wpływa na możliwość dodawania zależności
- Nie można usunąć węzła użytego jako przyczyna
- Kolory tagów są generowane automatycznie
