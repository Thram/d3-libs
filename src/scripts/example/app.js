var riot       = require('riot'),
    appHelp    = require('../../tags/example/app-help.tag'),
    appMain    = require('../../tags/example/app-main.tag'),
    appNavi    = require('../../tags/example/app-navi.tag');
module.exports = function () {
  riot.route.base('/');
  riot.mount('*');
  riot.route.start(true);
};

