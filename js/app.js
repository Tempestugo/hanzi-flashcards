let vocab = {};
let filteredWords = [];
let mySelection = JSON.parse(localStorage.getItem('myHanziList')) || [];
let currentIndex = 0;
let writers = [];
let mode = 'all';
let currentLevel = 'all';

async function init() {
    const res = await fetch('data/vocab.json');
    vocab = await res.json();
    setupEvents();
    applyFilters();
    nextCard();
}

function applyFilters() {
    const allWords = Object.keys(vocab);
    //
    filteredWords = allWords.filter(word => {
        const info = vocab[word];
        if (mode === 'favorites' && !mySelection.includes(word)) return false;
        if (currentLevel !== 'all' && info.level !== currentLevel) return false;
        return true;
    });
    updateUI();
}

function showCard(word) {
    if (!word || !vocab[word]) return;
    const info = vocab[word];

    document.getElementById('pinyin').innerText = info.pinyin;
    document.getElementById('meaning').innerText = info.meaning;
    document.getElementById('character-target').innerHTML = '';
    document.getElementById('card-back').classList.add('hidden');

    const btnFav = document.getElementById('btn-favorite');
    btnFav.innerText = mySelection.includes(word) ? "⭐ Salvo na Lista" : "☆ Adicionar à Minha Lista";

    writers = [];
    for (const char of word) {
        const charDiv = document.createElement('div');
        charDiv.style.display = 'inline-block';
        document.getElementById('character-target').appendChild(charDiv);
        writers.push(HanziWriter.create(charDiv, char, {
            width: 140, height: 140, padding: 5, showOutline: true,
            charDataLoader: async (c) => (await fetch(`data/hanzi/${c}.json`)).json()
        }));
    }
}

function nextCard() {
    if (filteredWords.length === 0) {
        document.getElementById('pinyin').innerText = "Vazio";
        document.getElementById('meaning').innerText = "Ajuste os filtros";
        return;
    }
    currentIndex = Math.floor(Math.random() * filteredWords.length);
    showCard(filteredWords[currentIndex]);
}

function setupEvents() {
    // BUSCA "SANFONA"
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length < 1) { searchResults.style.display = 'none'; return; }

        const matches = Object.keys(vocab).filter(w =>
            w.includes(term) || vocab[w].pinyin.toLowerCase().includes(term)
        ).slice(0, 8);

        if (matches.length > 0) {
            searchResults.innerHTML = matches.map(w => `
                <div class="result-item" onclick="selectWord('${w}')">
                    <span><strong>${w}</strong> <small>${vocab[w].pinyin}</small></span>
                    <i style="font-size: 10px; color: #999;">${vocab[w].level}</i>
                </div>
            `).join('');
            searchResults.style.display = 'block';
        } else { searchResults.style.display = 'none'; }
    };

    window.selectWord = (word) => {
        showCard(word);
        searchResults.style.display = 'none';
        searchInput.value = '';
    };

    // CHIPS (FILTRO DE BARALHO)
    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentLevel = chip.dataset.level;
            applyFilters();
            nextCard();
        };
    });

    document.getElementById('btn-favorite').onclick = () => {
        const currentWord = document.getElementById('pinyin').innerText === "Vazio" ? null :
                          Object.keys(vocab).find(w => vocab[w].pinyin === document.getElementById('pinyin').innerText);
        if (!currentWord) return;
        if (!mySelection.includes(currentWord)) mySelection.push(currentWord);
        else mySelection = mySelection.filter(w => w !== currentWord);
        localStorage.setItem('myHanziList', JSON.stringify(mySelection));
        applyFilters();
        showCard(currentWord);
    };

    document.getElementById('btn-toggle-list').onclick = () => {
        mode = (mode === 'all') ? 'favorites' : 'all';
        applyFilters();
        nextCard();
    };

    document.getElementById('btn-flip').onclick = () => {
        document.getElementById('card-back').classList.remove('hidden');
        writers.forEach((w, i) => setTimeout(() => w.animateCharacter(), i * 800));
    };

    document.getElementById('btn-next').onclick = nextCard;
}

function updateUI() {
    const btnToggle = document.getElementById('btn-toggle-list');
    btnToggle.innerText = mode === 'all' ? `Modo: Geral (HSK: ${filteredWords.length})` : `Minha Lista (${filteredWords.length})`;
}

init();