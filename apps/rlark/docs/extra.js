/**
 * Prevent RTD-injected JS from expanding all navigation sections.
 *
 * RTD's version-selector script checks all nav toggle checkboxes, causing
 * the sidebar to appear fully expanded. This script uses a MutationObserver
 * to watch for attribute changes on nav toggles and reverts any check that
 * is not on the current page's ancestor path.
 *
 * User-initiated clicks on nav labels are detected and allowed to pass
 * through, so the native expand/collapse behavior works correctly.
 */
(function () {
  var reverting = false;
  var userClicked = null;

  // Detect user clicks on nav labels (the arrow / section title)
  document.addEventListener('click', function (e) {
    var label = e.target.closest('.md-nav__link');
    if (!label) return;
    var li = label.closest('.md-nav__item--nested');
    if (!li) return;
    var toggle = li.querySelector(':scope > .md-nav__toggle');
    if (toggle) {
      userClicked = toggle;
      // clear the flag after the click event chain completes
      setTimeout(function () { userClicked = null; }, 0);
    }
  }, true); // capture phase: fire before the checkbox changes

  function isInActivePath(toggle) {
    var li = toggle.closest('.md-nav__item--nested');
    if (!li) return true;
    if (li.classList.contains('md-nav__item--active')) return true;
    if (li.querySelector('.md-nav__item--active')) return true;
    return false;
  }

  function revertIfNeeded(toggle) {
    if (reverting) return;
    if (toggle === userClicked) return; // user clicked, allow
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