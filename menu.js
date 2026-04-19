const headerContainer = document.querySelector('.header__container');
const nav = document.querySelector('.nav');

if (headerContainer && nav) {
    const burgerButton = document.createElement('button');
    burgerButton.className = 'burger-btn';
    burgerButton.type = 'button';
    burgerButton.setAttribute('aria-label', 'Открыть меню');
    burgerButton.setAttribute('aria-expanded', 'false');
    burgerButton.innerHTML = '<span></span><span></span><span></span>';

    const logo = headerContainer.querySelector('.logo');
    if (logo) {
        logo.insertAdjacentElement('afterend', burgerButton);
    } else {
        headerContainer.prepend(burgerButton);
    }

    const closeMenu = () => {
        nav.classList.remove('nav--open');
        burgerButton.classList.remove('burger-btn--active');
        burgerButton.setAttribute('aria-expanded', 'false');
    };

    burgerButton.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav--open');
        burgerButton.classList.toggle('burger-btn--active', isOpen);
        burgerButton.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('.nav__link').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
        if (!headerContainer.contains(event.target)) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}
