/**
 * Prevent RTD-injected JS from expanding all navigation sections.
 *
 * RTD's version-selector script checks all nav toggle checkboxes, causing
 * the sidebar to appear fully expanded. This script uses a MutationObserver
 * to watch for attribute changes on nav toggles and reverts any check that
 * is not on the current page's ancestor path.
 *
 * Unlike setTimeout-based approaches, MutationObserver fires in real time
 * whenever RTD's JS modifies the DOM, so timing is never an issue.
 */
(function () {
  var reverting = false;

  function isInActivePath(toggle) {
    var li = toggle.closest('.md-nav__item--nested');
    if (!li) return true; // not a nested item, allow
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
    mutations.forEach(function (m) {
      if (m.type === 'attributes' && m.attributeName === 'checked') {
        revertIfNeeded(m.target);
      }
    });
  });

  function observeAll() {
    document.querySelectorAll('.md-nav__toggle').forEach(function (t) {
      observer.observe(t, { attributes: true, attributeFilter: ['checked'] });
      revertIfNeeded(t);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }
})();