// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    if (menuToggle && mainNav && modalOverlay) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
            modalOverlay.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        });

        modalOverlay.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close menu on window resize if it's open (prevents menu staying open when switching to desktop)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1023 && mainNav.classList.contains('active')) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Add touch event listeners for better mobile experience
    if (mainNav) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        mainNav.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        mainNav.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        // Handle swipe gesture to close menu
        function handleSwipe() {
            const swipeThreshold = 100;
            if (touchEndX - touchStartX > swipeThreshold) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
});