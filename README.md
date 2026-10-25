\# Yandex Music Controls for BetterDiscord



Плагин для BetterDiscord, который добавляет панель управления Яндекс Музыкой в стиле SpotifyControls, а также скрипты-мосты для управления плеером.



\## 🚀 Возможности

\* Красивая панель управления прямо над профилем (в стиле SpotifyControls).

\* Управление воспроизведением (Play/Pause, Next, Prev).

\* Отображение обложки трека, названия, исполнителя и прогресс-бара (берётся из Rich Presence WinYandexMusicRPC).

\* Работает в фоне (без лишних окон).



\## 📦 Установка



1\. Скачайте все файлы из этого репозитория и положите их в одну папку (например, на Рабочий стол).

2\. Переместите файл `YandexMusicControls.plugin.js` в папку плагинов BetterDiscord:

&#x20;  \* \*\*Windows:\*\* `%appdata%\\BetterDiscord\\plugins`

3\. Запустите `StartHidden.vbs` (он запустит невидимый мост для управления плеером).

4\. Включите плагин в настройках Discord (BetterDiscord -> Plugins).

5\. \*(Опционально)\* Запустите `1\_Install\_Autostart.bat`, чтобы мост запускался вместе с Windows.



\## ⚠️ Важно

\* Плагин использует активность Discord (Rich Presence), которую транслирует программа \[WinYandexMusicRPC](https://github.com/Feodor0090/WinYandexMusicRPC). Убедитесь, что она запущена.

\* Для работы кнопок должен быть запущен мост (файл `StartHidden.vbs`).



\## 🛠 Удаление

\* Запустите `2\_Remove\_Autostart.bat`, чтобы убрать программу из автозагрузки.

\* Выключите плагин в BetterDiscord и удалите файл `YandexMusicControls.plugin.js` из папки плагинов.

