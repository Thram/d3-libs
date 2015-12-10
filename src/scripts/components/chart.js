/**
 * Created by thram on 10/12/15.
 */
var $     = require('jquery'),
    _     = require('lodash'),
    d3    = require('./d3.extension'),
    utils = require('./chart.utils');

module.exports = function (type, options) {
  var self  = this,
      svg,
      scale = {},
      axes  = {
        x: {
          domain   : [0, 100],
          position: "bottom",
          divisions: 10,
          unit     : undefined
        },
        y: {
          domain   : [0, 100],
          position: "left",
          divisions: 10,
          unit     : undefined
        }
      }, color;
  options   = options || {};
  // Define default
  self.loaded         = false;
  self.related_charts = [];
  self.draw           = function () {
  };

  // Private Methods

  function _initSVG(opts) {
    svg = d3.select(self.container).append("svg")
      .attr("viewBox", "0 0 " + self.attributes.width + " " + self.attributes.height)
      .attr("preserveAspectRatio", "xMidYMid")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .append("g")
      .attr("transform", "translate(" + self.attributes.margin + "," + self.attributes.margin + ")");
    if (opts) {
      svg.attr("class", opts.className);
    }
  }

  function _addReference() {
    $(self.container).append($('<div class="reference">').css('top', self.attributes.margin).css('left', self.attributes.margin));
  }

  function _addLabel(options) {
    var className = 'label ' + options.tags;
    var div       = $('<div>').hide();
    div.addClass(className).append(options.data.label);
    $(self.container).append(div);
  }

  function _showLabel(options) {
    var label = $(self.container).find(options.selector);
    label.css('top', options.top - label.height() / 2).css('left', options.left - label.width() / 2);
    label.fadeIn();
  }

  function _hideLabels() {
    $(self.container).find('.label').fadeOut();
  }

  function _toggleLabel(options) {
    var label = $(self.container).find(options.selector);
    if (label.is(':visible')) {
      _hideLabels();
    } else {
      _showLabel(options);
    }
  }

  function _initAxes() {
    axes.x.axis = d3.svg.axis()
      .scale(scale.x)
      .ticks(axes.x.divisions)
      .orient(axes.x.position);

    if (axes.x.unit) {
      if (axes.x.unit === 'time') {
        axes.x.axis.ticks(d3.time.daysTotal, 2);
        axes.x.axis.tickFormat(d3.time.format("%d/%m"));
      } else
        axes.x.axis.tickFormat(d3.format(axes.x.unit));
    }

    axes.y.axis = d3.svg.axis()
      .scale(scale.y)
      .ticks(axes.y.divisions)
      .orient(axes.y.position);

    if (axes.y.unit) {
      if (axes.y.unit === 'time') {
        axes.y.axis.ticks(d3.time.days, 1);
        axes.y.axis.tickFormat(d3.time.format("%d"));
      } else {
        axes.y.axis.tickFormat(d3.format(axes.y.unit));
      }
    }
  }

  function _drawAxis(width, height) {
    // Add the x-axis.
    svg.append("g")
      .attr("class", "axis x")
      .attr("transform", axes.x.translate)
      .call(axes.x.axis.tickSize(-width, 0, 0));

    // Add the y-axis.
    svg.append("g")
      .attr("class", "axis y")
      .attr("transform", axes.y.translate)
      .call(axes.y.axis.tickSize(-height, 0, 0));
  }

  function _drawPoints(opts) {
    var pointColor = opts.color || '#333';
    var points     = opts.container.datum(opts.data)
      .append('circle')
      .style('fill', pointColor)
      .attr('class', function () {
        return 'point point-' + opts.index + ' ' + opts.data.tags;
      })
      .attr('r', 0)
      .attr('cx', function (d) {
        return scale.x(d[self.decoder[0]]);
      }).attr('cy', function (d) {
        return scale.y(d[self.decoder[1]]);
      }).transition()
      .attr('r', 4).each(function () {
        _addLabel(opts);
      });
    var components = $(opts.container[0]).find("circle");
    var mouseenter = function (ev) {
      opts.events.mouseenter(ev);
      components.off('mouseout', opts.events.mouseout);
      components.on('mouseout', opts.events.mouseout);
    };
    components.off('mouseenter', mouseenter).off('click touch', opts.events.click);
    components.on('mouseenter', mouseenter).on('click touch', opts.events.click);
  }

  function _drawLine(opts) {
    var line = d3.svg.line()
      .x(function (d) {
        return scale.x(d[self.decoder[0]]);
      })
      .y(function (d) {
        return scale.y(d[self.decoder[1]]);
      });
    var path, animation;
    if (self.loaded) {
      path      = svg.select(".line-" + opts.index);
      animation = path
        .transition()
        .delay(opts.animation.delay || 0)
        .duration(opts.animation.duration || 400)
        .ease("linear")
        .attr("d", line(opts.data));
    } else {
      path = svg.append("path")
        .attr("class", 'line line-' + opts.index + ' ' + (opts.data.tags || ''))
        .attr("d", line(opts.data))
        .attr('stroke', opts.color)
        .attr("stroke-width", 2)
        .style("fill", "none");

      var totalLength = path.node().getTotalLength();

      animation = path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .delay(opts.animation.delay || 0)
        .duration(opts.animation.duration || 400)
        .ease("linear")
        .attr("stroke-dashoffset", 0);
    }

    if (opts.start) animation.each('start', opts.start);
    if (opts.end) animation.each('end', opts.start);
  }

  function _highlightRelatedCharts(tags) {
    if (self.related_charts) {
      _.each(self.related_charts, function (rChart) {
        var rChartContainer = $(rChart.container);
        switch (rChart.type) {
          //case "bubble":
          //  rChart.highlight(rChartContainer.find(".label" + tags + '.depth-' + rChart.getCurrentDepth()), rChartContainer.find(".node" + tags + '.depth-' + rChart.getCurrentDepth()));
          //  break;
          case "line":
            rChart.highlight(tags);
            break;
          //case "bar":
          //  _barChart();
          //  break;
          default:
            throw "There is no chart defined for that type.";
        }
      });
    }
  }

  function _resetRelatedCharts() {
    if (self.related_charts) {
      _.each(self.related_charts, function (rChart) {
        if (rChart.type === 'bubble') {
          rChart.resetHighlights();
        }
      });
    }
  }

  function _lineChart() {
    // Setup
    self.type       = 'line';
    self.animations = {
      duration: options.animations ? options.animations.duration || 2000 : 2000
    };
    self.container  = options.container || document.querySelector('body');

    var bounds      = self.container.getBoundingClientRect();
    self.attributes = {
      margin : options.margin || 30,
      padding: options.padding || 20,
      height : options.height || bounds.height || 600,
      width  : options.width || bounds.width || 960
    };

    self.decoder = options.decoder || ['x', 'y'];

    var _chartWidth, _chartHeight;
    _chartWidth  = self.attributes.width - self.attributes.margin * 2;
    _chartHeight = self.attributes.height - self.attributes.margin * 2;

    $(self.container).addClass('line-chart-container');

    // Axes
    if (options.axes) {
      if (options.axes.x) {
        axes.x.domain    = [options.axes.x.min || 0, options.axes.x.max || 100];
        axes.x.divisions = options.axes.x.divisions || 10;
        axes.x.position  = options.axes.x.position || "bottom";
        axes.x.unit      = options.axes.x.unit || "";
      }
      if (options.axes.y) {
        axes.y.domain    = [options.axes.y.min || 0, options.axes.y.max || 100];
        axes.y.divisions = options.axes.y.divisions || 10;
        axes.y.position  = options.axes.y.position || "left";
        axes.y.unit      = options.axes.y.unit || "";
      }
    }
    axes.x.translate = axes.x.position === "bottom" ? "translate(0," + _chartHeight + ")" : "translate(0,0)";
    axes.y.translate = axes.y.position === "left" ? "translate(0,0)" : "translate(" + _chartWidth + ",0)";

    scale.x = axes.x.unit === 'time' ? d3.time.scale().range([0, _chartWidth]).domain(axes.x.domain).rangeRound([0, _chartWidth]) : d3.scale.linear().domain(axes.x.domain).range([0, _chartWidth]);
    scale.y = axes.y.unit === 'time' ? d3.time.scale().range([_chartHeight, 0]).domain(axes.y.domain).rangeRound([_chartHeight, 0]) : d3.scale.linear().domain(axes.y.domain).range([_chartHeight, 0]);
    _initAxes();
    //Chart
    //Helpers

    function _showPointLabel(pointEl) {
      var bbox      = d3.select(pointEl).position();
      var className = $(pointEl).parent().attr('tags') + ' label ' + $(pointEl).attr('class');
      _showLabel({
        selector: utils.getClassSelector(className),
        top     : bbox.top,
        left    : bbox.left
      });
    }

    function _drawCircles(data, lineColor) {
      var circleContainer = svg.append('g').attr('class', data.id + ' ' + data.tags + ' points').attr('tags', data.tags);

      data.points.forEach(function (datum, index) {
        _drawPoints({
          container: circleContainer,
          color    : lineColor,
          data     : datum,
          index    : index,
          tags     : data.tags,
          events   : {
            mouseout  : function () {
              d3.select(this).attr('r', 4).style('fill', lineColor);
              _hideLabels();
              self.resetHighlights();
              _resetRelatedCharts();
            },
            mouseenter: function () {
              d3.select(this).attr('r', 6).style('fill', d3.rgb(lineColor).darker(1));
              _hideLabels();
              _showPointLabel(this);
              var tags = utils.getClassSelector($(this).parent().attr('tags'));
              self.highlight(tags);
              _highlightRelatedCharts(tags);
            },
            click     : function () {
              _showPointLabel(this);
            }
          }
        })
        ;
      });
    }

    //Public Methods
    self.update = function (options) {
      self.setDataSource(options);
      self.updateReference(options.label);
    };

    self.highlight = function (tag) {
      var container = $(self.container);
      container.find(".line" + tag).attr('stroke-opacity', 1).attr('stroke-width', 3);
      container.find("g.points" + tag).attr('fill-opacity', 1);
      container.find(".line:not(" + tag + ")").attr('stroke-opacity', 0.3).attr('stroke-width', 1);
      container.find("g.points:not(" + tag + ")").attr('fill-opacity', 0.3);
    };

    self.resetHighlights = function () {
      var container = $(self.container);
      container.find(".line").attr('stroke-opacity', 1).attr('stroke-width', 2);
      container.find("g.points").attr('fill-opacity', 1);
    };
    // Drawing the Chart
    _initSVG({className: "line-chart"});

    self.draw = function () {
      var domain = [0, (self.data.length / 2), self.data.length];
      if (options.colors) {
        color = d3.scale.quantize()
          .domain(domain)
          .range(options.colors);
      } else {
        color = d3.scale.category20c().domain(domain);
      }
      !self.loaded && _drawAxis(_chartWidth, _chartHeight);

      self.data.forEach(function (value, idx) {
        var lineColor = color(idx);
        _drawLine({
          index    : idx,
          data     : value,
          color    : lineColor,
          animation: {
            duration: self.animations.duration,
            events  : {
              start: function () {
                _drawCircles(value, lineColor);
              }
            }
          }
        });
      });
      console.log('draw chart!');
      if (!self.loaded) {
        _addReference();
        self.updateReference();
        self.loaded = true;
      }

    };
  }

  //Public Methods
  self.addRelatedChart = function (relatedChart) {
    self.related_charts.push(relatedChart);
  };

  self.setDataSource   = function (options) {
    var type = options.type || 'json';
    if (utils.isJSON(options.src)) {
      self.data = options.src;
      options.success && options.success(self);
    } else {
      var onDataReady = function (error, root) {
        if (error) {
          if (options.error)
            options.error(error);
          else
            throw error;
        }
        self.data = root;
        options.success && options.success(self);
      };

      switch (type) {
        case 'text':
        case 'xml':
        case 'csv':
        case 'html':
        case 'tsv':
          d3[type](options.src, onDataReady);
          break;
        case 'json':
        default :
          d3.json(options.src, onDataReady);
      }
    }
  };
  self.updateReference = function (text) {
    var reference = $(self.container).find('div.reference');
    if (text) {
      reference.text(text);
      if (!reference.is(':visible')) reference.fadeIn();
    } else
      reference.fadeOut();
  };

  // Initialisation
  switch (type) {
    //case "bubble":
    //  _bubbleChart();
    //  break;
    case "line":
      _lineChart();
      break;
    //case "bar":
    //  _barChart();
    //  break;
    default:
      throw "There is no chart defined for that type.";
  }
  return self;
};