<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSSテロップ表示ツール</title>
    <style>
        body {
            margin: 0;
            overflow: hidden; /* テロップがはみ出さないように */
            font-family: sans-serif;
            background-color: #f5f5f5; /* 背景色を追加 */
        }

        #ticker-container {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            box-sizing: border-box;
            background-color: #ffffff; /* デフォルトのテロップ背景色 */
            color: #222222; /* デフォルトのテロップ文字色 */
            padding: 5px 0; /* 上下パディングを追加 */
            z-index: 999; /* 他の要素の上に表示 */
            border-top: 1px solid #ddd;
        }

        #ticker-text {
            display: inline-block;
            font-size: 32px;
            font-weight: 400;
            animation: scroll-left 15s linear infinite; /* 初期アニメーション */
            padding-left: 100%; /* 初期表示を画面外からにする */
        }

        @keyframes scroll-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
        }

        #controller {
            position: absolute; /* 初期値をabsoluteに変更 */
            top: 20px;
            left: 20px;
            width: 400px;
            min-width: 250px;
            min-height: 200px;
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000; /* テロップの上に表示 */
            resize: both; /* リサイズを許可 */
            overflow: auto; /* 内容がはみ出したらスクロールバー */
            display: block; /* デフォルトで表示 */
            font-size: 14px;
            box-sizing: border-box;
        }

        #controller.dragging {
            cursor: grabbing;
        }

        #controller h3 {
            margin-top: 0;
            font-size: 1.2em;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }

        #controller label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }

        #controller input[type="text"],
        #controller input[type="number"],
        #controller select,
        #controller textarea {
            width: calc(100% - 12px);
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        #controller input[type="color"] {
            width: 80px;
            height: 30px;
            border: none;
            padding: 0;
            vertical-align: middle;
            margin-bottom: 10px;
        }

        #controller button {
            background-color: #007bff;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
            margin-right: 5px;
            margin-bottom: 5px;
        }

        #controller button:hover {
            background-color: #0056b3;
        }

        #controller button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        #controller .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
        }

        .preview-text {
            margin-top: 15px;
            padding: 10px;
            border: 1px dashed #aaa;
            background-color: #e9e9e9;
            font-size: 16px;
            text-align: center;
            color: #333;
            border-radius: 4px;
        }

        /* 画面上部の設定表示/非表示ボタン */
        #toggle-controller-btn {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 1001; /* コントローラーよりもさらに上 */
            padding: 6px 16px;
            font-size: 16px;
            border-radius: 8px;
            background: #fff;
            border: 1px solid #ccc;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div id="ticker-container">
        <span id="ticker-text">RSSフィードから読み込まれた情報、または手動で入力されたテキストがここに表示されます。</span>
    </div>

    <button id="toggle-controller-btn">⚙️ 設定表示/非表示</button>

    <div id="controller">
        <h3>テロップ設定パネル</h3>

        <div class="button-group">
            <button id="play-btn">▶️ 再生</button>
            <button id="pause-btn">⏸️ 一時停止</button>
        </div>

        <div class="button-group">
            <button id="speech-on-btn">🔊 読み上げON</button>
            <button id="speech-off-btn">🔇 読み上げOFF</button>
        </div>

        <div class="button-group">
            <button id="zoom-in-btn">＋コントローラー拡大</button>
            <button id="zoom-out-btn">−コントローラー縮小</button>
        </div>

        <div class="button-group">
            <button id="font-size-up-btn">＋文字大</button>
            <button id="font-size-down-btn">−文字小</button>
        </div>

        <label for="rss-url-input">RSSフィードURL (複数URLはカンマかスペースで区切る):</label>
        <textarea id="rss-url-input" rows="3" placeholder="例: https://news.yahoo.co.jp/rss/topics/top-picks.xml, https://example.com/feed"></textarea>
        <button id="load-rss-button">RSSを読み込む</button>
        <button id="stop-rss-button">RSS自動更新停止</button>

        <label for="ticker-input">手動入力テキスト:</label>
        <textarea id="ticker-input" rows="3" placeholder="テロップに表示したいテキストを入力してください"></textarea>

        <label for="speed-input">速度:</label>
        <input type="number" id="speed-input" value="0" min="-1000" max="1000" step="10">
        <p style="font-size: 0.8em; color: #666; margin-top: -8px; margin-bottom: 10px;">マイナス値にするとさらに遅くなります。</p>


        <label for="size-slider">文字サイズ:</label>
        <input type="range" id="size-slider" min="12" max="120" value="32">

        <label for="font-select">フォント:</label>
        <select id="font-select">
            <option value="sans-serif">ゴシック体 (sans-serif)</option>
            <option value="serif">明朝体 (serif)</option>
            <option value="monospace">等幅 (monospace)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="メイリオ, Meiryo, sans-serif">メイリオ</option>
            <option value="游ゴシック, YuGothic, sans-serif">游ゴシック</option>
            <option value="Times New Roman, serif">Times New Roman</option>
        </select>

        <label for="weight-slider">文字の太さ:</label>
        <input type="range" id="weight-slider" min="100" max="900" step="100" value="400">

        <label for="text-color-picker">文字色:</label>
        <input type="color" id="text-color-picker" value="#222222">

        <label for="bg-color-picker">背景色:</label>
        <input type="color" id="bg-color-picker" value="#ffffff">

        <div class="preview-text">プレビューテキスト</div>

        <button id="reset-settings-btn" style="margin-top: 15px;">設定初期化</button>
    </div>

    <script>
        const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzrvWwKI8q5InEHJaR1qKWGeJlZzHjRc2RUxdBvHmU9Raxl_FjM-kgOC1MyjGcgRs6M/exec';

        const tickerText = document.getElementById('ticker-text');
        const controller = document.getElementById('controller');
        const rssUrlInput = document.getElementById('rss-url-input');
        const loadRssButton = document.getElementById('load-rss-button');
        const stopRssButton = document.getElementById('stop-rss-button');
        const tickerInput = document.getElementById('ticker-input');
        const speedInput = document.getElementById('speed-input'); // 数値入力
        const sizeSlider = document.getElementById('size-slider');
        const weightSlider = document.getElementById('weight-slider');
        const previewText = controller.querySelector('.preview-text');
        const fontSelect = document.getElementById('font-select');
        const textColorPicker = document.getElementById('text-color-picker');
        const bgColorPicker = document.getElementById('bg-color-picker');

        // ボタン要素の取得
        const toggleControllerBtn = document.getElementById('toggle-controller-btn');
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const speechOnBtn = document.getElementById('speech-on-btn');
        const speechOffBtn = document.getElementById('speech-off-btn');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const fontSizeUpBtn = document.getElementById('font-size-up-btn');
        const fontSizeDownBtn = document.getElementById('font-size-down-btn');
        const resetSettingsBtn = document.getElementById('reset-settings-btn');


        // currentSpeedの初期値をspeedInputから取得
        let currentSpeed = parseInt(speedInput.value);
        let currentSize = parseInt(sizeSlider.value);
        let currentText = tickerInput.value;
        let currentFont = fontSelect.value;
        let currentWeight = parseInt(weightSlider.value);
        let currentTextColor = textColorPicker.value;
        let currentBgColor = bgColorPicker.value;

        let rssIntervalId = null;
        const RSS_UPDATE_INTERVAL = 60 * 1000; // 60秒ごとに更新

        // グローバルで宣言
        let isTickerPaused = false;
        let isSpeechOn = false; // 読み上げON/OFFの状態
        let utterance = null; // SpeechSynthesisUtterance オブジェクトを保持

        function updateTicker() {
            // 速度計算を更新: speedInputの数値に応じてdurationを調整
            // currentSpeedが0で基準、正の値で速く、負の値で遅くする
            const baseDuration = 15; // speedInputが0のときの基準時間（秒）
            const speedFactor = 0.1; // 速度に対する影響度 (調整可能、大きいほど速度変化が顕著)

            // currentSpeedが負の方向に大きくなるほどdurationを増加させる
            // currentSpeedが正の方向に大きくなるほどdurationを減少させる
            let animationDuration = baseDuration - (currentSpeed * speedFactor);

            // 最小・最大時間を設定して、極端な値にならないようにする
            animationDuration = Math.max(1, animationDuration); // 最低1秒
            animationDuration = Math.min(60, animationDuration); // 最大60秒 (必要に応じて変更)


            tickerText.style.fontSize = `${currentSize}px`;
            tickerText.style.fontFamily = currentFont;
            tickerText.style.fontWeight = currentWeight;
            tickerText.style.color = currentTextColor;
            tickerText.style.backgroundColor = currentBgColor; // テロップの背景色も設定
            tickerText.textContent = currentText;
            previewText.style.fontSize = `${currentSize}px`;
            previewText.style.fontFamily = currentFont;
            previewText.style.fontWeight = currentWeight;
            previewText.style.color = currentTextColor;
            previewText.style.backgroundColor = currentBgColor;
            // プレビューテキストに現在の速度の数値を直接表示
            previewText.textContent = `サイズ: ${currentSize}px, 速度: ${currentSpeed}, 書体: ${currentFont}, 太さ: ${currentWeight}`;

            // アニメーションを一旦停止して再適用することで、即座に速度変更を反映
            tickerText.style.animation = 'none';
            void tickerText.offsetWidth; // 強制的にリフローさせる
            tickerText.style.animation = `scroll-left ${animationDuration}s linear infinite`;
            tickerText.style.animationPlayState = isTickerPaused ? 'paused' : 'running';

            // 読み上げONなら自動で読み上げ
            if (isSpeechOn) {
                speakText(currentText);
            }
        }

        async function fetchRssFeed(url) {
            try {
                // rss2json APIを利用（CORS回避用）
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();

                let texts = [];
                if (data.items && data.items.length > 0) {
                    data.items.forEach(item => {
                        // かわいい絵文字を追加
                        texts.push(`🌸【${item.title}】🌸`);
                    });
                } else {
                    // rss2jsonがデータなしの場合もエラーとみなす
                    texts.push(`💦RSS取得失敗 (データなし): ${url}`);
                }
                return texts;
            } catch (error) {
                console.error('RSSフィードの読み込みエラー (rss2json):', error); // エラーログを追加
                return [`💦RSS取得失敗 (rss2jsonエラー): ${url}`];
            }
        }

        async function fetchAndDisplayMultipleRss() {
            // カンマ・スペース両方で区切れるように
            const urls = rssUrlInput.value
                .split(/[\s,]+/)
                .map(u => u.trim())
                .filter(u => u);

            if (urls.length === 0) {
                currentText = 'RSSフィードのURLを入力してください。';
                tickerInput.value = currentText;
                updateTicker();
                return;
            }

            loadRssButton.disabled = true;
            loadRssButton.textContent = '読み込み中...';

            let allTexts = [];
            for (const url of urls) {
                const rss2jsonTexts = await fetchRssFeed(url);
                // rss2jsonで成功したら、その結果を使う
                if (rss2jsonTexts.length > 0 && !rss2jsonTexts[0].includes('RSS取得失敗')) {
                    allTexts = allTexts.concat(rss2jsonTexts);
                } else {
                    // rss2jsonで失敗したらGASプロキシを試す
                    try {
                        const proxyUrl = `${GAS_PROXY_URL}?url=${encodeURIComponent(url)}`;
                        const response = await fetch(proxyUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const xmlText = await response.text();
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                        const items = xmlDoc.querySelectorAll('item');
                        let feedTexts = [];
                        if (items.length === 0) {
                            const entries = xmlDoc.querySelectorAll('entry');
                            if (entries.length > 0) {
                                entries.forEach(entry => {
                                    const title = entry.querySelector('title')?.textContent || '無題';
                                    feedTexts.push(`🌸【${title}】🌸`); // GASプロキシでも絵文字追加
                                });
                            } else {
                                feedTexts.push(`💦RSSフィードが見つからないか、内容が空です: ${url}`);
                            }
                        } else {
                            items.forEach(item => {
                                const title = item.querySelector('title')?.textContent || '無題';
                                // descriptionは長くなる場合があるので、タイトルのみに限定
                                feedTexts.push(`🌸【${title}】🌸`);
                            });
                        }
                        allTexts = allTexts.concat(feedTexts);
                    } catch (gasError) {
                        console.error('RSSフィードの読み込みエラー (GASプロキシ):', gasError); // エラーログを追加
                        allTexts.push(`💦RSS取得失敗 (GASプロキシエラー): ${url}`);
                    }
                }
            }
            const combinedText = allTexts.join(' ◇ ');

            currentText = combinedText || 'RSSフィードから情報を取得できませんでした。URLを確認してください。';
            tickerInput.value = currentText;
            updateTicker(); // テキストが更新されたら速度も再適用

            loadRssButton.disabled = false;
            loadRssButton.textContent = 'RSSを読み込む';
        }

        function startRssUpdates() {
            if (rssIntervalId) clearInterval(rssIntervalId);
            fetchAndDisplayMultipleRss(); // 初回実行
            rssIntervalId = setInterval(fetchAndDisplayMultipleRss, RSS_UPDATE_INTERVAL);
            loadRssButton.disabled = true;
            loadRssButton.textContent = 'RSS自動更新中';
            stopRssButton.disabled = false;
            tickerInput.disabled = true; // RSS更新中は手動入力不可に
        }

        function stopRssUpdates() {
            if (rssIntervalId) {
                clearInterval(rssIntervalId);
                rssIntervalId = null;
                alert('RSSフィードの自動更新を停止しました。');
            }
            loadRssButton.disabled = false;
            loadRssButton.textContent = 'RSSを読み込む';
            stopRssButton.disabled = true;
            tickerInput.disabled = false; // 手動入力を再度可能に
        }

        loadRssButton.addEventListener('click', startRssUpdates);
        stopRssButton.addEventListener('click', stopRssUpdates);
        stopRssButton.disabled = true; // 最初は停止ボタンを無効に

        tickerInput.addEventListener('input', (e) => {
            if (!rssIntervalId) { // RSS自動更新中でない場合のみ手動入力を反映
                currentText = e.target.value;
                updateTicker();
            }
        });

        // speedInputのイベントリスナーを設定
        speedInput.addEventListener('input', (e) => {
            // 数値としてパースし、NaNの場合はデフォルト値0を使用
            currentSpeed = parseInt(e.target.value) || 0;
            updateTicker();
        });

        sizeSlider.addEventListener('input', (e) => {
            currentSize = parseInt(e.target.value);
            updateTicker();
        });

        fontSelect.addEventListener('change', (e) => {
            currentFont = e.target.value;
            updateTicker();
        });

        weightSlider.addEventListener('input', (e) => {
            currentWeight = parseInt(e.target.value);
            updateTicker();
        });

        textColorPicker.addEventListener('input', (e) => {
            currentTextColor = e.target.value;
            updateTicker();
        });
        bgColorPicker.addEventListener('input', (e) => {
            currentBgColor = e.target.value;
            // テロップ全体の背景色も更新
            document.getElementById('ticker-container').style.backgroundColor = currentBgColor;
            updateTicker();
        });

        // 設定保存キー
        const STORAGE_KEY = 'teropTickerSettings';

        // 設定保存
        function saveSettings() {
            const settings = {
                speed: currentSpeed, // speedInputの値を保存
                size: currentSize,
                text: currentText,
                font: currentFont,
                weight: currentWeight,
                textColor: currentTextColor,
                bgColor: currentBgColor,
                rssUrl: rssUrlInput.value,
                controllerLeft: controller.style.left, // コントローラーの位置を保存
                controllerTop: controller.style.top,
                controllerWidth: controller.style.width, // コントローラーのサイズを保存
                controllerHeight: controller.style.height,
                isControllerVisible: controllerVisible // コントローラーの表示状態を保存
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }

        // 設定読込
        function loadSettings() {
            const settings = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!settings) return;

            speedInput.value = settings.speed; // speedInputの値を読み込み
            sizeSlider.value = settings.size;
            tickerInput.value = settings.text;
            fontSelect.value = settings.font;
            weightSlider.value = settings.weight;
            textColorPicker.value = settings.textColor;
            bgColorPicker.value = settings.bgColor;
            rssUrlInput.value = settings.rssUrl;

            currentSpeed = settings.speed;
            currentSize = settings.size;
            currentText = settings.text;
            currentFont = settings.font;
            currentWeight = settings.weight;
            currentTextColor = settings.textColor;
            currentBgColor = settings.bgColor;
            document.getElementById('ticker-container').style.backgroundColor = currentBgColor; // テロップ背景色も読み込み

            // コントローラーの位置とサイズ、表示状態を復元
            controller.style.left = settings.controllerLeft || '20px';
            controller.style.top = settings.controllerTop || '20px';
            controller.style.width = settings.controllerWidth || '400px';
            controller.style.height = settings.controllerHeight && settings.controllerHeight !== 'auto' ? settings.controllerHeight : 'auto';
            controllerVisible = settings.isControllerVisible !== undefined ? settings.isControllerVisible : true;
            controller.style.display = controllerVisible ? 'block' : 'none';


            updateTicker();
        }

        // 設定初期化
        function resetSettings() {
            localStorage.removeItem(STORAGE_KEY);
            speedInput.value = 0; // 初期値を0に設定
            sizeSlider.value = 32;
            tickerInput.value = 'RSSフィードから読み込まれた情報、または手動で入力されたテキストがここに表示されます。';
            fontSelect.value = 'sans-serif';
            weightSlider.value = 400;
            textColorPicker.value = '#222222';
            bgColorPicker.value = '#ffffff';
            rssUrlInput.value = '';

            currentSpeed = 0; // 初期値を0に設定
            currentSize = 32;
            currentText = tickerInput.value;
            currentFont = fontSelect.value;
            currentWeight = 400;
            currentTextColor = '#222222';
            currentBgColor = '#ffffff';
            document.getElementById('ticker-container').style.backgroundColor = currentBgColor; // テロップ背景色も初期化

            // コントローラーの位置とサイズを初期値に戻す
            controller.style.left = '20px';
            controller.style.top = '20px';
            controller.style.width = '400px';
            controller.style.height = 'auto'; // 高さは初期化時に自動調整に
            controllerVisible = true;
            controller.style.display = 'block';

            updateTicker();
            // RSS自動更新中であれば停止する
            stopRssUpdates();
            alert('設定を初期化しました。');
        }

        resetSettingsBtn.addEventListener('click', resetSettings);

        let controllerVisible = true; // 初期状態は表示
        toggleControllerBtn.addEventListener('click', () => {
            controllerVisible = !controllerVisible;
            controller.style.display = controllerVisible ? 'block' : 'none';
            saveSettings(); // 表示状態も保存
        });

        // 各設定変更時に保存
        speedInput.addEventListener('input', saveSettings);
        sizeSlider.addEventListener('input', saveSettings);
        tickerInput.addEventListener('input', saveSettings);
        fontSelect.addEventListener('change', saveSettings);
        weightSlider.addEventListener('input', saveSettings);
        textColorPicker.addEventListener('input', saveSettings);
        bgColorPicker.addEventListener('input', saveSettings);
        rssUrlInput.addEventListener('input', saveSettings); // RSS URL入力時にも保存

        // ページロード時に設定読込
        window.addEventListener('DOMContentLoaded', () => {
            loadSettings();
            // RSS URLが保存されていれば、ページロード時に自動で更新を開始する
            if (rssUrlInput.value.trim()) {
                startRssUpdates();
            }
        });


        // 移動・リサイズ用変数
        let isDragging = false;
        let isResizing = false;
        let offsetX = 0, offsetY = 0, startWidth = 0, startHeight = 0;

        // リサイズ用のハンドルを追加 (HTML要素として既に存在するため、ここでは取得のみ)
        // const resizeHandle = document.createElement('div'); // HTMLにハンドルがない場合のみ追加
        const resizeHandle = controller.querySelector('.resize-handle'); // HTMLにハンドルがある場合

        // 移動イベント
        controller.addEventListener('mousedown', (e) => {
            const rect = controller.getBoundingClientRect();
            // リサイズハンドル上ならリサイズ開始
            if (e.target.classList.contains('resize-handle')) { // クラス名でチェック
                isResizing = true;
                startWidth = rect.width;
                startHeight = rect.height;
                offsetX = e.clientX;
                offsetY = e.clientY;
                document.body.style.cursor = 'se-resize';
                return;
            }
            // 入力欄等は除外
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.classList.contains('preview-text') || e.target.tagName === 'H3' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') {
                return;
            }
            isDragging = true;
            controller.classList.add('dragging');
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            document.body.style.cursor = 'move';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                let newX = e.clientX - offsetX;
                let newY = e.clientY - offsetY;
                const maxX = window.innerWidth - controller.offsetWidth;
                const maxY = window.innerHeight - controller.offsetHeight;
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
                controller.style.left = `${newX}px`;
                controller.style.top = `${newY}px`;
            }
            if (isResizing) {
                let newWidth = startWidth + (e.clientX - offsetX);
                let newHeight = startHeight + (e.clientY - offsetY);
                newWidth = Math.max(250, newWidth); // 最小幅
                newHeight = Math.max(200, newHeight); // 最小高
                controller.style.width = `${newWidth}px`;
                controller.style.height = `${newHeight}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            isResizing = false;
            controller.classList.remove('dragging');
            document.body.style.cursor = '';
            saveSettings(); // 位置とサイズ変更後も保存
        });

        controller.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        // 拡大・縮小のイベント (コントローラー自体のサイズ)
        zoomInBtn.addEventListener('click', () => {
            const currentWidth = parseInt(controller.style.width) || controller.offsetWidth;
            const currentHeight = parseInt(controller.style.height) || controller.offsetHeight;
            controller.style.width = `${Math.min(currentWidth + 50, window.innerWidth - 20)}px`;
            controller.style.height = `${Math.min(currentHeight + 30, window.innerHeight - 20)}px`;
            saveSettings();
        });

        zoomOutBtn.addEventListener('click', () => {
            const currentWidth = parseInt(controller.style.width) || controller.offsetWidth;
            const currentHeight = parseInt(controller.style.height) || controller.offsetHeight;
            controller.style.width = `${Math.max(currentWidth - 50, 250)}px`;
            controller.style.height = `${Math.max(currentHeight - 30, 200)}px`;
            saveSettings();
        });

        // 女性の声で読み上げ
        function speakText(text) {
            if (!window.speechSynthesis) {
                console.warn('Speech Synthesis API is not supported in this browser.');
                return;
            }
            if (utterance && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel(); // 現在読み上げ中の場合は停止
            }
            utterance = new SpeechSynthesisUtterance(text);
            // 女性の日本語ボイスを優先
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.lang.startsWith('ja') && (v.name.includes('Female') || v.name.includes('女性') || v.name.includes('Haruka') || v.name.includes('Google 日本語')));
            utterance.voice = femaleVoice || voices.find(v => v.lang.startsWith('ja'));
            utterance.rate = 1;
            utterance.pitch = 1.2;
            window.speechSynthesis.speak(utterance);
        }

        speechOnBtn.addEventListener('click', () => {
            isSpeechOn = true;
            speakText(currentText);
        });

        speechOffBtn.addEventListener('click', () => {
            isSpeechOn = false;
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        });

        // 文字サイズ変更イベント（使いやすいように調整）
        fontSizeUpBtn.addEventListener('click', () => {
            // 1クリックで+8px、最大120pxまで
            currentSize = Math.min(currentSize + 8, 120);
            sizeSlider.value = currentSize;
            updateTicker();
            saveSettings();
        });
        fontSizeDownBtn.addEventListener('click', () => {
            // 1クリックで-8px、最小12pxまで
            currentSize = Math.max(currentSize - 8, 12);
            sizeSlider.value = currentSize;
            updateTicker();
            saveSettings();
        });

        // 文字サイズスライダー変更時も即反映
        sizeSlider.addEventListener('input', (e) => {
            currentSize = parseInt(e.target.value);
            updateTicker();
            saveSettings();
        });

        // RSS URL入力欄の変更時に即座に反映（非同期処理を高速化）
        let rssFetchTimeout;
        rssUrlInput.addEventListener('input', () => {
            // 入力があれば即座にRSSを反映
            if (rssUrlInput.value.trim()) {
                // 連続入力時の遅延を最小化
                if (rssFetchTimeout) clearTimeout(rssFetchTimeout);
                rssFetchTimeout = setTimeout(() => {
                    fetchAndDisplayMultipleRss();
                }, 100); // 100ms後に実行（ほぼ即時）
            }
            saveSettings();
        });


        // 再生・一時停止ボタンのイベント
        playBtn.addEventListener('click', () => {
            isTickerPaused = false;
            updateTicker(); // 状態変更後に反映
        });

        pauseBtn.addEventListener('click', () => {
            isTickerPaused = true;
            updateTicker(); // 状態変更後に反映
        });

        // 初期描画
        updateTicker();
    </script>
</body>
</html>