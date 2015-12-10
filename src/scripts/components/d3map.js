/**
 * Created by thram on 22/10/14.
 */
Component.Map = (function () {
    //Private Variables

    var _mapRegion, _mapEl, _svg,
        _projection,
        _path,
        _g,
        _grid,
        _thumb,
        _active,
        _width,
        _height,
        _worldBounds,
        _mapHeight,
        _transitionDuration = 800,
        _scale = 1, _x = 0, _y = 0,
        _currentYear = new Date().getFullYear(),
        _selectedYear = undefined,
        _sequenceInterval = undefined,
        _destination = undefined,
        _zoomed = false,
        _defaultLat = 150, _worldColor = '#7EA1BC'; // -134 Australia;

    //Private Methods

    function _setXYZ(shape) {
        _scale = (_zoomed ? (_worldBounds.width - _mapRegion.find('.details').width()) : _worldBounds.width) / shape.size.width;
        var offsetX = 50; // Check the reason of this offset
        var offsetXRight = 39; // Check the reason of this offset
        var offsetY = 140; // Check the reason of this offset
        _x = shape.center.x + (shape.center.x + shape.size.width + offsetX > _worldBounds.width ? offsetXRight : offsetX);
        _y = shape.center.y + offsetY;
    }

    function _getTransformation() {
        return "translate(" + _worldBounds.width / 2 + ',' + _worldBounds.height / 2 + ")"
            + "scale(" + _scale + ")"
            + "translate(" + -_x + "," + -_y + ")";
    }

    function _zoomIn(shape, onSuccess) {
        _setXYZ(shape);
        _g.selectAll(".country").transition().duration(_transitionDuration)
            .style("stroke-width", 1.0 / _scale + "px");
        _path.pointRadius(1 / (_scale / 2));
        _g.transition().duration(_transitionDuration).attr("transform", _getTransformation())
            .each("end", function () {
                App.execute(onSuccess);
            });
    }

    function _zoomOut(onSuccess) {
        _path.pointRadius(1);
        Component.Slider.hideFilters(function () {
            _hideDetails(Component.Slider.update);
            _g.selectAll(".country").transition().duration(_transitionDuration)
                .style("stroke-width", "1px");
            _g.transition().duration(_transitionDuration).attr("transform", "").each("end", function () {
                App.execute(onSuccess);
            });
        });
    }

    function _hideMovements(onSuccess) {
//        _mapEl.find('.circle').fadeOut();
        var movements = _mapEl.find('g.movements');
        if (movements.size() > 0) {
            movements.fadeOut(function () {
                App.execute(onSuccess);
            });
        } else {
            App.execute(onSuccess);
        }

    }

    function _showMovements(onSuccess) {
//        _mapEl.find('.circle').fadeIn();
        _mapEl.find('g.movements').fadeIn(function () {
            App.execute(onSuccess);
        });

    }

    function _addMarker(cell) {
        var markerPoints = _mapEl.find('g.markers .marker-point').not('.marked');
        var markersList = [];

        markerPoints.each(function () {
            var markerPoint = $(this);
            var collide = View.elementsCollide(markerPoint, cell);
            if (collide.isColliding) {
                var markerObj = {'story': markerPoint.attr('story'), location: markerPoint.attr('location')};
                markerPoint.get(0).addClass('marked');
                var storiesIDs = _.pluck(markersList, 'story');
                if (!_.contains(storiesIDs, markerObj.story)) {
                    if (markersList.length === 1) {
                        var usedMarker = _mapEl.find('#marker-' + markerObj.story + '-' + markerObj.location);
                        if (usedMarker.size() > 0) {
                            usedMarker.fadeOut(function () {
                                usedMarker.remove();
                            });
                        }
                    }
                    markersList.push(markerObj);
                }

            }
        });
        cell.data('markersList', markersList);

        function _onTouchStart(ev) {
            var $this = $(this);
            var position = $this.offset();
            Animation.bounceOut(_mapEl.find('.bubble'), {remove: true});
            var bubble = $('<div class="bubble"></div>');
            var bubbleBox = $('<div class="bubble-box"></div>');
            var markersList = $this.data('markersList');
            var storiesIDs = _.pluck(markersList, 'story');
            var data = {
                quantity: markersList.length
            };
            if (data.quantity === 1) {
                data['story'] = Data.getStory(markersList[0].story);
            }
            $('.details .story.active').removeClass('active');
            $('.details .story.selected').removeClass('selected');
            _.each(storiesIDs, function (id) {
                $('.details #story-' + id).addClass('selected');
            });

            $('.details .story').not('.selected').slideUp();
            $('.details .story.selected').slideDown();
            if (data.quantity === 1) {
                Component.render(bubbleBox, {id: 'map-story-sub-component', data: data});
                bubble.append(bubbleBox);
                _mapEl.append(bubble);
                bubble.css({
                    top: position.top - bubble.height() - 20,
                    left: position.left - bubble.width() / 2 + $this.width() / 2
                });
                if ($this.position().left - bubbleBox.width() / 2 < 0) bubbleBox.addClass('left');
                if ($this.position().left + bubbleBox.width() / 2 > _grid.width()) bubbleBox.addClass('right');
                if ($this.position().top - bubbleBox.height() / 2 < _grid.position().top) {
                    bubbleBox.addClass('top');
                    bubble.css({
                        top: position.top + bubble.height() / 2
                    });
                }
                Animation.bounceIn(bubble);
                View.bindTouchEvent({
                    el: bubble.find('.select-button'), event: 'start', onEvent: function () {
                        App.changePage({view: 'Story', face: 'back', story_id: data.story.id});
                    }
                });
            }
        }

        var delay = 100 * (_mapEl.find('g.markers .marker-point.marked').size() - 1);

        if (markersList.length > 1) {
            cell.hide().addClass('marker-group').append(cell.find('span').text('+' + markersList.length));
            _.delay(function () {
                Animation.bounceIn(cell);
            }, delay);
            View.bindTouchEvent({el: cell, event: 'start', onEvent: _onTouchStart});
        } else {
            if (markersList.length === 1 && $('#marker-' + markersList[0].story + '-' + markersList[0].location).size() === 0) {
                var markerPoint = _mapEl.find('.marker-point.marker-point-' + markersList[0].story + '-' + markersList[0].location);
                var marker = $('<div class="marker">');
                marker.data('markersList', markersList);

                marker.hide();
                _mapEl.append(marker);
                marker.css({
                    top: markerPoint.offset().top - marker.height() / 2,
                    left: markerPoint.offset().left - marker.width() / 2
                });
                _.delay(function () {
                    Animation.bounceIn(marker);
                }, delay);
                View.bindTouchEvent({el: marker, event: 'start', onEvent: _onTouchStart});
            } else {
                View.bindTouchEvent({
                    el: cell, event: 'start', onEvent: function () {
                        var bubbles = _mapRegion.find('.bubble');
                        if (bubbles.size() > 0) {
                            if (bubbles.size() > 0) {
                                Animation.bounceOut(bubbles, {remove: true});
                            }
                        }
                        $('.details .story').slideDown();
                        _mapRegion.find('.story.active').removeClass('active');
                    }
                });
            }
        }
    }

    function _generateGrid(options) {
        if (!_grid) {
            _grid = $('<div class="grid">');
            _mapEl.append(_grid);
        }

        if (options['type'] === 'map') {
            _grid.css({top: _worldBounds.top, left: _worldBounds.left});
        }

        function _drawGrid() {
            _grid.empty();
            var cellSize = options['type'] === 'map' ? {width: _worldBounds.width, height: _worldBounds.height} : {height: 96, width: 96};
            _grid.data('cellSize', cellSize);
            var rowsLength = Math.ceil(_worldBounds.height / cellSize.height); // whatever you want to append the rows to:
            _grid.height(rowsLength * cellSize.height);
            for (var i = 0; i < rowsLength; i++) {
                var row = $('<div class="grid-row">');
                _grid.append(row);
                var width = options['type'] === 'map' ? _worldBounds.width : _worldBounds.width - _mapRegion.find('.details').width();
                var cellsLength = Math.floor(width / cellSize.width); // whatever you want to append the rows to:
                _grid.width(cellsLength * cellSize.width);
                for (var x = 1; x <= cellsLength; x++) {
                    var cell = $('<div id="pos-' + i + '_' + x + '" class="grid-cell"><span></span></div>');
                    cell.height(cellSize.height);
                    cell.width(cellSize.width);
                    row.append(cell);
                    App.execute(options['onCellAdded'], cell);
                }
            }
        }

        //Clean grid
        if (_mapEl.find('.marker-group, .marker').size() > 0) {
            Animation.bounceOut(_mapEl.find('.marker-group, .marker, .bubble'), {
                remove: true, onSuccess: function () {
                    _mapEl.find('g.markers .marker-point.marked').each(function () {
                        $(this).get(0).removeClass('marked');
                    });
                    _drawGrid();
                }
            })
        } else {
            _drawGrid();
        }


    }

    function _zoomZone(cell) {

        function onTouchStart(ev) {

            if (!_.isUndefined(_sequenceInterval)) {
                stopSequence();
            }
            var center, zoneSize, x0, y0, x1, y1;
            var details = $('.details');
            var offset = 10;
            zoneSize = {width: (_worldBounds.width - details.width() - offset * 2) / 6, height: _worldBounds.height / 5 - offset * 2};
            center = {x: ev.pageX - _grid.position().left + offset, y: ev.pageY - _grid.position().top + offset};
            x0 = center.x - zoneSize.width / 2;
            y0 = center.y - zoneSize.height / 2;
            if (x0 < 0) {
                x0 = 0;
                center.x = zoneSize.width / 2;
            }
            if (y0 < 0) {
                y0 = -50;
                center.y = y0 + zoneSize.height / 2;
            }
            x1 = x0 + zoneSize.width;
            y1 = y0 + zoneSize.height;

            if (x1 > _worldBounds.width) {
                x0 = _worldBounds.width - zoneSize.width;
                center.x = x0 + zoneSize.width / 2;
            }
            if (y1 > _worldBounds.height) {
                y0 = _worldBounds.height - zoneSize.height;
                center.y = y0 + zoneSize.height / 2;
            }
            x1 = x0 + zoneSize.width;
            y1 = y0 + zoneSize.height;

            //To get stories from CAM
            var boundsCoord = [
                _projection.invert([x0 + _grid.position().left + offset / 2, y0 + _grid.position().top + offset]),
                _projection.invert([x1 + _grid.position().left - offset / 2, y1 + _grid.position().top - offset])
            ];
            //var test = $('<div>').css({
            //    position: 'absolute',
            //    top: y0 + 'px',
            //    left: x0 + 'px',
            //    width: zoneSize.width + 'px',
            //    height: zoneSize.height + 'px',
            //    background: 'red',
            //    opacity: .8
            //});
            //console.log('Coordinates: Top-Left: (' + boundsCoord[0][1] + ',' + boundsCoord[0][0] + ') Bottom-Right: (' + boundsCoord[1][1] + ',' + boundsCoord[1][0] + ')')
            //$('.grid').append(test);

            var markersFilter = {
                top_left_latitude: boundsCoord[0][1],
                top_left_longitude: boundsCoord[0][0],
                bottom_right_latitude: boundsCoord[1][1],
                bottom_right_longitude: boundsCoord[1][0]
            };
            Data.add('bounds', markersFilter);
            View.unbindTouchEvent({el: cell, event: 'start', onEvent: onTouchStart});
            $('body').addClass('zoomed');
            _zoomed = true;
            _hideMovements(function () {
                Component.Slider.hideFilters(function () {
                    Component.Slider.update({recalculate: true});
                    _showDetails();
                    $('.zoom-out-button').fadeIn();
                    $('.logo').fadeOut();
                    _zoomIn({center: center, size: zoneSize}, function () {
                        _generateZoneGrid();
                        var countries = $('path.country');
                        countries.each(function () {
                            var collideGrid = View.elementsCollide(_grid, $(this));
                            if (collideGrid.isColliding && (collideGrid.collidingArea.area === collideGrid.totalArea || (collideGrid.collidingArea.height > 96 && collideGrid.collidingArea.width > 96))) {
                                $(this).get(0).addClass('active');
                            }
                        });
                        Data.loadStories({filter: markersFilter}).then(function () {
                            _renderMarkers();
                            _generateZoneGrid();
                        });
                    });
                });
            });


        }

        View.bindTouchEvent({el: cell, event: 'start', onEvent: onTouchStart});
    }

    function _generateZoneGrid() {
        _generateGrid({type: 'zone', onCellAdded: _addMarker});
    }

    function _generateMapGrid() {
        _generateGrid({type: 'map', onCellAdded: _zoomZone});
    }

    function _hideMarkers(onSuccess) {
        var markersBubbles = _mapEl.find('.marker, .marker-group, .bubble');
        markersBubbles.fadeOut();
        Animation.bounceOut(markersBubbles, {
            remove: true, onSuccess: function () {
                _mapEl.find('g.markers').remove();
                App.execute(onSuccess);
            }
        });
    }

    function _renderStoriesList(storiesData) {
        var detailsEl = $('.details');
        Animation.fadeOut(detailsEl.find('.story'), {
            remove: true, onSuccess: function () {
                if (!_.isEmpty(storiesData)) {
                    _.forEach(storiesData, function (story, index) {
                        var storyEl = $('<div class="story">');
                        storyEl.hide().attr('id', 'story-' + story.id).data('id', story.id);
                        Component.render(storyEl, {
                            id: 'map-story-sub-component',
                            data: {
                                story: story,
                                video: story.videos && story.videos.length > 0 ? story.videos[0] : undefined
                            }
                        });
                        detailsEl.append(storyEl);
                        _.delay(function () {
                            Animation.fadeIn(storyEl);
                        }, 100 * index);
                    });

                    _.delay(function () {
                        View.bindTouchEvent({
                            el: detailsEl.find('.story'),
                            event: 'scroll',
                            wrapperClass: 'details',
                            itemClass: 'story',
                            onClick: function (el) {
                                if (el.parents('.story-box').length > 0) {
                                    VideoControls.stopAll();
                                    var item = el.parents('.story');
                                    var id = item.data('id');
                                    App.changePage({
                                        view: 'Story',
                                        face: 'back',
                                        story_id: id
                                    });
                                }
                                if (el.parents('.video').length > 0) {
                                    VideoControls.playPause(el.parents('.video'));
                                }
                            }
                        });

                    }, 100 * storiesData.length);
                } else {
                    if (detailsEl.find('.story.no-data').size() === 0) {
                        var storyEl = $('<div class="story no-data">');
                        storyEl.append($('<p>There are no stories for this period of time.</p>'));
                        var sendBtn = $('<div class="send-button"><div class="icon-envelope"></div><span>Share your stories</span></div>');
                        storyEl.append(sendBtn);
                        View.bindTouchEvent({
                            el: sendBtn, event: 'start', onEvent: function (el) {
                                var modal = Component.Modal.render({
                                    id: 'modal-send-form-component',
                                    className: 'send-form-modal'
                                });
                                Component.Keyboard.render(modal);
                                View.bindTouchEvent({
                                    el: modal.find('.send-button'),
                                    event: 'start',
                                    onClose: startCarousel,
                                    onEvent: function (el) {
                                        var emailEl = modal.find('input#email');
                                        var email = emailEl.val();
                                        if (Data.validateEmail(email)) {
                                            Data.shareStory({email: email}).then(function () {
                                                Component.Modal.closeModal();
                                                if (!_view.find('.content').hasClass('video-container')) {
                                                    startCarousel();
                                                }
                                            });
                                        } else {
                                            modal.find('.placeholder').removeClass('error');
                                            emailEl.focus();
                                            modal.find('.email.placeholder').addClass('error');
                                        }
                                    }
                                });

                            }
                        });
                        detailsEl.append(storyEl);
                    }
                }

            }
        });
    }

    function _renderMarkers() {
        var storiesData = Data.getStories(Component.Slider.getFilter());
        $('g.markers').remove();
        _renderStoriesList(storiesData);
        var markers = _svg.append("g").attr('class', 'markers');
        _.each(storiesData, function (story) {
            //GeoJSON Coordinates: [longitude, latitude, altitude]
            _.each(story.locations, function (location, index) {
                markers.append("path")
                    .datum({type: "Point", coordinates: [location.longitude, location.latitude]})
                    .attr("class", "marker-point marker-point-" + story.id + "-" + index)
                    .attr("story", story.id)
                    .attr("location", index)
                    .attr("d", _path)
                    .attr("fill", "none")
                    .attr("transform", _getTransformation());
            });
        });

        return $(markers);
    }

    function _resetMap(onSuccess) {
        _scale = 1;
        _x = 0;
        _y = 0;
        _g.selectAll(".active").classed("active", _active = false);
        if (_zoomed) {
            $('body').removeClass('zoomed');
            _zoomed = false;
            $('.zoom-out-button').fadeOut();
            $('.logo').fadeIn();
            _hideMarkers(function () {
                _mapEl.find('.country').fadeIn();
                _zoomOut(function () {
                    _renderMovements();
                    _generateMapGrid();
                    $('.details').empty();
                    Data.clearStories();
                    App.execute(onSuccess);
                });
            });
        } else {
            App.execute(onSuccess);
        }
    }

    function _reset(onSuccess) {
        onSuccess = onSuccess || _showMovements;
        if (_zoomed) {
            _resetMap(onSuccess);
        } else {
            App.execute(onSuccess);
        }
    }

    function _renderMovements() {
        var movementsData = Data.getMovements(_selectedYear);
        $('.movements').remove();
        var movements = _svg.append("g").attr('class', 'movements');
        _.each(movementsData, function (movement) {
            var strokeWidth = movement.num_people / 1000 / 2;
            //GeoJSON Coordinates: [longitude, latitude, altitude]
            var xy = _projection([movement.source_location.longitude, movement.source_location.latitude]);
            var beginPointObj = {"x": xy[0], "y": xy[1]};
            xy = _projection(_destination);
            var endPointObj = {"x": xy[0], "y": xy[1]};
            var unitX = (endPointObj.x - beginPointObj.x) / 4;
            var midPoint1 = {"x": beginPointObj.x + unitX, "y": beginPointObj.y};
            var midPoint2 = {"x": endPointObj.x - unitX, "y": beginPointObj.y + (endPointObj.y - beginPointObj.y) / 2};
            var lineData = [beginPointObj, midPoint1, midPoint2, endPointObj];
            var lineFunction = d3.svg.line().x(function (d) {
                return d.x;
            }).y(function (d) {
                return d.y;
            }).interpolate("basis");
            var movementEl = movements.append("path")
                .attr("d", lineFunction(lineData))
                .attr("id", movement.id)
                .attr("class", "route")
                .style("stroke", "url(" + (movement.source_location.longitude > -25 && movement.source_location.longitude < _destination[0] ? "#arcFadeLeft" : "#arcFadeRight") + ")")
                .style("stroke-width", strokeWidth < 1 ? "1px" : strokeWidth + "px");

            //Apply Animation!
            var path = movementEl[0][0];
            var length = path.getTotalLength();
            // Clear any previous transition
            path.style.transition = path.style.WebkitTransition = 'none';
            // Set up the starting positions
            path.style.strokeDasharray = length + ' ' + length;
            path.style.strokeDashoffset = length;
            // Trigger a layout so styles are calculated & the browser
            // picks up the starting position before animating
            path.getBoundingClientRect();
            requestAnimationFrame(function () {
                // Define our transition
                var delay = _.random(0, 1000);
                path.style.transition = path.style.WebkitTransition = 'stroke-dashoffset 2s ease-in-out ' + delay + 'ms';
                // Go!
                path.style.strokeDashoffset = '0';
            });

        });
//        _.delay(_showCircles, 2000);

    }

    function _hideDetails(onSuccess) {
        _mapRegion.find('.details').fadeOut(function () {
            App.execute(onSuccess);
        });
    }

    function _showDetails(onSuccess) {
        _mapRegion.find('.details').fadeIn(function () {
            App.execute(onSuccess);
        });
    }

    var _thumbSequence = undefined;

    function _showThumb() {
        if (!_thumb) {
            _thumb = $('<div class="thumb-wrapper">').append($('<div class="thumb">')).hide();
            $('body').append(_thumb);
        }
        if (_thumbSequence) clearInterval(_thumbSequence);
        _thumbSequence = setInterval(function () {
            var reference = $('.route').size() > 0 ? $('.route') : $('.country');
            var totalReference = reference.size();
            var randomCountry = $(reference.get(_.random(0, totalReference - 1)));
            _thumb.css({
                top: randomCountry.offset().top - _thumb.height() / 2,
                left: randomCountry.offset().left - _thumb.width() / 2
            });
            _thumb.fadeIn(500);
            _.delay(function () {
                _hideThumb();
            }, 3000);
        }, 5000); // 10s
    }

    function _hideThumb(stop) {
        if (stop) {
            clearInterval(_thumbSequence);
        }
        if (_thumb) {
            _thumb.fadeOut(500, function () {
                if (stop) {
                    _thumb.remove();
                    _thumb = undefined;
                }
            });
        }

    }

    //Public Methods

    function render(view, options) {
        options = options || {};
        options['id'] = 'map-component';
        options['region'] = '.map-region';
        _mapRegion = Component.render(view, options);
        _mapEl = _mapRegion.find('#map');
        queue()
            .defer(d3.json, "data/countries.topo.json")
            .await(function (error, world) {
                _projection = d3.geo.equirectangular().scale(297).translate([_mapEl.width() / 2, _mapEl.height() / 2 + 50])
                    .rotate([-_defaultLat, 0]);

                _width = _mapEl.width();
                _height = _mapEl.height();

                _svg = d3.select("#map").append("svg")
                    .attr("preserveAspectRatio", "xMidYMid")
                    .attr("viewBox", "0 0 " + _width + " " + _height)
                    .attr("width", _width)
                    .attr("height", _height);
                _path = d3.geo.path()
                    .projection(_projection);

                _svg.append("rect")
                    .attr("width", _width)
                    .attr("height", _height)
                    .attr("class", "background");

                _g = _svg.append("g").attr('class', 'world');
                var countries = topojson.feature(world, world.objects.countries).features;
                var country = _g.selectAll(".country").data(countries);

                country
                    .enter()
                    .insert("path")
                    .attr("class", "country")
                    .attr("id", function (d) {
                        return d.id;
                    })
                    .attr("d", _path)
                    .style("stroke", "#fff")
                    .style("stroke-width", "1px")
                    .style("fill", _worldColor);

                _g.select('#AUS').each(function (d) {
                    _destination = d3.geo.centroid(d);
                });
                _worldBounds = $('g.world').get(0).getBoundingClientRect();
                _generateMapGrid();
                View.bindTouchEvent({el: $('.zoom-out-button'), event: 'start', onEvent: _reset});
                startSequence();
                View.enableTouch();
            });
        return _mapEl;
    }

    function updateMovements(options) {
        options = options || {};
        if (options['year']) {
            _hideMovements(function () {
                _mapEl.find('g.movements').remove();
                _selectedYear = parseInt(options['year']);
                _renderMovements();
            });
        }

    }

    function updateMarkers(options) {
        View.disableTouch();
        _selectedYear = options['filter']['yearStart'];
        _renderMarkers();
        _generateZoneGrid();
        View.enableTouch();
    }

    function startSequence() {
        _resetMap(function () {
            $('body').addClass('map-sequence');
            var year = _.isUndefined(_selectedYear) || _selectedYear > _currentYear ? 1945 : _selectedYear + 1;
            Component.Slider.updateYear(year);
            updateMovements({year: year});
            _showThumb();
            if (_sequenceInterval) clearInterval(_sequenceInterval);
            _sequenceInterval = setInterval(function () {
                year = (_selectedYear + 1) > _currentYear ? 1945 : _selectedYear + 1;
                Component.Slider.updateYear(year);
                updateMovements({year: year});
            }, 10000); // 10s
        });
    }

    function stopSequence() {
        $('body').removeClass('map-sequence');
        _hideThumb(true);
        clearInterval(_sequenceInterval);
        _sequenceInterval = undefined;
    }

    function resetWithoutTransition() {
        _scale = 1;
        _x = 0;
        _y = 0;
        _g.selectAll(".active").classed("active", _active = false);
        if (_zoomed) {
            $('body').removeClass('zoomed');
            _zoomed = false;
            $('.zoom-out-button').hide();
            $('.logo').show();
            var markersBubbles = _mapEl.find('.marker, .marker-group, .bubble');
            markersBubbles.remove();
            _mapEl.find('g.markers').remove();
            _mapEl.find('.country').show();
            _path.pointRadius(1);
            _mapRegion.find('.details').hide();
            $('.filter-begin, .filter-end, .selection').hide();
            Component.Slider.update();
            _g.selectAll(".country").style("stroke-width", "1px");
            _g.attr("transform", "");
            $('.details').empty();
            Data.clearStories();
        }
    }

    function restartMap() {
        _renderMovements();
        _generateMapGrid();
    }

    return {
        "updateMovements": updateMovements,
        "updateMarkers": updateMarkers,
        "startSequence": startSequence,
        "stopSequence": stopSequence,
        "resetWithoutTransition": resetWithoutTransition,
        "restartMap": restartMap,
        "render": render
    }
})
();
