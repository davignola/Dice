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
        if (newIndex === 0) {
            self.currentPlayer = newPlayer;
            dice.ui.setCurentPlayer(newIndex);
        }
    };

    this.getMaxIndex = function () {
        var result = Math.max.apply(Math, self.players.map(function (o) { return o.index; }));
        return result === -Infinity ? -1 : result;
    };

    this.nextPlayer = function () {
        // Init
        var nextIndex = self.getNextIndex();
        // accumulate current points
        if (self.currentPlayer) {
            // if the last round index is ours we are already game over
            if (self.currentPlayer.index === self.lastRoundPlayerIndex) {
                return;
            }
            var points = dice.ui.getAccumulated();
            // Must have enough points to start
            if (points !== 0 && self.currentPlayer.totalPoints() < self.pointsToStart && points < self.pointsToStart) {
                points = 0;
                dice.ui.addAlert("Le joueur doit avoir au moins " + self.pointsToStart + " pour commencer à cumuler", dice.ui.alertSeverity.warning);
            }
            // Must not bust target 
            if ((self.currentPlayer.totalPoints() + points > self.targetScore)) {
                points = 0;
                dice.ui.addAlert("Le joueur doit finir à exactement : " + self.targetScore + " points", dice.ui.alertSeverity.warning);
            }
            self.currentPlayer.addPoint(points);
            self.lastPoints = points;
            // Check if can now accumulate last
            if (!self.currentPlayer.canAccumulateLast && self.currentPlayer.totalPoints() >= self.pointsToAccumulateLast) {
                self.currentPlayer.canAccumulateLast = true;
                //TODO: special mark
                dice.ui.addAlert(self.currentPlayer.name + " peux maintenant cumuler le score précédent", dice.ui.alertSeverity.info);
            }
            // if target reached flag as a winner
            if (self.currentPlayer.totalPoints() === self.targetScore) {
                // Add a legendary winning star
                dice.ui.addStar(self.currentPlayer.index);
                // flag last round if not allready done
                if (self.lastRoundPlayerIndex === -1) {
                    self.lastRoundPlayerIndex = self.currentPlayer.index;
                    dice.ui.addAlert("Dernière ronde !", dice.ui.alertSeverity.info);
                }
            }
            dice.ui.addPoint(self.currentPlayer.index, self.roundCount, points, self.currentPlayer.totalPoints());
            dice.ui.setAccumulated(0);
            // Check if round completed
            if (nextIndex === 0) {
                self.roundCount++;
            }
            //Set next player
            self.currentPlayer = self.players[nextIndex];
            dice.ui.setCurentPlayer(nextIndex);
            // if the last round index is the nextr then game over confeties'n shitz
            if (nextIndex === self.lastRoundPlayerIndex) {
                dice.ui.addAlert("Game Over !", dice.ui.alertSeverity.success);
            }
        } else {
            dice.ui.addAlert("Ajoutez des joueurs pour commencer", dice.ui.alertSeverity.info);
        }
    };

    this.getNextIndex = function () {
        var nextIndex = (self.currentPlayer ? self.currentPlayer.index + 1 : 0);
        if (nextIndex > self.getMaxIndex()) {
            nextIndex = 0;
        }
        return nextIndex;
    };

    this.getPreviousIndex = function () {
        var prevIndex = (self.currentPlayer ? self.currentPlayer.index - 1 : self.getMaxIndex());
        if (prevIndex < 0) {
            prevIndex = self.getMaxIndex();
        }
        return prevIndex;
    };

    this.accumulateLast = function () {
        if (!self.currentPlayer) {
            return;
        }
        if (self.currentPlayer.canAccumulateLast) {
            dice.ui.accumulate(self.lastPoints);
        } else {
            dice.ui.addAlert("Le joueur doit avoir au moins " + self.pointsToAccumulateLast + " pour cumuler les points précédents", dice.ui.alertSeverity.warning);
        }
    };

    this.nextPlayerAccumulateLast = function () {
        self.nextPlayer();
        self.accumulateLast();
    };

    this.cancelLastMove = function () {
        // Has a game started ?
        if (!self.currentPlayer || (self.currentPlayer.index === 0 && self.roundCount === 0)) {
            return;
        }
        var previousIndex = self.getPreviousIndex();
        // restore accumulator
        dice.ui.setAccumulated(self.lastPoints);
        // Check if last round was winning move
        if (self.lastRoundPlayerIndex === previousIndex) {
            self.lastRoundPlayerIndex = -1;
        }
        // check if we undo a round
        if (previousIndex === self.getMaxIndex()) {
            self.roundCount--;
        }
        // set previous player
        self.currentPlayer = self.players[previousIndex];
        // set in ui
        dice.ui.setCurentPlayer(previousIndex);
        // remove points
        self.currentPlayer.removeLastPoints();
        // Remove points from ui
        dice.ui.removePoints(previousIndex, self.roundCount, self.currentPlayer.totalPoints());
        // Restore previous points
        var lastPlayerPoints = self.players[self.getPreviousIndex()].points;
        if (lastPlayerPoints.length > 0) {
            self.lastPoints = lastPlayerPoints[lastPlayerPoints.length - 1];
        } else {
            self.lastPoints = 0;
        }
    };

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
    };

    this.newGame = function () {
        // Apply rules
        var params = dice.ui.getParams();
        self.targetScore = params.target;
        self.pointsToStart = params.startup;
        self.pointsToAccumulateLast = params.cumul;
        // Flush players
        self.players = [];
        dice.ui.clearPlayerContainer();
        // Reset the rest
        self.reset();
    };

    this.removePlayer = function(playerIndex) {
        self.players.slice(playerIndex);
        // Re-index
        for (var i in self.players) {
            if (self.players.hasOwnProperty(i)) {
                self.players[i].index = Number(i);
            }
        }
        //TODO: re-index ui
        // Remove from ui
        dice.ui.removePlayerContainer(playerIndex);
    }
};