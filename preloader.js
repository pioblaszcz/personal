// Gets percent that document has loaded
(function () {
    let loadedImages = 0;
    let totalImages = document.images.length;
    let checkInterval;
    
    // Calculates document load progress based on performance.getEntriesByType("resource")
    function getResourceProgress() {
        const resources = performance.getEntriesByType("resource");
        const total = resources.length;
        let loaded = 0;

        if (total === 0) return 100; // Assume full load if no resources are tracked

        resources.forEach((resource) => {
            if (resource.responseEnd) loaded++;
        });

        return Math.round((loaded / total) * 100);
    }

    // Calculates document load progress based on document.readyState
    function getDocumentProgress() {
        if (document.readyState === "loading") return 25;
        if (document.readyState === "interactive") return 75;
        if (document.readyState === "complete") return 100;
        return 0;
    }

    // Calculates document load progress based on amount of images that have loaded
    function getImageProgress() {
        if (totalImages === 0) return 100; // No images, assume fully loaded
        return Math.round((loadedImages / totalImages) * 100);
    }

    // Averages the percentages and calculates weight of each percentage
    function calculateOverallProgress() {
        let docProgress = getDocumentProgress();
        let resProgress = getResourceProgress();
        let imgProgress = getImageProgress();

        // Weighted average (adjust weights as needed)
        let overallProgress = Math.round(
            docProgress * 0.4 + resProgress * 0.4 + imgProgress * 0.2
        );

        updatePreloader(overallProgress);
        return overallProgress;
    }

    // Update loadedImages based on, well, how many images have loaded
    function trackImageLoading() {
        if (totalImages === 0) return;

        Array.from(document.images).forEach((img) => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener("load", () => {
                    loadedImages++;
                });
                img.addEventListener("error", () => {
                    loadedImages++; // Still count as loaded to avoid infinite wait
                });
            }
        });
    }

    // Recalculate document load progress on ready state change
    document.onreadystatechange = function () {
        calculateOverallProgress();
    };

    // Recalculate document load progress on DOMContentLoaded
    window.addEventListener("DOMContentLoaded", () => {
        trackImageLoading();
        calculateOverallProgress();
    });

    // Recalculate document load progress on window.load
    window.addEventListener("load", () => {
        calculateOverallProgress();
        clearInterval(checkInterval);
        removePreloader(); // Ensure preloader is removed on full page load
    });

    // Run calculations every 1000ms
    checkInterval = setInterval(() => {
        let progress = calculateOverallProgress();
        if (progress >= 100) {
            removePreloader();
            clearInterval(checkInterval);
        }
    }, 100);
})();

// Updates preloader counter
function updatePreloader(value) {
    // Checks if number is an integer between 0-100
    if (typeof value !== "number" || value < 0 || value > 100) {
        console.error("Value must be an integer between 0 and 100.");
        return;
    }

    // Compute cumulative translations
    let onesTranslation = value * -2;  // Ones place moves -2ch per percent
    let tensTranslation = Math.floor(value / 10) * -2; // Tens place moves -2ch per 10%
    let hundredsTranslation = Math.floor(value / 100) * -2; // Hundreds place moves -2ch per 100%

    // Apply translations
    document.querySelector("#number-track-100").style.transform = `translateY(${hundredsTranslation}ch)`;
    document.querySelector("#number-track-10").style.transform = `translateY(${tensTranslation}ch)`;
    document.querySelector("#number-track-1").style.transform = `translateY(${onesTranslation}ch)`;
}

// Activates welcome animation
function removePreloader() {
    setTimeout(() => {
        // Scales everything by 1.2
        document.querySelector('p').style.transform = 'scale(1.2)';
        setTimeout(() => {
            // Moves 'welcome' text up
            const tracks = document.querySelectorAll("#preloader > p > span");
            tracks.forEach((track, index) => {
                setTimeout(() => {
                    let currentTransform = track.style.transform || "translateY(0ch)";
                    let currentY = parseFloat(currentTransform.match(/-?\d+/)) || 0;
                    track.style.transform = `translateY(${currentY - 2}ch)`;
                }, index * 50);
            });

            
        }, 700);
    }, 1000);

    setTimeout(() => {
        document.querySelector("#preloader").style.opacity = 0;
        setTimeout(() => {
            document.querySelector("#preloader").remove();
        }, 1000);
    }, 3700);
}
