/**
 * Created by thram on 10/12/15.
 */
require('gsap/src/uncompressed/plugins/CSSPlugin');
var TweenLite   = require('gsap/src/uncompressed/TweenLite');
var transitions = {
  enter: function (element, time, callback) {
    TweenLite.fromTo(element, time, {opacity: 0, top: -element.offsetHeight + "px"}, {
      top       : 0,
      opacity   : 1,
      onComplete: callback
    })
    ;
  },
  leave: function (element, time, callback) {
    TweenLite.fromTo(element, time, {opacity: 1}, {
      opacity   : 0,
      onComplete: callback
    });
  },
  show : function (tag, view, data) {
    if (tag.view) {
      tag.trigger('hide:' + tag.view);
    }
    transitions.leave(tag.root, 0.2, function () {
      if (tag.view) {
        tag.trigger('hidden:' + tag.view);
      }
      tag.update(data);
      tag.trigger('show:' + view);
      transitions.enter(tag.root, 0.4, function () {
        tag.trigger('shown:' + view);
        tag.view = view;
      });
    });
  }
};

module.exports = transitions;