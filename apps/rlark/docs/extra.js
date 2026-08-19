/**
 * Fix RTD-injected JS that expands all navigation sections.
 * RTD's version-selector script checks all nav toggle checkboxes, causing
 * the sidebar to appear fully expanded on every page.
 *
 * This script unchecks toggles that are NOT ancestors of the current page,
 * so the current page's path stays expanded while everything else collapses.
 */
document.addEventListener('DOMContentLoaded', function () {
  requestAnimationFrame(function () {
    // Collect toggles that are ancestors of active nav items
    var keepChecked = new Set();
    var activeItems = document.querySelectorAll('.md-nav__item--active');
    activeItems.forEach(function (item) {
      var el = item.parentElement;
      while (el) {
        if (el.classList.contains('md-nav')) {
          var toggle = el.parentElement.querySelector(':scope > .md-nav__toggle');
          if (toggle) {
            keepChecked.add(toggle);
            toggle.checked = true;  // ensure it stays checked
          }
          el = el.parentElement;
        } else {
          break;
        }
      }
    });

    // Uncheck all toggles except those in the current page's path
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      if (!keepChecked.has(t)) {
        t.checked = false;
      }
    });
  });
});