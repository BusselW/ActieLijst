/************************************************
 * Widget Logic
 * Fetches latest items for the small widget view
 ************************************************/

const LIST_GUID = '8d274240-f1a0-4018-a1f8-741c95a63041';
const SITE_URL = 'https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel';

document.addEventListener("DOMContentLoaded", function() {
    loadWidgetData();
});

async function loadWidgetData() {
    const listContainer = document.getElementById("widgetList");
    
    try {
        // Fetch top 5 items, sorted by Created descending
        const url = `${SITE_URL}/_api/web/lists(guid'${LIST_GUID}')/items?` +
            "$select=ID,Title,Created,Categorie&$orderby=Created desc&$top=5";

        const resp = await apiCallWithDigest(url, { method: "GET" });
        const data = await resp.json();
        const items = data.d.results || [];

        listContainer.innerHTML = "";
        
        if (items.length === 0) {
            listContainer.innerHTML = `
                <li style="padding:20px; text-align:center; color:#888; font-style:italic;">
                    Geen afspraken gevonden.
                </li>`;
            return;
        }

        items.forEach(item => {
            const li = document.createElement("li");
            li.className = "widget-item";
            
            const date = new Date(item.Created);
            const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            // Determine icon based on category (optional visual flair)
            let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
            
            if ((item.Categorie || "").toLowerCase() === "juridisch") {
                iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`;
            }

            li.innerHTML = `
                <div class="widget-icon">
                    ${iconSvg}
                </div>
                <div class="widget-content">
                    <span class="widget-item-title" title="${item.Title}">${item.Title}</span>
                    <span class="widget-item-meta">${item.Categorie || 'Algemeen'} • ${dateStr}</span>
                </div>
            `;
            
            // Make the whole item clickable to open the full list (optional, but nice UX)
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                window.open("index.aspx", "_blank");
            });

            listContainer.appendChild(li);
        });

    } catch (err) {
        console.error("Widget error:", err);
        listContainer.innerHTML = `
            <li style="padding:10px; color:#E74C3C; text-align:center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:5px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <br>Fout bij laden gegevens.
            </li>`;
    }
}
