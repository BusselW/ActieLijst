<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>Afsprakenlijst Appel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Quill CSS -->
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
        
    <!-- Onze Stylesheet -->
    <link rel="stylesheet" href="https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel/SiteAssets/afsprakenlijst/styles.css">
    
    <!-- jQuery (optioneel, voor gemak) -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/jquery3.6.0.js"></script>
    
    <!-- Quill JS -->
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>

    <!-- PostCall.js: bevat apiCallWithDigest() -->
    <script src="https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel/SiteAssets/afsprakenlijst/PostCall.js"></script>

    <!-- Onze scripts -->
    <script src="https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel/SiteAssets/afsprakenlijst/scripts.js"></script>
</head>
<body>
    <h1>
        Afsprakenlijst Appel
        <a href="https://som.org.om.local/sites/MulderT/Onderdelen/ZVAppel/Appel/Lists/Afsprakenlijst/AllItems.aspx"
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
             data-tooltip="Deze lijst toont alle afspraken van het appel.">
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
                    <th data-sort="Title" class="sortable">Titel</th>
                    <th data-sort="Categorie" class="sortable">Categorie</th>
                    <th data-sort="Uitleg" class="sortable">Uitleg</th>
                    <th data-sort="Created" class="sortable">Aangemaakt</th>
                </tr>
            </thead>
            <tbody id="table-body">
                <tr id="loading-row" data-state="loading">
                    <td colspan="4">Gegevens laden...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Toevoegen/Bewerken Modal -->
    <div class="modal" id="editModal">
        <div class="modal-content">
            <h2 id="modalTitle">Nieuwe afspraak</h2>
            <!-- Verborgen input om te zien of we iets aan het bewerken zijn -->
            <input type="hidden" id="editId">

            <!-- Titel -->
            <label for="editTitle">Titel *</label>
            <input type="text" id="editTitle" required>

            <!-- Categorie (keuze) -->
            <label for="editCategorie">Categorie</label>
            <select id="editCategorie">
                <option value="Algemeen">Algemeen</option>
                <option value="Juridisch">Juridisch</option>
            </select>

            <!-- Quill: Uitleg -->
            <label for="quillUitleg">Uitleg</label>
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
            <div id="quillUitleg" style="height: 200px;"></div>

            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                <button type="button" class="action-button" id="saveItemButton">Opslaan</button>
                <button type="button" class="action-button" onclick="closeModal('editModal')">Annuleren</button>
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
