<container>
    <view-home if={ state===
    'home' }></view-home>
    <view-example1 if={ state===
    'example1' }></view-example1>
    <view-example2 if={ state===
    'example2' }></view-example2>
    <view-example3 if={ state===
    'example3' }></view-example3>

    <script>
        var self = this;
        self.title = 'Now loading...';
        self.body = '';
        self.data = [
            {id: 'apple', title: 'Apple', body: "The world biggest fruit company."},
            {id: 'orange', title: 'Orange', body: "I don't have the word for it..."}
        ];
        var riot = require('riot');
        var transitions = require('../scripts/toolbox/transitions');

        var router = riot.route.create();
        router('/', home);
        router('#/', home);
        router('#/example1', example1);
        router('#/example2', example2);
        router('#/example3', example3);
        router(home); // `notfound` would be nicer!

        function home() {
            transitions.show(self, 'home', {body: "Home!!", state: 'home'});
        }

        function example1() {
            transitions.show(self, 'example1', {body: "Example 1!!", state: 'example1'});
        }

        function example2() {
            transitions.show(self, 'example2', {body: "Example 2!!", state: 'example2'});
        }

        function example3() {
            transitions.show(self, 'example3', {body: "Example 3!!", state: 'example3'});
        }
    </script>


    <style scoped>
        :scope {
            z-index: 100;
            position: relative;
            display: block;
            font-family: sans-serif;
            margin-right: 0;
            margin-left: 50px;
            width: 100%;
            height: 100%;
        }

    </style>

</container>
