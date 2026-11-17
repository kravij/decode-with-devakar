/* DWD media additions — mounts the launch gallery after the author section
   and wires a native <dialog> lightbox. No third-party dependencies. */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var template = document.getElementById('dwd-gallery-template');
  var dialog = document.getElementById('dwd-lightbox');

  if (!root || !template || !dialog) return;

  function mountGallery() {
    var main = root.querySelector('main');
    var author = root.querySelector('#author');
    if (!main || !author || main.querySelector('.dwd-media')) return false;

    var gallery = template.content.firstElementChild.cloneNode(true);
    author.insertAdjacentElement('afterend', gallery);
    wireLightbox(gallery);
    return true;
  }

  function wireLightbox(gallery) {
    var media = dialog.querySelector('.dwd-lb-media');
    var close = dialog.querySelector('.dwd-lb-close');
    var tiles = Array.prototype.slice.call(gallery.querySelectorAll('.dwd-tile'));
    var current = -1;
    var lastFocus = null;
    var touchStart = null;
    var suppressBackdropCloseUntil = 0;

    function itemFromTile(tile) {
      var img = tile.querySelector('img');
      return {
        type: tile.getAttribute('data-type') || 'image',
        src: tile.getAttribute('data-src') || (img && img.getAttribute('src')),
        poster: tile.getAttribute('data-poster') || '',
        alt: (img && img.getAttribute('alt')) || ''
      };
    }

    function show(index) {
      current = index;
      var item = itemFromTile(tiles[index]);
      media.replaceChildren();

      if (item.type === 'video') {
        var video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        if (item.poster) video.poster = item.poster;
        var source = document.createElement('source');
        source.src = item.src;
        source.type = 'video/mp4';
        video.appendChild(source);
        media.appendChild(video);
      } else {
        var img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.decoding = 'async';
        media.appendChild(img);
      }
    }

    function step(delta) {
      if (!tiles.length) return;
      show((current + delta + tiles.length) % tiles.length);
    }

    function stopVideo() {
      var video = media.querySelector('video');
      if (video) {
        video.pause();
        media.replaceChildren();
      }
    }

    tiles.forEach(function (tile, index) {
      tile.addEventListener('click', function () {
        lastFocus = tile;
        show(index);
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      });
    });

    close.addEventListener('click', function () { dialog.close(); });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog && Date.now() > suppressBackdropCloseUntil) dialog.close();
    });

    // Horizontal swipe navigation. Listeners stay passive so vertical page
    // scrolling and native video controls keep their normal behaviour.
    dialog.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1) { touchStart = null; return; }
      var target = event.target;
      if (target && target.closest && target.closest('button, a, input, select, textarea')) {
        touchStart = null;
        return;
      }
      var touch = event.touches[0];
      if (target && target.tagName === 'VIDEO') {
        var box = target.getBoundingClientRect();
        var controlZone = Math.min(64, box.height * 0.3);
        if (touch.clientY > box.bottom - controlZone) { touchStart = null; return; }
      }
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    dialog.addEventListener('touchend', function (event) {
      if (!touchStart || !event.changedTouches.length) { touchStart = null; return; }
      var start = touchStart;
      touchStart = null;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - start.x;
      var dy = touch.clientY - start.y;
      if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      suppressBackdropCloseUntil = Date.now() + 500;
      step(dx < 0 ? 1 : -1);
    }, { passive: true });

    dialog.addEventListener('touchcancel', function () { touchStart = null; }, { passive: true });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });

    dialog.addEventListener('close', function () {
      stopVideo();
      if (lastFocus) lastFocus.focus();
    });
  }

  if (!mountGallery()) {
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (mountGallery() || tries > 120) {
        window.clearInterval(timer);
      }
    }, 50);
  }
})();
