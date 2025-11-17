document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const sunIconMobile = document.getElementById('theme-icon-sun-mobile');
    const moonIconMobile = document.getElementById('theme-icon-moon-mobile');
    const themeTextMobile = document.getElementById('theme-text-mobile');
    
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    // --- 1. LÓGICA DO DARK MODE ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
            sunIconMobile.classList.remove('hidden');
            moonIconMobile.classList.add('hidden');
            themeTextMobile.textContent = 'Modo Claro';
        } else {
            htmlElement.classList.remove('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
            sunIconMobile.classList.add('hidden');
            moonIconMobile.classList.remove('hidden');
            themeTextMobile.textContent = 'Modo Escuro';
        }
    }

    function getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme; 
        }
        return 'light';
    }

    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    function toggleTheme() {
        const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
    
    // --- 2. LÓGICA DO MENU MOBILE ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (mobileMenu) mobileMenu.classList.remove('hidden');
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', () => {
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
    }
    
    if (mobileLinks) {
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu) mobileMenu.classList.add('hidden');
            });
        });
    }
    
    // --- 3. LÓGICA DE ANIMAÇÃO DE SCROLL ---
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');

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

    // --- 4. LÓGICA DO BOTÃO "VOLTAR AO TOPO" ---
    const scrollTopBtn = document.getElementById('back-to-top');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) { 
                scrollTopBtn.classList.add('btn-top-visible');
            } else {
                scrollTopBtn.classList.remove('btn-top-visible');
            }
        });
    }

    // --- 5. LÓGICA DOS BOTÕES DO CARROSSEL (ATUALIZADO) ---
    function setupCarouselButtons(containerId, prevBtnId, nextBtnId) {
        const container = document.getElementById(containerId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (!container || !prevBtn || !nextBtn) {
            console.warn(`Carrossel ${containerId} ou botões não encontrados.`);
            return;
        }

        // Pega o tamanho do card (ou um valor padrão)
        const scrollAmount = (container.querySelector('.snap-center')?.offsetWidth || 350) + 24; // 350 + gap

        prevBtn.addEventListener('click', () => {
            container.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // Ativa os botões para os dois carrosséis
    setupCarouselButtons('avisos-carousel-container', 'avisos-prev', 'avisos-next');
    setupCarouselButtons('profissionais-carousel-container', 'prof-prev', 'prof-next');

});