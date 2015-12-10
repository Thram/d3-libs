<view-example1 class="view">
    <article>
        <h1>Example 1</h1>

        <h2>Line Chart</h2>

        <div id="chart"></div>
        <button onclick="{updateChart}">Update!</button>
    </article>

    <script>
        var self = this;
        var d3Chart = require('../../scripts/components/chart');
        var chart = d3Chart('line', {
            background_color: "#231F20",
            container       : self.chart
        });
        var data = [
            [{"x": "0", "y": "0"}, {"x": "10", "y": "10"}, {"x": "20", "y": "5"}, {"x": "54", "y": "23"}, {
                "x": "75",
                "y": "12"
            }, {"x": "93", "y": "5"}],
            [{"x": "0", "y": "0"}, {"x": "10", "y": "30"}, {"x": "20", "y": "45"}, {"x": "50", "y": "23"}, {
                "x": "75",
                "y": "12"
            }, {"x": "100", "y": "84"}]
        ];
        self.updateChart = function (e) {
            console.log('Update!');
            chart.setDataSource({
                src: [data[1]]
            });
            console.log('Update!');
            chart.draw();
            console.log('Update!');
        }
        chart.setDataSource({
            src: [data[0]]
        });
        self.parent.on('show:example1', function () {
            chart.draw();
        });

    </script>

</view-example1>
