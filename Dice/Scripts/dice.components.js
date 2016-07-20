// Main
if (!dice) {
    var dice = {};
}
if (!dice.component) {
    dice.component = {};
}
dice.component.Player = function(name, index) {
    var self = this;
    this.name = name;
    this.index = index;
    this.points = [];
    this.totalPoints = function () { return this.points.reduce(function (a, b) { return a + b; }, 0); };
    this.canAccumulateLast = false;


    this.addPoint = function(point) {
        /// <summary>Add points to the points array</summary>
        /// <param name="point" type="number"></param>
        if (point) {
            this.points.push(point);
        }
    }

    this.removeLastPoints = function() {
        /// <summary>Remove last point entry</summary>
        if (self.points.length > 0) {
            self.points.pop();
        }
    }

    this.reset = function() {
        self.points = [];
        self.canAccumulateLast = false;
    }
}