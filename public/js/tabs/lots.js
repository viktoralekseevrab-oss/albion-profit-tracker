// ==================== ЛОТЫ ====================
function getFilteredSortedLots() {
    let list = window.lots.filter(l => (l.item?.name || '').toLowerCase().includes(window.lotsSearch.toLowerCase()));
    if (window.lotSort === 'newest') list.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    else if (window.lotSort === 'oldest') list.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    else if (window.lotSort === 'profit') {
        list.sort((a, b) => {
            const pa = a.totalRevenue - (a.costPerUnit * a.quantitySold) - a.commissionPaid;
            const pb = b.totalRevenue - (b.costPerUnit * b.quantitySold) - b.commissionPaid;
            return pb - pa;
        });
    }
    return list;
}

function renderLotList() {
    const ul = document.getElementById('lotsList');
    if (!ul) return;
    ul.innerHTML = getFilteredSortedLots().map(l => `
        <li class="${l.id === window.selectedLotId ? 'active' : ''}" onclick="selectLot('${l.id}')">
            ${l.item?.image ? `<img src="${l.item.image}">` : ''}
            <span>${escapeHtml(l.item?.name || 'Без названия')} (${l.quantityRemaining}/${l.quantityTotal}) — ${getCityName(l.cityId)}</span>
        </li>`).join('');
}

function selectLot(id) {
    window.selectedLotId = id;
    renderLotList();
    renderLotDetail();
}

function renderLotDetail() {
    const main = document.getElementById('mainPanel');
    if (window.currentTab !== 'lots') return;
    const lot = window.lots.find(l => l.id === window.selectedLotId);
    if (!lot) {
        main.innerHTML = '<div class="empty-state"><h2>📈 Выберите лот</h2></div>';
        return;
    }
    const profit = lot.totalRevenue - (lot.costPerUnit * lot.quantitySold) - lot.commissionPaid;
    main.innerHTML = `
        <div class="lot-detail">
            <div class="lot-header">
                ${lot.item?.image ? `<img src="${lot.item.image}">` : ''}
                <h1>${escapeHtml(lot.item?.name || 'Без названия')} (${getCityName(lot.cityId)})</h1>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>📅 Создан</label><input disabled value="${new Date(lot.dateCreated).toLocaleString()}"></div>
                <div class="form-group"><label>🔢 Всего</label><input disabled value="${lot.quantityTotal}"></div>
                <div class="form-group"><label>📦 Осталось</label><input type="number" value="${lot.quantityRemaining}" onchange="updateLotRemaining(this.value)"></div>
                <div class="form-group"><label>✅ Продано</label><input disabled value="${lot.quantitySold}"></div>
                <div class="form-group"><label>💵 Себест. 1шт</label><input disabled value="${lot.costPerUnit.toFixed(2)}"></div>
                <div class="form-group"><label>💰 Цена (за шт)</label><input type="number" value="${lot.sellPricePerUnit}" onchange="updateLotPrice(this.value)"></div>
                <div class="form-group"><label>🧾 Выручка</label><input disabled value="${lot.totalRevenue.toFixed(2)}"></div>
                <div class="form-group"><label>💸 Комиссии</label><input disabled value="${lot.commissionPaid.toFixed(2)}"></div>
            </div>
            <div class="actions-row">
                <button class="btn-sm btn-sell" onclick="addLotSale()">💰 Внести продажу</button>
                <button class="btn-sm btn-danger" onclick="deleteLot()">🗑 Удалить лот</button>
            </div>
            <div class="lot-info"><p><strong>📊 Чистая прибыль:</strong> <span class="${profit>=0?'profit-green':'profit-red'}">${profit.toFixed(2)}</span></p></div>
        </div>`;
}

async function updateLotRemaining(val) {
    const lot = window.lots.find(l => l.id === window.selectedLotId);
    if (!lot) return;
    const v = parseInt(val);
    if (isNaN(v) || v < 0 || v > lot.quantityTotal) return alert('Некорректное значение');
    const updated = await apiFetch(`/lots/${lot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantityRemaining: v }),
    });
    Object.assign(lot, updated);
    renderLotList();
    renderLotDetail();
}

async function updateLotPrice(val) {
    const lot = window.lots.find(l => l.id === window.selectedLotId);
    if (!lot) return;
    const price = parseFloat(val);
    if (isNaN(price) || price < 0) return alert('Некорректная цена');
    const updated = await apiFetch(`/lots/${lot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sellPricePerUnit: price }),
    });
    Object.assign(lot, updated);
    renderLotDetail();
}

async function addLotSale() {
    const lot = window.lots.find(l => l.id === window.selectedLotId);
    if (!lot || lot.quantityRemaining <= 0) return alert('Нет товара для продажи');
    const qty = prompt(`Осталось ${lot.quantityRemaining}. Продано?`, Math.min(1, lot.quantityRemaining));
    if (!qty) return;
    const sold = parseInt(qty);
    if (isNaN(sold) || sold <= 0 || sold > lot.quantityRemaining) return alert('Некорректное количество');
    const rev = prompt('Полученная сумма (после налогов):', (sold * lot.sellPricePerUnit).toFixed(2));
    if (!rev) return;
    const revenue = parseFloat(rev);
    if (isNaN(revenue) || revenue < 0) return alert('Некорректная сумма');
    const updated = await apiFetch(`/lots/${lot.id}/sale`, {
        method: 'POST',
        body: JSON.stringify({ quantity: sold, revenue }),
    });
    Object.assign(lot, updated);
    renderLotList();
    renderLotDetail();
}

async function deleteLot() {
    if (!confirm('Удалить лот?')) return;
    await apiFetch(`/lots/${window.selectedLotId}`, { method: 'DELETE' });
    window.lots = window.lots.filter(l => l.id !== window.selectedLotId);
    window.selectedLotId = window.lots.length ? window.lots[0].id : null;
    renderLotList();
    renderLotDetail();
}