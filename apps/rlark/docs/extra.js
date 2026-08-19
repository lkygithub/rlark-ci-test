/**
 * Fix RTD-injected JS that expands all navigation sections on initial load.
 * RTD's version-selector script checks all nav toggle checkboxes, causing
 * the sidebar to appear fully expanded on the homepage.
 * This script runs after the page loads and unchecks all nav toggles.
 */
document.addEventListener('DOMContentLoaded', function () {
  requestAnimationFrame(function () {
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      t.checked = false;
    });
  });
});