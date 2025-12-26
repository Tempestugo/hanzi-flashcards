let vocab = {};
let filteredWords = [];
let mySelection = JSON.parse(localStorage.getItem('myHanziList')) || [];
let currentIndex = 0;
let writers = [];
let mode = 'all'; // 'all' ou 'favorites'
let currentLevel = 'all'; // 'all', 'HSK1' ou 'HSK2'
let searchTerm = '';

async function init() {
    try {
        const res = await fetch('data/vocab.json');
        vocab = await res.json();

        setupEventListeners();
        applyFilters();
        nextCard();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function applyFilters() {
    const allWords = Object.keys(vocab);

    filteredWords = allWords.filter(word => {
        const info = vocab[word];

        // 1. Filtro de Lista (Geral vs Favoritos)
        if (mode === 'favorites' && !mySelection.includes(word)) return false;

        // 2. Filtro de Nível (HSK1, HSK2 ou Tudo)
        if (currentLevel !== 'all' && info.level !== currentLevel) return false;

        // 3. Filtro de Busca
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const match = word.includes(search) ||
                          info.pinyin.toLowerCase().includes(search) ||
                          info.meaning.toLowerCase().includes(search);
            if (!match) return false;
        }

        return true;
    });

    updateUI();
}

function showCard(word) {
    if (!word) return;
    const info = vocab[word];

    document.getElementById('pinyin').innerText = info.pinyin;
    document.getElementById('meaning').innerText = info.meaning;
    document.getElementById('character-target').innerHTML = '';
    document.getElementById('card-back').classList.add('hidden');

    // Atualiza botão de favorito
    const btnFav = document.getElementById('btn-favorite');
    btnFav.innerText = mySelection.includes(word) ? "⭐ Salvo na Lista" : "☆ Adicionar à Minha Lista";

    writers = [];
    for (const char of word) {
        const charDiv = document.createElement('div');
        charDiv.style.display = 'inline-block';
        document.getElementById('character-target').appendChild(charDiv);

        const writer = HanziWriter.create(charDiv, char, {
            width: 150,
            height: 150,
            padding: 5,
            showOutline: true,
            charDataLoader: async (c) => {
                const response = await fetch(`data/hanzi/${c}.json`);
                return await response.json();
            }
        });
        writers.push(writer);
    }
}

function nextCard() {
    if (filteredWords.length === 0) {
        document.getElementById('pinyin').innerText = "Nenhum resultado";
        document.getElementById('meaning').innerText = "Ajuste os filtros ou busca";
        document.getElementById('character-target').innerHTML = '';
        return;
    }
    currentIndex = Math.floor(Math.random() * filteredWords.length);
    showCard(filteredWords[currentIndex]);
}

function updateUI() {
    const btnToggle = document.getElementById('btn-toggle-list');
    btnToggle.innerText = mode === 'all'
        ? `Modo: Geral (Ver Minha Lista: ${mySelection.length})`
        : `Modo: Minha Lista (${filteredWords.length} itens)`;
}

function setupEventListeners() {
    // Busca
    document.getElementById('search-input').oninput = (e) => {
        searchTerm = e.target.value;
        applyFilters();
    };

    // Chips de Nível
    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => {
                c.style.background = 'white';
                c.style.fontWeight = 'normal';
            });
            chip.style.background = '#e1f0ff';
            chip.style.fontWeight = 'bold';
            currentLevel = chip.dataset.level;
            applyFilters();
        };
    });

    // Favoritar
    document.getElementById('btn-favorite').onclick = () => {
        const currentWord = filteredWords[currentIndex];
        if (!currentWord) return;

        if (!mySelection.includes(currentWord)) {
            mySelection.push(currentWord);
        } else {
            mySelection = mySelection.filter(w => w !== currentWord);
        }

        localStorage.setItem('myHanziList', JSON.stringify(mySelection));
        applyFilters();
        showCard(currentWord);
    };

    // Alternar Lista/Geral
    document.getElementById('btn-toggle-list').onclick = () => {
        mode = (mode === 'all') ? 'favorites' : 'all';
        applyFilters();
        nextCard();
    };

    // Virar Card
    document.getElementById('btn-flip').onclick = () => {
        document.getElementById('card-back').classList.remove('hidden');
        writers.forEach((w, i) => setTimeout(() => w.animateCharacter(), i * 1000));
    };

    // Próximo
    document.getElementById('btn-next').onclick = nextCard;
}

init();