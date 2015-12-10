/**
 * Created by thram on 21/10/15.
 */
var D3Graph = (function (type, options) {
    options = options || {};
    var graph = {
        __onDataReady: function () {
        }
    };

    var _data;

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

        var el = this.node();
        var elPos = el.getBoundingClientRect();
        var vpPos = getVpPos(el);

        function getVpPos(el) {
            if (el.parentElement.tagName === 'svg') {
                return el.parentElement.getBoundingClientRect();
            }
            return getVpPos(el.parentElement);
        }

        return {
            top: elPos.top - vpPos.top,
            left: elPos.left - vpPos.left,
            width: elPos.width,
            bottom: elPos.bottom - vpPos.top,
            height: elPos.height,
            right: elPos.right - vpPos.left
        };

    };

    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };

    function _getClassName(name) {
        return name.toLowerCase().replace(/,/g, "").replace(/'/g, "").split(" ").join("-");
    }

    function _getClassSelector(tags) {
        return '.' + tags.split(' ').join('.');
    }

    function _isJSON(something) {
        if (typeof something != 'string')
            something = JSON.stringify(something);

        try {
            JSON.parse(something);
            return true;
        } catch (e) {
            return false;
        }
    }

    function _hasClass(el, className) {
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(el.getAttribute('class'));
    }

    function _addClass(el, className) {
        if (!_hasClass(el, className)) {
            el.setAttribute('class', el.getAttribute('class') + ' ' + className);
        }
    }

    function _removeClass(el, className) {
        var removedClass = el.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
        if (_hasClass(el, className)) {
            el.setAttribute('class', removedClass);
        }
    }

    switch (type) {
        case "bubble":
            graph = bubbleChart(options);
            break;
        case "lines":
            graph = linesChart(options);
            break;
        case "bars":
            graph = barsChart(options);
            break;
    }

    graph.addRelatedChart = function (relatedChart) {
        graph.related_charts = graph.related_charts || [];
        graph.related_charts.push(relatedChart)
    };
    graph.getData = function () {
        return _data;
    };

    graph.setDataSource = function (options) {
        var type = options['type'] || 'json';
        if (_isJSON(options['src'])) {
            graph.__onDataReady(options['src']);
            options['success'] && options.success(graph);
        } else {
            function onDataReady(error, root) {
                if (error) {
                    if (options['error'])
                        options.error(error);
                    else
                        throw error;
                }
                graph.__onDataReady(root);
                options['success'] && options.success(graph);
            }

            switch (type) {
                case 'text':
                    d3.text(options['src'], onDataReady);
                    break;
                case 'xml':
                    d3.xml(options['src'], onDataReady);
                    break;
                case 'csv':
                    d3.csv(options['src'], onDataReady);
                    break;
                case 'html':
                    d3.html(options['src'], onDataReady);
                    break;
                case 'tsv':
                    d3.tsv(options['src'], onDataReady);
                    break;
                case 'json':
                default :
                    d3.json(options['src'], onDataReady);
            }
        }
    };

    function _updateReference(text) {
        var reference = $(graph.container).find('div.reference');
        if (text) {
            reference.text(text);
            if (!reference.is(':visible')) reference.fadeIn();
        } else
            reference.fadeOut();
    }

    function _addReference() {
        $(graph.container).append($('<div class="reference">').css('top', graph.attributes.margin).css('left', graph.attributes.margin));
    }

    graph.updateReference = _updateReference;

    function linesChart(options) {
        options['container'] = options['container'] || 'body';
        var isLoaded = false;
        var containerBounds = document.querySelector(options['container']).getBoundingClientRect();
        var chart = {
            type: 'line',
            animation_duration: options['animation_duration'] || 2000,
            attributes: {
                margin: options['margin'] || 30,
                padding: options['padding'] || 20,
                height: options['height'] || containerBounds.height || 600,
                width: options['width'] || containerBounds.width || 960
            },
            container: options['container']
        };
        $(chart.container).addClass('line-chart-container');

        //Defaults
        var axes = {
            x: {
                domain: [0, 100],
                position: "bottom",
                divisions: 10,
                unit: undefined
            },
            y: {
                domain: [0, 100],
                position: "left",
                divisions: 10,
                unit: undefined
            }
        };
        if (options.axes) {
            if (options.axes.x) {
                axes.x.domain = [options.axes.x.min || 0, options.axes.x.max || 100];
                axes.x.divisions = options.axes.x.divisions || 10;
                axes.x.position = options.axes.x.position || "bottom";
                axes.x.unit = options.axes.x.unit || "";
            }
            if (options.axes.y) {
                axes.y.domain = [options.axes.y.min || 0, options.axes.y.max || 100];
                axes.y.divisions = options.axes.y.divisions || 10;
                axes.y.position = options.axes.y.position || "left";
                axes.y.unit = options.axes.y.unit || "";
            }
        }

        var svg, color, width, height, x, y, line;
        width = chart.attributes.width - chart.attributes.margin * 2;
        height = chart.attributes.height - chart.attributes.margin * 2;
        x = axes.x.unit === 'time' ? d3.time.scale().range([0, width]).domain(axes.x.domain).rangeRound([0, width]) : d3.scale.linear().domain(axes.x.domain).range([0, width]);
        y = axes.y.unit === 'time' ? d3.time.scale().range([height, 0]).domain(axes.y.domain).rangeRound([height, 0]) : d3.scale.linear().domain(axes.y.domain).range([height, 0]);

        axes.x.translate = axes.x.position === "bottom" ? "translate(0," + height + ")" : "translate(0,0)";
        axes.y.translate = axes.y.position === "left" ? "translate(0,0)" : "translate(" + width + ",0)";

        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(axes.x.divisions)
            .orient(axes.x.position);

        if (axes.x.unit) {
            if (axes.x.unit === 'time') {
                xAxis.ticks(d3.time.daysTotal, 2);
                xAxis.tickFormat(d3.time.format("%d/%m"));
            } else
                xAxis.tickFormat(d3.format(axes.x.unit));
        }

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(axes.y.divisions)
            .orient(axes.y.position);

        if (axes.y.unit) {
            if (axes.y.unit === 'time') {
                yAxis.ticks(d3.time.days, 1);
                yAxis.tickFormat(d3.time.format("%d"));
            } else {
                yAxis.tickFormat(d3.format(axes.y.unit));
            }

        }

        line = d3.svg.line()
            .x(function (d) {
                return x(d.x);
            })
            .y(function (d) {
                return y(d.y);
            });
        var parser = d3.time.format("%B %d");
        svg = d3.select(chart.container).append("svg")
            .attr("class", "line-chart")
            .attr("viewBox", "0 0 " + chart.attributes.width + " " + chart.attributes.height)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr("transform", "translate(" + chart.attributes.margin + "," + chart.attributes.margin + ")");

        function _drawAxis() {
            // Add the x-axis.
            svg.append("g")
                .attr("class", "axis x")
                .attr("transform", axes.x.translate)
                .call(xAxis.tickSize(-height, 0, 0));

            // Add the y-axis.
            svg.append("g")
                .attr("class", "axis y")
                .attr("transform", axes.y.translate)
                .call(yAxis.tickSize(-width, 0, 0));
        }

        function _highlightLine(tag) {
            var container = $(chart.container);
            container.find(".line" + tag).attr('stroke-opacity', 1).attr('stroke-width', 3);
            container.find("g.points" + tag).attr('fill-opacity', 1);
            container.find(".line:not(" + tag + ")").attr('stroke-opacity', .3).attr('stroke-width', 1);
            container.find("g.points:not(" + tag + ")").attr('fill-opacity', .3);
        }

        function _resetHighlights() {
            var container = $(chart.container);
            container.find(".line").attr('stroke-opacity', 1).attr('stroke-width', 2);
            container.find("g.points").attr('fill-opacity', 1);
        }

        function _addLabel(options) {
            var className = options.tags + ' label point point-' + options.index;
            var div = $('<div>').hide();
            div.addClass(className).append(parser(options.data.x) + '<br>' + (options.data.y * 100).toFixed(2) + '%');
            $(chart.container).append(div);
        }

        function _hideLabels() {
            $(chart.container).find('.label').fadeOut();
        }

        function _toggleLabel(el) {
            var bbox = d3.select(el).position();
            var top = bbox.top;
            var left = bbox.left;
            var className = $(el).parent().attr('tags') + ' label ' + $(el).attr('class');
            var label = $(chart.container).find(_getClassSelector(className));
            if (label.is(':visible')) {
                label.fadeOut();
            } else {
                label.fadeIn();
                label.css('top', top - label.height() / 2).css('left', left + 12);
            }

        }

        function _showLabel(el) {
            var bbox = d3.select(el).position();
            var top = bbox.top;
            var left = bbox.left;
            var className = $(el).parent().attr('tags') + ' label ' + $(el).attr('class');
            var label = $(chart.container).find(_getClassSelector(className));
            label.fadeIn();
            label.css('top', top - label.height() / 2).css('left', left + 12);
        }

        function _drawCircle(options) {
            var pointColor = options['color'] || '#333';
            options.container.datum(options.data)
                .append('circle')
                .style('fill', pointColor)
                .attr('class', function (d) {
                    return 'point point-' + options.index;
                })
                .attr('r', 0)
                .attr('cx', function (d) {
                    return x(d.x);
                }).attr('cy', function (d) {
                    return y(d.y);
                }).transition()
                .attr('r', 4).each(function (d) {
                    _addLabel(options);
                });
            var components = $(options.container[0]).find("circle");
            components.off('mouseenter').off('mouseout').off('click touch');
            components.on('mouseenter', function (d) {
                d3.select(this).attr('r', 6).style('fill', d3.rgb(pointColor).darker(1));
                _hideLabels();
                _showLabel(this);
                var tags = _getClassSelector($(this).parent().attr('tags'));
                _highlightLine(tags);
                if (chart.related_charts) {
                    _.each(chart.related_charts, function (rChart) {
                        var rChartContainer = $(rChart.container);
                        if (rChart.type === 'bubble') {
                            rChart.highlightBubble(rChartContainer.find(".label" + tags + '.depth-' + rChart.getCurrentDepth()), rChartContainer.find(".node" + tags + '.depth-' + rChart.getCurrentDepth()))
                        }
                    });
                }
                $(this).on('mouseout', function (d) {
                    d3.select(this).attr('r', 4).style('fill', pointColor);
                    _hideLabels();
                    _resetHighlights();
                    if (chart.related_charts) {
                        _.each(chart.related_charts, function (rChart) {
                            if (rChart.type === 'bubble') {
                                rChart.resetHighlights()
                            }
                        });
                    }
                });
            }).on('click touch', function (ev) {
                _toggleLabel(this)
            })
        }

        function _drawCircles(key, data, lineColor) {
            var circleContainer = svg.append('g').attr('class', data.id + ' ' + data.tags + ' points').attr('tags', data.tags);

            data.points.forEach(function (datum, index) {
                _drawCircle({
                    label: datum.x,
                    container: circleContainer,
                    color: lineColor,
                    data: datum,
                    index: index,
                    tags: data.tags
                });
            });
        }

        chart.highlight       = _highlightLine;
        chart.resetHighlights = _resetHighlights;

        chart.__onDataReady = function (series) {
            _data = series;
            var lines = Object.keys(_data);
            var domain = [0, (lines.length / 2), lines.length];
            if (options['colors']) {
                color = d3.scale.quantize()
                    .domain(domain)
                    .range(options['colors']);
            } else {
                color = d3.scale.category20c().domain(domain);
            }
            !isLoaded && _drawAxis();

            lines.forEach(function (key, idx) {
                var lineColor = color(idx);
                var lineData = _data[key];
                var path = svg.append("path")
                    .attr("id", key)
                    .attr("class", 'line ' + lineData.tags)
                    .attr("d", line(lineData.points))
                    .attr('stroke', lineColor)
                    .attr("stroke-width", 2)
                    .style("fill", "none");

                var totalLength = path.node().getTotalLength();

                path
                    .attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(chart.animation_duration)
                    .ease("linear")
                    .attr("stroke-dashoffset", 0).each('start', function () {
                        _drawCircles(key, lineData, lineColor);
                    });
            });
            if (!isLoaded) {
                _addReference();
                _updateReference();
                isLoaded = true;
            }

        };
        return chart;
    }

    function barsChart(options) {
        options['container'] = options['container'] || 'body';
        var isLoaded = false;
        var containerBounds = document.querySelector(options['container']).getBoundingClientRect();
        var chart = {
            type: 'bar',
            layers: options['layers'] || [],
            animation_duration: options['animation_duration'] || 750,
            attributes: {
                margin: options['margin'] || 30,
                padding: options['padding'] || 20,
                height: options['height'] || containerBounds.height || 600,
                width: options['width'] || containerBounds.width || 960
            },
            container: options['container']
        };
        $(chart.container).addClass('bar-chart-container');

        //Defaults
        var axes = {
            x: {
                domain: [0, 100],
                position: "bottom",
                divisions: 10,
                unit: undefined
            },
            y: {
                domain: [0, 100],
                position: "left",
                divisions: 10,
                unit: undefined
            }
        };
        if (options.axes) {
            if (options.axes.x) {
                axes.x.key = options.axes.x.key || 'x';
                axes.x.domain = options.axes.x.domain || [options.axes.x.min || 0, options.axes.x.max || 100];
                axes.x.divisions = options.axes.x.divisions || 10;
                axes.x.position = options.axes.x.position || "bottom";
                axes.x.unit = options.axes.x.unit || "";
                axes.x.unitFormat = options.axes.x.unitFormat || "";
            }
            if (options.axes.y) {
                axes.y.key = options.axes.y.key || 'y';
                axes.y.domain = options.axes.y.domain || [options.axes.y.min || 0, options.axes.y.max || 100];
                axes.y.divisions = options.axes.y.divisions || 10;
                axes.y.position = options.axes.y.position || "left";
                axes.y.unit = options.axes.y.unit || "";
                axes.y.unitFormat = options.axes.y.unitFormat || "";
            }
        }

        var svg, color, width, height, x, y;
        width = chart.attributes.width - chart.attributes.margin * 2;
        height = chart.attributes.height - chart.attributes.margin * 2;

        axes.x.translate = axes.x.position === "bottom" ? "translate(0," + height + ")" : "translate(0,0)";
        axes.y.translate = axes.y.position === "left" ? "translate(0,0)" : "translate(" + width + ",0)";

        function _drawAxis() {
            svg.selectAll(".axis").remove();
            svg.append("g")
                .attr("class", "axis x")
                .attr("transform", axes.x.translate)
                .call(xAxis.tickSize(-height, 0, 0));

            // Add the y-axis.
            svg.append("g")
                .attr("class", "axis y")
                .attr("transform", axes.y.translate)
                .call(yAxis.tickSize(-width, 0, 0));
        }

        x = d3.scale.ordinal()
            .rangeRoundBands([0, width]);

        y = d3.scale.linear()
            .rangeRound([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient(axes.x.position);

        if (axes.x.unit) {
            if (axes.x.unit === 'time') {
                xAxis.tickFormat(d3.time.format(axes.x.unitFormat));
            } else
                xAxis.tickFormat(d3.format(axes.x.unitFormat));
        }

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient(axes.y.position);

        if (axes.y.unit) {
            if (axes.y.unit === 'time') {
                yAxis.tickFormat(d3.time.format(axes.y.unitFormat));
            } else
                yAxis.tickFormat(d3.format(axes.y.unitFormat));
        }

        svg = d3.select(chart.container).append("svg")
            .attr("class", "bar-chart")
            .attr("viewBox", "0 0 " + chart.attributes.width + " " + chart.attributes.height)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr("transform", "translate(" + chart.attributes.margin + "," + chart.attributes.margin + ")");

        function _showLabel(el) {
            var bbox = d3.select(el).position();
            var top = bbox.top;
            var left = bbox.left;
            var className = $(el).parent().attr('tags') + ' label ' + $(el).attr('class');
            var label = $(chart.container).find(_getClassSelector(className));
            label.fadeIn();
            label.css('top', top - label.height() / 2).css('left', left + 12);
        }

        function _addLabel(el, d) {
            var className = el.className.baseVal + ' label bar';
            var div = $('<div>').hide();
            div.addClass(className).append(d.y);
            $(chart.container).append(div);
            _showLabel(el);
        }

        chart.__onDataReady = function (series) {
            _data = _.clone(series);

            var keys = Object.keys(_data);
            var current = _data[keys[0]];
            var data = current.layers;
            if (options['colors']) {
                color = d3.scale.ordinal()
                    .domain(axes.y.domain)
                    .range(options['colors']);
            } else {
                color = d3.scale.category20c().domain(axes.y.domain);
            }

            data.forEach(function (d) {
                var y0 = 0;
                d.values = color.domain().map(function (name) {
                    return {name: name, y0: y0, y1: y0 += +d[name]};
                });
                d.x = d[axes.x.key];
                d.y = d.values[d.values.length - 1].y1;
            });

            console.log(data)

            //data.sort(function (a, b) {
            //    return a.date.getTime() - b.date.getTime();
            //});

            x.domain(data.map(function (d) {
                return d.x;
            }));
            y.domain([0, d3.max(data, function (d) {
                return d.y;
            })]).nice();

            var layers = svg.selectAll(".layer").data(data);

            layers.enter().append("g")
                .classed('layer', true).attr("transform", function (d) {
                    return "translate(" + x(d.x) + ",0)";
                });

            var bars = layers.selectAll("rect")
                .data(function (d) {
                    return d.values;
                });

            bars.enter().append("rect")
                .classed('bar', true)
                .style("fill", function (d, i) {
                    return color(d.name);
                })
                .attr("y", height)
                .attr("height", function () {
                    return $(this).height()
                })
                .attr("width", x.rangeBand() - 1);

            bars.transition()
                .duration(chart.animation_duration)
                .attr('y', function (d, i) {
                    return y(d.y1);
                })
                .attr('height', function (d, i) {
                    return y(d.y0) - y(d.y1);
                });

            // exit selection
            bars
                .exit().remove();

            _drawAxis();
            if (!isLoaded) {
                _addReference();
                _updateReference();
                isLoaded = true;
            }
        };
        return chart;
    }

    function bubbleChart(options) {
        var _maxDepth = 0, _minDepth = 0;
        options['container'] = options['container'] || 'body';
        var containerBounds = document.querySelector(options['container']).getBoundingClientRect();
        var chart = {
            type: 'bubble',
            animation_duration: options['animation_duration'] || 750,
            onSelect: options['onSelect'] || undefined,
            attributes: {
                margin: options['margin'] || 40,
                padding: options['padding'] || 0,
                diameter: options['diameter'] || containerBounds.height > containerBounds.width ? containerBounds.height : containerBounds.width || 960
            },
            container: options['container']
        };
        var svg, pack, focus, view, bubbles;
        $(chart.container).addClass('bubble-chart-container');

        pack = d3.layout.pack()
            .padding(chart.attributes.padding)
            .size([chart.attributes.diameter - chart.attributes.margin, chart.attributes.diameter - chart.attributes.margin])
            .value(function (d) {
                return d.value;
            });

        svg = d3.select(chart.container).append("svg")
            .attr("class", "bubble-chart")
            .attr("viewBox", "0 0 " + chart.attributes.diameter + " " + chart.attributes.diameter)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr("transform", "translate(" + chart.attributes.diameter / 2 + "," + chart.attributes.diameter / 2 + ")");

        d3.select(self.frameElement).style("height", chart.attributes.diameter + "px");


        function _addLabel(el, d) {
            var className = el.className.baseVal.replace(/node/g, 'label');
            var div = $('<div>').hide();
            div.addClass(className).data('d', d).append(d.name + '<br>' + d.value);
            $(chart.container).append(div);
        }

        function _hideLabels() {
            $(chart.container).find('.label').fadeOut();
        }

        function _showLabel(el) {
            var bbox = d3.select(el).position();
            var top = bbox.top;
            var left = bbox.left;
            var className = el.className.baseVal.replace(/node/g, 'label');
            var label = $(chart.container).find(_getClassSelector(className));
            label.show().fadeIn();
            if (_hasClass(el, 'node-leaf')) {
                var labelBbox = label[0].getBoundingClientRect();
                top = top + (bbox.height / 2) - labelBbox.height / 2;
                left = left + (bbox.width / 2) - (labelBbox.width / 2);
            }
            label.css('top', top).css('left', left);
        }

        function _highlightBubble(label, node) {
            $('.label.hover').removeClass('hover');
            _.each(svg.selectAll('.node.hover')[0], function (value) {
                _removeClass(value, 'hover');
            });

            $(chart.container).find('.label').css('opacity', .3);
            $(chart.container).append(label.css('opacity', 1));
            label.addClass("hover");
            _addClass(node[0], 'hover');
        }

        function _resetHighlights() {
            $(chart.container).find('.label').removeClass('hover').css('opacity', 1);
            $(chart.container).find('.node').each(function () {
                _removeClass(this, 'hover');
            });
        }

        function getCurrentDepth() {
            return focus.depth + 1;
        }

        chart.highlightBubble = _highlightBubble;
        chart.resetHighlights = _resetHighlights;
        chart.getCurrentDepth = getCurrentDepth;

        chart.__onDataReady = function (root) {
            chart._root = root;
            var nodes = pack.nodes(chart._root).filter(function (d) {
                return d.value > 0;
            });
            focus = chart._root;
            _data = nodes;

            function _getParentName(obj) {
                return obj['parent'] ? _getClassName(obj.name) + " " + _getParentName(obj['parent']) : _getClassName(obj.name);
            }

            bubbles = svg.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", function (d) {
                    var nodeGroupClass = d.parent ? d.children ? _getParentName(d.parent) : _getParentName(d.parent) : "";
                    return (d.parent ? d.children ? "node " + nodeGroupClass : "node node-leaf " + nodeGroupClass : "node node-root") + " " + _getClassName(d.name) + " depth-" + d.depth;
                }).each(function (d) {
                    _maxDepth = d.depth >= _maxDepth ? d.depth : _maxDepth;
                    _minDepth = d.depth <= _minDepth ? d.depth : _minDepth;
                    _addLabel(this, d);
                });

            _addReference();
            _updateReference();

            function _getCurrentDepthElement(obj) {
                var el = $('.node' + _getClassSelector(_getParentName(obj)) + '.depth-' + (focus.depth + 1));
                if (el.size() > 0) {
                    var d = d3.select(el[0]).data()[0];
                    if (d.depth === (focus.depth + 1)) {
                        return el;
                    } else {
                        return _getCurrentDepthElement(d)
                    }
                } else {
                    return _getCurrentDepthElement(obj.parent)
                }

            }


            var components = $(chart.container).find(".node,.label");
            components.off('mouseenter').off('mouseout').off('click');
            components.on('mouseenter', function (ev) {
                var label, node;
                if ($(this).hasClass('label')) {
                    label = $(this);
                    node = $(_getClassSelector(label.attr('class').replace(/label/g, 'node')));
                } else {
                    node = $(this);
                    label = $(_getClassSelector(node[0].className.baseVal.replace(/node/g, 'label')));
                }
                var d = label.data('d');
                if (d.depth > (focus.depth + 1)) {
                    node = _getCurrentDepthElement(d);
                    label = $(_getClassSelector(node[0].className.baseVal.replace(/node/g, 'label')));
                    d = label.data('d');
                }
                if (_hasClass(node[0], 'active') || d.depth <= focus.depth) return;
                if (d.depth < _maxDepth && !_hasClass(node[0], 'hover')) {
                    _highlightBubble(label, node);
                    if (chart.related_charts) {
                        _.each(chart.related_charts, function (rChart) {
                            if (rChart.type === 'line') {
                                rChart.highlight(_getClassSelector(_getClassName(d.name)));
                            }
                        });
                    }

                    function _onLeave(ev) {
                        $(chart.container).find('.label').css('opacity', 1);
                        label.removeClass('hover');
                        _removeClass(node[0], 'hover');
                        if (chart.related_charts) {
                            _.each(chart.related_charts, function (rChart) {
                                var rChartContainer = $(rChart.container);
                                if (rChart.type === 'line') {
                                    rChartContainer.find(".line").attr('stroke-opacity', 1).attr('stroke-width', 2);
                                    rChartContainer.find("g.points").attr('fill-opacity', 1);
                                }

                            });
                        }
                    }

                    label.on('mouseout', _onLeave);
                    node.on('mouseout', _onLeave);
                }


            }).on('click', function (ev) {
                var label, node;
                if ($(this).hasClass('label')) {
                    label = $(this);
                    node = $(_getClassSelector(label.attr('class').replace(/label/g, 'node')));
                } else {
                    node = $(this);
                    label = $(_getClassSelector(node[0].className.baseVal.replace(/node/g, 'label')));
                }
                var d = label.data('d');
                if (d.depth > (focus.depth + 1)) {
                    node = _getCurrentDepthElement(d);
                    label = $(_getClassSelector(node[0].className.baseVal.replace(/node/g, 'label')));
                    d = label.data('d');
                }
                if (focus !== d) {
                    ev.stopPropagation();
                    _.each(svg.selectAll('.node.active,.node.hover')[0], function (value) {
                        _removeClass(value, 'active');
                        _removeClass(value, 'hover');
                    });
                    $(chart.container).find('.label').css('opacity', 1);
                    $('.label.active, .label.hover').removeClass('active').removeClass('hover');
                    _addClass(node[0], 'active');
                    label.addClass('active');
                    _zoom(d);
                    chart.onSelect && chart.onSelect(d);
                }
            });


            d3.select(chart.container)
                .on("click", function () {
                    d3.event.stopPropagation();
                    _zoom(chart._root);
                    chart.onSelect && chart.onSelect(chart._root);
                    _.each(svg.selectAll('.node.active,.node.hover')[0], function (value) {
                        _removeClass(value, 'active');
                        _removeClass(value, 'hover');
                    });
                    $(chart.container).find('.label').css('opacity', 1);
                    $('.label.active, .label.hover').removeClass('active').removeClass('hover');
                });

            _zoomTo([chart._root.x, chart._root.y, chart._root.r * 2 + chart.attributes.margin]);
            svg.selectAll(".node.depth-1").each(function (d) {
                _showLabel(this);
            })
        };


        function _zoom(d) {
            focus = d;
            _updateReference(focus.depth === _minDepth ? '' : focus.name);
            _hideLabels();
            var transition = d3.transition()
                .duration(chart.animation_duration)
                .tween("zoom", function (d) {
                    var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + chart.attributes.margin]);
                    return function (t) {
                        _zoomTo(i(t));
                    };
                });


            transition.selectAll(".node").filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            }).each("end", function (d) {
                _showLabel(this);
            });
        }

        function _zoomTo(v) {
            var k = chart.attributes.diameter / v[2];
            view = v;
            bubbles.attr("transform", function (d) {
                var x = (d.x - v[0]) * k;
                var y = (d.y - v[1]) * k;
                return "translate(" + x + "," + y + ")";
            }).attr("r", function (d) {
                return d.r * k;
            });
        }

        return chart;
    }

    return graph;
});