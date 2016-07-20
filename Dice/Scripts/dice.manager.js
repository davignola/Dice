// Main
if (!dice) {
    var dice = {};
}
dice.manager = new function () {
    var self = this;
    this.players = [];
    this.currentPlayer = null;
    this.targetScore = 20000;
    // Game ends when a player matches this id
    this.lastRoundPlayerIndex = -1;
    this.roundCount = 0;
    this.pointsToStart = 500;
    this.pointsToAccumulateLast = 5000;
    this.lastPoints = 0;


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

    this.nextPlayer = function () {
        // Init
        var nextIndex = (self.currentPlayer ? self.currentPlayer.index + 1 : 0);
        if (nextIndex > self.getMaxIndex()) {
            nextIndex = 0;
            self.roundCount++;
        }
        // accumulate current points
        if (self.currentPlayer) {
            // if the last round index is ours we are already game over
            if (self.currentPlayer.index === self.lastRoundPlayerIndex) {
                return;
            }
            var points = dice.ui.getAccumulated();
            // Must have enough points to start and must not bust target
            if ((self.currentPlayer.totalPoints() < self.pointsToStart && points < self.pointsToStart) ||
                (self.currentPlayer.totalPoints() + points > self.targetScore)) {
                points = 0;
            }
            self.currentPlayer.addPoint(points);
            self.lastPoints = points;
            // Check if can now accumulate last
            if (!self.currentPlayer.canAccumulateLast && self.currentPlayer.totalPoints() >= self.pointsToAccumulateLast) {
                self.currentPlayer.canAccumulateLast = true;
                //TODO: special mark
            }
            // if target reached flag as a winner
            if (self.currentPlayer.totalPoints() === self.targetScore) {
                //TODO: ui.setWiener !
                // flag last round if not allready done
                if (self.lastRoundPlayerIndex === -1) {
                    self.lastRoundPlayerIndex = self.currentPlayer.index;
                }
            }
            dice.ui.addPoint(self.currentPlayer.index, self.roundCount, points, self.currentPlayer.totalPoints());
            dice.ui.setAccumulated(0);
        }
        //Set next player
        self.currentPlayer = self.players[nextIndex];
        dice.ui.setCurentPlayer(nextIndex);
        // if the last round index is the nextr then game over confeties'n shitz
        if (nextIndex === self.lastRoundPlayerIndex) {
            // Todo: win message
        }
    }

    this.accumulateLast = function () {
        if (self.currentPlayer.canAccumulateLast) {
            dice.ui.accumulate(self.lastPoints);
        }
    }

    this.nextPlayerAccumulateLast = function () {
        self.nextPlayer();
        self.accumulateLast();
    }

    this.reset = function () {
        for (var i in self.players) {
            if (self.players.hasOwnProperty(i)) {
                self.players[i].reset();
            }
        }
        dice.ui.reset();
        self.lastRoundPlayerIndex = -1;
        self.lastPoints = 0;
        self.currentPlayer = self.players[0];
        self.roundCount = 0;
    }
}