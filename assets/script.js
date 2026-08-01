(function () {

    const slides =
        document.querySelectorAll(
            ".gx-screen-slide"
        );

    const buttons =
        document.querySelectorAll(
            ".gx-slide"
        );

    let current = 0;

    function showSlide(index) {

        slides.forEach(
            slide =>
                slide.classList.remove("active")
        );

        buttons.forEach(
            button =>
                button.classList.remove("active")
        );

        slides[index].classList.add("active");
        buttons[index].classList.add("active");

        current = index;
    }

    buttons.forEach(
        (button, index) => {

            button.addEventListener(
                "click",
                () => showSlide(index)
            );

        }
    );


    // Automatic presentation

    setInterval(() => {

        current =
            (current + 1) %
            slides.length;

        showSlide(current);

    }, 5000);


    // Touch swipe

    let startX = 0;

    const screen =
        document.querySelector(
            ".gx-device-screen"
        );

    screen.addEventListener(
        "touchstart",
        event => {

            startX =
                event.touches[0].clientX;

        },
        { passive: true }
    );

    screen.addEventListener(
        "touchend",
        event => {

            const endX =
                event.changedTouches[0].clientX;

            const distance =
                startX - endX;

            if (Math.abs(distance) < 50)
                return;

            if (distance > 0) {

                current =
                    (current + 1) %
                    slides.length;

            } else {

                current =
                    (current - 1 +
                    slides.length) %
                    slides.length;

            }

            showSlide(current);

        },
        { passive: true }
    );

})();

