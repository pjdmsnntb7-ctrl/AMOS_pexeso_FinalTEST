// Výchozí fotky (ptáčci), které se spustí, pokud admin nevytvoří vlastní hru
const výchoziDatabazeFotek = [
    'podklady/foto1.jpg', 'podklady/foto2.jpg', 'podklady/foto3.jpg', 'podklady/foto4.jpg',
    'podklady/foto5.jpg', 'podklady/foto6.jpg', 'podklady/foto7.jpg', 'podklady/foto8.jpg',
    'podklady/foto9.jpg', 'podklady/foto10.jpg', 'podklady/foto11.jpg', 'podklady/foto12.jpg'
];

let databazeFotek = [...výchoziDatabazeFotek];

// --- IMPORTOVÁNÍ CUSTOM PEXESA (BEZSERVEROVÝ ADMIN) ---
const urlParams = new URLSearchParams(window.location.search);
const customHraNazev = urlParams.get('hra');

// Pokud je v adrese např. ?hra=love, vytáhneme data z paměti prohlížeče
if (customHraNazev) {
    const ulozene = localStorage.getItem('amos_pexeso_' + customHraNazev);
    if (ulozene) {
        databazeFotek = JSON.parse(ulozene);
        console.log("Načteno custom pexeso: " + customHraNazev);
    }
}

// Přidání importovacího okna na hlavní obrazovku přes klávesu "I"
window.addEventListener('keydown', (e) => {
    // Reaguje pouze na hlavní obrazovce (když je herní plocha skrytá)
    if (e.key.toLowerCase() === 'i' && document.getElementById('herni-plocha').classList.contains('skryte')) {
        const kod = prompt("Zadej vygenerovaný kód pexesa z Admin panelu:");
        if (kod) {
            try {
                const data = JSON.parse(decodeURIComponent(atob(kod)));
                if (data.nazev && data.fotky) {
                    localStorage.setItem('amos_pexeso_' + data.nazev, JSON.stringify(data.fotky));
                    alert(`Pexeso "${data.nazev}" bylo úspěšně importováno do tohoto počítače! Stránka se teď obnoví s novým tématem.`);
                    window.location.search = `?hra=${data.nazev}`;
                }
            } catch (err) {
                alert("Neplatný, příliš velký nebo poškozený kód pexesa.");
            }
        }
    }
});
// --- KONEC ADMIN LOGIKY ---


let fotkyProHru = [];
let otoceneKarty = []; 
let nalezeneDvojice = 0;
let celkovyPocetDvojic = 0;

// Multiplayer data
let hraci = []; 
let indexHraceNaTahu = 0;
let celkovyPocetHracu = 1;

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
        
        const vstupyKontejner = document.getElementById('vstupy-jmen');
        vstupyKontejner.innerHTML = '';
        
        for (let i = 1; i <= celkovyPocetHracu; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-jmeno';
            input.placeholder = `Jméno ${i}. hráče`;
            input.value = `Hráč ${i}`; 
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

// 3. KROK: Výběr obtížnosti a start hry
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

    hraci.forEach(h => h.skore = 0);
    aktualizujPanelSkore();

    if (pocetKaret === 12) {
        herniPlocha.style.gridTemplateColumns = "repeat(4, 1fr)";
    } else {
        herniPlocha.style.gridTemplateColumns = "repeat(6, 1fr)";
    }

    const vybraneUnikatni = databazeFotek.slice(0, celkovyPocetDvojic);
    fotkyProHru = zamichej([...vybraneUnikatni, ...vybraneUnikatni]);

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
        hracNaTahu.skore++;
        nalezeneDvojice++;
        otoceneKarty = [];
        aktualizujPanelSkore();

        if (nalezeneDvojice === celkovyPocetDvojic) {
            setTimeout(vyhodnotKonec_Hry, 600);
        }
    } else {
        setTimeout(() => {
            karta1.classList.remove('otocena');
            karta2.classList.remove('otocena');
            otoceneKarty = [];
            
            indexHraceNaTahu = (indexHraceNaTahu + 1) % celkovyPocetHracu;
            aktualizujPanelSkore();
        }, 1200);
    }
}

function vyhodnotKonec_Hry() {
    const nadpis = document.getElementById('vyherni-nadpis');
    const text = document.getElementById('vyherni-text');

    if (celkovyPocetHracu === 1) {
        nadpis.innerText = "Skvělá práce! 🎉";
        text.innerText = "Zvládl jsi to na jedničku.";
    } else {
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

resetTlacitko.addEventListener('click', () => {
    vyherniOkno.classList.add('skryte');
    herniPlocha.classList.add('skryte');
    panelSkore.classList.add('skryte');
    
    sekcePocetHracu.classList.remove('skryte');
    sekceJmenaHracu.classList.add('skryte');
    sekceObtiznost.classList.add('skryte');
    uvodniObrazovka.classList.remove('skryte');
});