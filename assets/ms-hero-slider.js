(() => {
  if (window.msHeroSliderScriptInitialized) return;
  window.msHeroSliderScriptInitialized = true;

  let swiperPromise;

  const loadSwiper = (source) => {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (!source) return Promise.reject(new Error('The hero slider is missing its Swiper source.'));
    if (swiperPromise) return swiperPromise;

    swiperPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = () => {
        if (window.Swiper) {
          resolve(window.Swiper);
        } else {
          reject(new Error(`Swiper did not initialize from ${source}.`));
        }
      };
      script.onerror = () => reject(new Error(`Unable to load Swiper from ${source}.`));
      document.head.append(script);
    });

    return swiperPromise;
  };

  const initializeSlider = (slider) => {
    if (!(slider instanceof HTMLElement) || slider.swiper) return;

    const swiperElement = slider.querySelector('.swiper');
    const slideCount = slider.querySelectorAll('.swiper-slide').length;
    if (!swiperElement || slideCount < 2) return;

    loadSwiper(slider.dataset.swiperSrc)
      .then((Swiper) => {
        if (!slider.isConnected || slider.swiper) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const inThemeEditor = Boolean(window.Shopify && window.Shopify.designMode);
        const previousButton = slider.querySelector('.ms-hero-slider__arrow--prev');
        const nextButton = slider.querySelector('.ms-hero-slider__arrow--next');
        const pagination = slider.querySelector('.ms-hero-slider__pagination');

        slider.swiper = new Swiper(swiperElement, {
          slidesPerView: 'auto',
          spaceBetween: Number(slider.dataset.spaceBetween) || 14,
          speed: reducedMotion ? 0 : Number(slider.dataset.speed) || 600,
          loop: slider.dataset.loop === 'true' && slideCount > 1,
          allowTouchMove: slideCount > 1,
          grabCursor: slideCount > 1,
          watchOverflow: true,
          autoplay:
            slider.dataset.autoplay === 'true' && !reducedMotion && !inThemeEditor
              ? {
                  delay: Number(slider.dataset.delay) || 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false,
          navigation:
            previousButton && nextButton
              ? {
                  prevEl: previousButton,
                  nextEl: nextButton,
                  disabledClass: 'ms-is-disabled',
                }
              : false,
          pagination: pagination
            ? {
                el: pagination,
                clickable: true,
                bulletClass: 'ms-hero-slider__bullet',
                bulletActiveClass: 'ms-is-active',
                renderBullet(index, className) {
                  const slideLabel = (slider.dataset.slideLabel || 'Slide {index} of {length}')
                    .replace('{index}', String(index + 1))
                    .replace('{length}', String(slideCount));
                  const escapedLabel = slideLabel
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                  return `<button type="button" class="${className}" aria-label="${escapedLabel}"></button>`;
                },
              }
            : false,
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
        });
      })
      .catch((error) => {
        console.error('Hero slider initialization failed.', error);
      });
  };

  const initializeSliders = (container = document) => {
    if (!(container instanceof Element || container instanceof Document)) return;

    if (container instanceof Element && container.matches('.ms-hero-slider__carousel')) {
      initializeSlider(container);
    }

    container.querySelectorAll('.ms-hero-slider__carousel').forEach(initializeSlider);
  };

  initializeSliders();

  document.addEventListener('shopify:section:load', (event) => {
    initializeSliders(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    if (!(event.target instanceof Element)) return;

    const sliders = [];
    if (event.target.matches('.ms-hero-slider__carousel')) sliders.push(event.target);
    sliders.push(...event.target.querySelectorAll('.ms-hero-slider__carousel'));
    sliders.forEach((slider) => slider.swiper?.destroy(true, true));
  });

  document.addEventListener('shopify:block:select', (event) => {
    if (!(event.target instanceof Element)) return;

    const slide = event.target.closest('.ms-hero-slide');
    const slider = slide?.closest('.ms-hero-slider__carousel');
    if (!slide || !slider?.swiper) return;

    const loopIndex = slide.getAttribute('data-swiper-slide-index');
    const slideIndex = loopIndex === null ? Array.from(slide.parentElement.children).indexOf(slide) : Number(loopIndex);
    slider.swiper.slideTo(slideIndex, 0);
    slider.swiper.autoplay?.stop();
  });
})();
