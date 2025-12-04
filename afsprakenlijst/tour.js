/************************************************
 * Interactive Tour Guide
 * Guides users through the application features
 ************************************************/

let tourSteps = [];
let currentTourStep = 0;
let tourOverlay = null;
let tourTooltip = null;

// Define tour steps
const TOUR_STEPS = [
    {
        target: 'h1',
        title: 'Welkom bij de Afsprakenlijst!',
        content: 'Deze tour laat je zien hoe je de afsprakenlijst kunt gebruiken. Klik op "Volgende" om te beginnen.',
        position: 'bottom'
    },
    {
        target: '#addButton',
        title: 'Nieuwe afspraak toevoegen',
        content: 'Klik hier om een nieuwe afspraak toe te voegen. Je kunt ook dubbelklikken op een rij om deze te bewerken.',
        position: 'bottom'
    },
    {
        target: '.styled-table tbody',
        title: 'Afspraken selecteren',
        content: 'Klik op een rij om deze te selecteren. Dubbelklik om direct te bewerken. Gebruik Enter of Delete toetsen voor snelle acties.',
        position: 'top',
        highlight: true
    },
    {
        target: '#editButton',
        title: 'Bewerken knop',
        content: 'Na het selecteren van een rij kun je hier klikken om te bewerken, of druk gewoon op Enter.',
        position: 'bottom'
    },
    {
        target: '#deleteButton',
        title: 'Verwijderen knop',
        content: 'Verwijder geselecteerde afspraken hier, of druk op de Delete toets.',
        position: 'bottom'
    },
    {
        target: '#category-filter',
        title: 'Filter op categorie',
        content: 'Filter afspraken op categorie om specifieke items te vinden.',
        position: 'bottom'
    },
    {
        target: '#search-input',
        title: 'Zoekfunctie',
        content: 'Typ hier om te zoeken in titel, categorie en uitleg van afspraken.',
        position: 'bottom'
    },
    {
        target: '.styled-table th.sortable',
        title: 'Sorteren',
        content: 'Klik op kolomkoppen om te sorteren. Klik nogmaals om de sorteervolgorde om te draaien.',
        position: 'bottom'
    },
    {
        target: '#fullscreenButton',
        title: 'Volledig scherm',
        content: 'Klik hier voor volledig scherm modus voor een beter overzicht.',
        position: 'bottom'
    },
    {
        target: '#helpButton',
        title: 'Tour afsluiten',
        content: 'Je kunt deze tour altijd opnieuw starten door op de help knop te klikken. Veel succes!',
        position: 'left'
    }
];

/************************************************
 * Initialize tour
 ************************************************/
function initTour() {
    // Create help button
    const helpButton = document.createElement('button');
    helpButton.id = 'helpButton';
    helpButton.className = 'help-button';
    helpButton.innerHTML = '?';
    helpButton.title = 'Start interactieve tour';
    helpButton.addEventListener('click', startTour);
    document.body.appendChild(helpButton);

    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('afsprakenlijst_tour_completed');
    if (!hasSeenTour) {
        // Auto-start tour for first-time users after a short delay
        setTimeout(() => startTour(), 500);
    }
}

/************************************************
 * Start the tour
 ************************************************/
function startTour() {
    tourSteps = [...TOUR_STEPS];
    currentTourStep = 0;
    createTourElements();
    showTourStep(0);
}

/************************************************
 * Create tour overlay and tooltip elements
 ************************************************/
function createTourElements() {
    // Remove existing elements if any
    if (tourOverlay) tourOverlay.remove();
    if (tourTooltip) tourTooltip.remove();

    // Create overlay
    tourOverlay = document.createElement('div');
    tourOverlay.className = 'tour-overlay';
    tourOverlay.addEventListener('click', (e) => {
        if (e.target === tourOverlay) {
            endTour();
        }
    });
    document.body.appendChild(tourOverlay);

    // Create tooltip
    tourTooltip = document.createElement('div');
    tourTooltip.className = 'tour-tooltip';
    document.body.appendChild(tourTooltip);
}

/************************************************
 * Show specific tour step
 ************************************************/
function showTourStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) {
        endTour();
        return;
    }

    currentTourStep = stepIndex;
    const step = tourSteps[stepIndex];
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
        console.warn(`Tour target not found: ${step.target}`);
        nextTourStep();
        return;
    }

    // Highlight target element
    highlightElement(targetElement);

    // Position and show tooltip
    positionTooltip(targetElement, step);

    // Update tooltip content
    tourTooltip.innerHTML = `
        <div class="tour-tooltip-header">
            <h3>${step.title}</h3>
            <button class="tour-close" onclick="endTour()">×</button>
        </div>
        <div class="tour-tooltip-body">
            <p>${step.content}</p>
        </div>
        <div class="tour-tooltip-footer">
            <span class="tour-step-counter">Stap ${stepIndex + 1} van ${tourSteps.length}</span>
            <div class="tour-buttons">
                ${stepIndex > 0 ? '<button class="tour-btn tour-btn-secondary" onclick="previousTourStep()">Vorige</button>' : ''}
                ${stepIndex < tourSteps.length - 1 
                    ? '<button class="tour-btn tour-btn-primary" onclick="nextTourStep()">Volgende</button>' 
                    : '<button class="tour-btn tour-btn-primary" onclick="completeTour()">Afronden</button>'}
            </div>
        </div>
    `;

    tourTooltip.style.display = 'block';
}

/************************************************
 * Highlight target element
 ************************************************/
function highlightElement(element) {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });

    // Add highlight to current element
    element.classList.add('tour-highlight');
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/************************************************
 * Position tooltip relative to target
 ************************************************/
function positionTooltip(targetElement, step) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tourTooltip.getBoundingClientRect();
    const position = step.position || 'bottom';
    
    let top, left;

    switch (position) {
        case 'top':
            top = rect.top - tooltipRect.height - 20;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            break;
        case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            break;
        case 'left':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.left - tooltipRect.width - 20;
            break;
        case 'right':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.right + 20;
            break;
        default:
            top = rect.bottom + 20;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Keep tooltip within viewport
    const padding = 10;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    tourTooltip.style.top = `${top}px`;
    tourTooltip.style.left = `${left}px`;
}

/************************************************
 * Navigation functions
 ************************************************/
function nextTourStep() {
    showTourStep(currentTourStep + 1);
}

function previousTourStep() {
    showTourStep(currentTourStep - 1);
}

function completeTour() {
    localStorage.setItem('afsprakenlijst_tour_completed', 'true');
    endTour();
}

function endTour() {
    if (tourOverlay) {
        tourOverlay.remove();
        tourOverlay = null;
    }
    if (tourTooltip) {
        tourTooltip.remove();
        tourTooltip = null;
    }
    
    // Remove highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
}

/************************************************
 * Keyboard navigation for tour
 ************************************************/
document.addEventListener('keydown', (e) => {
    if (!tourTooltip || tourTooltip.style.display === 'none') return;

    if (e.key === 'Escape') {
        endTour();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentTourStep < tourSteps.length - 1) {
            nextTourStep();
        } else {
            completeTour();
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentTourStep > 0) {
            previousTourStep();
        }
    }
});

/************************************************
 * Initialize tour when DOM is ready
 ************************************************/
// Wait for the main scripts.js to load first
window.addEventListener('load', () => {
    // Small delay to ensure all scripts are initialized
    setTimeout(initTour, 100);
});
