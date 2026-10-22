(() => {
  if (window.msHeroSliderScriptInitialized) return;
  window.msHeroSliderScriptInitialized = true;

  const loadSwiper = (source) => {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (window.msHeroSwiperPromise) return window.msHeroSwiperPromise;

    window.msHeroSwiperPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = () => resolve(window.Swiper);
      script.onerror = () => reject(new Error(`Unable to load Swiper from ${source}`));
      document.head.append(script);
    });

    return window.msHeroSwiperPromise;
  };

  const initializeSlider = (slider) => {
    if (!(slider instanceof HTMLElement) || slider.swiper) return;
    if (slider.querySelectorAll('.swiper-slide').length < 2) return;

    loadSwiper(slider.dataset.swiperSrc)
      .then((Swiper) => {
        if (slider.isConnected && !slider.swiper) {
          new Swiper(slider, {
            slidesPerView: 1.12,
            spaceBetween: 12,
            speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700,
            threshold: 5,
            grabCursor: true,
            simulateTouch: true,
            allowTouchMove: true,
            watchOverflow: true,
            keyboard: {
              enabled: true,
              onlyInViewport: true,
            },
            a11y: {
              enabled: true,
            },
            breakpoints: {
              750: {
                slidesPerView: 1.08,
                spaceBetween: 16,
              },
            },
          });
        }
      })
      .catch((error) => {
        console.error('Hero slider initialization failed.', error);
      });
  };

  const initializeSliders = (container = document) => {
    if (!(container instanceof Element || container instanceof Document)) return;

    if (container instanceof Element && container.matches('.ms-hero-slider')) {
      initializeSlider(container);
    }

    container.querySelectorAll('.ms-hero-slider').forEach(initializeSlider);
  };

  initializeSliders();

  document.addEventListener('shopify:section:load', (event) => {
    initializeSliders(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    if (!(event.target instanceof Element)) return;

    const sliders = [];
    if (event.target.matches('.ms-hero-slider')) sliders.push(event.target);
    sliders.push(...event.target.querySelectorAll('.ms-hero-slider'));

    sliders.forEach((slider) => {
      slider.swiper?.destroy(true, true);
    });
  });
})();
