// ==================== ТОВАРЫ ====================
function getFilteredSortedItems() {
    let list = window.items.filter(i => i.name.toLowerCase().includes(window.itemsSearch.toLowerCase()));
    if (window.itemSort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
}

function renderItemList() {
    const ul = document.getElementById('itemsList');
    if (!ul) return;
    ul.innerHTML = getFilteredSortedItems().map(i => `
        <li class="${i.id === window.selectedItemId ? 'active' : ''}" onclick="selectItem('${i.id}')">
            ${i.image ? `<img src="${i.image}" onerror="this.style.display='none'">` : '<div style="width:30px;height:30px;background:#1b2530;border-radius:6px;"></div>'}
            <span>${escapeHtml(i.name)}</span>
        </li>`).join('');
}

function selectItem(id) {
    window.selectedItemId = id;
    window.selectedLotId = null;
    renderItemList();
    renderItemCard();
}

function renderItemCard() {
    const main = document.getElementById('mainPanel');
    if (window.currentTab !== 'items') return;
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) {
        main.innerHTML = '<div class="empty-state"><h2>📦 Выберите товар</h2></div>';
        return;
    }

    const cd = item.cityData?.[window.selectedCityId] || { craftCost: 0, sellPrice: 0, taxPercent: 10.5 };
    const returnFactor = item.useReturn ? (1 - item.returnPercent / 100) : 1;
    let totalResCost = 0;

    const resRows = item.resources.map((r, i) => {
    const resName = r.name || r.resource?.name || 'Неизвестный ресурс';
    const price = getResourcePrice(resName, window.selectedCityId);
    const eff = r.qty * returnFactor;
    const cost = eff * price;
    totalResCost += cost;

    return `<tr>
        <td>
            <input type="text" list="resourcesDataList" value="${escapeHtml(resName)}" 
                   onchange="updateItemResource(${i}, 'name', this.value)" 
                   style="width:100%; padding:4px; border-radius:4px; border:1px solid var(--border); background:var(--input-bg); color:var(--text);">
        </td>
        <td><input type="number" value="${r.qty}" step="any" onchange="updateItemResource(${i}, 'qty', parseFloat(this.value)||0)"></td>
        <td>${price.toFixed(2)}</td>
        <td>${eff.toFixed(2)}</td>
        <td>${cost.toFixed(2)}</td>
        <td><button class="btn-sm btn-danger" onclick="deleteItemResource(${i})">✕</button></td>
    </tr>`;
}).join('');

    const totalCost = totalResCost + cd.craftCost;
    const revenue = cd.sellPrice * (1 - cd.taxPercent / 100);
    const profitUnit = revenue - totalCost;
    const profitTotal = profitUnit * item.quantity;
    const cityName = getCityName(window.selectedCityId);

    main.innerHTML = `
        <div class="item-card">
            <div class="item-header">
                ${item.image ? `<img src="${item.image}" onerror="this.style.display='none'">` : '<div style="width:64px;height:64px;background:#1b2530;border-radius:10px;"></div>'}
                <h1>${escapeHtml(item.name)}</h1>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>🔗 URL картинки</label><input value="${item.image||''}" onchange="updateItemField('image', this.value)"></div>
                <div class="form-group"><label>📦 Название</label><input value="${escapeHtml(item.name)}" onchange="updateItemField('name', this.value)"></div>
                <div class="form-group"><label>🔨 Стоимость крафта (1шт) в ${cityName}</label><input type="number" value="${cd.craftCost}" step="any" onchange="updateCityData('craftCost', parseFloat(this.value)||0)"></div>
                <div class="form-group"><label>🔢 Количество в партии</label><input type="number" value="${item.quantity}" min="1" onchange="updateItemField('quantity', parseInt(this.value)||1)"></div>
                <div class="form-group"><label>💰 Цена продажи (1шт) в ${cityName}</label><input type="number" value="${cd.sellPrice}" step="any" onchange="updateCityData('sellPrice', parseFloat(this.value)||0)"></div>
                <div class="form-group"><label>🧾 Налог % в ${cityName}</label><input type="number" value="${cd.taxPercent}" step="0.1" onchange="updateCityData('taxPercent', parseFloat(this.value)||0)"></div>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="useReturnCheck" ${item.useReturn ? 'checked' : ''} onchange="toggleUseReturn(this.checked)">
                <label>Учитывать возврат ресурсов</label>
            </div>
            <div class="form-group" style="max-width:200px;"><label>↩️ Процент возврата %</label><input type="number" value="${item.returnPercent}" step="0.1" onchange="updateItemField('returnPercent', parseFloat(this.value)||0)"></div>
            <div class="resources-section">
                <h3>📋 Ресурсы (на 1 крафт) — цены из ${cityName}</h3>
                <table><thead><tr><th>Ресурс</th><th>Кол-во</th><th>Цена</th><th>Эффект.</th><th>Затраты</th><th></th></tr></thead><tbody>${resRows}</tbody></table>
                <button class="btn-sm btn-add-res" onclick="addItemResource()">➕ Добавить ресурс</button>
            </div>
            <div class="calculation-box">
                <p><strong>📊 Расчёт на 1 шт (${cityName}):</strong></p>
                <p>• Ресурсы: ${totalResCost.toFixed(2)} + крафт ${cd.craftCost.toFixed(2)} = <b>${totalCost.toFixed(2)}</b></p>
                <p>• Прибыль с 1 шт: <span class="${profitUnit>=0?'profit-green':'profit-red'}">${profitUnit.toFixed(2)}</span></p>
                <p><strong>📦 Партия ${item.quantity} шт.:</strong> себест. ${(totalCost*item.quantity).toFixed(2)}, выручка ${(revenue*item.quantity).toFixed(2)}, прибыль <span class="${profitTotal>=0?'profit-green':'profit-red'}">${profitTotal.toFixed(2)}</span></p>
            </div>
            <div class="actions-row">
                <button class="btn-sm btn-sell" onclick="createLotFromItem()">📈 Выставить на продажу</button>
                <button class="btn-sm btn-copy" onclick="copyItem()">📋 Копировать товар</button>
                <button class="btn-sm btn-danger" onclick="deleteItem()">🗑 Удалить</button>
            </div>
        </div>`;
}

async function updateItemField(field, value) {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    item[field] = value;
    await saveItem(item);
    renderItemList();
    renderItemCard();
}

async function updateCityData(field, value) {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    if (!item.cityData) item.cityData = {};
    if (!item.cityData[window.selectedCityId]) {
        item.cityData[window.selectedCityId] = { craftCost: 0, sellPrice: 0, taxPercent: 10.5 };
    }
    item.cityData[window.selectedCityId][field] = value;
    await saveItem(item);
    renderItemCard();
}

function updateItemResource(idx, field, value) {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    item.resources[idx][field] = value;
    if (field === 'name') {
        delete item.resources[idx].resourceId;
    }
    saveItem(item).then(() => renderItemCard());
}

async function addItemResource() {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    const defaultName = (window.resourceDefinitions && window.resourceDefinitions.length > 0)
        ? window.resourceDefinitions[0].name
        : 'Стальной слиток T4.0';
    item.resources.push({ name: defaultName, qty: 1 });
    await saveItem(item);
    renderItemCard();
}

async function deleteItemResource(idx) {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item || item.resources.length <= 1) return;
    item.resources.splice(idx, 1);
    await saveItem(item);
    renderItemCard();
}

async function toggleUseReturn(val) {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    item.useReturn = val;
    await saveItem(item);
    renderItemCard();
}

async function saveItem(item) {
    const cityDataArray = window.cities.map(c => {
        const existing = item.cityData?.[c.id] || { craftCost: 0, sellPrice: 0, taxPercent: 10.5 };
        return {
            cityId: c.id,
            craftCost: existing.craftCost || 0,
            sellPrice: existing.sellPrice || 0,
            taxPercent: existing.taxPercent ?? 10.5
        };
    });

    const payload = {
        name: item.name,
        image: item.image,
        returnPercent: item.returnPercent,
        useReturn: item.useReturn,
        quantity: item.quantity,
        resources: item.resources,
        cityData: cityDataArray
    };

    const updated = await apiFetch(`/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    // Нормализация cityData
    if (Array.isArray(updated.cityData)) {
        const cdObj = {};
        updated.cityData.forEach(cd => {
            cdObj[cd.cityId] = {
                craftCost: cd.craftCost || 0,
                sellPrice: cd.sellPrice || 0,
                taxPercent: cd.taxPercent ?? 10.5
            };
        });
        updated.cityData = cdObj;
    }
    // Нормализация ресурсов
    if (updated.resources) {
        updated.resources = updated.resources.map(r => ({
            ...r,
            name: r.resource?.name || r.name || 'Неизвестный ресурс'
        }));
    }

    const idx = window.items.findIndex(i => i.id === item.id);
    if (idx !== -1) window.items[idx] = updated;

    // ✅ Обновляем глобальный справочник и datalist
    window.resourceDefinitions = await apiFetch('/resources');
    if (typeof updateResourcesDataList === 'function') {
        updateResourcesDataList();
    }

    return updated;
}

async function addNewItem() {
    const cityData = {};
    window.cities.forEach(c => { cityData[c.id] = { craftCost: 0, sellPrice: 0, taxPercent: 10.5 }; });
    const newItem = {
        name: 'Новый товар',
        image: '',
        resources: [{ name: 'Стальной слиток T4.0', qty: 1 }],
        returnPercent: 15.2,
        useReturn: true,
        quantity: 1,
        cityData
    };
    const created = await apiFetch('/items', {
        method: 'POST',
        body: JSON.stringify(newItem),
    });
    if (Array.isArray(created.cityData)) {
        const cdObj = {};
        created.cityData.forEach(cd => {
            cdObj[cd.cityId] = { craftCost: cd.craftCost, sellPrice: cd.sellPrice, taxPercent: cd.taxPercent };
        });
        created.cityData = cdObj;
    }
    if (created.resources) {
        created.resources = created.resources.map(r => ({
            ...r,
            name: r.resource?.name || r.name || 'Неизвестный ресурс'
        }));
    }
    window.items.push(created);
    window.selectedItemId = created.id;
    renderItemList();
    renderItemCard();
}

async function copyItem() {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    const copy = JSON.parse(JSON.stringify(item));
    delete copy.id;
    copy.name += ' (копия)';
    const created = await apiFetch('/items', {
        method: 'POST',
        body: JSON.stringify(copy),
    });
    if (Array.isArray(created.cityData)) {
        const cdObj = {};
        created.cityData.forEach(cd => {
            cdObj[cd.cityId] = { craftCost: cd.craftCost, sellPrice: cd.sellPrice, taxPercent: cd.taxPercent };
        });
        created.cityData = cdObj;
    }
    if (created.resources) {
        created.resources = created.resources.map(r => ({
            ...r,
            name: r.resource?.name || r.name || 'Неизвестный ресурс'
        }));
    }
    window.items.push(created);
    window.selectedItemId = created.id;
    renderItemList();
    renderItemCard();
}

async function deleteItem() {
    if (!confirm('Удалить товар?')) return;
    await apiFetch(`/items/${window.selectedItemId}`, { method: 'DELETE' });
    window.items = window.items.filter(i => i.id !== window.selectedItemId);
    window.selectedItemId = window.items.length ? window.items[0].id : null;
    renderItemList();
    renderItemCard();
}

async function createLotFromItem() {
    const item = window.items.find(i => i.id === window.selectedItemId);
    if (!item) return;
    const cost = calculateItemCost(item, window.selectedCityId);
    const cd = item.cityData?.[window.selectedCityId] || { sellPrice: 0 };
    const lotData = {
        itemId: item.id,
        cityId: window.selectedCityId,
        quantityTotal: item.quantity,
        costPerUnit: cost,
        totalCost: cost * item.quantity,
        sellPricePerUnit: cd.sellPrice || 0,
    };
    const created = await apiFetch('/lots', {
        method: 'POST',
        body: JSON.stringify(lotData),
    });
    window.lots.push(created);
    window.selectedLotId = created.id;
    switchTab('lots');
}