// Fix: RTD readthedocs-addons.js prevents mkdocs-material bundle from
// changing the html class from "no-js" to "js", which breaks the
// collapsible sidebar navigation.
(function() {
  var html = document.documentElement;
  if (html.className.indexOf('no-js') !== -1) {
    html.className = html.className.replace('no-js', 'js');
  }
})();