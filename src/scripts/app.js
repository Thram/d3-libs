// Main Libraries
var riot = require('riot');

// Tags
require('../tags/container.tag');
require('../tags/nav.tag');
// View Tags
require('../tags/views/home.tag');
require('../tags/views/example1.tag');
require('../tags/views/example2.tag');
require('../tags/views/example3.tag');

// Start App
riot.route.base('/');
riot.mount('*');
riot.route.start(true);