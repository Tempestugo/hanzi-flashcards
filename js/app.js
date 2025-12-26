let vocab = {};
let words = [];
let mySelection = JSON.parse(localStorage.getItem('myHanziList')) || [];
let currentIndex = 0;
let writers = [];
let mode = 'all'; // 'all' ou 'favorites'

async function init() {
    const res = await fetch('data/vocab.json');
    vocab = await res.json();
    updateButtonText();
    setList();
    nextCard();
}

function setList() {
    words = (mode === 'all') ? Object.keys(vocab) : mySelection;
    if (words.length === 0) {
        alert("Sua lista está vazia! Adicione palavras primeiro.");
        mode = 'all';
        words = Object.keys(vocab);
    }
}

function showCard(word) {
    const info = vocab[word];
    document.getElementById('pinyin').innerText = info.pinyin;
    document.getElementById('meaning').innerText = info.meaning; // O significado já está aqui!
    document.getElementById('character-target').innerHTML = '';
    document.getElementById('card-back').classList.add('hidden');
    
    // Atualiza cor do botão se já estiver na lista
    const btnFav = document.getElementById('btn-favorite');
    btnFav.innerText = mySelection.includes(word) ? "⭐ Salvo" : "☆ Salvar";

    writers = [];
    for (const char of word) {
        const charDiv = document.createElement('div');
        charDiv.style.display = 'inline-block';
        document.getElementById('character-target').appendChild(charDiv);
        const writer = HanziWriter.create(charDiv, char, {
            width: 150, height: 150, padding: 5, showOutline: true,
            charDataLoader: async (c) => {
                const response = await fetch(`data/hanzi/${c}.json`);
                return await response.json();
            }
        });
        writers.push(writer);
    }
}

// Funções de Controle
function nextCard() {
    if (words.length === 0) return;
    currentIndex = Math.floor(Math.random() * words.length);
    showCard(words[currentIndex]);
}

function updateButtonText() {
    document.getElementById('btn-toggle-list').innerText = 
        `Modo: ${mode === 'all' ? 'Geral' : 'Meus Favoritos'} (${mySelection.length})`;
}

// Eventos
document.getElementById('btn-favorite').onclick = () => {
    const currentWord = words[currentIndex];
    if (!mySelection.includes(currentWord)) {
        mySelection.push(currentWord);
    } else {
        mySelection = mySelection.filter(w => w !== currentWord);
    }
    localStorage.setItem('myHanziList', JSON.stringify(mySelection));
    updateButtonText();
    showCard(currentWord);
};

document.getElementById('btn-toggle-list').onclick = () => {
    mode = (mode === 'all') ? 'favorites' : 'all';
    setList();
    updateButtonText();
    nextCard();
};

document.getElementById('btn-flip').onclick = () => {
    document.getElementById('card-back').classList.remove('hidden');
    writers.forEach((w, i) => setTimeout(() => w.animateCharacter(), i * 1000));
};

document.getElementById('btn-next').onclick = nextCard;

init();