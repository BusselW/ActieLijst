<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>Actielijst Kwaliteitsteam</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Quill CSS -->
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
        
    <!-- Onze Stylesheet -->
    <link rel="stylesheet" href="https://som.org.om.local/sites/MulderT/Kwaliteitsteam/SitePages/CPW/ActieLijst/Styles.css">
    
    <!-- jQuery (optioneel, voor gemak) -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/jquery3.6.0.js"></script>
    
    <!-- Quill JS -->
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>

    <!-- PostCall.js: bevat apiCallWithDigest() -->
    <script src="https://som.org.om.local/sites/MulderT/Kwaliteitsteam/SitePages/CPW/ActieLijst/PostCall.js"></script>

    <!-- Onze scripts -->
    <script src="https://som.org.om.local/sites/MulderT/Kwaliteitsteam/SitePages/CPW/ActieLijst/scripts.js"></script>
</head>
<body>
     <h1>
        Actielijst Kwaliteitsteam
        <a href="https://som.org.om.local/sites/MulderT/Kwaliteitsteam/Lists/Actielijst%20Kwaliteitsteam/Standaard%20weergave.aspx"
           target="_blank"
           title="Open lijst in een nieuwe pagina"
           style="margin-left: 10px;">
            <img src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/Iconen/CustomLijsten/OpenLink.png"
                 alt="Open link"
                 style="width: 20px; height: 20px; vertical-align: middle;">
        </a>
        <img src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/Iconen/Algemeen/help.png"
             alt="Help"
             class="help-icon"
             data-tooltip="Deze lijst toont alle acties van het kwaliteitsteam. ...">
    </h1>
    <div class="tooltip" id="tooltip-info"></div

    <!-- Meldingen -->
    <div id="notification" class="notification"></div>

    <div class="action-bar">
<div class="action-buttons">
    <button type="button" class="action-button" id="fullscreenButton">Volledig scherm</button>
    <button type="button" class="action-button" id="addButton">Toevoegen</button>
    <button type="button" class="action-button disabled" id="editButton" disabled>Bewerken</button>
    <button type="button" class="action-button disabled" id="deleteButton" disabled>Verwijderen</button>
    <!-- Nieuwe knop -->
    <button type="button" class="action-button" id="bulkEditButton">Meervoudig bewerken</button>
    <button type="button" class="action-button" id="saveBulkEditButton" style="display:none;">Wijzigingen opslaan</button>
</div>

        <div class="filter-dropdown">
            <label for="status-filter">Status:</label>
            <select id="status-filter">
                <option value="open" selected>Open</option>
                <option value="gesloten">Gesloten</option>
                <option value="all">Alles</option>
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
                    <th data-sort="Title" class="sortable">Titel</th>
                    <th data-sort="Verantwoordelijk" class="sortable">Verantwoordelijke</th>
                    <th data-sort="Probleemomschrijving" class="sortable">Probleem</th>
                    <th data-sort="Acties" class="sortable">Acties</th>
                    <th data-sort="Besluit_x0020_c_x002e_q_x002e__x" class="sortable">Besluit</th>
                    <th data-sort="Afdeling" class="sortable">Afdeling</th>
                    <th data-sort="Verzoeker" class="sortable">Verzoeker</th>
                    <th data-sort="Prioriteit" class="sortable">Prioriteit</th>
                    <th data-sort="Einddatum" class="sortable">Einddatum</th>
                    <th data-sort="Status" class="sortable">Status</th>
                </tr>
            </thead>
            <tbody id="table-body">
                <tr id="loading-row" data-state="loading">
                    <td colspan="10">Gegevens laden...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Toevoegen/Bewerken Modal -->
    <div class="modal" id="editModal">
        <div class="modal-content">
            <h2 id="modalTitle">Nieuwe actie</h2>
            <!-- Verborgen input om te zien of we iets aan het bewerken zijn -->
            <input type="hidden" id="editId">

            <!-- Titel -->
            <label for="editTitle">Titel</label>
            <input type="text" id="editTitle" required>

            <!-- Verantwoordelijke (people picker single) -->
            <label>Verantwoordelijke (single)</label>
            <input type="text" id="peoplePickerSearch" placeholder="Zoek user..." autocomplete="off">
            <div id="peoplePickerResults" class="people-picker-results"></div>
            <input type="hidden" id="selectedUserKey">

            <!-- Afdeling -->
            <label for="editAfdeling">Afdeling</label>
            <input type="text" id="editAfdeling">

            <!-- Verzoeker (people picker MULTI) -->
            <label>Verzoeker (multi-person)</label>
            <input type="text" id="verzoekerSearch" placeholder="Zoek user(s)..." autocomplete="off">
            <div id="verzoekerResults" class="people-picker-results"></div>
            <!-- Hierin slaan we de user keys (array) op -->
            <input type="hidden" id="verzoekerKeys" value="[]">

            <!-- Prioriteit (keuze) -->
            <label for="editPrioriteit">Prioriteit</label>
            <select id="editPrioriteit">
                <option value="Laag">Laag</option>
                <option value="Middel">Middel</option>
                <option value="Hoog">Hoog</option>
            </select>

            <!-- Einddatum & Status -->
            <label for="editEinddatum">Einddatum</label>
            <input type="date" id="editEinddatum">

            <label for="editStatus">Status</label>
            <select id="editStatus">
                <option value="Open">Open</option>
                <option value="Gesloten">Gesloten</option>
            </select>

<!-- Quill: Probleemomschrijving -->
<label for="quillProbleem">Probleemomschrijving</label>
<div id="quillToolbar" class="quill-toolbar">
    <button class="ql-bold"></button>
    <button class="ql-italic"></button>
    <button class="ql-underline"></button>
    <button class="ql-link"></button>
    <!-- Voeg meer toolbar knoppen toe indien nodig -->
</div>
<div id="quillProbleem" style="height: 150px;"></div>

<!-- Quill: Acties -->
<label for="quillActies">Acties</label>
<div id="quillToolbar2" class="quill-toolbar">
    <button class="ql-bold"></button>
    <button class="ql-italic"></button>
    <button class="ql-underline"></button>
    <button class="ql-link"></button>
    <!-- Voeg meer toolbar knoppen toe indien nodig -->
</div>
<div id="quillActies" style="height: 100px;"></div>

<!-- Quill: Besluit c.q. standpunt -->
<label for="quillBesluit">Besluit / Standpunt</label>
<div id="quillToolbarBesluit" class="quill-toolbar">
    <button class="ql-bold"></button>
    <button class="ql-italic"></button>
    <button class="ql-underline"></button>
    <button class="ql-link"></button>
    <!-- Voeg meer toolbar knoppen toe indien nodig -->
</div>
<div id="quillBesluit" style="height: 150px;"></div>


            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                <button type="button" class="action-button" id="saveItemButton">Opslaan</button>
                <button type="button" class="action-button" onclick="closeModal('editModal')">Annuleren</button>
            </div>
        </div>
    </div>

    <!-- Verwijderen Modal -->
    <div class="modal" id="deleteModal">
        <div class="modal-content">
            <h2>Verwijder actie</h2>
            <p>Weet je zeker dat je deze actie wilt verwijderen?</p>
            <input type="hidden" id="deleteId">
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top:10px;">
                <button type="button" class="action-button" id="confirmDeleteButton">Verwijderen</button>
                <button type="button" class="action-button" onclick="closeModal('deleteModal')">Annuleren</button>
            </div>
        </div>
    </div>

</body>
</html>
