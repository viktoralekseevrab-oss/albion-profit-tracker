// ==================== ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ ====================

async function initApp() {
    try {
        // Загружаем города
        window.cities = await apiFetch('/cities');
        if (!window.cities.length) return alert('Нет городов в базе!');
        window.selectedCityId = window.cities[0].id;

        // Справочник ресурсов
        window.resourceDefinitions = await apiFetch('/resources');

        // Цены ресурсов пользователя
        const pricesData = await apiFetch('/resources/prices');
        window.cityResources = pricesData || {};

        // Гарантируем нулевые цены
        window.cities.forEach(city => {
            if (!window.cityResources[city.id]) window.cityResources[city.id] = {};
            window.resourceDefinitions.forEach(def => {
                if (window.cityResources[city.id][def.name] === undefined) {
                    window.cityResources[city.id][def.name] = 0;
                }
            });
        });

        // Товары и лоты
        window.items = await apiFetch('/items');
        // ✅ Нормализуем ресурсы: вытаскиваем name из resource
        window.items.forEach(item => {
    if (Array.isArray(item.cityData)) {
        const cdObj = {};
        item.cityData.forEach(cd => {
            cdObj[cd.cityId] = {
                craftCost: cd.craftCost || 0,
                sellPrice: cd.sellPrice || 0,
                taxPercent: cd.taxPercent ?? 10.5
            };
        });
        item.cityData = cdObj;
    }
    // Нормализация ресурсов: вытаскиваем name наружу
    if (item.resources) {
        item.resources = item.resources.map(r => ({
            ...r,
            name: r.resource?.name || r.name || 'Неизвестный ресурс'
        }));
    }
});


        window.lots = await apiFetch('/lots').catch(() => []);

        // Обновляем datalist ресурсов
        if (typeof updateResourcesDataList === 'function') {
            updateResourcesDataList();
        }

        renderAll();
    } catch (e) {
        console.error(e);
        alert('Ошибка загрузки данных: ' + e.message);
    }
}

function renderAll() {
    renderCitySelector();
    renderSidebar();
    switch (window.currentTab) {
        case 'dashboard': renderDashboard(); break;
        case 'items':
            renderItemList();
            renderItemCard();
            break;
        case 'lots':
            renderLotList();
            renderLotDetail();
            break;
        case 'resources':
            renderResourcesPage();
            break;
    }
}

function renderCitySelector() {
    const sel = document.getElementById('globalCitySelect');
    if (!sel) return;
    sel.innerHTML = window.cities.map(c =>
        `<option value="${c.id}" ${c.id === window.selectedCityId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
}

function changeGlobalCity(cityId) {
    window.selectedCityId = cityId;
    renderAll();
}

function switchTab(tab) {
    window.currentTab = tab;
    ['Dashboard', 'Items', 'Lots', 'Resources'].forEach(name => {
        const btn = document.getElementById(`tab${name}Btn`);
        if (btn) btn.classList.toggle('active', name.toLowerCase() === tab);
    });
    renderAll();
}

function renderSidebar() {
    const container = document.getElementById('sidebarContent');
    if (!container) return;
    const cityName = getCityName(window.selectedCityId);
    switch (window.currentTab) {
        case 'dashboard':
            container.innerHTML = `
                <div class="sidebar-header"><h2>📊 Обзор рынка (${cityName})</h2></div>
                <div class="search-box">
                    <input type="text" id="searchDashboard" placeholder="Поиск товара..." oninput="renderDashboard()">
                    <button class="clear-search" onclick="document.getElementById('searchDashboard').value=''; renderDashboard();">✕</button>
                </div>
                <p style="font-size:12px; color:var(--text-secondary); padding:10px;">Клик по заголовку таблицы сортирует.</p>
            `;
            break;
        case 'items':
            container.innerHTML = `
                <div class="sidebar-header"><h2>🛠 Товары</h2></div>
                <div class="search-box">
                    <input type="text" id="searchItems" placeholder="Поиск..." oninput="window.itemsSearch=this.value; renderItemList()">
                    <button class="clear-search" onclick="clearSearch('items')">✕</button>
                </div>
                <div class="sort-row">
                    <select id="sortItems" onchange="changeItemSort()">
                        <option value="az" ${window.itemSort==='az'?'selected':''}>По названию (А→Я)</option>
                        <option value="za" ${window.itemSort==='za'?'selected':''}>По названию (Я→А)</option>
                    </select>
                </div>
                <button class="btn-add-item" onclick="addNewItem()">➕ Добавить товар</button>
                <ul class="list-container" id="itemsList"></ul>
            `;
            break;
        case 'lots':
            container.innerHTML = `
                <div class="sidebar-header"><h2>📈 Лоты</h2></div>
                <div class="search-box">
                    <input type="text" id="searchLots" placeholder="Поиск..." oninput="window.lotsSearch=this.value; renderLotList()">
                    <button class="clear-search" onclick="clearSearch('lots')">✕</button>
                </div>
                <div class="sort-row">
                    <select id="sortLots" onchange="changeLotSort()">
                        <option value="newest" ${window.lotSort==='newest'?'selected':''}>Сначала новые</option>
                        <option value="oldest" ${window.lotSort==='oldest'?'selected':''}>Сначала старые</option>
                        <option value="profit" ${window.lotSort==='profit'?'selected':''}>По прибыли</option>
                    </select>
                </div>
                <ul class="list-container" id="lotsList"></ul>
            `;
            break;
        case 'resources':
            container.innerHTML = `
                <div class="sidebar-header"><h2>🧱 Ресурсы</h2></div>
                <div class="search-box">
                    <input type="text" id="searchResources" placeholder="Поиск ресурса..." oninput="window.resourcesSearch=this.value; renderResourcesPage()">
                    <button class="clear-search" onclick="clearSearch('resources')">✕</button>
                </div>
                <p style="font-size:12px; color:var(--text-secondary); padding:10px;">Редактируйте цены для выбранного города в правой панели.</p>
            `;
            break;
    }
}

// Запуск после полной загрузки DOM
(function() {
    if (localStorage.getItem('token')) {
        showApp();
        setTimeout(() => initApp().catch(e => console.error(e)), 10);
    } else {
        showAuth();
    }
})();