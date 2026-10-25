/**
 * @name YandexMusicControls
 * @description Панель управления Яндекс Музыкой в стиле SpotifyControls.
 * @version 5.3.0
 */

const css = `
.ym-controls-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 52px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-accent);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    padding: 0 8px;
    order: -1;
    margin: 0;
}
.ym-controls-container.maximized { padding-top: 8px; }
.ym-controls-container.with-timeline { padding-top: 8px; }
.ym-controls-inner {
    display: flex;
    align-items: center;
    font-size: 14px;
    width: 100%;
}
.ym-controls-inner.maximized { flex-direction: column; }
.ym-controls-cover-wrapper {
    position: relative;
    width: 32px;
    min-width: 32px;
    height: 32px;
    min-height: 32px;
    margin-right: 8px;
    border-radius: 4px;
    overflow: hidden;
    transition: border-radius .3s ease, margin .3s ease, width .3s ease, height .3s ease;
    cursor: pointer;
}
.ym-controls-inner.maximized .ym-controls-cover-wrapper {
    width: calc(100% + 16px);
    height: 100%;
    margin: 0 0 8px 0;
    border-radius: 0;
}
.ym-controls-cover {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    color: var(--text-strong);
}
.ym-controls-cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-tertiary);
    font-size: 18px;
}
.ym-controls-details {
    flex-grow: 1;
    margin-right: 4px;
    min-width: 0;
    user-select: text;
}
.ym-controls-inner.maximized .ym-controls-details {
    margin: 0 0 4px 0;
    width: 100%;
    text-align: center;
}
.ym-controls-song {
    font-weight: 500;
    color: var(--text-strong);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ym-controls-artist {
    font-weight: 300;
    color: var(--text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 13px;
}
.ym-controls-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}
.ym-controls-btn {
    background: none;
    border: none;
    color: #ffffff;
    opacity: 0.7;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
.ym-controls-btn:hover {
    color: #ff3333;
    opacity: 1;
    transform: scale(1.1);
}
.ym-controls-btn:active { transform: scale(0.9); }
.ym-controls-btn svg { width: 20px; height: 20px; fill: currentColor; }
.ym-controls-btn.play-pause { opacity: 1; }
.ym-controls-btn.play-pause svg { width: 24px; height: 24px; }
.ym-controls-timeline { margin: 6px 0 4px 0; }
.ym-controls-bar-container {
    position: relative;
    border-radius: 2px;
    background-color: rgba(79, 84, 92, 0.16);
    height: 4px;
    margin-bottom: 4px;
}
.ym-controls-bar-fill {
    border-radius: 2px;
    height: 100%;
    min-width: 4px;
    background: var(--text-subtle);
}
.ym-controls-bar-container:hover .ym-controls-bar-fill { background: #ff3333; }
.ym-controls-bar-grabber {
    display: none;
    position: absolute;
    top: 0;
    width: 12px;
    height: 12px;
    margin-top: -4px;
    margin-left: -6px;
    background: var(--text-subtle);
    border-radius: 50%;
    pointer-events: none;
}
.ym-controls-bar-container:hover .ym-controls-bar-grabber { display: block; }
.ym-controls-bar-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-subtle);
    font-weight: 500;
}
`;

const Icons = {
    prev: `<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
    next: `<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
    play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
};

module.exports = class YandexMusicControls {
    constructor() {
        this.pluginName = "YandexMusicControls";
        this.Api = new BdApi(this.pluginName);
        this.injectInterval = null;
        this.rootElement = null;
        this.reactRoot = null;
        this.pollInterval = null;
        this.isMaximized = false;
        this.lastManualAction = 0; // Защита от перезаписи статуса
        
        this.state = {
            title: "Яндекс Музыка",
            artist: "Ожидание...",
            cover: null,
            isPlaying: false,
            position: 0,
            duration: 0,
            hasData: false
        };
    }

    start() {
        this.Api.Logger.info("Плагин запущен (v5.3.0)");
        BdApi.DOM.addStyle("ym-controls-styles", css);
        this.startInjecting();
        this.startPolling();
    }

    stop() {
        if (this.injectInterval) clearInterval(this.injectInterval);
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.rootElement) this.rootElement.remove();
        if (this.reactRoot) this.reactRoot.unmount();
        BdApi.DOM.removeStyle("ym-controls-styles");
    }

    startPolling() {
        this.pollInterval = setInterval(() => {
            try {
                const UserStore = BdApi.Webpack.getStore("UserStore");
                const PresenceStore = BdApi.Webpack.getStore("PresenceStore");
                const LocalActivityStore = BdApi.Webpack.getStore("LocalActivityStore");
                
                if (!UserStore) return;
                const user = UserStore.getCurrentUser();
                if (!user) return;

                let activities = [];
                if (PresenceStore && PresenceStore.getActivities) activities = PresenceStore.getActivities(user.id) || [];
                if (activities.length === 0 && LocalActivityStore && LocalActivityStore.getActivities) activities = LocalActivityStore.getActivities() || [];
                if (activities.length === 0 && user.activities) activities = user.activities;

                let ym = activities.find(a => a.name && (a.name.toLowerCase().includes("yandex") || a.name.toLowerCase().includes("музыка") || a.name.toLowerCase().includes("music")));
                if (!ym) ym = activities.find(a => a.assets && a.assets.large_image && a.details);

                if (ym) {
                    const newTitle = ym.details || ym.name || "Яндекс Музыка";
                    
                    // Проверяем, не сменился ли трек (сбрасываем защиту)
                    if (this.state.title !== newTitle) {
                        this.lastManualAction = 0;
                    }

                    this.state.title = newTitle;
                    this.state.artist = ym.state || "Неизвестный исполнитель";
                    this.state.hasData = true;
                    
                    if (ym.assets && ym.assets.large_image) {
                        let img = ym.assets.large_image;
                        if (img.startsWith("mp:external/")) {
                            const match = img.match(/mp:external\/[^\/]+\/https\/(.+)/);
                            if (match) img = "https://" + match[1];
                        } else if (!img.startsWith("http")) {
                            img = `https://cdn.discordapp.com/app-assets/${ym.application_id}/${img}.png`;
                        }
                        this.state.cover = img;
                    } else {
                        this.state.cover = null;
                    }

                    // --- УМНАЯ ПРОВЕРКА ПАУЗЫ ---
                    let rpcIsPlaying = true;
                    
                    if (ym.timestamps && ym.timestamps.start) {
                        const now = Date.now();
                        this.state.position = Math.max(0, now - ym.timestamps.start);
                        if (ym.timestamps.end) {
                            this.state.duration = ym.timestamps.end - ym.timestamps.start;
                            // Если время вышло за пределы трека — он остановлен
                            if (this.state.position > this.state.duration) {
                                rpcIsPlaying = false;
                            }
                        }
                    } else {
                        // Если RPC не прислал тайминги — музыка на паузе
                        rpcIsPlaying = false;
                    }

                    // Если в тексте есть слово "Pause" или "⏸"
                    if ((ym.state && ym.state.toLowerCase().includes("pause")) || 
                        (ym.details && ym.details.toLowerCase().includes("pause"))) {
                        rpcIsPlaying = false;
                    }

                    // Применяем статус с учетом ручной паузы (защита 3 секунды)
                    const isManual = (Date.now() - this.lastManualAction) < 3000;
                    if (!isManual) {
                        this.state.isPlaying = rpcIsPlaying;
                    }
                    // -----------------------------
                    
                } else {
                    this.state.hasData = false;
                    this.state.title = "Яндекс Музыка";
                    this.state.artist = "Не играет";
                    this.state.cover = null;
                    this.state.position = 0;
                    this.state.duration = 0;
                    this.state.isPlaying = false;
                    this.lastManualAction = 0;
                }
                
                this.updateUI();
            } catch (e) {
                this.Api.Logger.error("Ошибка парсинга:", e);
            }
        }, 1000);
    }

    startInjecting() {
        this.injectInterval = setInterval(() => {
            if (document.getElementById("ym-controls-root")) return;
            const panels = document.querySelector('[class*="panels_"]');
            if (panels) this.renderPanel(panels);
        }, 2000);
    }

    renderPanel(panelsContainer) {
        const React = BdApi.React;
        const ReactDOM = BdApi.ReactDOM;
        const h = React.createElement;

        this.rootElement = document.createElement("div");
        this.rootElement.id = "ym-controls-root";
        panelsContainer.prepend(this.rootElement);

        const formatTime = (ms) => {
            if (!ms || ms < 0) return "0:00";
            const sec = Math.floor(ms / 1000);
            const min = Math.floor(sec / 60);
            return `${min}:${(sec % 60).toString().padStart(2, "0")}`;
        };

        const Panel = () => {
            const [tick, setTick] = React.useState(0);

            React.useEffect(() => {
                const update = () => setTick(t => t + 1);
                this.rootElement.addEventListener("ym-update", update);
                return () => this.rootElement.removeEventListener("ym-update", update);
            }, []);

            const progress = this.state.duration > 0 ? (this.state.position / this.state.duration) * 100 : 0;
            
            const containerClass = `ym-controls-container ${this.isMaximized ? "maximized" : ""} ${this.state.hasData ? "with-timeline" : ""}`;
            const innerClass = `ym-controls-inner ${this.isMaximized ? "maximized" : ""}`;

            return h("div", { className: containerClass },
                h("div", { className: innerClass },
                    h("div", { 
                        className: "ym-controls-cover-wrapper",
                        onClick: () => {
                            this.isMaximized = !this.isMaximized;
                            this.updateUI();
                        }
                    },
                        this.state.cover ? 
                            h("img", { className: "ym-controls-cover", src: this.state.cover }) :
                            h("div", { className: "ym-controls-cover ym-controls-cover-placeholder" }, "🎵")
                    ),
                    
                    h("div", { className: "ym-controls-details" },
                        h("div", { className: "ym-controls-song" }, this.state.title),
                        h("div", { className: "ym-controls-artist" }, this.state.artist)
                    ),
                    
                    h("div", { className: "ym-controls-buttons" },
                        h("button", { 
                            className: "ym-controls-btn", 
                            onClick: (e) => { e.stopPropagation(); this.sendCmd("prev"); },
                            dangerouslySetInnerHTML: { __html: Icons.prev }
                        }),
                        h("button", { 
                            className: "ym-controls-btn play-pause", 
                            onClick: (e) => { e.stopPropagation(); this.sendCmd("playpause"); },
                            dangerouslySetInnerHTML: { __html: this.state.isPlaying ? Icons.pause : Icons.play }
                        }),
                        h("button", { 
                            className: "ym-controls-btn", 
                            onClick: (e) => { e.stopPropagation(); this.sendCmd("next"); },
                            dangerouslySetInnerHTML: { __html: Icons.next }
                        })
                    )
                ),
                
                this.state.hasData && h("div", { className: "ym-controls-timeline" },
                    h("div", { 
                        className: "ym-controls-bar-container",
                        onClick: () => {
                            BdApi.UI.showToast(`Перемотка недоступна в RPC`, {type: "warning", timeout: 1500});
                        }
                    },
                        h("div", { className: "ym-controls-bar-fill", style: { width: `${progress}%` } }),
                        h("div", { className: "ym-controls-bar-grabber", style: { left: `${progress}%` } })
                    ),
                    h("div", { className: "ym-controls-bar-text" },
                        h("span", null, formatTime(this.state.position)),
                        h("span", null, formatTime(this.state.duration))
                    )
                )
            );
        };

        this.reactRoot = ReactDOM.createRoot(this.rootElement);
        this.reactRoot.render(h(Panel));
    }

    updateUI() {
        if (this.rootElement) this.rootElement.dispatchEvent(new Event("ym-update"));
    }

    async sendCmd(action) {
        if (action === "playpause") {
            // Мгновенно меняем иконку
            this.state.isPlaying = !this.state.isPlaying;
            // Ставим защиту, чтобы RPC не перебил кнопку обратно (на 3 секунды)
            this.lastManualAction = Date.now(); 
            this.updateUI();
        }

        try {
            await BdApi.Net.fetch(`http://127.0.0.1:50505/${action}?t=${Date.now()}`);
        } catch (e) {
            BdApi.UI.showToast("Мост не запущен! Запустите StartHidden.vbs", {type: "error"});
            if (action === "playpause") {
                this.state.isPlaying = !this.state.isPlaying;
                this.updateUI();
            }
        }
    }

    getSettingsPanel() {
        return "YandexMusicControls v5.3.0: исправлено отображение паузы.";
    }
};