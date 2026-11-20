/* Generated runtime dictionary. Edit scripts/runtime-i18n.js, then regenerate. */
(function () {
  "use strict";
  if (document.documentElement.lang !== __LANG__) return;
  var dictionary = __DICTIONARY__;
  var keys = Object.keys(dictionary).filter(function (key) {
    return key.length >= 3 && key.length <= 240;
  }).sort(function (a, b) { return b.length - a.length; });
  var pattern = new RegExp("(?<![\\p{L}])(?:" + keys.map(function (key) {
    return key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|") + ")(?![\\p{L}])", "gu");
  var lastText = new WeakMap();
  var lastAttributes = new WeakMap();
  var attrs = ["alt", "aria-label", "placeholder", "title"];

  function translate(value) {
    if (!value) return value;
    var core = value.trim();
    if (Object.prototype.hasOwnProperty.call(dictionary, core)) {
      return value.replace(core, function () { return dictionary[core]; });
    }
    return value.replace(pattern, function (match) { return dictionary[match]; });
  }
  window.TV_t = translate;

  function blocked(node) {
    var element = node.nodeType === 1 ? node : node.parentElement;
    return !element || !!element.closest('script,style,code,pre,noscript,svg,[translate="no"],.notranslate');
  }
  function text(node) {
    if (blocked(node) || lastText.get(node) === node.nodeValue) return;
    var translated = translate(node.nodeValue);
    lastText.set(node, translated);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
  function attributes(node) {
    if (blocked(node)) return;
    var previous = lastAttributes.get(node) || {};
    attrs.forEach(function (attr) {
      var value = node.getAttribute(attr);
      if (value === null || previous[attr] === value) return;
      previous[attr] = translate(value);
      if (previous[attr] !== value) node.setAttribute(attr, previous[attr]);
    });
    lastAttributes.set(node, previous);
  }
  function tree(root) {
    if (root.nodeType === 3) { text(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) attributes(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) text(node);
      else attributes(node);
    }
  }
  // Static HTML is already translated. Only newly rendered/changed copy needs work.
  var initial = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  var node;
  while ((node = initial.nextNode())) {
    if (node.nodeType === 3) lastText.set(node, node.nodeValue);
    else {
      var saved = {};
      attrs.forEach(function (attr) { saved[attr] = node.getAttribute(attr); });
      lastAttributes.set(node, saved);
    }
  }
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "characterData") text(mutation.target);
      if (mutation.type === "attributes") attributes(mutation.target);
      mutation.addedNodes.forEach(tree);
    });
  }).observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attrs});
  window.TV_translate = tree;
})();
