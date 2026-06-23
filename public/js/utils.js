function escapeHtml(s) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(s).replace(/[&<>"']/g, m => map[m]);
}

function getCityName(id) {
    return window.cities.find(c => c.id === id)?.name || id;
}

function clearSearch(type) {
    if (type === 'items') {
        document.getElementById('searchItems').value = '';
        window.itemsSearch = '';
        renderItemList();
    } else if (type === 'lots') {
        document.getElementById('searchLots').value = '';
        window.lotsSearch = '';
        renderLotList();
    } else if (type === 'resources') {
        document.getElementById('searchResources').value = '';
        window.resourcesSearch = '';
        renderResourcesPage();
    }
}

function changeItemSort() {
    window.itemSort = document.getElementById('sortItems').value;
    renderItemList();
}

function changeLotSort() {
    window.lotSort = document.getElementById('sortLots').value;
    renderLotList();
}