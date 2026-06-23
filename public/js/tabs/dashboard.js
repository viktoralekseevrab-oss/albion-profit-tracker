function renderDashboard() {
    const main = document.getElementById('mainPanel');
    if (window.currentTab !== 'dashboard') return;
    const searchVal = document.getElementById('searchDashboard')?.value || '';
    let filtered = window.items.filter(i => i.name.toLowerCase().includes(searchVal.toLowerCase()));
    const rows = filtered.map(item => {
        const { cost, revenue, profit, roi } = calculateItemProfit(item, window.selectedCityId);
        return { item, cost, revenue, profit, roi };
    });

    const sort = window.dashboardSort;
    rows.sort((a, b) => {
        let va, vb;
        switch (sort.field) {
            case 'name': va = a.item.name; vb = b.item.name; return va.localeCompare(vb) * (sort.asc ? 1 : -1);
            case 'cost': return (a.cost - b.cost) * (sort.asc ? 1 : -1);
            case 'revenue': return (a.revenue - b.revenue) * (sort.asc ? 1 : -1);
            case 'profit': return (a.profit - b.profit) * (sort.asc ? 1 : -1);
            case 'roi': return (a.roi - b.roi) * (sort.asc ? 1 : -1);
            default: return 0;
        }
    });

    const totalProfit = rows.reduce((sum, r) => sum + r.profit * r.item.quantity, 0);
    const cityName = getCityName(window.selectedCityId);
    main.innerHTML = `
        <div class="dashboard-page">
            <h2 style="color:var(--accent);">📊 Прибыльность товаров — ${cityName}</h2>
            <div style="overflow-x:auto;">
                <table>
                    <thead><tr>
                        <th onclick="dashboardSortBy('name')">Товар ${sort.field==='name'?(sort.asc?'↑':'↓'):''}</th>
                        <th onclick="dashboardSortBy('cost')">Себест. 1шт ${sort.field==='cost'?(sort.asc?'↑':'↓'):''}</th>
                        <th onclick="dashboardSortBy('revenue')">Цена нетто ${sort.field==='revenue'?(sort.asc?'↑':'↓'):''}</th>
                        <th onclick="dashboardSortBy('profit')">Прибыль 1шт ${sort.field==='profit'?(sort.asc?'↑':'↓'):''}</th>
                        <th onclick="dashboardSortBy('roi')">ROI % ${sort.field==='roi'?(sort.asc?'↑':'↓'):''}</th>
                        <th>Партия</th>
                        <th>Общая прибыль</th>
                    </tr></thead>
                    <tbody>${rows.map(r => `
                        <tr style="cursor:pointer" onclick="selectItemFromDashboard('${r.item.id}')">
                            <td>${escapeHtml(r.item.name)}</td>
                            <td>${r.cost.toFixed(2)}</td>
                            <td>${r.revenue.toFixed(2)}</td>
                            <td class="${r.profit>=0?'profit-green':'profit-red'}">${r.profit.toFixed(2)}</td>
                            <td class="${r.roi>=0?'profit-green':'profit-red'}">${r.roi.toFixed(1)}%</td>
                            <td>${r.item.quantity}</td>
                            <td class="${(r.profit*r.item.quantity)>=0?'profit-green':'profit-red'}">${(r.profit * r.item.quantity).toFixed(2)}</td>
                        </tr>`).join('')}</tbody>
                </table>
            </div>
            <p style="margin-top:12px;"><strong>Суммарная прибыль (партии):</strong> <span class="${totalProfit>=0?'profit-green':'profit-red'}">${totalProfit.toFixed(2)}</span></p>
        </div>`;
}

function dashboardSortBy(field) {
    const sort = window.dashboardSort;
    if (sort.field === field) sort.asc = !sort.asc;
    else {
        sort.field = field;
        sort.asc = (field === 'profit' || field === 'roi') ? false : true;
    }
    renderDashboard();
}

function selectItemFromDashboard(id) {
    window.selectedItemId = id;
    switchTab('items');
}

// Расчёт себестоимости и прибыли (как в оригинале)
function getResourcePrice(resName, cityId) {
    const prices = window.cityResources[cityId] || {};
    return prices[resName] ?? 0;
}

function calculateItemCost(item, cityId) {
    const returnFactor = item.useReturn ? (1 - item.returnPercent / 100) : 1;
    let totalResourceCost = 0;
    item.resources.forEach(r => {
        totalResourceCost += (r.qty * returnFactor) * getResourcePrice(r.name, cityId);
    });
    const cd = item.cityData?.[cityId] || { craftCost: 0 };
    return totalResourceCost + (cd.craftCost || 0);
}

function calculateItemProfit(item, cityId) {
    const cd = item.cityData?.[cityId] || { sellPrice: 0, taxPercent: 10.5 };
    const cost = calculateItemCost(item, cityId);
    const revenue = (cd.sellPrice || 0) * (1 - (cd.taxPercent || 0) / 100);
    return { cost, revenue, profit: revenue - cost, roi: cost > 0 ? ((revenue - cost) / cost * 100) : 0 };
}