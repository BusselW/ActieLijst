/************************************************
 * Globale variabelen
 ************************************************/
let allData = [];
let selectedRowId = null; 
let currentSortField = 'Title';
let sortDirection = 'asc';

// Quill instanties
let quillProbleem = null;
let quillActies = null;
let quillBesluit = null;

/************************************************
 * Init zodra de DOM geladen is
 ************************************************/
document.addEventListener("DOMContentLoaded", function() {

    // Initialiseer Quill editors
quillProbleem = new Quill('#quillProbleem', {
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, false] }], // Headers
            ['bold', 'italic', 'underline', 'strike'], // Tekst opmaak
            [{ list: 'ordered' }, { list: 'bullet' }], // Lijsten
            ['link', 'image', 'video'], // Media invoegen
            ['clean'] // Alle opmaak verwijderen
        ]
    },
    theme: 'snow'
});




    console.log("Quill Probleem geïnitieerd:", quillProbleem);

    quillActies = new Quill('#quillActies', {
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, false] }], // Headers
            ['bold', 'italic', 'underline', 'strike'], // Tekst opmaak
            [{ list: 'ordered' }, { list: 'bullet' }], // Lijsten
            ['link', 'image', 'video'], // Media invoegen
            ['clean'] // Alle opmaak verwijderen
        ]
    },
    theme: 'snow'
});

    quillBesluit = new Quill('#quillBesluit', {
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, false] }], // Headers
            ['bold', 'italic', 'underline', 'strike'], // Tekst opmaak
            [{ list: 'ordered' }, { list: 'bullet' }], // Lijsten
            ['link', 'image', 'video'], // Media invoegen
            ['clean'] // Alle opmaak verwijderen
        ]
    },
    theme: 'snow'
});

    // 1) Fullscreen knop
    const fullscreenButton = document.getElementById("fullscreenButton");
    if (fullscreenButton) {
        fullscreenButton.addEventListener("click", toggleFullscreen);
    }

    // 2) Kolommen sorteerbaar
    document.querySelectorAll(".styled-table th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const field = th.dataset.sort;
            if (currentSortField === field) {
                sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
            } else {
                currentSortField = field;
                sortDirection = 'asc';
            }
            document.querySelectorAll(".styled-table th").forEach(x => x.classList.remove("sorted-asc", "sorted-desc"));
            th.classList.add(sortDirection === 'asc' ? "sorted-asc" : "sorted-desc");
            sortData(currentSortField, sortDirection);
        });
    });

    // 3) Rij in tabel aanklikken => bewerken/verwijderen mogelijk
    const tableBody = document.getElementById("table-body");
    tableBody.addEventListener("click", (evt) => {
        const row = evt.target.closest("tr");
        if (!row || row.id === "loading-row") return;
        [...tableBody.querySelectorAll("tr")].forEach(tr => tr.classList.remove("selected"));
        row.classList.add("selected");
        selectedRowId = row.dataset.id;

        // Activeer bewerken/verwijderen
        document.getElementById("editButton").disabled = false;
        document.getElementById("editButton").classList.remove("disabled");
        document.getElementById("editButton").classList.add("enabled");

        document.getElementById("deleteButton").disabled = false;
        document.getElementById("deleteButton").classList.remove("disabled");
        document.getElementById("deleteButton").classList.add("enabled");
    });

    // 4) Toevoegen
    document.getElementById("addButton").addEventListener("click", () => {
        document.getElementById("editId").value = "";
        openAddModal();
    });

    // 5) Bewerken
    document.getElementById("editButton").addEventListener("click", openEditModal);

    // 6) Verwijderen
    document.getElementById("deleteButton").addEventListener("click", () => {
        if (!selectedRowId) return;
        document.getElementById("deleteId").value = selectedRowId;
        openModal("deleteModal");
    });

    document.getElementById("confirmDeleteButton").addEventListener("click", handleDelete);

    // 7) Filter & zoeken
    document.getElementById("status-filter").addEventListener("change", (e) => {
        filterByStatus(e.target.value.toLowerCase());
    });
    document.getElementById("search-input").addEventListener("input", (e) => {
        filterBySearchTerm(e.target.value.toLowerCase());
    });

    // 8) People Picker (single) => Verantwoordelijke
    const ppSearch = document.getElementById("peoplePickerSearch");
    ppSearch.addEventListener("input", async (e) => {
        const query = e.target.value;
        if (!query || query.length < 2) {
            document.getElementById("peoplePickerResults").style.display = "none";
            return;
        }
        await showPeoplePickerSuggestions(query);
    });

    // 9) People Picker (multi) => Verzoeker
    const vsSearch = document.getElementById("verzoekerSearch");
    vsSearch.addEventListener("input", async (e) => {
        const query = e.target.value;
        if (!query || query.length < 2) {
            document.getElementById("verzoekerResults").style.display = "none";
            return;
        }
        await showVerzoekerPickerSuggestions(query);
    });

    // 10) Opslaan-knop
    document.getElementById("saveItemButton").addEventListener("click", () => saveItem());

    // Data inladen
    loadData();
});

/************************************************
 * People Picker SINGLE => Verantwoordelijke
 ************************************************/
async function showPeoplePickerSuggestions(query) {
    try {
        const suggestions = await searchPeoplePicker(query, false); // false => single
        renderPeoplePickerSuggestions(suggestions);
    } catch (err) {
        console.error("Fout bij PeoplePicker (single) search:", err);
        showNotification("Fout bij het zoeken van gebruikers.", "error");
    }
}

function renderPeoplePickerSuggestions(suggestions) {
    const container = document.getElementById("peoplePickerResults");
    container.innerHTML = "";
    if (!suggestions || !suggestions.length) {
        container.style.display = "none";
        return;
    }
    suggestions.forEach(sug => {
        const div = document.createElement("div");
        div.classList.add("people-picker-item");
        div.textContent = sug.DisplayText;
        div.addEventListener("click", () => {
            document.getElementById("selectedUserKey").value = sug.Key;
            document.getElementById("peoplePickerSearch").value = sug.DisplayText;
            container.style.display = "none";
        });
        container.appendChild(div);
    });
    container.style.display = "block";
}

/************************************************
 * People Picker MULTI => Verzoeker
 ************************************************/
async function showVerzoekerPickerSuggestions(query) {
    try {
        // We staan meervoudige selectie toe => AllowMultipleEntities: true
        const suggestions = await searchPeoplePicker(query, true);
        renderVerzoekerSuggestions(suggestions);
    } catch (err) {
        console.error("Fout bij PeoplePicker (multi) search:", err);
        showNotification("Fout bij het zoeken van gebruikers.", "error");
    }
}

function renderVerzoekerSuggestions(suggestions) {
    const container = document.getElementById("verzoekerResults");
    container.innerHTML = "";
    if (!suggestions || !suggestions.length) {
        container.style.display = "none";
        return;
    }
    suggestions.forEach(sug => {
        const div = document.createElement("div");
        div.classList.add("people-picker-item");
        div.textContent = sug.DisplayText;
        div.addEventListener("click", () => {
            // We hebben in #verzoekerKeys een array in JSON-vorm
            let currentVal = document.getElementById("verzoekerKeys").value;
            let arr = [];
            try {
                arr = JSON.parse(currentVal);
            } catch(e) {
                arr = [];
            }
            // Als key er nog niet in zit, toevoegen
            if (!arr.includes(sug.Key)) {
                arr.push(sug.Key);
            }
            document.getElementById("verzoekerKeys").value = JSON.stringify(arr);
            document.getElementById("verzoekerSearch").value = arr.length + " gebruiker(s) geselecteerd";
            container.style.display = "none";
        });
        container.appendChild(div);
    });
    container.style.display = "block";
}

/************************************************
 * searchPeoplePicker => fetch call
 ************************************************/
async function searchPeoplePicker(query, isMulti) {
    // Voor single = false => allowMultipleEntities = false
    // Voor multi = true => allowMultipleEntities = true
    const url = "https://som.org.om.local/sites/MulderT/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.ClientPeoplePickerSearchUser";
    const body = {
        queryParams: {
            __metadata: { type: "SP.UI.ApplicationPages.ClientPeoplePickerQueryParameters" },
            AllowEmailAddresses: true,
            AllowMultipleEntities: isMulti, // true of false
            AllUrlZones: false,
            MaximumEntitySuggestions: 5,
            PrincipalSource: 15,
            PrincipalType: 1,   // 1 = user
            QueryString: query
        }
    };

    const resp = await apiCallWithDigest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json;odata=verbose" },
        body: JSON.stringify(body)
    });
    const data = await resp.json();
    return JSON.parse(data.d.ClientPeoplePickerSearchUser);
}

/************************************************
 * Data ophalen en tabel renderen
 ************************************************/
async function loadData() {
    try {
        allData = await fetchItemsFromList();
        sortData("Created", "desc");
        filterByStatus("open");
    } catch (err) {
        console.error("Fout bij laden data:", err);
        showNotification("Fout bij het laden van data.", "error");
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = `<tr><td colspan="10">Fout bij het laden van data</td></tr>`;
    }
}

async function fetchItemsFromList() {
    // Let op: nieuwe velden in de $select => 'Besluit_x0020_c_x002e_q_x002e__x', 'Verzoeker', 'Prioriteit'
    // 'Verzoeker/Title' en 'Verzoeker/Id' als multi-person => we gebruiken .results
    const url = "https://som.org.om.local/sites/MulderT/Kwaliteitsteam/_api/web/" +
      "lists/getbytitle('Actielijst Kwaliteitsteam')/items?" +
      "$select=ID,Title,Probleemomschrijving,Acties,Besluit_x0020_c_x002e_q_x002e__x," +
      "Afdeling,Einddatum,Status,Created,Prioriteit," +
      "Verantwoordelijk/Title,Verantwoordelijk/Id," +
      "Verzoeker/Title,Verzoeker/Id" +
      "&$expand=Verantwoordelijk,Verzoeker";

    const resp = await apiCallWithDigest(url, { method: "GET" });
    const data = await resp.json();
    console.log("Ophalen data:", data.d.results);
    return data.d.results || [];
}

function renderTable(data) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";
    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10">Geen gegevens gevonden</td></tr>`;
        return;
    }
    data.forEach(item => {
        const tr = document.createElement("tr");
        tr.dataset.id = item.ID;

        // We laten voor Verzoeker (multi-person) de Title's joined zien
        let verzoekerTitles = "";
        if (item.Verzoeker && item.Verzoeker.results && item.Verzoeker.results.length > 0) {
            verzoekerTitles = item.Verzoeker.results.map(u => u.Title).join("; ");
        }

        tr.innerHTML = `
            <td>${escapeHTML(item.Title) || ""}</td>
            <td>${escapeHTML(item.Verantwoordelijk?.Title) || ""}</td>
            <td>${sanitizeHTML(item.Probleemomschrijving) || ""}</td>
            <td>${sanitizeHTML(item.Acties) || ""}</td>
            <td>${sanitizeHTML(item.Besluit_x0020_c_x002e_q_x002e__x) || ""}</td>
            <td>${escapeHTML(item.Afdeling) || ""}</td>
            <td>${escapeHTML(verzoekerTitles)}</td>
            <td>${escapeHTML(item.Prioriteit) || ""}</td>
            <td>${formatDate(item.Einddatum)}</td>
            <td>${escapeHTML(item.Status) || ""}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/************************************************
 * Filter, zoeken, sorteren
 ************************************************/
function filterByStatus(status) {
    let filtered;
    if (status === "all") {
        filtered = allData;
    } else {
        filtered = allData.filter(x => (x.Status || "").toLowerCase() === status);
    }
    renderTable(filtered);
}

function filterBySearchTerm(term) {
    const statusVal = document.getElementById("status-filter").value.toLowerCase();
    let list = allData;
    if (statusVal !== "all") {
        list = allData.filter(x => (x.Status || "").toLowerCase() === statusVal);
    }
    const filtered = list.filter(x => {
        // Vang multi-person Verzoeker op => x.Verzoeker.results
        let verzoekerTitles = "";
        if (x.Verzoeker && x.Verzoeker.results) {
            verzoekerTitles = x.Verzoeker.results.map(u => u.Title).join(" ");
        }
        return (
           (x.Title || "").toLowerCase().includes(term) ||
           (x.Verantwoordelijk?.Title || "").toLowerCase().includes(term) ||
           (x.Probleemomschrijving || "").toLowerCase().includes(term) ||
           (x.Acties || "").toLowerCase().includes(term) ||
           (x.Besluit_x0020_c_x002e_q_x002e__x || "").toLowerCase().includes(term) ||
           (x.Afdeling || "").toLowerCase().includes(term) ||
           verzoekerTitles.toLowerCase().includes(term) ||
           (x.Prioriteit || "").toLowerCase().includes(term)
        );
    });
    renderTable(filtered);
}

function sortData(field, direction) {
    allData.sort((a,b) => {
        let valA = a[field] || "";
        let valB = b[field] || "";
        if (field === "Created" || field === "Einddatum") {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
            return direction==="asc" ? (valA - valB) : (valB - valA);
        }
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
        if (valA < valB) return direction==="asc"? -1 : 1;
        if (valA > valB) return direction==="asc"? 1 : -1;
        return 0;
    });
    const statusVal = document.getElementById("status-filter").value.toLowerCase();
    if (statusVal === "all") {
        renderTable(allData);
    } else {
        filterByStatus(statusVal);
    }
}

/************************************************
 * Toevoegen
 ************************************************/
function openAddModal() {
    document.getElementById("modalTitle").innerText = "Nieuwe actie";
    document.getElementById("editId").value = "";

    document.getElementById("editTitle").value = "";
    document.getElementById("peoplePickerSearch").value = "";
    document.getElementById("selectedUserKey").value = "";

    document.getElementById("verzoekerSearch").value = "";
    document.getElementById("verzoekerKeys").value = "[]";

    document.getElementById("editAfdeling").value = "";
    document.getElementById("editPrioriteit").value = "Laag";
    document.getElementById("editEinddatum").value = "";
    document.getElementById("editStatus").value = "Open";

    quillProbleem.setContents([]);
    quillActies.setContents([]);
    quillBesluit.setContents([]);

    openModal("editModal");
}

/************************************************
 * Bewerken
 ************************************************/
async function openEditModal() {
    if (!selectedRowId) return;
    const item = allData.find(x => x.ID == selectedRowId);
    if (!item) return;

    document.getElementById("modalTitle").innerText = "Actie bewerken";
    document.getElementById("editId").value = item.ID;

    // Titel, Afdeling, Status, Prioriteit
    document.getElementById("editTitle").value = item.Title || "";
    document.getElementById("editAfdeling").value = item.Afdeling || "";
    document.getElementById("editStatus").value = item.Status || "Open";
    document.getElementById("editPrioriteit").value = item.Prioriteit || "Laag";

    // Einddatum => yyyy-mm-dd
    document.getElementById("editEinddatum").value = item.Einddatum
      ? new Date(item.Einddatum).toISOString().split("T")[0]
      : "";

    // Verantwoordelijke (single-person)
    document.getElementById("peoplePickerSearch").value = item.Verantwoordelijk?.Title || "";
    document.getElementById("selectedUserKey").value = "";

    // Verzoeker (multi-person)
    const aantalVerzoekers = item.Verzoeker?.results?.length || 0;
    document.getElementById("verzoekerSearch").value = `${aantalVerzoekers} gebruiker(s) al gekoppeld`;
    
    // Sla de verzoekerKeys op (indien mogelijk)
    // Helaas biedt de huidige API niet direct de userKey, dus dit kan niet direct hersteld worden
    // Gebruikers moeten opnieuw geselecteerd worden bij bewerken
    document.getElementById("verzoekerKeys").value = "[]"; 

    // Quill editors vullen met gesaniteerde HTML
    const probleemHtml = item.Probleemomschrijving || "<p><br></p>";
    const sanitizedProbleemHtml = sanitizeHTML(probleemHtml);
    console.log("Probleemomschrijving geladen (gesaniteerd):", sanitizedProbleemHtml);
    quillProbleem.clipboard.dangerouslyPasteHTML(sanitizedProbleemHtml);

    const actiesHtml = item.Acties || "<p><br></p>";
    const sanitizedActiesHtml = sanitizeHTML(actiesHtml);
    console.log("Acties geladen (gesaniteerd):", sanitizedActiesHtml);
    quillActies.clipboard.dangerouslyPasteHTML(sanitizedActiesHtml);

    const besluitHtml = item.Besluit_x0020_c_x002e_q_x002e__x || "<p><br></p>";
    const sanitizedBesluitHtml = sanitizeHTML(besluitHtml);
    console.log("Besluit geladen (gesaniteerd):", sanitizedBesluitHtml);
    quillBesluit.clipboard.dangerouslyPasteHTML(sanitizedBesluitHtml);

    openModal("editModal");
}
/************************************************
 * Save (Create / Update)
 ************************************************/
async function saveItem() {
    try {
        const id = document.getElementById("editId").value;
        const isNew = !id; // nieuw vs. bestaand

        // Datum
        const einddatumVal = document.getElementById("editEinddatum").value;
        const einddatum = einddatumVal ? einddatumVal : null;

        // People Picker (single)
        const userKey = document.getElementById("selectedUserKey").value;
        let verantwoordelijkeId = null;
        if (userKey) {
            verantwoordelijkeId = await resolveUserKey(userKey);
        }

        // People Picker (multi) => Verzoeker
        let verzoekerKeysArr = [];
        try {
            verzoekerKeysArr = JSON.parse(document.getElementById("verzoekerKeys").value);
        } catch(e) {
            verzoekerKeysArr = [];
        }
        let verzoekerIdArray = [];
        // Loop over elk key en haal userId op
        for (let k of verzoekerKeysArr) {
            const uid = await resolveUserKey(k); // ensureUser
            verzoekerIdArray.push(uid);
        }

        // Quill HTML
        const probleemHtml = quillProbleem.root.innerHTML;
        const actiesHtml   = quillActies.root.innerHTML;
        const besluitHtml  = quillBesluit.root.innerHTML;

        // Body
        const body = {
            __metadata: { type: "SP.Data.Actielijst_x0020_KwaliteitsteamListItem" },
            Title: document.getElementById("editTitle").value || "",
            Afdeling: document.getElementById("editAfdeling").value || "",
            Prioriteit: document.getElementById("editPrioriteit").value || "Laag",
            Einddatum: einddatum,
            Status: document.getElementById("editStatus").value || "Open",
            Probleemomschrijving: probleemHtml,
            Acties: actiesHtml,
            Besluit_x0020_c_x002e_q_x002e__x: besluitHtml
        };

        // Verantwoordelijke (single)
        if (verantwoordelijkeId != null) {
            body.VerantwoordelijkeId = verantwoordelijkeId;
        }

        // Verzoeker (multi-person)
        // Meervoudige persons => array van IDs
        if (verzoekerIdArray.length > 0) {
            body.VerzoekerId = { results: verzoekerIdArray };
        }

        if (isNew) {
            await createItem(body);
            showNotification("Item succesvol toegevoegd.", "success");
        } else {
            await updateItem(id, body);
            showNotification("Item succesvol bijgewerkt.", "success");
        }

        closeModal("editModal");
        await loadData();
    } catch (err) {
        console.error("Fout bij opslaan item:", err);
        showNotification("Fout bij opslaan van item.", "error");
    }
}

async function createItem(body) {
    const url = "https://som.org.om.local/sites/MulderT/Kwaliteitsteam/_api/web/lists/getbytitle('Actielijst Kwaliteitsteam')/items";
    await apiCallWithDigest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json;odata=verbose" },
        body: JSON.stringify(body)
    });
}

async function updateItem(itemId, body) {
    const url = `https://som.org.om.local/sites/MulderT/Kwaliteitsteam/_api/web/lists/getbytitle('Actielijst Kwaliteitsteam')/items(${itemId})`;
    await apiCallWithDigest(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;odata=verbose",
            "X-HTTP-Method": "MERGE",
            "If-Match": "*"
        },
        body: JSON.stringify(body)
    });
}

/************************************************
 * Delete
 ************************************************/
async function handleDelete() {
    try {
        const id = document.getElementById("deleteId").value;
        if (!id) return;
        const url = `https://som.org.om.local/sites/MulderT/Kwaliteitsteam/_api/web/lists/getbytitle('Actielijst Kwaliteitsteam')/items(${id})`;
        await apiCallWithDigest(url, {
            method: "POST",
            headers: {
                "X-HTTP-Method": "DELETE",
                "If-Match": "*"
            }
        });
        showNotification("Item succesvol verwijderd.", "success");
        closeModal('deleteModal');
        await loadData();
    } catch (err) {
        console.error("Fout bij verwijderen:", err);
        showNotification("Fout bij verwijderen van item.", "error");
    }
}

/************************************************
 * PeoplePicker ensureUser
 ************************************************/
async function resolveUserKey(userKey) {
    // userKey = "i:0#.f|membership|some@domain.local"
    const url = "https://som.org.om.local/sites/MulderT/_api/web/ensureuser";
    const body = { 'logonName': userKey };
    const resp = await apiCallWithDigest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json;odata=verbose" },
        body: JSON.stringify(body)
    });
    const data = await resp.json();
    return data.d.Id; 
}

/************************************************
 * Hulpfuncties
 ************************************************/
function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = "flex";
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = "none";
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen().catch(err => console.error(err));
    }
}

/************************************************
 * Meldingen tonen
 ************************************************/
function showNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.className = "notification"; // Reset classes
    if (type === "error") {
        notification.classList.add("error");
    } else if (type === "success") {
        notification.classList.add("success");
    }
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 5000); // Verberg na 5 seconden
}

/************************************************
 * Sanitize HTML voor tabel weergave
 ************************************************/
function sanitizeHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Verwijder alle 'ExternalClass...' divs
    const externalDivs = tempDiv.querySelectorAll('div[class^="ExternalClass"]');
    externalDivs.forEach(div => {
        div.replaceWith(...div.childNodes);
    });
    return tempDiv.innerHTML;
}


/************************************************
 * Escape HTML om XSS te voorkomen in tabel
 ************************************************/
function escapeHTML(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
