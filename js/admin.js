import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { firebaseConfig } from "./config.js";

// 1. Inicialização Admin
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const appId = firebaseConfig.appId;

// Caminhos das coleções (PADRONIZADOS)
const PROF_COL = `/artifacts/${appId}/public/data/profissionais`;
const AVISOS_COL = `/artifacts/${appId}/public/data/avisos`;

// Autenticação
signInAnonymously(auth).then(() => console.log("Admin Logado")).catch(console.error);

// 2. Adicionar Professor
document.getElementById('add-professor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = "Salvando...";
    btn.disabled = true;

    const nome = document.getElementById('nome').value;
    const cargo = document.getElementById('cargo').value;
    const bio = document.getElementById('bio').value;
    const fileInput = document.getElementById('imgUpload');
    const urlInput = document.getElementById('imgUrl');

    try {
        let finalImgUrl = "";

        // Lógica de Imagem: Arquivo > URL > Placeholder
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const storageRef = ref(storage, `professores/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            finalImgUrl = await getDownloadURL(storageRef);
        } else if (urlInput.value) {
            finalImgUrl = urlInput.value;
        }

        await addDoc(collection(db, PROF_COL), {
            nome, cargo, bio, imgUrl: finalImgUrl, dataCriacao: serverTimestamp()
        });

        alert("Professor adicionado!");
        e.target.reset();
    } catch (error) {
        console.error("Erro ao salvar professor:", error);
        alert("Erro ao salvar. Veja o console.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// 3. Adicionar Aviso
document.getElementById('add-aviso-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('aviso-titulo').value;
    const texto = document.getElementById('aviso-texto').value;

    try {
        await addDoc(collection(db, AVISOS_COL), {
            titulo, texto, dataEnvio: serverTimestamp()
        });
        alert("Aviso publicado!");
        e.target.reset();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar aviso.");
    }
});

// 4. Listar e Deletar Professores
onSnapshot(collection(db, PROF_COL), (snapshot) => {
    const lista = document.getElementById('professores-lista');
    lista.innerHTML = '';
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-gray-50 p-3 rounded border";
        li.innerHTML = `
            <div>
                <span class="font-bold">${data.nome}</span> - <span class="text-sm text-gray-600">${data.cargo}</span>
            </div>
            <button class="text-red-500 font-bold hover:text-red-700 bg-red-100 px-3 py-1 rounded text-sm" data-id="${doc.id}">Excluir</button>
        `;
        
        // Botão de Delete
        li.querySelector('button').addEventListener('click', async () => {
            if(confirm(`Deletar ${data.nome}?`)) {
                await deleteDoc(doc.ref);
            }
        });
        lista.appendChild(li);
    });
});

// 5. Listar e Deletar Avisos
onSnapshot(collection(db, AVISOS_COL), (snapshot) => {
    const lista = document.getElementById('avisos-lista');
    lista.innerHTML = '';
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-gray-50 p-3 rounded border";
        li.innerHTML = `
            <div>
                <span class="font-bold block">${data.titulo}</span>
                <span class="text-xs text-gray-500 truncate max-w-[200px] block">${data.texto}</span>
            </div>
            <button class="text-red-500 font-bold hover:text-red-700 bg-red-100 px-3 py-1 rounded text-sm" data-id="${doc.id}">Excluir</button>
        `;
        
        li.querySelector('button').addEventListener('click', async () => {
            if(confirm("Deletar este aviso?")) {
                await deleteDoc(doc.ref);
            }
        });
        lista.appendChild(li);
    });
});