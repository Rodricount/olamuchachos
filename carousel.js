document.addEventListener('DOMContentLoaded', () => {
    // 1. Get all the carousel elements
    const container = document.querySelector('.carousel-container');
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    
    if (!container || !track || slides.length === 0) {
        console.error("Carousel elements not found. Check HTML structure.");
        return; 
    }

    // --- Core Carousel Variables ---
    let currentSlide = 0; 
    let isDragging = false;
    let startPos = 0;
    let prevTranslate = 0;
    let animationID;

    // 2. Function to read the current X translation from CSS
    const getTranslateX = () => {
        const style = window.getComputedStyle(track);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return matrix.m41; // m41 is the X translation value
    };

    // 3. Function to visually move the track
    const moveToSlide = (index, instant = false) => {
        // Calculate the slide width every time to ensure accuracy
        const slideWidth = slides[0].getBoundingClientRect().width;
        
        // Calculate the target X position in pixels
        const newTransform = -index * slideWidth;
        
        // Set transition property based on 'instant' flag
        track.style.transition = instant ? 'none' : 'transform 0.3s ease-in-out';

        // Apply transformation
        track.style.transform = `translateX(${newTransform}px)`;
        
        // Update the state
        currentSlide = index;
        
        // Update prevTranslate so that drag operations start from the correct position
        prevTranslate = newTransform;
    };
    
    // --- Auto-Sliding & Interval Management ---
    const autoSlide = () => {
        let nextIndex = (currentSlide + 1) % slides.length;
        moveToSlide(nextIndex);
    };
    
    let slideInterval = setInterval(autoSlide, 5000); 
    
    const resetInterval = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(autoSlide, 5000);
    };

    // --- Button Navigation (Fixes for quick double-taps included) ---
    prevButton.addEventListener('click', () => {
        moveToSlide(currentSlide, true); // Fix: Snap instantly to current position before moving
        let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        moveToSlide(prevIndex);
        resetInterval();
    });

    nextButton.addEventListener('click', () => {
        moveToSlide(currentSlide, true); // Fix: Snap instantly to current position before moving
        let nextIndex = (currentSlide + 1) % slides.length;
        moveToSlide(nextIndex);
        resetInterval();
    });

    // --- Drag/Touch Logic Core ---

    function startDrag(clientX) {
        isDragging = true;
        startPos = clientX; 
        prevTranslate = getTranslateX(); 
        track.classList.add('is-dragging'); 
        container.style.cursor = 'grabbing';
        resetInterval(); 
        cancelAnimationFrame(animationID);
    }
    
    function moveDrag(clientX) {
        if (!isDragging) return;
        
        const deltaX = clientX - startPos; 
        const currentTranslate = prevTranslate + deltaX;
        
        // Use requestAnimationFrame for smooth visual updates during drag
        animationID = requestAnimationFrame(() => {
            track.style.transform = `translateX(${currentTranslate}px)`;
        });
    }

    function endDrag(clientX) {
        if (!isDragging) return;
        
        cancelAnimationFrame(animationID);
        isDragging = false;
        track.classList.remove('is-dragging'); 
        container.style.cursor = 'grab';

        const finalTranslate = getTranslateX();
        const movedBy = finalTranslate - prevTranslate;
        const slideWidth = slides[0].getBoundingClientRect().width; 
 
        if (Math.abs(movedBy) > slideWidth * 0.05) {   
            if (movedBy > 0) {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            } 
            // Dragged left (movedBy is negative) -> Go to next slide
            else {
                currentSlide = (currentSlide + 1) % slides.length;
            }
        }
        
        // Snap the track to the calculated final slide
        moveToSlide(currentSlide);
    }


    // 4. Mouse Listeners (Desktop)
    container.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        startDrag(e.clientX);
        
        // Attach move/up listeners to the whole document for robust drag handling
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Handlers for document listeners
    function handleMouseMove(e) {
        moveDrag(e.clientX);
    }
    function handleMouseUp(e) {
        endDrag(e.clientX);
        // Important: Remove the document listeners after the drag ends
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    // 5. Touch Listeners (Mobile)
    container.addEventListener('touchstart', (e) => {
        startDrag(e.touches[0].clientX);
    });

    container.addEventListener('touchmove', (e) => {
        moveDrag(e.touches[0].clientX);
    });

    container.addEventListener('touchend', (e) => {
        // Use the final clientX from the touch that ended
        endDrag(e.changedTouches[0].clientX);
    });

    // 6. Window Resize Handler
    window.addEventListener('resize', () => {
        // Ensure the current slide is correctly positioned after resize
        moveToSlide(currentSlide, true); 
    });

    // Initial setup: start on the first slide
    moveToSlide(0, true); 

});
