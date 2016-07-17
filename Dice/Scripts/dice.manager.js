// Main
if (!dice) {
    var dice = {};
}
dice.manager = new function () {
    var self = this;
    this.players = [];
    this.addPlayer = function (name) {
        var newIndex = self.getMaxIndex() + 1;
        name = name || "Joueur " + (newIndex + 1);

        self.players.push(new dice.component.Player(name, newIndex));
    }

    this.getMaxIndex = function () {
        var result = Math.max.apply(Math, self.players.map(function (o) { return o.index; }));
        return result === -Infinity ? -1 : result;
    }
}