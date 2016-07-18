// Main
if (!dice) {
    var dice = {};
}
dice.manager = new function () {
    var self = this;
    this.players = [];
    this.currentPlayer = null;
    this.targetScore = 10000;
    // Game ends when a player matches this id
    this.lastRoundPlayerId = -1;
    this.roundCount = 0;


    this.addPlayer = function (name) {
        var newIndex = self.getMaxIndex() + 1;
        name = name || "Joueur " + (newIndex + 1);
        var newPlayer = new dice.component.Player(name, newIndex);
        self.players.push(newPlayer);
        dice.ui.addPlayerContainer(newPlayer);
    }

    this.getMaxIndex = function () {
        var result = Math.max.apply(Math, self.players.map(function (o) { return o.index; }));
        return result === -Infinity ? -1 : result;
    }

    this.nextPlayer = function (playerIndex) {
        playerIndex = playerIndex || (self.currentPlayer ? self.currentPlayer.index + 1 : 0);
        if (playerIndex > self.getMaxIndex()) {
            playerIndex = 0;
            self.roundCount++;
        }
        self.currentPlayer = self.players[playerIndex];
        dice.ui.setCurentPlayer(playerIndex);
    }
}