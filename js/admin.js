import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// ATUALIZAÇÃO: Importar o Storage
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- 1. INICIALIZAÇÃO E AUTENTICAÇÃO ---
const firebaseConfig = {
  apiKey: "AIzaSyBsL8FE4ygY0-SyW6vcseUfRZIcrO5OyaY",
  authDomain: "teste-nucleo-ingles.firebaseapp.com",
  projectId: "teste-nucleo-ingles",
  storageBucket: "teste-nucleo-ingles.firebasestorage.app", // IMPORTANTE: Tem que estar certo
  messagingSenderId: "577482236590",
  appId: "1:577482236590:web:e49672ee452c97bba1033f"
};

const appId = firebaseConfig.appId; 
let db;
let auth;
let app;
let storage; // ATUALIZAÇÃO: Variável do Storage

// Caminhos
const colPath = `/artifacts/${appId}/public/data/profissionais`;
const colPathAvisos = `/artifacts/${appId}/public/data/avisos`; 
let colRef;
let colRefAvisos;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app); // ATUALIZAÇÃO: Ligar o Storage
    
    console.log("Admin: Firebase App ID:", appId);
    console.log("Admin: Auth, Firestore e Storage inicializados.");

    await signInAnonymously(auth);

} catch (error) {
    console.error("Admin: Erro ao inicializar Firebase:", error);
    alert("ERRO FATAL: Não foi possível conectar ao Firebase. Verifique o console.");
}

// --- 2. LÓGICA SÓ RODA DEPOIS DE AUTENTICAR ---
onAuthStateChanged(auth, (user) => {
// ... (Essa parte continua igual)
    if (user) {
        console.log("Admin: Usuário autenticado:", user.uid);
        
        colRef = collection(db, colPath);
        colRefAvisos = collection(db, colPathAvisos);

        // Funções de Professores
        loadProfessoresAdmin();
        setupAddForm();

        // Funções de Avisos
        loadAvisosAdmin();
        setupAddAvisoForm();

    } else {
        console.log("Admin: Usuário não autenticado.");
    }
});

// --- 3. CARREGAR E MOSTRAR PROFESSORES NA LISTA ---
// ... (Essa função continua 100% igual)
function loadProfessoresAdmin() {
    const lista = document.getElementById('professores-lista');
    const loadingMsg = document.getElementById('lista-loading');

    if (!lista || !loadingMsg) return;

    console.log("Admin: Ouvindo a coleção:", colPath);

    onSnapshot(colRef, (snapshot) => {
        lista.innerHTML = ''; 
        loadingMsg.classList.add('hidden'); 

        if (snapshot.empty) {
            lista.innerHTML = `<li class="text-gray-500">Nenhum professor cadastrado.</li>`;
            return;
        }

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id; 

            const item = document.createElement('li');
            item.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm';
            
            item.innerHTML = `
                <div>
                    <strong class="text-lg">${data.nome || "Sem nome"}</strong>
                    <span class="text-sm text-gray-600 block">${data.cargo || "Sem cargo"}</span>
                </div>
                <button data-id="${docId}" class="btn-delete-professor btn-delete">Deletar</button>
            `;
            
            lista.appendChild(item);
        });

        setupProfessorDeleteButtons(); 

    }, (error) => {
        console.error("Admin: Erro ao buscar professores:", error);
        loadingMsg.textContent = "Erro ao carregar lista.";
        loadingMsg.classList.remove('hidden');
    });
}

// --- 4. CONFIGURAR O FORMULÁRIO DE ADICIONAR PROFESSOR (GRANDE ATUALIZAÇÃO AQUI) ---
function setupAddForm() {
    const form = document.getElementById('add-professor-form');
    if (!form) return;

    const submitButton = document.getElementById('submit-button');
    const successMsg = document.getElementById('form-success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitButton.disabled = true;
        submitButton.textContent = "Salvando...";
        successMsg.classList.add('hidden');

        // Pegar os dados do formulário
        const nome = document.getElementById('nome').value;
        const cargo = document.getElementById('cargo').value;
        const bio = document.getElementById('bio').value;
        
        // ATUALIZAÇÃO: Pegar as DUAS opções
        const file = document.getElementById('imgUpload').files[0]; 
        const imgUrlLink = document.getElementById('imgUrl').value; 

        let imgUrlParaSalvar = ""; // Começa vazia

        try {
            // REGRA 1: O Tio mandou um ARQUIVO? (Isso tem prioridade)
            if (file) {
                submitButton.textContent = "Enviando foto...";
                
                const filePath = `professores/${crypto.randomUUID()}-${file.name}`;
                const storageRef = ref(storage, filePath);
                await uploadBytes(storageRef, file);
                imgUrlParaSalvar = await getDownloadURL(storageRef);
                
                console.log("Admin: Foto enviada (Upload).");
            } 
            // REGRA 2: Não mandou arquivo, MAS mandou um LINK?
            else if (imgUrlLink) { 
                imgUrlParaSalvar = imgUrlLink;
                console.log("Admin: Foto enviada (Link).");
            }
            // REGRA 3: Não mandou nem arquivo nem link.
            // imgUrlParaSalvar continua "", e o firebase.js do site principal vai botar o placeholder.


            // Salva tudo no BANCO (Firestore)
            submitButton.textContent = "Salvando dados...";
            await addDoc(colRef, {
                nome: nome,
                cargo: cargo,
                bio: bio,
                imgUrl: imgUrlParaSalvar // Salva o link (do upload ou do link) ou ""
            });

            console.log("Admin: Professor salvo!");
            form.reset(); 
            successMsg.classList.remove('hidden'); 

            setTimeout(() => successMsg.classList.add('hidden'), 3000);

        } catch (error) {
            console.error("Admin: Erro ao salvar professor:", error);
            alert("Erro ao salvar: " + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Salvar Professor";
        }
    });
}

// --- 5. CONFIGURAR OS BOTÕES DE DELETAR PROFESSOR ---
// ... (Essa função continua 100% igual)
function setupProfessorDeleteButtons() {
    const buttons = document.querySelectorAll('.btn-delete-professor');
    
    buttons.forEach(button => {
        button.onclick = async (e) => {
            const docId = e.target.dataset.id;
            
            if (!confirm(`Tem certeza que quer deletar esse PROFESSOR?\n(ID: ${docId})`)) {
                return;
            }

            console.log("Admin: Deletando PROFESSOR:", docId);
            
            try {
                // (Futuramente, a gente tem que deletar a FOTO do Storage também, mas foda-se por agora)
                const docRef = doc(db, colPath, docId); 
                await deleteDoc(docRef);
                console.log("Admin: Professor deletado.");
            } catch (error) {
                console.error("Admin: Erro ao deletar:", error);
                alert("Erro ao deletar: " + error.message);
            }
        };
    });
}


// --- 6. FUNÇÕES NOVAS PARA AVISOS ---
// ... (Toda essa parte de Avisos continua 100% igual)

function loadAvisosAdmin() {
    const lista = document.getElementById('avisos-lista');
    const loadingMsg = document.getElementById('aviso-lista-loading');

    if (!lista || !loadingMsg) return;

    console.log("Admin: Ouvindo a coleção de Avisos:", colPathAvisos);

    onSnapshot(colRefAvisos, (snapshot) => {
        lista.innerHTML = ''; 
        loadingMsg.classList.add('hidden'); 

        if (snapshot.empty) {
            lista.innerHTML = `<li class="text-gray-500">Nenhum aviso cadastrado.</li>`;
            return;
        }

        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        docs.sort((a, b) => {
            const dateA = a.dataEnvio ? a.dataEnvio.toDate() : new Date(0);
            const dateB = b.dataEnvio ? b.dataEnvio.toDate() : new Date(0);
            return dateB - dateA;
        });


        docs.forEach((data) => {
            const docId = data.id; 

            const item = document.createElement('li');
            item.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm';
            
            item.innerHTML = `
                <div>
                    <strong class="text-lg">${data.titulo || "Sem Título"}</strong>
                    <span class="text-sm text-gray-600 block">${data.texto ? data.texto.substring(0, 50) + '...' : "Sem texto"}</span>
                </div>
                <button data-id="${docId}" class="btn-delete-aviso btn-delete">Deletar</button>
            `;
            
            lista.appendChild(item);
        });

        setupAvisoDeleteButtons();

    }, (error) => {
        console.error("Admin: Erro ao buscar avisos:", error);
        loadingMsg.textContent = "Erro ao carregar lista de avisos.";
        loadingMsg.classList.remove('hidden');
    });
}

function setupAddAvisoForm() {
    const form = document.getElementById('add-aviso-form');
    if (!form) return;

    const submitButton = document.getElementById('aviso-submit-button');
    const successMsg = document.getElementById('aviso-form-success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitButton.disabled = true;
        submitButton.textContent = "Salvando...";
        successMsg.classList.add('hidden');

        const titulo = document.getElementById('aviso-titulo').value;
        const texto = document.getElementById('aviso-texto').value;

        try {
            await addDoc(colRefAvisos, {
                titulo: titulo,
                texto: texto,
                dataEnvio: new Date() 
            });

            console.log("Admin: Aviso salvo!");
            form.reset(); 
            successMsg.classList.remove('hidden');

            setTimeout(() => successMsg.classList.add('hidden'), 3000);

        } catch (error) {
            console.error("Admin: Erro ao salvar aviso:", error);
            alert("Erro ao salvar: " + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Salvar Aviso";
        }
    });
}

function setupAvisoDeleteButtons() {
    const buttons = document.querySelectorAll('.btn-delete-aviso');
    
    buttons.forEach(button => {
        button.onclick = async (e) => {
            const docId = e.target.dataset.id;
            
            if (!confirm(`Tem certeza que quer deletar esse AVISO?\n(ID: ${docId})`)) {
                return;
            }

            console.log("Admin: Deletando AVISO:", docId);
            
            try {
                const docRef = doc(db, colPathAvisos, docId); 
                await deleteDoc(docRef);
                console.log("Admin: Aviso deletado.");
            } catch (error) {
                console.error("Admin: Erro ao deletar aviso:", error);
                alert("Erro ao deletar: " + error.message);
            }
        };
    });
}