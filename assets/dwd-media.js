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
    var caption = dialog.querySelector('.dwd-lb-caption');
    var prev = dialog.querySelector('.dwd-lb-prev');
    var next = dialog.querySelector('.dwd-lb-next');
    var close = dialog.querySelector('.dwd-lb-close');
    var tiles = Array.prototype.slice.call(gallery.querySelectorAll('.dwd-tile'));
    var current = -1;
    var lastFocus = null;

    function itemFromTile(tile) {
      var img = tile.querySelector('img');
      return {
        type: tile.getAttribute('data-type') || 'image',
        src: tile.getAttribute('data-src') || (img && img.getAttribute('src')),
        poster: tile.getAttribute('data-poster') || '',
        caption: tile.getAttribute('data-caption') || (img && img.getAttribute('alt')) || ''
      };
    }

    function show(index) {
      current = index;
      var item = itemFromTile(tiles[index]);
      media.replaceChildren();
      caption.textContent = item.caption;

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
        img.alt = item.caption;
        img.decoding = 'async';
        media.appendChild(img);
      }

      var multiple = tiles.length > 1;
      prev.hidden = !multiple;
      next.hidden = !multiple;
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
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

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
