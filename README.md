# Front-End Gulp Boilerplate

[![Greenkeeper badge](https://badges.greenkeeper.io/Thram/d3-libs.svg)](https://greenkeeper.io/)

A nice Gulp Boilerplate for Front-End Development using RiotJS (http://riotjs.com/)
## Setup:
Just clone the repository or download and run:
```javascript
npm install
```

Happy Coding!

## Includes:
- RiotJS
- Browserify
- Sass
- Browser Sync
- Source Maps for JS & CSS on Debug Mode
- JS Lint
- Optimize Images
- Run Tests with Jasmine
- Include Partials (@@include) or Templates (%%include)

## Build Commands
### Debug Mode
```javascript
gulp
```
### Release Mode
```javascript
gulp -r // gulp --release
```
### Live Development
```javascript
gulp live 
// Live on Release Mode
gulp live -r // gulp live --release
```
### Tests
```javascript
gulp test
// Watch Mode
gulp test -w // gulp test --watch
```
