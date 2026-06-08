// Výchozí fotky (ptáčci), které se spustí, pokud admin nevytvoří vlastní hru
const výchoziDatabazeFotek = [
    'podklady/foto1.jpg', 'podklady/foto2.jpg', 'podklady/foto3.jpg', 'podklady/foto4.jpg',
    'podklady/foto5.jpg', 'podklady/foto6.jpg', 'podklady/foto7.jpg', 'podklady/foto8.jpg',
    'podklady/foto9.jpg', 'podklady/foto10.jpg', 'podklady/foto11.jpg', 'podklady/foto12.jpg'
];

// Dynamická databáze, do které nahrajeme buď výchozí fotky, nebo ty od admina
let databazeFotek = [...výchoziDatabazeFotek];

// --- NOVÁ LOGIKA: KONTROLA URL PARAMETRU (ADMIN) ---
const urlParams = new URLSearchParams(window.location.search);
const nazevCustomHry = urlParams.get('hra'); // Zjistí, jestli je v URL např. ?hra=auta

if (nazevCustomHry) {
    // Pokusíme se vytáhnout fotky z paměti prohlížeče
    const ulozeneFotky = localStorage.getItem('amos_pexeso_' + nazevCustomHry);
    if (ulozeneFotky) {
        databazeFotek = JSON.parse(ulozeneFotky);
        console.log(`Načteno pexeso od admina: ${nazevCustomHry}`);
    } else {
        alert("Pozor: Toto pexeso nebylo na tomto zařízení nalezeno. Spouštím výchozí verzi.");
    }
}
// --- KONEC ADMIN LOGIKY ---

let fotkyProHru = [];
let otoceneKarty = []; 
let nalezeneDvojice = 0;
let celkovyPocetDvojic = 0;

// HTML Elementy
const herniPlocha = document.getElementById('herni-plocha');
const uvodniObrazovka = document.getElementById('uvodni-obrazovka');
const vyherniOkno = document.getElementById('vyherni-okno');
const resetTlacitko = document.getElementById('reset-tlacitko');
const panelSkore = document.getElementById('panel-skore');

const sekcePocetHracu = document.getElementById('sekce-pocet-hracu');
const sekceJmenaHracu = document.getElementById('sekce-jmena-hracu');
const sekceObtiznost = document.getElementById('sekce-obtiznost');

function zamichej(pole) {
    return pole.sort(() => Math.random() - 0.5);
}

// 1. KROK: Kliknutí na počet hráčů
document.querySelectorAll('.btn-hraci').forEach(btn => {
    btn.addEventListener('click', () => {
        celkovyPocetHracu = parseInt(btn.dataset.hraci);
        sekcePocetHracu.classList.add('skryte');
        
        // Vygenerujeme textová pole pro zadání jmen
        const vstupyKontejner = document.getElementById('vstupy-jmen');
        vstupyKontejner.innerHTML = '';
        
        for (let i = 1; i <= celkovyPocetHracu; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-jmeno';
            input.placeholder = `Jméno ${i}. hráče`;
            input.value = `Hráč ${i}`; // Výchozí hodnota
            vstupyKontejner.appendChild(input);
        }
        
        sekceJmenaHracu.classList.remove('skryte');
    });
});

// 2. KROK: Potvrzení jmen a přechod k obtížnosti
document.getElementById('btn-potvrdit-jmena').addEventListener('click', () => {
    hraci = [];
    const vstupy = document.querySelectorAll('.input-jmeno');
    vstupy.forEach(vstup => {
        hraci.push({
            jmeno: vstup.value.trim() !== "" ? vstup.value.trim() : "Hráč",
            skore: 0
        });
    });
    
    sekceJmenaHracu.classList.add('skryte');
    sekceObtiznost.classList.remove('skryte');
});

// 3. KROK: Výběr obtížnosti a finální generování plochy
document.querySelectorAll('.btn-obtiznost').forEach(btn => {
    btn.addEventListener('click', () => {
        const pocetKaret = parseInt(btn.dataset.karet);
        celkovyPocetDvojic = pocetKaret / 2;
        
        inicializujHru(pocetKaret);
    });
});

function inicializujHru(pocetKaret) {
    uvodniObrazovka.classList.add('skryte');
    herniPlocha.classList.remove('skryte');
    panelSkore.classList.remove('skryte');

    herniPlocha.innerHTML = '';
    otoceneKarty = [];
    nalezeneDvojice = 0;
    indexHraceNaTahu = 0;

    // Reset skóre všech hráčů
    hraci.forEach(h => h.skore = 0);

    // Vykreslení tabulky skóre
    aktualizujPanelSkore();

    // Nastavení mřížky pro 120px / 140px čtverce
    if (pocetKaret === 12) {
        herniPlocha.style.gridTemplateColumns = "repeat(4, 1fr)";
    } else {
        herniPlocha.style.gridTemplateColumns = "repeat(6, 1fr)";
    }

    const vybraneUnikatni = databazeFotek.slice(0, celkovyPocetDvojic);
    fotkyProHru = zamichej([...vybraneUnikatni, ...vybraneUnikatni]);

    // Vygenerování karet
    fotkyProHru.forEach((cesta, index) => {
        const karta = document.createElement('div');
        karta.classList.add('karta');
        karta.dataset.foto = cesta;
        karta.innerHTML = `
            <div class="karta-vnitrek">
                <div class="karta-rub"></div>
                <div class="karta-lic" style="background-image: url('${cesta}')"></div>
            </div>
        `;

        karta.addEventListener('click', () => {
            if (karta.classList.contains('otocena') || otoceneKarty.length === 2) return;

            karta.classList.add('otocena');
            otoceneKarty.push(karta);

            if (otoceneKarty.length === 2) {
                zkontrolujShodu();
            }
        });

        herniPlocha.appendChild(karta);
    });
}

function aktualizujPanelSkore() {
    panelSkore.innerHTML = '';
    hraci.forEach((hrac, index) => {
        const box = document.createElement('div');
        box.className = `skore-box ${index === indexHraceNaTahu ? 'na-tahu' : ''}`;
        box.innerHTML = `
            <span class="skore-jmeno">${hrac.jmeno}</span>
            <span class="skore-body">${hrac.skore}</span>
        `;
        panelSkore.appendChild(box);
    });
}

function zkontrolujShodu() {
    const karta1 = otoceneKarty[0];
    const karta2 = otoceneKarty[1];
    const hracNaTahu = hraci[indexHraceNaTahu];

    if (karta1.dataset.foto === karta2.dataset.foto) {
        // Shoda: Hráč získá bod a hraje dál
        hracNaTahu.skore++;
        nalezeneDvojice++;
        otoceneKarty = [];
        aktualizujPanelSkore();

        if (nalezeneDvojice === celkovyPocetDvojic) {
            setTimeout(vyhodnotKonec_Hry, 600);
        }
    } else {
        // Neshoda: Karty se otočí zpět a hraje další hráč v pořadí
        setTimeout(() => {
            karta1.classList.remove('otocena');
            karta2.classList.remove('otocena');
            otoceneKarty = [];
            
            // Posun na dalšího hráče (pokud jsme na konci pole, jdeme od nuly)
            indexHraceNaTahu = (indexHraceNaTahu + 1) % celkovyPocetHracu;
            aktualizujPanelSkore();
        }, 1200);
    }
}

function vyhodnotKonec_Hry() {
    const nadpis = document.getElementById('vyherni-nadpis');
    const text = document.getElementById('vyherni-text');

    if (celkovyPocetHracu === 1) {
        // Režim jednoho hráče: Ponecháme původní text
        nadpis.innerText = "Skvělá práce! 🎉";
        text.innerText = "Zvládl jsi to na jedničku.";
    } else {
        // Režim více hráčů: Spočítáme, kdo má nejvíc bodů
        let maxSkore = -1;
        let vyherci = [];

        hraci.forEach(h => {
            if (h.skore > maxSkore) {
                maxSkore = h.skore;
                vyherci = [h.jmeno];
            } else if (h.skore === maxSkore) {
                vyherci.push(h.jmeno);
            }
        });

        if (vyherci.length === 1) {
            nadpis.innerText = `Vítězí ${vyherci[0]}! 🏆`;
            text.innerText = `S celkovým počtem ${maxSkore} bodů ovládl celou hru.`;
        } else {
            nadpis.innerText = "Remíza! 🤝";
            text.innerText = `Hráči ${vyherci.join(' a ')} dosáhli shodně ${maxSkore} bodů.`;
        }
    }

    vyherniOkno.classList.remove('skryte');
}

// Reset hry vrátí uživatele na úplný start k výběru hráčů
resetTlacitko.addEventListener('click', () => {
    vyherniOkno.classList.add('skryte');
    herniPlocha.classList.add('skryte');
    panelSkore.classList.add('skryte');
    
    // Obnovíme výchozí stav menu
    sekcePocetHracu.classList.remove('skryte');
    sekceJmenaHracu.classList.add('skryte');
    sekceObtiznost.classList.add('skryte');
    uvodniObrazovka.classList.remove('skryte');
});