/**
 * Created by thram on 10/12/15.
 */
module.exports = {
  getClassName    : function (name) {
    return name.toLowerCase().replace(/,/g, "").replace(/'/g, "").split(" ").join("-");
  },
  getClassSelector: function (tags) {
    return '.' + tags.split(' ').join('.');
  },
  isJSON          : function (something) {
    if (typeof something != 'string')
      something = JSON.stringify(something);

    try {
      JSON.parse(something);
      return true;
    } catch (e) {
      return false;
    }
  },
  hasClass        : function (el, className) {
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(el.getAttribute('class'));
  },
  addClass        : function (el, className) {
    if (!this.hasClass(el, className)) {
      el.setAttribute('class', el.getAttribute('class') + ' ' + className);
    }
  },
  removeClass     : function (el, className) {
    var removedClass = el.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
    if (this.hasClass(el, className)) {
      el.setAttribute('class', removedClass);
    }
  }
};

