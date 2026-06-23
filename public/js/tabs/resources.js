// ==================== РЕСУРСЫ ====================
function renderResourcesPage() {
    const main = document.getElementById('mainPanel');
    if (window.currentTab !== 'resources') return;
    const cityId = window.resourcesFilter.cityId || window.selectedCityId;
    let filtered = window.resourceDefinitions;

    const search = window.resourcesSearch.trim().toLowerCase();
    if (search) filtered = filtered.filter(r => r.name.toLowerCase().includes(search));
    if (window.resourcesFilter.category !== 'all') filtered = filtered.filter(r => r.category === window.resourcesFilter.category);
    if (window.resourcesFilter.tier !== 'all') filtered = filtered.filter(r => r.tier == parseInt(window.resourcesFilter.tier));
    if (window.resourcesFilter.enchant !== 'all') filtered = filtered.filter(r => r.enchant == parseInt(window.resourcesFilter.enchant));

    const prices = window.cityResources[cityId] || {};
    const cityName = getCityName(cityId);
    main.innerHTML = `
        <div class="resources-page">
            <h2 style="color:var(--accent);">🧱 Цены ресурсов — ${cityName}</h2>
            <div class="filter-bar">
                <div class="form-group"><label>Город</label>
                    <select onchange="window.resourcesFilter.cityId=this.value; renderResourcesPage();">
                        <option value="">Текущий (${getCityName(window.selectedCityId)})</option>
                        ${window.cities.map(c => `<option value="${c.id}" ${(window.resourcesFilter.cityId||window.selectedCityId)===c.id?'selected':''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Категория</label>
                    <select onchange="window.resourcesFilter.category=this.value; renderResourcesPage();">
                        <option value="all">Все</option>
                        <option value="ore">Сталь</option>
                        <option value="wood">Брусья</option>
                        <option value="hide">Кожа</option>
                        <option value="fiber">Ткань</option>
                    </select>
                </div>
                <div class="form-group"><label>Тир</label>
                    <select onchange="window.resourcesFilter.tier=this.value; renderResourcesPage();">
                        <option value="all">Все</option>
                        ${[4,5,6,7,8].map(t => `<option value="${t}">T${t}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Чар</label>
                    <select onchange="window.resourcesFilter.enchant=this.value; renderResourcesPage();">
                        <option value="all">Все</option>
                        ${[0,1,2,3,4].map(e => `<option value="${e}">.${e}</option>`).join('')}
                    </select>
                </div>
                <button class="btn-mass-update" onclick="massUpdatePrices()">🔄 Задать цену видимым</button>
                <button class="btn-sm btn-copy" onclick="copyPricesFromCity()">📋 Копировать из другого города</button>
            </div>
            <table>
                <thead><tr><th>Ресурс</th><th>Тир</th><th>Чар</th><th>Цена</th><th>Действия</th></tr></thead>
                <tbody>${filtered.map(r => `<tr>
    <td>${escapeHtml(r.name)}</td>
    <td>T${r.tier}</td>
    <td>.${r.enchant}</td>
    <td><input type="number" value="${prices[r.name]??0}" step="any" onchange="updateResourcePrice('${escapeHtml(r.name)}', '${cityId}', parseFloat(this.value)||0)"></td>
    <td><button class="btn-sm btn-danger" onclick="deleteResource('${r.id}', '${escapeHtml(r.name)}')">🗑</button></td>
</tr>`).join('')}</tbody>
            </table>
            <p style="font-size:12px;">Показано ${filtered.length} ресурсов. Изменения влияют на все товары.</p>
        </div>`;
    updateResourcesDataList();
}

async function updateResourcePrice(resName, cityId, price) {
    if (!window.cityResources[cityId]) window.cityResources[cityId] = {};
    window.cityResources[cityId][resName] = price;
    await apiFetch('/resources/prices', {
        method: 'PUT',
        body: JSON.stringify({ cityId, prices: { [resName]: price } }),
    });
}

async function massUpdatePrices() {
    const cityId = window.resourcesFilter.cityId || window.selectedCityId;
    const priceStr = prompt(`Введите цену для всех видимых ресурсов в ${getCityName(cityId)}:`);
    if (priceStr === null) return;
    const val = parseFloat(priceStr);
    if (isNaN(val) || val < 0) return alert('Некорректная цена');

    let filtered = window.resourceDefinitions;
    const search = window.resourcesSearch.trim().toLowerCase();
    if (search) filtered = filtered.filter(r => r.name.toLowerCase().includes(search));
    if (window.resourcesFilter.category !== 'all') filtered = filtered.filter(r => r.category === window.resourcesFilter.category);
    if (window.resourcesFilter.tier !== 'all') filtered = filtered.filter(r => r.tier == parseInt(window.resourcesFilter.tier));
    if (window.resourcesFilter.enchant !== 'all') filtered = filtered.filter(r => r.enchant == parseInt(window.resourcesFilter.enchant));

    const pricesObj = {};
    filtered.forEach(r => { pricesObj[r.name] = val; });

    await apiFetch('/resources/prices', {
        method: 'PUT',
        body: JSON.stringify({ cityId, prices: pricesObj }),
    });

    if (!window.cityResources[cityId]) window.cityResources[cityId] = {};
    Object.assign(window.cityResources[cityId], pricesObj);
    renderResourcesPage();
}

async function copyPricesFromCity() {
    const targetCityId = window.resourcesFilter.cityId || window.selectedCityId;
    const sourceCityId = prompt(`Введите ID города-источника (${window.cities.map(c=>c.id+'-'+c.name).join(', ')}):`);
    if (!sourceCityId) return;
    if (!window.cityResources[sourceCityId]) return alert('Город-источник не найден');
    // Копируем все цены
    await apiFetch('/resources/prices', {
        method: 'PUT',
        body: JSON.stringify({ cityId: targetCityId, prices: window.cityResources[sourceCityId] }),
    });
    window.cityResources[targetCityId] = { ...window.cityResources[sourceCityId] };
    renderResourcesPage();
}

window.updateResourcesDataList = function() {
    const dl = document.getElementById('resourcesDataList');
    if (!dl) return;
    dl.innerHTML = '';
    window.resourceDefinitions.forEach(r => {
        const option = document.createElement('option');
        option.value = r.name;
        dl.appendChild(option);
    });
};
async function deleteResource(resourceId, resourceName) {
    if (!confirm(`Удалить ресурс "${resourceName}" навсегда? Это может повлиять на товары.`)) return;
    try {
        await apiFetch(`/resources/${resourceId}`, { method: 'DELETE' });
        // Удаляем из локального справочника
        window.resourceDefinitions = window.resourceDefinitions.filter(r => r.id !== resourceId);
        // Удаляем цены для всех городов
        Object.keys(window.cityResources).forEach(cityId => {
            if (window.cityResources[cityId]) {
                delete window.cityResources[cityId][resourceName];
            }
        });
        // Обновляем datalist
        if (typeof updateResourcesDataList === 'function') updateResourcesDataList();
        renderResourcesPage();
    } catch (e) {
        alert('Ошибка удаления: ' + e.message);
    }
}