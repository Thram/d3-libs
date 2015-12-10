/**
 * Created by thram on 10/12/15.
 */
var d3 = require('d3');

// copied from d3js source, I guess this function is not exposed in the api
function d3_time_range(floor, step, number) {
  return function (t0, t1, dt) {
    var time = floor(t0), times = [];
    if (time < t0) step(time);
    if (dt > 1) {
      while (time < t1) {
        var date = new Date(+time);
        if (!(number(date) % dt)) times.push(date);
        step(time);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time);
    }
    return times;
  };
}

d3.time.daysTotal = d3_time_range(d3.time.day, function (date) {
  date.setDate(date.getDate() + 1);
}, function (date) {
  return ~~(date / 86400000);
});

d3.selection.prototype.position = function () {

  var el    = this.node();
  var elPos = el.getBoundingClientRect();
  var vpPos = getVpPos(el);

  function getVpPos(el) {
    if (el.parentElement.tagName === 'svg') {
      return el.parentElement.getBoundingClientRect();
    }
    return getVpPos(el.parentElement);
  }

  return {
    top   : elPos.top - vpPos.top,
    left  : elPos.left - vpPos.left,
    width : elPos.width,
    bottom: elPos.bottom - vpPos.top,
    height: elPos.height,
    right : elPos.right - vpPos.left
  };

};

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

module.exports = d3;