import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- 1. INICIALIZAÇÃO E AUTENTICAÇÃO ---

const firebaseConfig = {
  apiKey: "AIzaSyBsL8FE4ygY0-SyW6vcseUfRZIcrO5OyaY",
  authDomain: "teste-nucleo-ingles.firebaseapp.com",
  projectId: "teste-nucleo-ingles",
  storageBucket: "teste-nucleo-ingles.firebasestorage.app",
  messagingSenderId: "577482236590",
  appId: "1:577482236590:web:e49672ee452c97bba1033f"
};

const appId = firebaseConfig.appId; 
let db;
let auth;
let app;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log("Firebase App ID:", appId);
    console.log("Firebase Auth e Firestore inicializados.");

    await signInAnonymously(auth);

} catch (error) {
    console.error("Erro ao inicializar ou autenticar no Firebase:", error);
    const carouselContainer = document.getElementById('profissionais-carousel-container');
    if(carouselContainer) carouselContainer.innerHTML = `<p class="text-red-500 text-center w-full">Erro ao conectar com o Firebase. Verifique o console.</p>`;
}

// --- 2. LÓGICA DE AUTENTICAÇÃO E CARREGAMENTO DE DADOS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);
        loadProfissionais();
        loadAvisos(); // <-- Carrega os avisos
        setupContactForm();
    } else {
        console.log("Usuário não autenticado.");
    }
});

// --- 3. CARREGAR PROFESSORES DO FIRESTORE ---
function loadProfissionais() {
    const carouselContainer = document.getElementById('profissionais-carousel-container');
    const template = document.getElementById('professor-card-template');
    const loadingMessage = document.getElementById('profissionais-loading');
    
    if (!carouselContainer || !template || !loadingMessage) {
        console.error("Não foi possível encontrar os elementos do carrossel.");
        return;
    }

    const colPath = `/artifacts/${appId}/public/data/profissionais`;
    const colRef = collection(db, colPath);
    
    console.log("Ouvindo a coleção:", colPath);

    onSnapshot(colRef, (snapshot) => {
        carouselContainer.innerHTML = ''; 
        
        if (snapshot.empty) {
            console.warn("Nenhum professor encontrado no Firebase.");
            carouselContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center w-full">Nenhum professor cadastrado no momento.</p>`;
            return;
        }

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            
            const nome = data.nome || "Nome do Professor";
            const cargo = data.cargo || "Cargo";
            const bio = data.bio || "Descrição do professor...";
            // ATUALIZAÇÃO: Se imgUrl tiver vazia, bota o placeholder com o nome
            const imgUrl = data.imgUrl || `https://placehold.co/400x400/2c2c2e/white?text=${nome.split(' ')[0]}`;
            
            const delay = 300 + (index * 50);

            const cardClone = template.content.cloneNode(true);
            
            cardClone.querySelector('.professor-img').src = imgUrl;
            cardClone.querySelector('.professor-img').alt = `Foto de ${nome}`;
            cardClone.querySelector('.professor-nome').textContent = nome;
            cardClone.querySelector('.professor-cargo').textContent = cargo;
            cardClone.querySelector('.professor-bio').textContent = bio;
            
            const animatedElement = cardClone.querySelector('.fade-in-up');
            if (animatedElement) {
                animatedElement.style.transitionDelay = `${delay}ms`;
            }

            carouselContainer.appendChild(cardClone);
        });
        
        reativarAnimacoes(carouselContainer);

    }, (error) => {
        console.error("Erro ao buscar professores:", error);
        carouselContainer.innerHTML = `<p class="text-red-500 text-center w-full">Erro ao carregar professores. Tente novamente.</p>`;
    });
}

// --- 4. CARREGAR AVISOS DO FIRESTORE (NOVA FUNÇÃO) ---
function loadAvisos() {
    const carouselContainer = document.getElementById('avisos-carousel-container');
    const template = document.getElementById('aviso-card-template');
    const loadingMessage = document.getElementById('avisos-loading');
    
    if (!carouselContainer || !template || !loadingMessage) {
        console.error("Não foi possível encontrar os elementos do carrossel de avisos.");
        return;
    }

    const colPath = `/artifacts/${appId}/public/data/avisos`;
    const colRef = collection(db, colPath);
    
    console.log("Ouvindo a coleção de avisos:", colPath);

    onSnapshot(colRef, (snapshot) => {
        carouselContainer.innerHTML = ''; 
        
        if (snapshot.empty) {
            console.warn("Nenhum aviso encontrado no Firebase.");
            carouselContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center w-full">Nenhum aviso no momento.</p>`;
            return;
        }

        const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        docs.sort((a, b) => {
            const dateA = a.dataEnvio ? a.dataEnvio.toDate() : new Date(0);
            const dateB = b.dataEnvio ? b.dataEnvio.toDate() : new Date(0);
            return dateB - dateA;
        });

        docs.forEach((data, index) => {
            const titulo = data.titulo || "Sem Título";
            const texto = data.texto || "Sem descrição...";
            const dataFomatada = data.dataEnvio ? dateFormatter.format(data.dataEnvio.toDate()) : "Sem data";
            
            const delay = 300 + (index * 50);

            const cardClone = template.content.cloneNode(true);
            
            cardClone.querySelector('.aviso-data').textContent = dataFomatada;
            cardClone.querySelector('.aviso-titulo').textContent = titulo;
            cardClone.querySelector('.aviso-texto').textContent = texto;
            
            const animatedElement = cardClone.querySelector('.fade-in-up');
            if (animatedElement) {
                animatedElement.style.transitionDelay = `${delay}ms`;
            }

            carouselContainer.appendChild(cardClone);
        });
        
        reativarAnimacoes(carouselContainer);

    }, (error) => {
        console.error("Erro ao buscar avisos:", error);
        carouselContainer.innerHTML = `<p class="text-red-500 text-center w-full">Erro ao carregar avisos.</p>`;
    });
}


// --- 5. LIDAR COM FORMULÁRIO DE CONTATO ---
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const colPath = `/artifacts/${appId}/public/data/contato`;
        const colRef = collection(db, colPath);

        try {
            await addDoc(colRef, {
                nome: name,
                email: email,
                mensagem: message,
                dataEnvio: new Date() 
            });

            console.log("Inscrição enviada com sucesso!");
            
            const formContainer = document.getElementById('form-container');
            const successMessage = document.getElementById('form-success-message');
            const successText = document.getElementById('success-text');
            
            if(successText) {
                successText.textContent = `Valeu, ${name}! Recebemos sua mensagem e entraremos em contato em breve.`;
            }
            
            form.classList.add('hidden');
            successMessage.classList.remove('hidden');

        } catch (error) {
            console.error("Erro ao enviar inscrição:", error);
            submitButton.disabled = false;
            submitButton.textContent = "Erro. Tentar Novamente";
        }
    });
}

// --- 6. FUNÇÃO AUXILIAR PARA REATIVAR ANIMAÇÕES ---
function reativarAnimacoes(container) {
     const animatedElements = container.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
     
     if ('IntersectionObserver' in window) {
         const observer = new IntersectionObserver((entries, observer) => {
             entries.forEach(entry => {
                 if (entry.isIntersecting) {
                     entry.target.classList.add('is-visible');
                     observer.unobserve(entry.target);
                 }
             });
         }, {
             rootMargin: '0px 0px -50px 0px'
         });

         animatedElements.forEach(el => {
             observer.observe(el);
         });
     } else {
         animatedElements.forEach(el => {
             el.classList.add('is-visible');
         });
     }
}