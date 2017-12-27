Bridge.assembly("Dice", function ($asm, globals) {
    "use strict";

    Bridge.define("Dice.Manager", {
        statics: {
            savedGameStateKey: "DiceSaveGameState",
            savedGamePlayersKey: "DiceSavePlayers",
            getInstance: function () {
                return Dice.Manager.Nested.instance;
            }
        },
        players: null,
        currentPlayer: null,
        lastRoundPlayerIndex: -1,
        roundCount: 0,
        lastPoints: 0,
        config: {
            init: function () {
                this.players = new (System.Collections.Generic.List$1(Dice.Component.Player))();
                this.settings = Bridge.merge(new Dice.Component.GameSettings(), {
        startup: 500,
        cumul: 5000,
        target: 20000
    } );
            }
        },
        ctor: function () {
            this.$initialize();
        },
        addPlayer: function (name) {
            var newIndex = (this.getMaxIndex() + 1) | 0;
            name = System.String.isNullOrWhiteSpace(name) ? "Joueur " + (((newIndex + 1) | 0)) : name;
            var newPlayer = new Dice.Component.Player.$ctor1(name, newIndex);
            this.players.add(newPlayer);
            Dice.Ui.addPlayerContainer(newPlayer);
            if (newIndex === 0) {
                this.currentPlayer = newPlayer;
                Dice.Ui.setCurentPlayer(newIndex);
            }
        },
        getMaxIndex: function () {
            return System.Linq.Enumerable.from(this.players).any() ? System.Linq.Enumerable.from(this.players).max($asm.$.Dice.Manager.f1) : -1;
        },
        nextPlayer: function () {
            // Init
            var nextIndex = this.getNextIndex();
            // accumulate current points
            if (this.currentPlayer == null) {
                Dice.Ui.addAlert("Ajoutez des joueurs pour commencer", Dice.Ui.AlertSeverity.info);
                return;
            }

            // if the last round index is ours we are already game over
            if (this.currentPlayer.index === this.lastRoundPlayerIndex) {
                return;
            }
            var points = Dice.Ui.getAccumulated();
            // Must have enough points to start
            if (points !== 0 && this.currentPlayer.getTotalPoints() < this.settings.startup && points < this.settings.startup) {
                points = 0;
                Dice.Ui.addAlert("Le joueur doit avoir au moins " + this.settings.startup + " pour commencer à cumuler", Dice.Ui.AlertSeverity.warning);
            }
            // Must not bust target 
            if ((((this.currentPlayer.getTotalPoints() + points) | 0) > this.settings.target)) {
                points = 0;
                Dice.Ui.addAlert("Le joueur doit finir à exactement : " + this.settings.target + " points", Dice.Ui.AlertSeverity.warning);
            }
            this.currentPlayer.addPoint(points);
            this.lastPoints = points;
            // Check if can now accumulate last
            if (!this.currentPlayer.canAccumulateLast && this.currentPlayer.getTotalPoints() >= this.settings.cumul) {
                this.currentPlayer.canAccumulateLast = true;
                //TODO: special mark
                Dice.Ui.addAlert(System.String.concat(this.currentPlayer.name, " peux maintenant cumuler le score précédent"), Dice.Ui.AlertSeverity.info);
            }
            // if target reached flag as a winner
            if (this.currentPlayer.getTotalPoints() === this.settings.target) {
                // Add a legendary winning star
                Dice.Ui.addStar(this.currentPlayer.index);
                this.currentPlayer.starCount = (this.currentPlayer.starCount + 1) | 0;
                // flag last round if not allready done
                if (this.lastRoundPlayerIndex === -1) {
                    this.lastRoundPlayerIndex = this.currentPlayer.index;
                    Dice.Ui.addAlert("Dernière ronde !", Dice.Ui.AlertSeverity.info);
                }
            }
            Dice.Ui.addPoint(this.currentPlayer.index, this.roundCount, points, this.currentPlayer.getTotalPoints());
            Dice.Ui.setAccumulated(0);
            // Check if round completed
            if (nextIndex === 0) {
                this.roundCount = (this.roundCount + 1) | 0;
            }
            //Set next player
            this.currentPlayer = this.players.getItem(nextIndex);
            Dice.Ui.setCurentPlayer(nextIndex);
            // if the last round index is the nextr then game over confeties'n shitz
            if (nextIndex === this.lastRoundPlayerIndex) {
                Dice.Ui.addAlert("Game Over !", Dice.Ui.AlertSeverity.success);
            }

            this.saveGame();
        },
        getNextIndex: function () {
            var nextIndex = (this.currentPlayer != null ? ((this.currentPlayer.index + 1) | 0) : 0);
            if (nextIndex > this.getMaxIndex()) {
                nextIndex = 0;
            }
            return nextIndex;
        },
        getPreviousIndex: function () {
            var prevIndex = (this.currentPlayer != null ? ((this.currentPlayer.index - 1) | 0) : this.getMaxIndex());
            if (prevIndex < 0) {
                prevIndex = this.getMaxIndex();
            }
            return prevIndex;
        },
        accumulateLast: function () {
            if (this.currentPlayer == null) {
                return;
            }
            if (this.currentPlayer.canAccumulateLast) {
                Dice.Ui.accumulate(this.lastPoints);
            } else {
                Dice.Ui.addAlert("Le joueur doit avoir au moins " + this.settings.cumul + " pour cumuler les points précédents", Dice.Ui.AlertSeverity.warning);
            }
        },
        nextPlayerAccumulateLast: function () {
            this.nextPlayer();
            this.accumulateLast();
        },
        cancelLastMove: function () {
            // Has a game started ?
            if (this.currentPlayer == null || (this.currentPlayer.index === 0 && this.roundCount === 0)) {
                return;
            }
            var previousIndex = this.getPreviousIndex();
            // restore accumulator
            Dice.Ui.setAccumulated(this.lastPoints);
            // Check if last round was winning move
            if (this.lastRoundPlayerIndex === previousIndex) {
                this.lastRoundPlayerIndex = -1;
            }
            // check if we undo a round
            if (previousIndex === this.getMaxIndex()) {
                this.roundCount = (this.roundCount - 1) | 0;
            }
            // set previous player
            this.currentPlayer = this.getPlayerbyIndex(previousIndex);
            // set in ui
            Dice.Ui.setCurentPlayer(previousIndex);
            // remove points
            this.currentPlayer.removeLastPoints();
            // Remove points from ui
            Dice.Ui.removePoints(previousIndex, this.roundCount, this.currentPlayer.getTotalPoints());
            // Restore previous points
            this.lastPoints = this.getPlayerbyIndex(this.getPreviousIndex()).getLastPoints();
        },
        reset: function () {
            var $t;
            $t = Bridge.getEnumerator(this.players);
            while ($t.moveNext()) {
                var player = $t.getCurrent();
                player.reset();
            }
            Dice.Ui.reset();
            this.lastRoundPlayerIndex = -1;
            this.lastPoints = 0;
            this.currentPlayer = System.Linq.Enumerable.from(this.players).firstOrDefault(null, null);
            this.roundCount = 0;
        },
        newGame: function () {
            // Apply rules
            this.settings = Dice.Ui.getParams().$clone();
            // Flush players
            this.players.clear();
            Dice.Ui.clearPlayerContainer();
            // Reset the rest
            this.reset();
        },
        removePlayer: function (playerIndex) {
            var $t;
            var player = this.getPlayerbyIndex(playerIndex);
            if (player == null) {
                return;
            }
            this.players.remove(player);
            // Re-index
            var idx = 0;
            $t = Bridge.getEnumerator(this.players);
            while ($t.moveNext()) {
                var curPlayer = $t.getCurrent();
                curPlayer.index = Bridge.identity(idx, (idx = (idx + 1) | 0));
            }
            //TODO: re-index ui
            // Remove from ui
            Dice.Ui.removePlayerContainer(playerIndex);
        },
        getPlayerbyIndex: function (playerIndex) {
            return System.Linq.Enumerable.from(this.players).singleOrDefault(function (sg) {
                    return sg.index === playerIndex;
                }, null);
        },
        saveGame: function () {
            window.localStorage.setItem(Dice.Manager.savedGameStateKey, JSON.stringify(this, System.Array.init(["Settings", "RoundCount", "LastPoints", "LastRoundPlayerIndex", "CurrentPlayer"], String)));
            window.localStorage.setItem(Dice.Manager.savedGamePlayersKey, JSON.stringify(this.players));
        },
        loadGame: function () {
            var $t;
            var oldManager = Bridge.merge(Bridge.createInstance(Dice.Manager), JSON.parse(Bridge.cast(window.localStorage.getItem(Dice.Manager.savedGameStateKey), String)));
            var oldPlayers = Bridge.merge(new Array(), JSON.parse(Bridge.cast(window.localStorage.getItem(Dice.Manager.savedGamePlayersKey), String)), null, function(){return Bridge.createInstance(Dice.Component.Player);});

            this.players = System.Linq.Enumerable.from(oldPlayers).toList(Dice.Component.Player);
            this.settings = oldManager.settings.$clone();
            this.roundCount = oldManager.roundCount;
            this.lastPoints = oldManager.lastPoints;
            this.lastRoundPlayerIndex = oldManager.lastRoundPlayerIndex;
            this.currentPlayer = oldManager.currentPlayer;

            // Rebuild the ui
            Dice.Ui.clearPlayerContainer();
            $t = Bridge.getEnumerator(this.players);
            while ($t.moveNext()) {
                (function () {
                    var player = $t.getCurrent();
                    Dice.Ui.addPlayerContainer(player);
                    //Re-Add points history
                    System.Linq.Enumerable.range(0, player.points.getCount()).zip(player.points, $asm.$.Dice.Manager.f2).aggregate(0, function (cur, nxt) {
                        cur = (cur + nxt.point) | 0;
                        Dice.Ui.addPoint(player.index, nxt.round, nxt.point, cur);
                        return cur;
                    });

                    // Restore starz
                    for (var i = 0; i < player.starCount; i = (i + 1) | 0) {
                        Dice.Ui.addStar(player.index);
                    }
                }).call(this);
            }
            Dice.Ui.setCurentPlayer(this.currentPlayer.index);
        }
    });

    Bridge.define("$AnonymousType$1", $asm, {
        $kind: "anonymous",
        ctor: function (round, point) {
            this.round = round;
            this.point = point;
        },
        getround : function () {
            return this.round;
        },
        getpoint : function () {
            return this.point;
        },
        equals: function (o) {
            if (!Bridge.is(o, $asm.$AnonymousType$1)) {
                return false;
            }
            return Bridge.equals(this.round, o.round) && Bridge.equals(this.point, o.point);
        },
        getHashCode: function () {
            var h = Bridge.addHash([7550196186, this.round, this.point]);
            return h;
        },
        toJSON: function () {
            return {
                round : this.round,
                point : this.point
            };
        }
    });

    Bridge.ns("Dice.Manager", $asm.$);

    Bridge.apply($asm.$.Dice.Manager, {
        f1: function (mx) {
            return mx.index;
        },
        f2: function (round, point) {
            return new $asm.$AnonymousType$1(round, point);
        }
    });

    Bridge.define("Dice.Manager.Nested", {
        statics: {
            ctor: function () {
            },
            instance: null,
            config: {
                init: function () {
                    this.instance = new Dice.Manager();
                }
            }
        }
    });

    Bridge.define("Dice.Ui", {
        statics: {
            /**
             * Add the ui column player container
             *
             * @static
             * @public
             * @this Dice.Ui
             * @memberof Dice.Ui
             * @param   {Dice.Component.Player}    playerObject
             * @return  {void}
             */
            addPlayerContainer: function (playerObject) {
                // Get main container
                var scoreboard = $("#dice-scoreboard");
                // This is the column
                var playerContainer = $("<div>");
                playerContainer.attr(Dice.Ui.DiceView.PlayerColumnAttribute, playerObject.index);
                // Panel with title and scoreboard
                var playerPanel = $("<div>");
                playerPanel.addClass("panel panel-default").attr(Dice.Ui.DiceView.PlayerPanelAttribute, playerObject.index).append($("<div>").addClass("panel-heading").append($("<h3>").addClass("panel-title").attr("id", System.String.concat(Dice.Ui.DiceView.PlayerPanelTitleBaseId, playerObject.index)).text(playerObject.name).on("dblclick", playerObject.index.toString(), Dice.Ui.showRename))).append($("<div>").addClass("panel-body low-pad").append($("<ul>").addClass("list-group").attr(Dice.Ui.DiceView.PlayerScoreBoardAttribute, playerObject.index))).append($("<div>").addClass("panel-footer").append($("<h5>").addClass("").attr(Dice.Ui.DiceView.PlayerPanelFooterAttribute, playerObject.index).text("Total: 0")));
                // Adding to containers
                playerContainer.append(playerPanel);
                scoreboard.append(playerContainer);
                // Force wrapping on a new line
                if ((((playerObject.index + 1) | 0)) % (6) === 0) {
                    scoreboard.append($("<div>").addClass("clearfix visible-lg-block"));
                }
                if ((((playerObject.index + 1) | 0)) % (4) === 0) {
                    scoreboard.append($("<div>").addClass("clearfix visible-md-block"));
                }
                if ((((playerObject.index + 1) | 0)) % (4) === 0) {
                    scoreboard.append($("<div>").addClass("clearfix visible-sm-block"));
                }
                if ((((playerObject.index + 1) | 0)) % (3) === 0) {
                    scoreboard.append($("<div>").addClass("clearfix visible-xs-block"));
                }
                // update columns classes
                Dice.Ui.setColumnClass();
            },
            removePlayerContainer: function (playerIndex) {
                $(System.String.concat("[data-player-container=", playerIndex, "]")).remove();
            },
            setColumnClass: function () {
                var playerCount = Dice.Manager.getInstance().players.getCount();
                var containers = $("#dice-scoreboard").find("div[data-player-container]");
                var previousXs = Math.max(Dice.Ui.DiceView.previousColumnSize, Dice.Ui.DiceView.MinColSizeXs);
                var previousSm = Math.max(Dice.Ui.DiceView.previousColumnSize, Dice.Ui.DiceView.MinColSizeSm);
                var previousMd = Math.max(Dice.Ui.DiceView.previousColumnSize, Dice.Ui.DiceView.MinColSizeMd);
                if (Dice.Ui.DiceView.previousColumnSize > 0) {
                    containers.removeClass("col-lg-" + Dice.Ui.DiceView.previousColumnSize + " col-xs-" + previousXs + " col-sm-" + previousSm + " col-md-" + previousMd);
                }
                var columnSize = System.Decimal.toInt(System.Decimal.max(System.Decimal(12.0).div(System.Decimal(playerCount)).floor(), System.Decimal(Dice.Ui.DiceView.MinColSizeLg)), System.Int32);
                var columnSizeXs = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeXs);
                var columnSizeSm = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeSm);
                var columnSizeMd = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeMd);
                containers.addClass("col-lg-" + columnSize + " col-xs-" + columnSizeXs + " col-sm-" + columnSizeSm + " col-md-" + columnSizeMd);
                Dice.Ui.DiceView.previousColumnSize = columnSize;
            },
            setCurentPlayer: function (playerIndex) {
                $("div[data-player-panel]").removeClass("panel-primary").addClass("panel-default");
                $(System.String.concat("div[data-player-panel=", playerIndex, "]")).removeClass("panel-default").addClass("panel-primary");
            },
            addPoint: function (playerIndex, roundNumber, points, totalPoints) {
                var currentPanel = $(System.String.concat("div[data-player-panel=", playerIndex, "]"));
                currentPanel.find("[dice-player-scoreboard]").append($("<li>").addClass("list-group-item low-pad").attr(Dice.Ui.DiceView.PlayerPointsRoundAttribute, roundNumber).text(points));
                currentPanel.find("[dice-player-total]").text("Total: " + totalPoints);
            },
            removePoints: function (playerIndex, roundNumber, totalPoints) {
                var currentPanel = $(System.String.concat("div[data-player-panel=", playerIndex, "]"));
                currentPanel.find(System.String.concat("[dice-score-round=", roundNumber, "]")).remove();
                currentPanel.find("[dice-player-total]").text("Total: " + totalPoints);
            },
            reset: function () {
                $("[dice-player-scoreboard]").html("");
                $("[dice-player-total]").text("Total: 0");
                Dice.Ui.setCurentPlayer(0);
            },
            accumulate: function (points) {
                var accumulator = $("#dice-point-accumulator");
                var currentValue = Dice.Ui.getAccumulated(accumulator);
                accumulator.val((((currentValue + points) | 0)).toString());
            },
            getAccumulated: function (selector) {
                var $t;
                if (selector === void 0) { selector = null; }
                selector = ($t = selector, $t != null ? $t : $("#dice-point-accumulator"));
                var value = { };
                if (!System.Int32.tryParse(Bridge.cast(selector, $).val(), value)) {
                    value.v = 0;
                }
                return value.v;
            },
            setAccumulated: function (value) {
                return $("#dice-point-accumulator").val(value.toString());
            },
            addAlert: function (message, severity) {
                var $t;
                var count = Bridge.identity(Dice.Ui.DiceView.alertCount, ($t = (Dice.Ui.DiceView.alertCount + 1) | 0, Dice.Ui.DiceView.alertCount = $t, $t));
                $("body").append($("<div>").addClass(System.String.concat("alert fade in alert-fixed-top alert-dismissible ", severity)).attr("id", System.String.concat(Dice.Ui.DiceView.AlertBaseId, count)).text(message));
                //Auto Close

                window.setTimeout(function () {
                    $(System.String.concat("#dice-alert-", count)).alert("close");
                }, Dice.Ui.DiceView.AlertDelay);
            },
            getParams: function () {
                var target = { }, startup = { }, cumul = { };
                if (!System.Int32.tryParse($("#dice-param-target").val(), target)) {
                    target.v = 20000;
                }
                if (!System.Int32.tryParse($("#dice-param-startup").val(), startup)) {
                    startup.v = 5000;
                }
                if (!System.Int32.tryParse($("#dice-param-cumul").val(), cumul)) {
                    cumul.v = 500;
                }
                return Bridge.merge(new Dice.Component.GameSettings(), {
                    target: target.v,
                    startup: startup.v,
                    cumul: cumul.v
                } );
            },
            clearPlayerContainer: function () {
                $("#dice-scoreboard").html("");
            },
            addStar: function (playerIndex) {
                $(System.String.concat("#dice-player-name-", playerIndex)).append($("<span>").addClass("glyphicon glyphicon-star pull-right"));
            },
            showRename: function (theEvent) {
                // Set current object
                Dice.Ui.DiceView.renameCurrentPlayer = Dice.Manager.getInstance().getPlayerbyIndex(System.Nullable.getValue(Bridge.cast(Bridge.cast(theEvent, jQuery.Event).data, System.Int32)));
                // Init the rename input to the current name
                $("#dice-rename-input").val(Dice.Ui.DiceView.renameCurrentPlayer.name);
                $("#dice-rename").modal("show");

            },
            sideRename: function () {
                $("#dice-rename").modal("hide");
            },
            rename: function (newName) {
                newName = System.String.isNullOrWhiteSpace(newName) ? $("#dice-rename-input").val() : newName;
                Dice.Ui.DiceView.renameCurrentPlayer.name = newName;
                $(System.String.concat("#dice-player-name-", Dice.Ui.DiceView.renameCurrentPlayer.index)).text(newName);
            }
        }
    });

    Bridge.define("Dice.Ui.AlertSeverity", {
        statics: {
            success: "alert-success",
            warning: "alert-warning",
            info: "alert-info",
            danger: "alert-danger"
        }
    });

    Bridge.define("Dice.Ui.DiceView", {
        statics: {
            PlayerSlots: 12,
            PlayerContainerId: "dice-scoreboard",
            PlayerColumnAttribute: "data-player-container",
            PlayerPanelAttribute: "data-player-panel",
            PlayerPanelTitleBaseId: "dice-player-name-",
            PlayerPanelFooterAttribute: "dice-player-total",
            PlayerScoreBoardAttribute: "dice-player-scoreboard",
            PlayerPointsRoundAttribute: "dice-score-round",
            PlayerPointsAccumulatorId: "dice-point-accumulator",
            AlertBaseId: "dice-alert-",
            ParamTargetId: "dice-param-target",
            ParamStartupId: "dice-param-startup",
            ParamcumulId: "dice-param-cumul",
            ParamCollapsibleId: "dice-params",
            alertCount: 0,
            AlertDelay: 3000,
            previousColumnSize: 0,
            MinColSizeXs: 4,
            MinColSizeSm: 3,
            MinColSizeMd: 3,
            MinColSizeLg: 2,
            RenameId: "dice-rename",
            RenameInputId: "dice-rename-input",
            renameCurrentPlayer: null
        }
    });
});
