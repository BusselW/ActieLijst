<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>Afsprakenlijst Appel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232874A6'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E">

    <!-- Quill CSS -->
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
        
    <!-- Onze Stylesheet -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- jQuery (optioneel, voor gemak) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Quill JS -->
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>

    <!-- PostCall.js: bevat apiCallWithDigest() -->
    <script src="PostCall.js"></script>

    <!-- Onze scripts -->
    <script src="scripts.js"></script>
    
    <!-- Tour guide -->
    <script src="tour.js"></script>
</head>
<body>
    <h1>
        Afsprakenlijst Appel
        <a href="https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel/Lists/Afsprakenlijst/AllItems.aspx"
           target="_blank"
           title="Open lijst in een nieuwe pagina"
           style="margin-left: 10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="#2874A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 3h6v6" stroke="#2874A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 14L21 3" stroke="#2874A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </a>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="help-icon" data-tooltip="Sneltoetsen:&#10;• Dubbelklik op een rij om te bewerken&#10;• Enter: Open geselecteerde afspraak&#10;• Delete: Verwijder geselecteerde afspraak&#10;• Esc: Sluit vensters" style="cursor: pointer; margin-left: 10px;">
            <circle cx="12" cy="12" r="10" stroke="#2874A6" stroke-width="2" fill="none"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#2874A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="17" r="0.5" fill="#2874A6" stroke="#2874A6" stroke-width="1.5"/>
        </svg>
    </h1>
    <div class="tooltip" id="tooltip-info"></div>

    <!-- Meldingen -->
    <div id="notification" class="notification"></div>

    <div class="action-bar">
        <div class="action-buttons">
            <button type="button" class="action-button" id="fullscreenButton">Volledig scherm</button>
            <button type="button" class="action-button" id="addButton">Toevoegen</button>
            <button type="button" class="action-button disabled" id="editButton" disabled>Bewerken</button>
            <button type="button" class="action-button disabled" id="deleteButton" disabled>Verwijderen</button>
        </div>

        <div class="filter-dropdown">
            <label for="category-filter">Categorie:</label>
            <select id="category-filter">
                <option value="all" selected>Alles</option>
                <option value="algemeen">Algemeen</option>
                <option value="juridisch">Juridisch</option>
            </select>
        </div>
        <div class="search-bar">
            <input type="text" id="search-input" class="search-input" placeholder="Zoek...">
        </div>
    </div>

    <div class="table-container">
        <table class="styled-table">
            <thead>
                <tr>
                    <th data-sort="ID" class="sortable" style="width: 50px;">ID</th>
                    <th data-sort="Title" class="sortable">Titel</th>
                    <th data-sort="Categorie" class="sortable">Categorie</th>
                    <th data-sort="Uitleg" class="sortable">Uitleg</th>
                    <th style="width: 50px; text-align: center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    </th>
                    <th data-sort="Created" class="sortable">Aangemaakt</th>
                </tr>
            </thead>
            <tbody id="table-body">
                <tr id="loading-row" data-state="loading">
                    <td colspan="6">Gegevens laden...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Toevoegen/Bewerken Modal -->
    <div class="modal" id="editModal">
        <div class="modal-content modal-content-large">
            <h2 id="modalTitle">Nieuwe afspraak</h2>
            <!-- Verborgen input om te zien of we iets aan het bewerken zijn -->
            <input type="hidden" id="editId">

            <!-- Titel -->
            <label for="editTitle">
                Titel <span class="required-asterisk">*</span>
                <span class="char-counter" id="titleCharCounter">0/100</span>
            </label>
            <input type="text" id="editTitle" required maxlength="100">
            <div class="validation-message" id="titleValidation"></div>

            <!-- Categorie (keuze) -->
            <label for="editCategorie">Categorie</label>
            <select id="editCategorie">
                <option value="Algemeen">Algemeen</option>
                <option value="Juridisch">Juridisch</option>
            </select>

            <!-- Quill: Uitleg -->
            <div class="editor-controls">
                <div style="display:flex; align-items:center; gap:8px;">
                    <label for="quillUitleg" style="margin:0;">Uitleg</label>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="help-icon" data-tooltip="Editor Sneltoetsen:&#10;• Ctrl+B: Vetgedrukt&#10;• Ctrl+I: Cursief&#10;• Ctrl+U: Onderstrepen&#10;• Enter: Nieuwe regel&#10;• Shift+Enter: Nieuwe alinea" style="cursor: pointer;">
                        <circle cx="12" cy="12" r="10" stroke="#999" stroke-width="2" fill="none"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="17" r="0.5" fill="#999" stroke="#999" stroke-width="1.5"/>
                    </svg>
                </div>
                <div class="editor-buttons">
                    <button type="button" class="btn-icon" id="togglePreview" title="Voorbeeld weergave">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon" id="clearFormatting" title="Opmaak verwijderen">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
                            <line x1="11" y1="11" x2="20" y2="20"></line>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon" id="smartPaste" title="Plakken (behoud opmaak)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="quillToolbar" class="quill-toolbar">
                <button class="ql-bold"></button>
                <button class="ql-italic"></button>
                <button class="ql-underline"></button>
                <button class="ql-strike"></button>
                <select class="ql-header">
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                    <option selected>Normal</option>
                </select>
                <button class="ql-list" value="ordered"></button>
                <button class="ql-list" value="bullet"></button>
                <button class="ql-link"></button>
                <button class="ql-clean"></button>
            </div>
            <div id="quillUitleg" class="quill-editor-resizable" style="height: 500px;"></div>
            <div class="resize-handle" id="editorResizeHandle"></div>
            
            <!-- Attachments Section -->
            <div class="attachments-section">
                <label>Bijlagen</label>
                
                <div id="attachmentWarning" class="validation-warning" style="display:none; margin-bottom:10px;">
                    Sla de afspraak eerst op om bijlagen toe te voegen.
                </div>

                <div id="attachmentContainer" style="display:none;">
                    <div id="dropZone" class="drop-zone">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2874A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p>Sleep bestanden hierheen of <span class="browse-link">klik om te bladeren</span></p>
                        <input type="file" id="fileInput" style="display:none" multiple>
                    </div>
                    <ul id="attachmentList" class="attachment-list"></ul>
                </div>
            </div>

            <!-- Preview area -->
            <div id="previewArea" class="preview-area" style="display:none;">
                <h4>Voorbeeld:</h4>
                <div id="previewContent" class="preview-content"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-top:1rem;">
                <div class="unsaved-indicator" id="unsavedIndicator" style="display:none;">
                    <span class="unsaved-dot">●</span> Niet opgeslagen wijzigingen
                </div>
                <div style="display:flex; gap:1rem; margin-left:auto;">
                    <button type="button" class="action-button" id="saveItemButton">Opslaan</button>
                    <button type="button" class="action-button" id="cancelButton">Annuleren</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Verwijderen Modal -->
    <div class="modal" id="deleteModal">
        <div class="modal-content">
            <h2>Verwijder afspraak</h2>
            <p>Weet je zeker dat je deze afspraak wilt verwijderen?</p>
            <input type="hidden" id="deleteId">
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top:10px;">
                <button type="button" class="action-button" id="confirmDeleteButton">Verwijderen</button>
                <button type="button" class="action-button" onclick="closeModal('deleteModal')">Annuleren</button>
            </div>
        </div>
    </div>

</body>
</html>
