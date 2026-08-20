/**
 * Prevent RTD-injected JS from expanding all navigation sections.
 *
 * RTD's version-selector script checks all nav toggle checkboxes on page
 * load. This script uses a MutationObserver to revert those checks during
 * the initial setup phase, then disconnects so the user can freely
 * expand/collapse sections afterward.
 *
 * Strategy:
 * 1. Watch for attribute changes on nav toggles and revert RTD's checks.
 * 2. After a short delay, disconnect the observer so user interactions
 *    are no longer intercepted.
 * 3. One final cleanup pass to fix any remaining incorrect state.
 */
(function () {
  var reverting = false;
  var checkCount = 0;
  var MAX_CHECK_BATCH = 30; // RTD checks at most ~15 toggles per page

  function isInActivePath(toggle) {
    var li = toggle.closest('.md-nav__item--nested');
    if (!li) return true;
    if (li.classList.contains('md-nav__item--active')) return true;
    if (li.querySelector('.md-nav__item--active')) return true;
    return false;
  }

  function revertIfNeeded(toggle) {
    if (reverting) return;
    if (toggle.checked && !isInActivePath(toggle)) {
      reverting = true;
      toggle.checked = false;
      reverting = false;
    }
  }

  var observer = new MutationObserver(function (mutations) {
    var shouldDisconnect = false;
    mutations.forEach(function (m) {
      if (m.type === 'attributes' && m.attributeName === 'checked') {
        checkCount++;
        if (checkCount > MAX_CHECK_BATCH) {
          shouldDisconnect = true;
          return;
        }
        revertIfNeeded(m.target);
      }
    });
    if (shouldDisconnect) {
      observer.disconnect();
    }
  });

  function fixAll() {
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      revertIfNeeded(t);
    });
  }

  function observeAll() {
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      observer.observe(t, { attributes: true, attributeFilter: ['checked'] });
      revertIfNeeded(t);
    });
  }

  function start() {
    observeAll();
    // Disconnect after RTD's JS is done (300ms is enough for the version
    // selector injection; the check-count limit also acts as a safety net).
    setTimeout(function () {
      observer.disconnect();
      fixAll();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();