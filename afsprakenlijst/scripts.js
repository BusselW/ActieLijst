/************************************************
 * Globale variabelen
 ************************************************/
let allData = [];
let selectedRowId = null; 
let currentSortField = 'Created';
let sortDirection = 'desc';

// Quill instantie
let quillUitleg = null;

// Auto-save and form state
let autoSaveTimer = null;
let formHasChanges = false;
let initialFormState = null;
let lastUsedCategory = localStorage.getItem('lastUsedCategory') || 'Algemeen';

// API configuratie
const LIST_GUID = '8d274240-f1a0-4018-a1f8-741c95a63041';
const SITE_URL = 'https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel';

/************************************************
 * Init zodra de DOM geladen is
 ************************************************/
document.addEventListener("DOMContentLoaded", function() {

    // Initialiseer Quill editor
    quillUitleg = new Quill('#quillUitleg', {
        modules: {
            toolbar: '#quillToolbar',
            keyboard: {
                bindings: {
                    // Enter voor line break, Shift+Enter voor nieuwe paragraaf
                    linebreak: {
                        key: 13,
                        handler: function(range, context) {
                            if (context.event.shiftKey) {
                                // Shift+Enter: nieuwe paragraaf (default behavior)
                                return true;
                            } else {
                                // Enter: single line break
                                this.quill.insertText(range.index, '\n');
                                this.quill.setSelection(range.index + 1);
                                return false;
                            }
                        }
                    }
                }
            }
        },
        theme: 'snow'
    });

    console.log("Quill Uitleg geïnitieerd:", quillUitleg);

    // Track Quill changes for auto-save and unsaved indicator
    quillUitleg.on('text-change', () => {
        trackFormChanges();
        resetAutoSaveTimer();
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

    // 3b) Dubbelklik op rij => direct bewerken
    tableBody.addEventListener("dblclick", (evt) => {
        const row = evt.target.closest("tr");
        if (!row || row.id === "loading-row") return;
        selectedRowId = row.dataset.id;
        openEditModal();
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
    document.getElementById("category-filter").addEventListener("change", (e) => {
        filterByCategory(e.target.value.toLowerCase());
    });
    document.getElementById("search-input").addEventListener("input", (e) => {
        filterBySearchTerm(e.target.value.toLowerCase());
    });

    // 8) Opslaan-knop
    document.getElementById("saveItemButton").addEventListener("click", () => saveItem());

    // 9) Toetsenbord sneltoetsen
    document.addEventListener("keydown", (e) => {
        // ESC om modals te sluiten
        if (e.key === "Escape") {
            closeModal("editModal");
            closeModal("deleteModal");
        }
        
        // Als er geen modal open is en een rij geselecteerd is
        const editModalOpen = document.getElementById("editModal").style.display === "flex";
        const deleteModalOpen = document.getElementById("deleteModal").style.display === "flex";
        
        if (!editModalOpen && !deleteModalOpen && selectedRowId) {
            if (e.key === "Enter") {
                e.preventDefault();
                openEditModal();
            } else if (e.key === "Delete") {
                e.preventDefault();
                document.getElementById("deleteId").value = selectedRowId;
                openModal("deleteModal");
            }
        }
    });

    // 10) Klik buiten modal om te sluiten
    document.getElementById("editModal").addEventListener("click", (e) => {
        if (e.target.id === "editModal") {
            if (formHasChanges) {
                if (confirm("Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt sluiten?")) {
                    closeModal("editModal");
                }
            } else {
                closeModal("editModal");
            }
        }
    });
    document.getElementById("deleteModal").addEventListener("click", (e) => {
        if (e.target.id === "deleteModal") {
            closeModal("deleteModal");
        }
    });

    // 11) Real-time validation voor Titel
    document.getElementById("editTitle").addEventListener("input", (e) => {
        updateCharCounter();
        validateTitle();
        trackFormChanges();
    });

    // 12) Track changes op alle form fields
    document.getElementById("editCategorie").addEventListener("change", trackFormChanges);
    
    // 13) Quill text change
    // Will be set up after Quill initialization

    // 14) Cancel button with unsaved check
    const cancelButton = document.getElementById("cancelButton");
    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            console.log("Cancel clicked. Form has changes:", formHasChanges);
            if (formHasChanges) {
                if (confirm("Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt annuleren?")) {
                    if (typeof clearDraft === 'function') clearDraft();
                    closeModal("editModal");
                }
            } else {
                if (typeof clearDraft === 'function') clearDraft();
                closeModal("editModal");
            }
        });
    }

    // 15) Preview toggle
    const togglePreviewBtn = document.getElementById("togglePreview");
    if (togglePreviewBtn) {
        togglePreviewBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePreview();
        });
    }

    // 16) Clear formatting
    const clearFormattingBtn = document.getElementById("clearFormatting");
    if (clearFormattingBtn) {
        clearFormattingBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selection = quillUitleg.getSelection();
            if (selection && selection.length > 0) {
                quillUitleg.removeFormat(selection.index, selection.length);
                showNotification("Opmaak verwijderd", "success");
            } else {
                showNotification("Selecteer eerst tekst om opmaak te verwijderen", "error");
            }
        });
    }

    // 17) Strip paste formatting (plain text paste)
    const stripPasteBtn = document.getElementById("stripPasteFormatting");
    if (stripPasteBtn) {
        stripPasteBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const text = await navigator.clipboard.readText();
                const selection = quillUitleg.getSelection() || { index: 0 };
                quillUitleg.insertText(selection.index, text);
                showNotification("Tekst geplakt zonder opmaak", "success");
            } catch (err) {
                showNotification("Kon niet plakken. Gebruik Ctrl+V.", "error");
            }
        });
    }

    // 18) Editor resize handle
    initEditorResize();

    // Data inladen
    loadData();
});

/************************************************
 * Data ophalen en tabel renderen
 ************************************************/
async function loadData() {
    try {
        allData = await fetchItemsFromList();
        sortData(currentSortField, sortDirection);
        filterByCategory("all");
    } catch (err) {
        console.error("Fout bij laden data:", err);
        showNotification("Fout bij het laden van data.", "error");
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = `<tr><td colspan="4">Fout bij het laden van data</td></tr>`;
    }
}

async function fetchItemsFromList() {
    const url = `${SITE_URL}/_api/web/lists(guid'${LIST_GUID}')/items?` +
      "$select=ID,Title,Categorie,Uitleg,Created&$orderby=Created desc";

    const resp = await apiCallWithDigest(url, { method: "GET" });
    const data = await resp.json();
    console.log("Ophalen data:", data.d.results);
    return data.d.results || [];
}

function renderTable(data) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";
    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">Geen gegevens gevonden</td></tr>`;
        return;
    }
    data.forEach(item => {
        const tr = document.createElement("tr");
        tr.dataset.id = item.ID;

        const titleCell = document.createElement("td");
        titleCell.textContent = item.Title || "";
        
        const categorieCell = document.createElement("td");
        categorieCell.textContent = item.Categorie || "Algemeen";
        
        const uitlegCell = document.createElement("td");
        uitlegCell.innerHTML = sanitizeAndFormatHTML(item.Uitleg || "");
        
        const createdCell = document.createElement("td");
        createdCell.textContent = formatDateTime(item.Created);
        
        tr.appendChild(titleCell);
        tr.appendChild(categorieCell);
        tr.appendChild(uitlegCell);
        tr.appendChild(createdCell);
        
        tableBody.appendChild(tr);
    });
}

/************************************************
 * Filter, zoeken, sorteren
 ************************************************/
function filterByCategory(category) {
    let filtered;
    if (category === "all") {
        filtered = allData;
    } else {
        filtered = allData.filter(x => (x.Categorie || "algemeen").toLowerCase() === category);
    }
    renderTable(filtered);
}

function filterBySearchTerm(term) {
    const categoryVal = document.getElementById("category-filter").value.toLowerCase();
    let list = allData;
    if (categoryVal !== "all") {
        list = allData.filter(x => (x.Categorie || "algemeen").toLowerCase() === categoryVal);
    }
    const filtered = list.filter(x => {
        return (
           (x.Title || "").toLowerCase().includes(term) ||
           (x.Categorie || "").toLowerCase().includes(term) ||
           (x.Uitleg || "").toLowerCase().includes(term)
        );
    });
    renderTable(filtered);
}

function sortData(field, direction) {
    allData.sort((a,b) => {
        let valA = a[field] || "";
        let valB = b[field] || "";
        if (field === "Created") {
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
    const categoryVal = document.getElementById("category-filter").value.toLowerCase();
    if (categoryVal === "all") {
        renderTable(allData);
    } else {
        filterByCategory(categoryVal);
    }
}

/************************************************
 * Toevoegen
 ************************************************/
function openAddModal() {
    document.getElementById("modalTitle").innerText = "Nieuwe afspraak";
    document.getElementById("editId").value = "";

    // Check for draft
    const hasDraft = loadDraft();
    
    if (!hasDraft) {
        document.getElementById("editTitle").value = "";
        document.getElementById("editCategorie").value = lastUsedCategory;
        quillUitleg.setContents([]);
    }

    updateCharCounter();
    document.getElementById("titleValidation").style.display = "none";
    document.getElementById("editTitle").classList.remove("input-error");
    
    openModal("editModal");
    setInitialFormState();
    setTimeout(() => document.getElementById("editTitle").focus(), 100);
}

/************************************************
 * Bewerken
 ************************************************/
async function openEditModal() {
    if (!selectedRowId) return;
    const item = allData.find(x => x.ID == selectedRowId);
    if (!item) return;

    document.getElementById("modalTitle").innerText = "Afspraak bewerken";
    document.getElementById("editId").value = item.ID;

    // Titel, Categorie
    document.getElementById("editTitle").value = item.Title || "";
    document.getElementById("editCategorie").value = item.Categorie || "Algemeen";

    // Quill editor vullen met gesaniteerde HTML
    const uitlegHtml = item.Uitleg || "<p><br></p>";
    const sanitizedUitlegHtml = sanitizeHTML(uitlegHtml);
    console.log("Uitleg geladen (gesaniteerd):", sanitizedUitlegHtml);
    quillUitleg.clipboard.dangerouslyPasteHTML(sanitizedUitlegHtml);

    updateCharCounter();
    document.getElementById("titleValidation").style.display = "none";
    document.getElementById("editTitle").classList.remove("input-error");

    openModal("editModal");
    setInitialFormState();
    setTimeout(() => document.getElementById("editTitle").focus(), 100);
}

/************************************************
 * Save (Create / Update)
 ************************************************/
async function saveItem() {
    // Validate first
    if (!validateTitle()) {
        showNotification("Titel is verplicht.", "error");
        return;
    }

    // Show saving state
    const saveButton = document.getElementById("saveItemButton");
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner"></span> Opslaan...';

    try {
        const id = document.getElementById("editId").value;
        const isNew = !id;

        const title = document.getElementById("editTitle").value.trim();
        const categorie = document.getElementById("editCategorie").value || "Algemeen";

        // Remember last used category
        lastUsedCategory = categorie;
        localStorage.setItem('lastUsedCategory', categorie);

        // Quill HTML
        const uitlegHtml = quillUitleg.root.innerHTML;

        // Body
        const body = {
            __metadata: { type: "SP.Data.AfsprakenlijstListItem" },
            Title: title,
            Categorie: categorie,
            Uitleg: uitlegHtml
        };

        if (isNew) {
            await createItem(body);
            showSuccessAnimation();
            showNotification("✓ Afspraak succesvol toegevoegd.", "success");
        } else {
            await updateItem(id, body);
            showSuccessAnimation();
            showNotification("✓ Afspraak succesvol bijgewerkt.", "success");
        }

        clearDraft();
        closeModal("editModal");
        await loadData();
    } catch (err) {
        console.error("Fout bij opslaan item:", err);
        const errorMsg = err.message || "Onbekende fout";
        showNotification(`Fout bij opslaan: ${errorMsg}`, "error");
    } finally {
        // Restore button state
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

async function createItem(body) {
    const url = `${SITE_URL}/_api/web/lists(guid'${LIST_GUID}')/items`;
    await apiCallWithDigest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json;odata=verbose" },
        body: JSON.stringify(body)
    });
}

async function updateItem(itemId, body) {
    const url = `${SITE_URL}/_api/web/lists(guid'${LIST_GUID}')/items(${itemId})`;
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
        const url = `${SITE_URL}/_api/web/lists(guid'${LIST_GUID}')/items(${id})`;
        await apiCallWithDigest(url, {
            method: "POST",
            headers: {
                "X-HTTP-Method": "DELETE",
                "If-Match": "*"
            }
        });
        showNotification("Afspraak succesvol verwijderd.", "success");
        closeModal('deleteModal');
        await loadData();
    } catch (err) {
        console.error("Fout bij verwijderen:", err);
        showNotification("Fout bij verwijderen van afspraak.", "error");
    }
}

/************************************************
 * Hulpfuncties
 ************************************************/
function formatDateTime(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('nl-NL') + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = "flex";
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) {
        m.style.display = "none";
        // Clear auto-save timer and draft when closing
        if (id === "editModal") {
            clearAutoSaveTimer();
            formHasChanges = false;
            document.getElementById("unsavedIndicator").style.display = "none";
        }
    }
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
    }, 5000);
}

function showSuccessAnimation() {
    const saveButton = document.getElementById("saveItemButton");
    saveButton.innerHTML = '✓ Opgeslagen!';
    saveButton.classList.add("success-flash");
    setTimeout(() => {
        saveButton.classList.remove("success-flash");
    }, 1000);
}

/************************************************
 * Sanitize HTML voor editor (removes external classes)
 ************************************************/
function sanitizeHTML(html) {
    if (!html) return "";
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
 * Sanitize and format HTML voor tabel weergave
 * Renders HTML properly (bold, italic, etc.) and handles line breaks
 ************************************************/
function sanitizeAndFormatHTML(html) {
    if (!html) return "";
    
    // Eerst VbCrLf en andere line breaks converteren naar <br>
    let formatted = html
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>')
        .replace(/\r/g, '<br>');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formatted;
    
    // Verwijder alle 'ExternalClass...' divs maar behoud content
    const externalDivs = tempDiv.querySelectorAll('div[class^="ExternalClass"]');
    externalDivs.forEach(div => {
        div.replaceWith(...div.childNodes);
    });
    
    // Verwijder potentieel gevaarlijke tags maar behoud formatting tags
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'span'];
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
            // Vervang niet-toegestane tags met hun content
            el.replaceWith(...el.childNodes);
        }
    });
    
    // Verwijder script tags en event handlers
    tempDiv.querySelectorAll('script').forEach(el => el.remove());
    tempDiv.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
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

/************************************************
 * Real-time validation
 ************************************************/
function validateTitle() {
    const titleInput = document.getElementById("editTitle");
    const validation = document.getElementById("titleValidation");
    const value = titleInput.value.trim();

    if (value === "") {
        titleInput.classList.add("input-error");
        validation.textContent = "Titel is verplicht";
        validation.style.display = "block";
        return false;
    } else {
        titleInput.classList.remove("input-error");
        validation.style.display = "none";
        
        // Check for duplicate
        checkDuplicateTitle(value);
        return true;
    }
}

function checkDuplicateTitle(title) {
    const validation = document.getElementById("titleValidation");
    const editId = document.getElementById("editId").value;
    
    const duplicate = allData.find(item => 
        item.Title.toLowerCase() === title.toLowerCase() && 
        item.ID != editId
    );
    
    if (duplicate) {
        validation.textContent = "⚠️ Een afspraak met deze titel bestaat al";
        validation.className = "validation-message validation-warning";
        validation.style.display = "block";
    }
}

function updateCharCounter() {
    const titleInput = document.getElementById("editTitle");
    const counter = document.getElementById("titleCharCounter");
    const length = titleInput.value.length;
    const max = titleInput.maxLength;
    
    counter.textContent = `${length}/${max}`;
    
    if (length > max * 0.9) {
        counter.classList.add("char-counter-warning");
    } else {
        counter.classList.remove("char-counter-warning");
    }
}

/************************************************
 * Track form changes and unsaved indicator
 ************************************************/
function trackFormChanges() {
    if (!initialFormState) return;
    
    const currentState = getCurrentFormState();
    formHasChanges = JSON.stringify(initialFormState) !== JSON.stringify(currentState);
    
    const indicator = document.getElementById("unsavedIndicator");
    const saveButton = document.getElementById("saveItemButton");
    
    if (formHasChanges) {
        indicator.style.display = "flex";
        saveButton.classList.add("button-highlight");
    } else {
        indicator.style.display = "none";
        saveButton.classList.remove("button-highlight");
    }
}

function getCurrentFormState() {
    return {
        title: document.getElementById("editTitle").value,
        categorie: document.getElementById("editCategorie").value,
        uitleg: quillUitleg.root.innerHTML
    };
}

function setInitialFormState() {
    initialFormState = getCurrentFormState();
    formHasChanges = false;
    document.getElementById("unsavedIndicator").style.display = "none";
    document.getElementById("saveItemButton").classList.remove("button-highlight");
}

/************************************************
 * Auto-save draft to localStorage
 ************************************************/
function resetAutoSaveTimer() {
    clearAutoSaveTimer();
    autoSaveTimer = setTimeout(saveDraft, 3000); // Auto-save after 3 seconds
}

function clearAutoSaveTimer() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
}

function saveDraft() {
    const draft = getCurrentFormState();
    draft.id = document.getElementById("editId").value;
    localStorage.setItem('afsprakenlijst_draft', JSON.stringify(draft));
    console.log("Draft auto-saved");
}

function loadDraft() {
    const draftStr = localStorage.getItem('afsprakenlijst_draft');
    if (!draftStr) return false;
    
    try {
        const draft = JSON.parse(draftStr);
        if (confirm("Er is een niet-opgeslagen concept gevonden. Wil je deze herstellen?")) {
            document.getElementById("editTitle").value = draft.title || "";
            document.getElementById("editCategorie").value = draft.categorie || "Algemeen";
            quillUitleg.clipboard.dangerouslyPasteHTML(draft.uitleg || "");
            updateCharCounter();
            return true;
        }
    } catch (e) {
        console.error("Error loading draft:", e);
    }
    return false;
}

function clearDraft() {
    localStorage.removeItem('afsprakenlijst_draft');
}

/************************************************
 * Preview toggle
 ************************************************/
function togglePreview() {
    const previewArea = document.getElementById("previewArea");
    const previewContent = document.getElementById("previewContent");
    const quillEditor = document.getElementById("quillUitleg");
    const quillToolbar = document.getElementById("quillToolbar");
    const resizeHandle = document.getElementById("editorResizeHandle");
    
    if (previewArea.style.display === "none") {
        // Show preview
        previewContent.innerHTML = sanitizeAndFormatHTML(quillUitleg.root.innerHTML);
        previewArea.style.display = "block";
        quillEditor.style.display = "none";
        if (quillToolbar) quillToolbar.style.display = "none";
        if (resizeHandle) resizeHandle.style.display = "none";
        document.getElementById("togglePreview").classList.add("active");
    } else {
        // Hide preview
        previewArea.style.display = "none";
        quillEditor.style.display = "block";
        if (quillToolbar) quillToolbar.style.display = "block";
        if (resizeHandle) resizeHandle.style.display = "block";
        document.getElementById("togglePreview").classList.remove("active");
    }
}

/************************************************
 * Editor resize functionality
 ************************************************/
function initEditorResize() {
    const handle = document.getElementById("editorResizeHandle");
    const editor = document.getElementById("quillUitleg");
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    handle.addEventListener("mousedown", (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = editor.offsetHeight;
        document.body.style.cursor = "ns-resize";
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;
        const delta = e.clientY - startY;
        const newHeight = Math.max(150, Math.min(600, startHeight + delta));
        editor.style.height = newHeight + "px";
    });

    document.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = "default";
        }
    });
}

