// Lawyer filter logic
const filterButtons = document.querySelectorAll('.filter-btn');
const lawyerCards = document.querySelectorAll('.leadership-card');

// Optional ID mapping based on your current HTML ids
const filterToIds = {
    corporate: ['2'],
    employment: ['5'],
    environmental: ['3'],
    competition: ['4'],
    banking: ['7'],
    dispute: ['1'],
    trust: ['6']
};

const keywordMap = {
    corporate: ['corporate & commercial law', 'corporate and commercial law'],
    employment: ['employment law'],
    environmental: ['environmental law'],
    competition: ['competition law'],
    banking: ['banking, finance & projects', 'banking finance & projects'],
    dispute: ['dispute resolution'],
    trust: ['trusts & estates law', 'trust & estate law']
};

function normalize(value) {
    return (value || '').trim().toLowerCase();
}

function matchesFilter(card, filter) {
    if (filter === 'all') return true;

    // 1) If you add data-category on cards later, this supports it immediately.
    const dataCategories = (card.dataset.category || '')
        .split(',')
        .map(normalize)
        .filter(Boolean);
    if (dataCategories.includes(filter)) return true;

    // 2) Current fallback: match by card id mapping.
    const cardId = card.getAttribute('id');
    if (filterToIds[filter]?.includes(cardId)) return true;

    // 3) Final fallback: match by visible card text.
    const text = normalize(card.textContent);
    return (keywordMap[filter] || []).some((keyword) => text.includes(keyword));
}

function applyFilter(rawFilter) {
    const filter = normalize(rawFilter);

    lawyerCards.forEach((card) => {
        card.style.display = matchesFilter(card, filter) ? '' : 'none';
    });
}

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        filterButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilter(button.dataset.filter);
    });
});

// Ensure initial state is shown
const activeButton = document.querySelector('.filter-btn.active');
applyFilter(activeButton ? activeButton.dataset.filter : 'all');
