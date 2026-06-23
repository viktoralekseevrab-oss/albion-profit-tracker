// Экспорт — скачивание JSON
function exportData() {
    const data = {
        cities: window.cities,
        resourceDefinitions: window.resourceDefinitions,
        cityResources: window.cityResources,
        items: window.items,
        lots: window.lots,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'albion-profit-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Импорт — загрузка JSON на сервер
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.items || !data.cityResources || !data.lots) {
                return alert('Неверный формат файла. Нужны items, lots, cityResources.');
            }
            // Отправляем на сервер
            await apiFetch('/import', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            // Обновляем локально
            window.items = data.items;
            window.lots = data.lots;
            window.cityResources = data.cityResources;
            alert('Импорт успешно выполнен!');
            renderAll();
        } catch (err) {
            console.error(err);
            alert('Ошибка импорта: ' + err.message);
        }
    };
    input.click();
}