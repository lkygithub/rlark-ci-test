/**
 * Fallback for browsers that do not support the CSS :has() selector
 * (extra.css handles the primary fix).
 *
 * RTD's version-selector JS checks all nav toggle checkboxes, causing
 * the sidebar to appear fully expanded. This script unchecks toggles
 * that are not ancestors of the current page.
 */
(function () {
  // Only run if :has() is not supported (e.g., older Firefox)
  try {
    document.querySelector(':has(*)');
    return; // :has() supported, CSS handles it
  } catch (e) { /* fall through to JS fallback */ }

  function fixNav() {
    var keepChecked = new Set();
    var activeItems = document.querySelectorAll('.md-nav__item--active');
    activeItems.forEach(function (item) {
      var el = item;
      while (el) {
        if (el.classList.contains('md-nav__item--nested')) {
          var toggle = el.querySelector(':scope > .md-nav__toggle');
          if (toggle) {
            keepChecked.add(toggle);
            toggle.checked = true;
          }
        }
        el = el.parentElement;
      }
    });
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      if (!keepChecked.has(t)) {
        t.checked = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fixNav();
    setTimeout(fixNav, 500);
  });
})();