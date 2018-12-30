/**
 * @version 1.0.0.0
 * @copyright Copyright ©  2017
 * @compiler Bridge.NET 17.6.0
 */
Bridge.assembly("Dice", function ($asm, globals) {
    "use strict";

    Bridge.define("Dice.Component.GameSettings", {
        $kind: "struct",
        statics: {
            methods: {
                getDefaultValue: function () { return new Dice.Component.GameSettings(); }
            }
        },
        fields: {
            Target: 0,
            Startup: 0,
            Cumul: 0
        },
        ctors: {
            ctor: function () {
                this.$initialize();
            }
        },
        methods: {
            getHashCode: function () {
                var h = Bridge.addHash([5591610627, this.Target, this.Startup, this.Cumul]);
                return h;
            },
            equals: function (o) {
                if (!Bridge.is(o, Dice.Component.GameSettings)) {
                    return false;
                }
                return Bridge.equals(this.Target, o.Target) && Bridge.equals(this.Startup, o.Startup) && Bridge.equals(this.Cumul, o.Cumul);
            },
            $clone: function (to) {
                var s = to || new Dice.Component.GameSettings();
                s.Target = this.Target;
                s.Startup = this.Startup;
                s.Cumul = this.Cumul;
                return s;
            }
        }
    });

    /** @namespace Dice.Component */

    /**
     * Player class
     *
     * @public
     * @class Dice.Component.Player
     */
    Bridge.define("Dice.Component.Player", {
        fields: {
            Name: null,
            Index: 0,
            Points: null,
            StarCount: 0,
            CanAccumulateLast: false
        },
        props: {
            TotalPoints: {
                get: function () {
                    return System.Linq.Enumerable.from(this.Points).sum();
                }
            },
            LastPoints: {
                get: function () {
                    return System.Linq.Enumerable.from(this.Points).lastOrDefault(null, 0);
                }
            }
        },
        ctors: {
            init: function () {
                this.Points = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                this.CanAccumulateLast = false;
            },
            ctor: function () {
                this.$initialize();
                this.Name = "Default";
                this.Index = -1;
            },
            $ctor1: function (name, index) {
                this.$initialize();
                this.Name = name;
                this.Index = index;
            }
        },
        methods: {
            AddPoint: function (point) {
                this.Points.add(point);
            },
            /**
             * Remove last point entry
             *
             * @instance
             * @public
             * @this Dice.Component.Player
             * @memberof Dice.Component.Player
             * @return  {void}
             */
            RemoveLastPoints: function () {
                if (System.Linq.Enumerable.from(this.Points).any()) {
                    this.Points.remove(System.Linq.Enumerable.from(this.Points).last());
                }
            },
            Reset: function () {
                this.Points.clear();
                this.CanAccumulateLast = false;
            }
        }
    });

    Bridge.define("Dice.Manager", {
        statics: {
            fields: {
                savedGameStateKey: null,
                savedGamePlayersKey: null
            },
            props: {
                Instance: {
                    get: function () {
                        return Dice.Manager.Nested.instance;
                    }
                }
            },
            ctors: {
                init: function () {
                    this.savedGameStateKey = "DiceSaveGameState";
                    this.savedGamePlayersKey = "DiceSavePlayers";
                }
            }
        },
        fields: {
            Players: null,
            CurrentPlayer: null,
            Settings: null,
            LastRoundPlayerIndex: 0,
            RoundCount: 0,
            LastPoints: 0
        },
        ctors: {
            init: function () {
                var $t;
                this.Settings = new Dice.Component.GameSettings();
                this.Players = new (System.Collections.Generic.List$1(Dice.Component.Player)).ctor();
                this.Settings = ($t = new Dice.Component.GameSettings(), $t.Startup = 500, $t.Cumul = 5000, $t.Target = 20000, $t);
                this.LastRoundPlayerIndex = -1;
                this.RoundCount = 0;
                this.LastPoints = 0;
            },
            ctor: function () {
                this.$initialize();
            }
        },
        methods: {
            AddPlayer: function (name) {
                var newIndex = (this.GetMaxIndex() + 1) | 0;
                name = System.String.isNullOrWhiteSpace(name) ? "Joueur " + (((newIndex + 1) | 0)) : name;
                var newPlayer = new Dice.Component.Player.$ctor1(name, newIndex);
                this.Players.add(newPlayer);
                Dice.Ui.AddPlayerContainer(newPlayer);
                if (newIndex === 0) {
                    this.CurrentPlayer = newPlayer;
                    Dice.Ui.SetCurentPlayer(newIndex);
                }
            },
            GetMaxIndex: function () {
                return System.Linq.Enumerable.from(this.Players).any() ? System.Linq.Enumerable.from(this.Players).max(function (mx) {
                        return mx.Index;
                    }) : -1;
            },
            NextPlayer: function () {
                var nextIndex = this.GetNextIndex();
                if (this.CurrentPlayer == null) {
                    Dice.Ui.AddAlert("Ajoutez des joueurs pour commencer", Dice.Ui.AlertSeverity.info);
                    return;
                }

                if (this.CurrentPlayer.Index === this.LastRoundPlayerIndex) {
                    return;
                }
                var points = Dice.Ui.GetAccumulated();
                if (points !== 0 && this.CurrentPlayer.TotalPoints < this.Settings.Startup && points < this.Settings.Startup) {
                    points = 0;
                    Dice.Ui.AddAlert("Le joueur doit avoir au moins " + this.Settings.Startup + " pour commencer à cumuler", Dice.Ui.AlertSeverity.warning);
                }
                if ((((this.CurrentPlayer.TotalPoints + points) | 0) > this.Settings.Target)) {
                    points = 0;
                    Dice.Ui.AddAlert("Le joueur doit finir à exactement : " + this.Settings.Target + " points", Dice.Ui.AlertSeverity.warning);
                }
                this.CurrentPlayer.AddPoint(points);
                this.LastPoints = points;
                if (!this.CurrentPlayer.CanAccumulateLast && this.CurrentPlayer.TotalPoints >= this.Settings.Cumul) {
                    this.CurrentPlayer.CanAccumulateLast = true;
                    Dice.Ui.AddAlert((this.CurrentPlayer.Name || "") + " peux maintenant cumuler le score précédent", Dice.Ui.AlertSeverity.info);
                }
                if (this.CurrentPlayer.TotalPoints === this.Settings.Target) {
                    Dice.Ui.AddStar(this.CurrentPlayer.Index);
                    this.CurrentPlayer.StarCount = (this.CurrentPlayer.StarCount + 1) | 0;
                    if (this.LastRoundPlayerIndex === -1) {
                        this.LastRoundPlayerIndex = this.CurrentPlayer.Index;
                        Dice.Ui.AddAlert("Dernière ronde !", Dice.Ui.AlertSeverity.info);
                    }
                }
                Dice.Ui.AddPoint(this.CurrentPlayer.Index, this.RoundCount, points, this.CurrentPlayer.TotalPoints);
                Dice.Ui.SetAccumulated(0);
                if (nextIndex === 0) {
                    this.RoundCount = (this.RoundCount + 1) | 0;
                }
                this.CurrentPlayer = this.Players.getItem(nextIndex);
                Dice.Ui.SetCurentPlayer(nextIndex);
                if (nextIndex === this.LastRoundPlayerIndex) {
                    Dice.Ui.AddAlert("Game Over !", Dice.Ui.AlertSeverity.success);
                }

                this.SaveGame();
            },
            GetNextIndex: function () {
                var nextIndex = (this.CurrentPlayer != null ? ((this.CurrentPlayer.Index + 1) | 0) : 0);
                if (nextIndex > this.GetMaxIndex()) {
                    nextIndex = 0;
                }
                return nextIndex;
            },
            GetPreviousIndex: function () {
                var prevIndex = (this.CurrentPlayer != null ? ((this.CurrentPlayer.Index - 1) | 0) : this.GetMaxIndex());
                if (prevIndex < 0) {
                    prevIndex = this.GetMaxIndex();
                }
                return prevIndex;
            },
            AccumulateLast: function () {
                if (this.CurrentPlayer == null) {
                    return;
                }
                if (this.CurrentPlayer.CanAccumulateLast) {
                    Dice.Ui.Accumulate(this.LastPoints);
                } else {
                    Dice.Ui.AddAlert("Le joueur doit avoir au moins " + this.Settings.Cumul + " pour cumuler les points précédents", Dice.Ui.AlertSeverity.warning);
                }
            },
            NextPlayerAccumulateLast: function () {
                this.NextPlayer();
                this.AccumulateLast();
            },
            CancelLastMove: function () {
                if (this.CurrentPlayer == null || (this.CurrentPlayer.Index === 0 && this.RoundCount === 0)) {
                    return;
                }
                var previousIndex = this.GetPreviousIndex();
                Dice.Ui.SetAccumulated(this.LastPoints);
                if (this.LastRoundPlayerIndex === previousIndex) {
                    this.LastRoundPlayerIndex = -1;
                }
                if (previousIndex === this.GetMaxIndex()) {
                    this.RoundCount = (this.RoundCount - 1) | 0;
                }
                this.CurrentPlayer = this.GetPlayerbyIndex(previousIndex);
                Dice.Ui.SetCurentPlayer(previousIndex);
                this.CurrentPlayer.RemoveLastPoints();
                Dice.Ui.RemovePoints(previousIndex, this.RoundCount, this.CurrentPlayer.TotalPoints);
                this.LastPoints = this.GetPlayerbyIndex(this.GetPreviousIndex()).LastPoints;
            },
            Reset: function () {
                var $t;
                this.Settings = Dice.Ui.GetParams();

                $t = Bridge.getEnumerator(this.Players);
                try {
                    while ($t.moveNext()) {
                        var player = $t.Current;
                        player.Reset();
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$Dispose();
                    }
                }
                Dice.Ui.Reset();
                this.LastRoundPlayerIndex = -1;
                this.LastPoints = 0;
                this.CurrentPlayer = System.Linq.Enumerable.from(this.Players).firstOrDefault(null, null);
                this.RoundCount = 0;
            },
            NewGame: function () {
                this.Settings = Dice.Ui.GetParams();
                this.Players.clear();
                Dice.Ui.ClearPlayerContainer();
                this.Reset();
            },
            RemovePlayer: function (playerIndex) {
                var $t;
                var player = this.GetPlayerbyIndex(playerIndex);
                if (player == null) {
                    return;
                }
                this.Players.remove(player);
                var idx = 0;
                $t = Bridge.getEnumerator(this.Players);
                try {
                    while ($t.moveNext()) {
                        var curPlayer = $t.Current;
                        curPlayer.Index = Bridge.identity(idx, (idx = (idx + 1) | 0));
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$Dispose();
                    }
                }
                Dice.Ui.RemovePlayerContainer(playerIndex);
            },
            GetPlayerbyIndex: function (playerIndex) {
                return System.Linq.Enumerable.from(this.Players).singleOrDefault(function (sg) {
                        return sg.Index === playerIndex;
                    }, null);
            },
            SaveGame: function () {
                window.localStorage.setItem(Dice.Manager.savedGameStateKey, JSON.stringify(this, System.Array.init(["Settings", "RoundCount", "LastPoints", "LastRoundPlayerIndex", "CurrentPlayer"], System.String)));
                window.localStorage.setItem(Dice.Manager.savedGamePlayersKey, JSON.stringify(this.Players.ToArray()));
            },
            LoadGame: function () {
                var $t;
                var oldManager = Bridge.merge(Bridge.createInstance(Dice.Manager), JSON.parse(Bridge.cast(window.localStorage.getItem(Dice.Manager.savedGameStateKey), System.String)));
                var oldPlayers = Bridge.merge(new Array(), JSON.parse(Bridge.cast(window.localStorage.getItem(Dice.Manager.savedGamePlayersKey), System.String)), null, function(){return Bridge.createInstance(Dice.Component.Player);});

                this.Players = System.Linq.Enumerable.from(oldPlayers).toList(Dice.Component.Player);
                this.Settings = oldManager.Settings.$clone();
                this.RoundCount = oldManager.RoundCount;
                this.LastPoints = oldManager.LastPoints;
                this.LastRoundPlayerIndex = oldManager.LastRoundPlayerIndex;
                this.CurrentPlayer = oldManager.CurrentPlayer;

                Dice.Ui.ClearPlayerContainer();
                $t = Bridge.getEnumerator(this.Players);
                try {
                    while ($t.moveNext()) {
                        var player = { v : $t.Current };
                        Dice.Ui.AddPlayerContainer(player.v);
                        System.Linq.Enumerable.range(0, player.v.Points.Count).zip(player.v.Points, function (round, point) {
                            return { round: round, point: point };
                        }).aggregate(0, (function ($me, player) {
                            return function (cur, nxt) {
                                cur = (cur + nxt.point) | 0;
                                Dice.Ui.AddPoint(player.v.Index, nxt.round, nxt.point, cur);
                                return cur;
                            };
                        })(this, player));

                        for (var i = 0; i < player.v.StarCount; i = (i + 1) | 0) {
                            Dice.Ui.AddStar(player.v.Index);
                        }
                    }
                } finally {
                    if (Bridge.is($t, System.IDisposable)) {
                        $t.System$IDisposable$Dispose();
                    }
                }
                Dice.Ui.SetCurentPlayer(this.CurrentPlayer.Index);
            }
        }
    });

    Bridge.define("Dice.Manager.Nested", {
        $kind: "nested class",
        statics: {
            fields: {
                instance: null
            },
            ctors: {
                init: function () {
                    this.instance = new Dice.Manager();
                },
                ctor: function () {
                }
            }
        }
    });

    Bridge.define("Dice.Ui", {
        statics: {
            methods: {
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
                AddPlayerContainer: function (playerObject) {
                    var scoreboard = $("#dice-scoreboard");
                    var playerContainer = $("<div>");
                    playerContainer.attr(Dice.Ui.DiceView.PlayerColumnAttribute, playerObject.Index);
                    var playerPanel = $("<div>");
                    playerPanel.addClass("panel panel-default").attr(Dice.Ui.DiceView.PlayerPanelAttribute, playerObject.Index).append($("<div>").addClass("panel-heading low-pad").append($("<h3>").addClass("panel-title").attr("id", (Dice.Ui.DiceView.PlayerPanelTitleBaseId || "") + playerObject.Index).append($("<span>").addClass("player-name").text(playerObject.Name)).append($("<span>").addClass("glyphicon glyphicon-edit pull-right player-icon").on("click", null, Bridge.toString(playerObject.Index), Dice.Ui.ShowRename)))).append($("<div>").addClass("panel-body low-pad").append($("<ul>").addClass("list-group").attr(Dice.Ui.DiceView.PlayerScoreBoardAttribute, playerObject.Index))).append($("<div>").addClass("panel-footer").append($("<h5>").addClass("").attr(Dice.Ui.DiceView.PlayerPanelFooterAttribute, playerObject.Index).text("Total: 0")));
                    playerContainer.append(playerPanel);
                    scoreboard.append(playerContainer);
                    if ((((playerObject.Index + 1) | 0)) % (6) === 0) {
                        scoreboard.append($("<div>").addClass("clearfix visible-lg-block"));
                    }
                    if ((((playerObject.Index + 1) | 0)) % (4) === 0) {
                        scoreboard.append($("<div>").addClass("clearfix visible-md-block"));
                    }
                    if ((((playerObject.Index + 1) | 0)) % (4) === 0) {
                        scoreboard.append($("<div>").addClass("clearfix visible-sm-block"));
                    }
                    if ((((playerObject.Index + 1) | 0)) % (3) === 0) {
                        scoreboard.append($("<div>").addClass("clearfix visible-xs-block"));
                    }
                    Dice.Ui.SetColumnClass();
                },
                RemovePlayerContainer: function (playerIndex) {
                    $("[data-player-container=" + playerIndex + "]").remove();
                },
                SetColumnClass: function () {
                    var playerCount = Dice.Manager.Instance.Players.Count;
                    var containers = $("#dice-scoreboard").find("div[data-player-container]");
                    var previousXs = Math.max(Dice.Ui.DiceView.PreviousColumnSize, Dice.Ui.DiceView.MinColSizeXs);
                    var previousSm = Math.max(Dice.Ui.DiceView.PreviousColumnSize, Dice.Ui.DiceView.MinColSizeSm);
                    var previousMd = Math.max(Dice.Ui.DiceView.PreviousColumnSize, Dice.Ui.DiceView.MinColSizeMd);
                    if (Dice.Ui.DiceView.PreviousColumnSize > 0) {
                        containers.removeClass("col-lg-" + Dice.Ui.DiceView.PreviousColumnSize + " col-xs-" + previousXs + " col-sm-" + previousSm + " col-md-" + previousMd);
                    }
                    var columnSize = System.Decimal.toInt(System.Decimal.max(System.Decimal(12.0).div(System.Decimal(playerCount)).floor(), System.Decimal(Dice.Ui.DiceView.MinColSizeLg)), System.Int32);
                    var columnSizeXs = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeXs);
                    var columnSizeSm = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeSm);
                    var columnSizeMd = Math.max(columnSize, Dice.Ui.DiceView.MinColSizeMd);
                    containers.addClass("col-lg-" + columnSize + " col-xs-" + columnSizeXs + " col-sm-" + columnSizeSm + " col-md-" + columnSizeMd);
                    Dice.Ui.DiceView.PreviousColumnSize = columnSize;
                },
                SetCurentPlayer: function (playerIndex) {
                    $("div[data-player-panel]").removeClass("panel-primary").addClass("panel-default");
                    $("div[data-player-panel=" + playerIndex + "]").removeClass("panel-default").addClass("panel-primary");
                },
                AddPoint: function (playerIndex, roundNumber, points, totalPoints) {
                    var currentPanel = $("div[data-player-panel=" + playerIndex + "]");
                    currentPanel.find("[dice-player-scoreboard]").append($("<li>").addClass("list-group-item low-pad").attr(Dice.Ui.DiceView.PlayerPointsRoundAttribute, roundNumber).text(points));
                    currentPanel.find("[dice-player-total]").text("Total: " + totalPoints);
                },
                RemovePoints: function (playerIndex, roundNumber, totalPoints) {
                    var currentPanel = $("div[data-player-panel=" + playerIndex + "]");
                    currentPanel.find("[dice-score-round=" + roundNumber + "]").remove();
                    currentPanel.find("[dice-player-total]").text("Total: " + totalPoints);
                },
                Reset: function () {
                    $("[dice-player-scoreboard]").html("");
                    $("[dice-player-total]").text("Total: 0");
                    Dice.Ui.SetCurentPlayer(0);
                },
                Accumulate: function (points) {
                    var accumulator = $("#dice-point-accumulator");
                    var currentValue = Dice.Ui.GetAccumulated(accumulator);
                    accumulator.val(Bridge.toString((((currentValue + points) | 0))));
                },
                GetAccumulated: function (selector) {
                    var $t;
                    if (selector === void 0) { selector = null; }
                    selector = ($t = selector, $t != null ? $t : $("#dice-point-accumulator"));
                    var value = { };
                    if (!System.Int32.tryParse(Bridge.cast(selector, $).val(), value)) {
                        value.v = 0;
                    }
                    return value.v;
                },
                SetAccumulated: function (value) {
                    return $("#dice-point-accumulator").val(Bridge.toString(value));
                },
                AddAlert: function (message, severity) {
                    var $t;
                    var count = Bridge.identity(Dice.Ui.DiceView.AlertCount, ($t = (Dice.Ui.DiceView.AlertCount + 1) | 0, Dice.Ui.DiceView.AlertCount = $t, $t));
                    $("body").append($("<div>").addClass("alert fade in alert-fixed-top alert-dismissible " + (severity || "")).attr("id", (Dice.Ui.DiceView.AlertBaseId || "") + count).text(message));

                    window.setTimeout(function () {
                        $("#dice-alert-" + count).alert("close");
                    }, Dice.Ui.DiceView.AlertDelay);
                },
                GetParams: function () {
                    var $t;
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
                    return ($t = new Dice.Component.GameSettings(), $t.Target = target.v, $t.Startup = startup.v, $t.Cumul = cumul.v, $t);
                },
                ClearPlayerContainer: function () {
                    $("#dice-scoreboard").html("");
                },
                AddStar: function (playerIndex) {
                    $("#dice-player-name-" + playerIndex).append($("<span>").addClass("glyphicon glyphicon-star pull-right player-icon"));
                },
                ShowRename: function (theEvent) {
                    var jQueryEvent = Bridge.as(theEvent, jQuery.Event);
                    if (jQueryEvent == null) {
                        return;
                    }
                    Dice.Ui.DiceView.RenameCurrentPlayer = Dice.Manager.Instance.GetPlayerbyIndex(System.Int32.parse(Bridge.toString(jQueryEvent.data)));
                    $("#dice-rename-input").val(Dice.Ui.DiceView.RenameCurrentPlayer.Name);
                    $("#dice-rename").modal("show");

                },
                SideRename: function () {
                    $("#dice-rename").modal("hide");
                },
                Rename: function (newName) {
                    newName = System.String.isNullOrWhiteSpace(newName) ? $("#dice-rename-input").val() : newName;
                    Dice.Ui.DiceView.RenameCurrentPlayer.Name = newName;
                    $("#dice-player-name-" + Dice.Ui.DiceView.RenameCurrentPlayer.Index + " .player-name").text(newName);
                }
            }
        }
    });

    Bridge.define("Dice.Ui.AlertSeverity", {
        $kind: "nested class",
        statics: {
            fields: {
                success: null,
                warning: null,
                info: null,
                danger: null
            },
            ctors: {
                init: function () {
                    this.success = "alert-success";
                    this.warning = "alert-warning";
                    this.info = "alert-info";
                    this.danger = "alert-danger";
                }
            }
        }
    });

    Bridge.define("Dice.Ui.DiceView", {
        $kind: "nested class",
        statics: {
            fields: {
                PlayerSlots: 0,
                PlayerContainerId: null,
                PlayerColumnAttribute: null,
                PlayerPanelAttribute: null,
                PlayerPanelTitleBaseId: null,
                PlayerPanelFooterAttribute: null,
                PlayerScoreBoardAttribute: null,
                PlayerPointsRoundAttribute: null,
                PlayerPointsAccumulatorId: null,
                AlertBaseId: null,
                ParamTargetId: null,
                ParamStartupId: null,
                ParamcumulId: null,
                ParamCollapsibleId: null,
                AlertCount: 0,
                AlertDelay: 0,
                PreviousColumnSize: 0,
                MinColSizeXs: 0,
                MinColSizeSm: 0,
                MinColSizeMd: 0,
                MinColSizeLg: 0,
                RenameId: null,
                RenameInputId: null,
                RenameCurrentPlayer: null
            },
            ctors: {
                init: function () {
                    this.PlayerSlots = 12;
                    this.PlayerContainerId = "dice-scoreboard";
                    this.PlayerColumnAttribute = "data-player-container";
                    this.PlayerPanelAttribute = "data-player-panel";
                    this.PlayerPanelTitleBaseId = "dice-player-name-";
                    this.PlayerPanelFooterAttribute = "dice-player-total";
                    this.PlayerScoreBoardAttribute = "dice-player-scoreboard";
                    this.PlayerPointsRoundAttribute = "dice-score-round";
                    this.PlayerPointsAccumulatorId = "dice-point-accumulator";
                    this.AlertBaseId = "dice-alert-";
                    this.ParamTargetId = "dice-param-target";
                    this.ParamStartupId = "dice-param-startup";
                    this.ParamcumulId = "dice-param-cumul";
                    this.ParamCollapsibleId = "dice-params";
                    this.AlertCount = 0;
                    this.AlertDelay = 3000;
                    this.PreviousColumnSize = 0;
                    this.MinColSizeXs = 4;
                    this.MinColSizeSm = 3;
                    this.MinColSizeMd = 3;
                    this.MinColSizeLg = 2;
                    this.RenameId = "dice-rename";
                    this.RenameInputId = "dice-rename-input";
                }
            }
        }
    });
});

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJEaWNlLmpzIiwKICAic291cmNlUm9vdCI6ICIiLAogICJzb3VyY2VzIjogWyJDb21wb25lbnQvUGxheWVyLmNzIiwiTWFuYWdlci5jcyIsIlVpLmNzIl0sCiAgIm5hbWVzIjogWyIiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFrQnVDQSxPQUFPQTs7Ozs7b0JBQ1JBLE9BQU9BLDRCQUEwQ0E7Ozs7Ozs4QkFGckRBLEtBQUlBOzs7OztnQkFRMUJBO2dCQUNBQSxhQUFRQTs7OEJBR0VBLE1BQWFBOztnQkFFdkJBLFlBQU9BO2dCQUNQQSxhQUFRQTs7OztnQ0FHU0E7Z0JBRWpCQSxnQkFBV0E7Ozs7Ozs7Ozs7OztnQkFRWEEsSUFBSUEsNEJBQWdDQTtvQkFFaENBLG1CQUFtQkEsNEJBQWlDQTs7OztnQkFNeERBO2dCQUNBQTs7Ozs7Ozs7Ozs7Ozs7d0JDckNtQ0EsT0FBT0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytCQWdCaEJBLEtBQUlBO2dDQUVIQSxVQUFJQTs0Q0FHREE7Ozs7Ozs7OztpQ0FJWkE7Z0JBRWxCQSxlQUFlQTtnQkFDZkEsT0FBT0EsaUNBQTBCQSxRQUFRQSxZQUFZQSxDQUFDQSx3QkFBZ0JBO2dCQUN0RUEsZ0JBQWdCQSxJQUFJQSw2QkFBT0EsTUFBTUE7Z0JBQ2pDQSxpQkFBWUE7Z0JBQ1pBLDJCQUFzQkE7Z0JBQ3RCQSxJQUFJQTtvQkFFQUEscUJBQXFCQTtvQkFDckJBLHdCQUFtQkE7Ozs7Z0JBTXZCQSxPQUFPQSw0QkFBbUNBLHNCQUFXQSw0QkFBbUNBLGtCQUFRQSxBQUFtQkE7K0JBQU1BO3lCQUFhQTs7O2dCQU10SUEsZ0JBQWdCQTtnQkFFaEJBLElBQUlBLHNCQUFzQkE7b0JBQVFBLHVEQUFrREE7b0JBQXdCQTs7O2dCQUc1R0EsSUFBSUEsNkJBQTRCQTtvQkFFNUJBOztnQkFFSkEsYUFBYUE7Z0JBRWJBLElBQUlBLGdCQUFlQSxpQ0FBaUNBLHlCQUF5QkEsU0FBU0E7b0JBRWxGQTtvQkFDQUEsaUJBQVlBLG1DQUFtQ0EscURBQXFEQTs7Z0JBR3hHQSxJQUFJQSxDQUFDQSxtQ0FBaUNBLGVBQVNBO29CQUUzQ0E7b0JBQ0FBLGlCQUFZQSx5Q0FBeUNBLGtDQUFrQ0E7O2dCQUUzRkEsNEJBQTRCQTtnQkFDNUJBLGtCQUFrQkE7Z0JBRWxCQSxJQUFJQSxDQUFDQSx3Q0FBd0NBLGtDQUFrQ0E7b0JBRTNFQTtvQkFFQUEsaUJBQVlBLGlGQUF5RUE7O2dCQUd6RkEsSUFBSUEsbUNBQWtDQTtvQkFHbENBLGdCQUFXQTtvQkFDWEE7b0JBRUFBLElBQUlBLDhCQUE2QkE7d0JBRTdCQSw0QkFBNEJBO3dCQUM1QkEscUNBQWdDQTs7O2dCQUd4Q0EsaUJBQVlBLDBCQUEwQkEsaUJBQWlCQSxRQUFRQTtnQkFDL0RBO2dCQUVBQSxJQUFJQTtvQkFFQUE7O2dCQUdKQSxxQkFBcUJBLHFCQUFhQTtnQkFDbENBLHdCQUFtQkE7Z0JBRW5CQSxJQUFJQSxjQUFhQTtvQkFFYkEsZ0NBQTJCQTs7O2dCQUcvQkE7OztnQkFJQUEsZ0JBQWdCQSxDQUFDQSxzQkFBc0JBLE9BQU9BO2dCQUM5Q0EsSUFBSUEsWUFBWUE7b0JBRVpBOztnQkFFSkEsT0FBT0E7OztnQkFLUEEsZ0JBQWdCQSxDQUFDQSxzQkFBc0JBLE9BQU9BLHVDQUErQkE7Z0JBQzdFQSxJQUFJQTtvQkFFQUEsWUFBWUE7O2dCQUVoQkEsT0FBT0E7OztnQkFLUEEsSUFBSUEsc0JBQXNCQTtvQkFBUUE7O2dCQUNsQ0EsSUFBSUE7b0JBRUFBLG1CQUFjQTs7b0JBSWRBLGlCQUFZQSxtQ0FBbUNBLDZEQUE2REE7Ozs7Z0JBTWhIQTtnQkFDQUE7OztnQkFNQUEsSUFBSUEsc0JBQXNCQSxRQUFRQSxDQUFDQSxrQ0FBaUNBO29CQUVoRUE7O2dCQUVKQSxvQkFBb0JBO2dCQUVwQkEsdUJBQWtCQTtnQkFFbEJBLElBQUlBLDhCQUE2QkE7b0JBRTdCQSw0QkFBNEJBOztnQkFHaENBLElBQUlBLGtCQUFpQkE7b0JBRWpCQTs7Z0JBR0pBLHFCQUFxQkEsc0JBQWlCQTtnQkFFdENBLHdCQUFtQkE7Z0JBRW5CQTtnQkFFQUEscUJBQWdCQSxlQUFlQSxpQkFBaUJBO2dCQUVoREEsa0JBQWtCQSxzQkFBc0JBOzs7O2dCQU14Q0EsZ0JBQWdCQTs7Z0JBRWhCQSwwQkFBdUJBOzs7O3dCQUVuQkE7Ozs7Ozs7Z0JBRUpBO2dCQUNBQSw0QkFBNEJBO2dCQUM1QkE7Z0JBQ0FBLHFCQUFxQkEsNEJBQThDQTtnQkFDbkVBOzs7Z0JBTUFBLGdCQUFnQkE7Z0JBRWhCQTtnQkFDQUE7Z0JBRUFBOztvQ0FHcUJBOztnQkFFckJBLGFBQWFBLHNCQUFpQkE7Z0JBQzlCQSxJQUFJQSxVQUFVQTtvQkFBUUE7O2dCQUN0QkEsb0JBQW9CQTtnQkFFcEJBO2dCQUNBQSwwQkFBMEJBOzs7O3dCQUV0QkEsa0NBQWtCQTs7Ozs7OztnQkFJdEJBLDhCQUF5QkE7O3dDQUdFQTtnQkFFM0JBLE9BQU9BLDRCQUErQ0EsOEJBQWFBLEFBQW9CQTsrQkFBTUEsYUFBWUE7Ozs7Z0JBS3pHQSw0QkFBNEJBLGdDQUEyQkEsZUFBZUEsTUFBTUE7Z0JBQzVFQSw0QkFBNEJBLGtDQUE2QkEsZUFBZUE7Ozs7Z0JBS3hFQSxpQkFBaUJBLG1DQUFXQSwwQkFBU0EsWUFBUUEsNEJBQTRCQTtnQkFDekVBLGlCQUFpQkEscUNBQTBCQSxZQUFRQSw0QkFBNEJBLGtHQUE1Q0E7O2dCQUVuQ0EsZUFBZUEsNEJBQXNDQSxtQkFBUkE7Z0JBQzdDQSxnQkFBZ0JBO2dCQUNoQkEsa0JBQWtCQTtnQkFDbEJBLGtCQUFrQkE7Z0JBQ2xCQSw0QkFBNEJBO2dCQUM1QkEscUJBQXFCQTs7Z0JBR3JCQTtnQkFDQUEsMEJBQXVCQTs7Ozt3QkFFbkJBLDJCQUFzQkE7d0JBRXRCQSxnQ0FDY0EsMkJBQ0xBLGlCQUFlQSxVQUFDQSxPQUFPQTttQ0FBVUEsU0FBTUEsY0FBT0E7d0NBQ2hDQTs2Q0FBQ0EsS0FBS0E7Z0NBQ25CQSxhQUFPQTtnQ0FBV0EsaUJBQVlBLGdCQUFjQSxXQUFXQSxXQUFXQTtnQ0FBTUEsT0FBT0E7Ozs7d0JBR3pGQSxLQUFLQSxXQUFXQSxJQUFJQSxvQkFBa0JBOzRCQUFPQSxnQkFBV0E7Ozs7Ozs7O2dCQUU1REEsd0JBQW1CQTs7Ozs7Ozs7Ozs7OztvQ0EzUHlCQSxJQUFJQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzhDQzZCZEE7b0JBR2xDQSxpQkFBaUJBLEVBQWNBO29CQUUvQkEsc0JBQXNCQTtvQkFDdEJBLHFCQUFxQkEsd0NBQWdDQTtvQkFFckRBLGtCQUFrQkE7b0JBQ2xCQSxpREFFVUEsdUNBQStCQSwyQkFDN0JBLG9EQUVJQSw2Q0FDUUEsa0RBQWtDQSwyQkFDdENBLHlDQUFrREEsMkJBQ2xEQSxvRkFDU0EsTUFBTUEscUNBQStCQSxBQUFxQkEsOEJBRTNFQSxpREFDSUEsc0NBQ0VBLDRDQUFvQ0EsNkJBRTFDQSwyQ0FDSUEsNEJBRUVBLDZDQUFxQ0E7b0JBR3ZEQSx1QkFBdUJBO29CQUN2QkEsa0JBQWtCQTtvQkFFbEJBLElBQUlBLENBQUNBLGtDQUEwQkEsQ0FBQ0E7d0JBRTVCQSxrQkFBa0JBOztvQkFFdEJBLElBQUlBLENBQUNBLGtDQUEwQkEsQ0FBQ0E7d0JBRTVCQSxrQkFBa0JBOztvQkFFdEJBLElBQUlBLENBQUNBLGtDQUEwQkEsQ0FBQ0E7d0JBRTVCQSxrQkFBa0JBOztvQkFFdEJBLElBQUlBLENBQUNBLGtDQUEwQkEsQ0FBQ0E7d0JBRTVCQSxrQkFBa0JBOztvQkFHdEJBOztpREFJcUNBO29CQUVyQ0EsRUFBY0EsNEJBQTZDQTs7O29CQUszREEsa0JBQWtCQTtvQkFDbEJBLGlCQUFpQkEsRUFBY0EseUJBQXVDQTtvQkFDdEVBLGlCQUFpQkEsU0FBU0EscUNBQTZCQTtvQkFDdkRBLGlCQUFpQkEsU0FBU0EscUNBQTZCQTtvQkFDdkRBLGlCQUFpQkEsU0FBU0EscUNBQTZCQTtvQkFDdkRBLElBQUlBO3dCQUVBQSx1QkFBdUJBLFlBQVlBLG1EQUNDQSwwQkFDQUEsMEJBQ0FBOztvQkFFeENBLGlCQUFpQkEscUJBQUtBLG1CQUFTQSxBQUFXQSx5QkFBZ0NBLHNDQUFjQTtvQkFDeEZBLG1CQUFtQkEsU0FBU0EsWUFBWUE7b0JBQ3hDQSxtQkFBbUJBLFNBQVNBLFlBQVlBO29CQUN4Q0EsbUJBQW1CQSxTQUFTQSxZQUFZQTtvQkFDeENBLG9CQUFvQkEsWUFBWUEsMEJBQ0NBLDRCQUNBQSw0QkFDQUE7b0JBQ2pDQSxzQ0FBOEJBOzsyQ0FHQ0E7b0JBRS9CQSxFQUFjQTtvQkFHZEEsRUFBY0EsMkJBQStDQTs7b0NBS3JDQSxhQUFpQkEsYUFBaUJBLFFBQVlBO29CQUV0RUEsbUJBQW1CQSxFQUFjQSwyQkFBK0NBO29CQUNoRkEsa0JBQWtCQSxtQ0FDTkEsbURBQ0VBLDZDQUFxQ0Esa0JBQ3JDQTtvQkFDZEEsa0JBQWtCQSw0QkFBc0RBLFlBQVlBOzt3Q0FHeERBLGFBQWlCQSxhQUFpQkE7b0JBRTlEQSxtQkFBbUJBLEVBQWNBLDJCQUErQ0E7b0JBQ2hGQSxrQkFBa0JBLHVCQUFrREE7b0JBRXBFQSxrQkFBa0JBLDRCQUFzREEsWUFBWUE7OztvQkFLcEZBLEVBQWNBO29CQUNkQSxFQUFjQTtvQkFDZEE7O3NDQUcwQkE7b0JBRTFCQSxrQkFBa0JBLEVBQWNBO29CQUNoQ0EsbUJBQW1CQSx1QkFBa0JBO29CQUNyQ0EsZ0JBQWdCQSxpQkFBQ0EsaUJBQWVBOzswQ0FHSEE7OztvQkFFN0JBLFdBQVdBLGtDQUFZQSxFQUFjQTtvQkFDckNBO29CQUNBQSxJQUFJQSxDQUFDQSxzQkFBYUEsQUFBQ0EsWUFBUUEsb0JBQXFCQTt3QkFBVUE7O29CQUMxREEsT0FBT0E7OzBDQUd5QkE7b0JBRWhDQSxPQUFPQSxFQUFjQSwrQkFBOENBOztvQ0FHM0NBLFNBQWdCQTs7b0JBRXhDQSw0QkFBWUE7b0JBQ1pBLGlCQUE2QkEsb0JBQTZCQSxzREFBcURBLDRCQUMvRkEsdUNBQXVCQSxZQUM3QkE7O29CQUdWQSxrQkFBa0JBLEFBQVNBO3dCQUFRQSxFQUFjQSxpQkFBNkJBO3VCQUEyQkE7Ozs7b0JBS3pHQTtvQkFDQUEsSUFBSUEsQ0FBQ0Esc0JBQWFBLEVBQWNBLDZCQUF5Q0E7d0JBQVdBOztvQkFDcEZBLElBQUlBLENBQUNBLHNCQUFhQSxFQUFjQSw4QkFBMENBO3dCQUFZQTs7b0JBQ3RGQSxJQUFJQSxDQUFDQSxzQkFBYUEsRUFBY0EsNEJBQXdDQTt3QkFBVUE7O29CQUNsRkEsT0FBT0EsVUFBSUEsMkNBR0VBLHVCQUNDQSxzQkFDRkE7OztvQkFNWkEsRUFBY0E7O21DQUdTQTtvQkFFdkJBLEVBQWNBLHVCQUF3Q0Esb0JBQW9CQTs7c0NBR2hEQTtvQkFFMUJBLGtCQUFrQkE7b0JBQ2xCQSxJQUFJQSxlQUFlQTt3QkFBUUE7O29CQUUzQkEsdUNBQStCQSx1Q0FBa0NBLG1CQUFVQTtvQkFFM0VBLEVBQWNBLDBCQUFrQ0E7b0JBQ2hEQSxFQUFjQTs7OztvQkFNZEEsRUFBY0E7O2tDQUdRQTtvQkFFdEJBLFVBQVVBLGlDQUEwQkEsV0FBV0EsRUFBY0EsOEJBQXNDQTtvQkFDbkdBLDRDQUFvQ0E7b0JBQ3BDQSxFQUFjQSx1QkFBd0NBLG1FQUEyREE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQW5OdEVBIiwKICAic291cmNlc0NvbnRlbnQiOiBbInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5MaW5xO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxudXNpbmcgU3lzdGVtLlRocmVhZGluZy5UYXNrcztcclxudXNpbmcgQnJpZGdlO1xyXG5cclxubmFtZXNwYWNlIERpY2UuQ29tcG9uZW50XHJcbntcclxuICAgIC8vLyA8c3VtbWFyeT5cclxuICAgIC8vLyBQbGF5ZXIgY2xhc3NcclxuICAgIC8vLyA8L3N1bW1hcnk+XHJcbiAgICBbUmVmbGVjdGFibGVdXHJcbiAgICBwdWJsaWMgY2xhc3MgUGxheWVyXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0cmluZyBOYW1lO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgSW5kZXg7XHJcbiAgICAgICAgcHVibGljIExpc3Q8aW50PiBQb2ludHMgPSBuZXcgTGlzdDxpbnQ+KCk7XHJcbiAgICAgICAgcHVibGljIGludCBUb3RhbFBvaW50cyB7IGdldCB7IHJldHVybiBQb2ludHMuU3VtKCk7IH0gfVxyXG4gICAgICAgIHB1YmxpYyBpbnQgTGFzdFBvaW50cyB7IGdldCB7IHJldHVybiBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkxhc3RPckRlZmF1bHQ8aW50PihQb2ludHMpOyB9IH1cclxuICAgICAgICBwdWJsaWMgaW50IFN0YXJDb3VudDtcclxuICAgICAgICBwdWJsaWMgYm9vbCBDYW5BY2N1bXVsYXRlTGFzdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBwdWJsaWMgUGxheWVyKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE5hbWUgPSBcIkRlZmF1bHRcIjtcclxuICAgICAgICAgICAgSW5kZXggPSAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBQbGF5ZXIoc3RyaW5nIG5hbWUsIGludCBpbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE5hbWUgPSBuYW1lO1xyXG4gICAgICAgICAgICBJbmRleCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWRkUG9pbnQoaW50IHBvaW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUG9pbnRzLkFkZChwb2ludCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLy8gPHN1bW1hcnk+XHJcbiAgICAgICAgLy8vIFJlbW92ZSBsYXN0IHBvaW50IGVudHJ5XHJcbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cclxuICAgICAgICBwdWJsaWMgdm9pZCBSZW1vdmVMYXN0UG9pbnRzKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkFueTxpbnQ+KHRoaXMuUG9pbnRzKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5Qb2ludHMuUmVtb3ZlKFN5c3RlbS5MaW5xLkVudW1lcmFibGUuTGFzdDxpbnQ+KHRoaXMuUG9pbnRzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFJlc2V0KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFBvaW50cy5DbGVhcigpO1xyXG4gICAgICAgICAgICBDYW5BY2N1bXVsYXRlTGFzdCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLkxpbnE7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG51c2luZyBTeXN0ZW0uVGhyZWFkaW5nLlRhc2tzO1xyXG51c2luZyBCcmlkZ2UuSHRtbDU7XHJcbnVzaW5nIERpY2UuQ29tcG9uZW50O1xyXG51c2luZyBCcmlkZ2U7XHJcblxyXG5uYW1lc3BhY2UgRGljZVxyXG57XHJcbiAgICBwdWJsaWMgc2VhbGVkIGNsYXNzIE1hbmFnZXJcclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIE1hbmFnZXIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTWFuYWdlciBJbnN0YW5jZSB7IGdldCB7IHJldHVybiBOZXN0ZWQuaW5zdGFuY2U7IH0gfVxyXG5cclxuICAgICAgICBwcml2YXRlIGNsYXNzIE5lc3RlZFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gRXhwbGljaXQgc3RhdGljIGNvbnN0cnVjdG9yIHRvIHRlbGwgQyMgY29tcGlsZXJcclxuICAgICAgICAgICAgLy8gbm90IHRvIG1hcmsgdHlwZSBhcyBiZWZvcmVmaWVsZGluaXRcclxuICAgICAgICAgICAgc3RhdGljIE5lc3RlZCgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW50ZXJuYWwgc3RhdGljIHJlYWRvbmx5IE1hbmFnZXIgaW5zdGFuY2UgPSBuZXcgTWFuYWdlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBjb25zdCBzdHJpbmcgc2F2ZWRHYW1lU3RhdGVLZXkgPSBcIkRpY2VTYXZlR2FtZVN0YXRlXCI7XHJcbiAgICAgICAgcHJpdmF0ZSBjb25zdCBzdHJpbmcgc2F2ZWRHYW1lUGxheWVyc0tleSA9IFwiRGljZVNhdmVQbGF5ZXJzXCI7XHJcblxyXG4gICAgICAgIHB1YmxpYyBMaXN0PFBsYXllcj4gUGxheWVycyA9IG5ldyBMaXN0PFBsYXllcj4oKTtcclxuICAgICAgICBwdWJsaWMgUGxheWVyIEN1cnJlbnRQbGF5ZXI7XHJcbiAgICAgICAgcHVibGljIEdhbWVTZXR0aW5ncyBTZXR0aW5ncyA9IG5ldyBHYW1lU2V0dGluZ3MgeyBTdGFydHVwID0gNTAwLCBDdW11bCA9IDUwMDAsIFRhcmdldCA9IDIwMDAwIH07XHJcblxyXG4gICAgICAgIC8vIEdhbWUgZW5kcyB3aGVuIGEgcGxheWVyIG1hdGNoZXMgdGhpcyBpZFxyXG4gICAgICAgIHB1YmxpYyBpbnQgTGFzdFJvdW5kUGxheWVySW5kZXggPSAtMTtcclxuICAgICAgICBwdWJsaWMgaW50IFJvdW5kQ291bnQgPSAwO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgTGFzdFBvaW50cyA9IDA7XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIEFkZFBsYXllcihzdHJpbmcgbmFtZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXdJbmRleCA9IEdldE1heEluZGV4KCkgKyAxO1xyXG4gICAgICAgICAgICBuYW1lID0gc3RyaW5nLklzTnVsbE9yV2hpdGVTcGFjZShuYW1lKSA/IFwiSm91ZXVyIFwiICsgKG5ld0luZGV4ICsgMSkgOiBuYW1lO1xyXG4gICAgICAgICAgICB2YXIgbmV3UGxheWVyID0gbmV3IFBsYXllcihuYW1lLCBuZXdJbmRleCk7XHJcbiAgICAgICAgICAgIFBsYXllcnMuQWRkKG5ld1BsYXllcik7XHJcbiAgICAgICAgICAgIFVpLkFkZFBsYXllckNvbnRhaW5lcihuZXdQbGF5ZXIpO1xyXG4gICAgICAgICAgICBpZiAobmV3SW5kZXggPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyID0gbmV3UGxheWVyO1xyXG4gICAgICAgICAgICAgICAgVWkuU2V0Q3VyZW50UGxheWVyKG5ld0luZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBHZXRNYXhJbmRleCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gU3lzdGVtLkxpbnEuRW51bWVyYWJsZS5Bbnk8UGxheWVyPihQbGF5ZXJzKSA/IFN5c3RlbS5MaW5xLkVudW1lcmFibGUuTWF4PFBsYXllcj4oUGxheWVycywoRnVuYzxQbGF5ZXIsaW50PikobXggPT4gbXguSW5kZXgpKSA6IC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgTmV4dFBsYXllcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBJbml0XHJcbiAgICAgICAgICAgIHZhciBuZXh0SW5kZXggPSBHZXROZXh0SW5kZXgoKTtcclxuICAgICAgICAgICAgLy8gYWNjdW11bGF0ZSBjdXJyZW50IHBvaW50c1xyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyID09IG51bGwpIHsgVWkuQWRkQWxlcnQoXCJBam91dGV6IGRlcyBqb3VldXJzIHBvdXIgY29tbWVuY2VyXCIsIFVpLkFsZXJ0U2V2ZXJpdHkuaW5mbyk7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhlIGxhc3Qgcm91bmQgaW5kZXggaXMgb3VycyB3ZSBhcmUgYWxyZWFkeSBnYW1lIG92ZXJcclxuICAgICAgICAgICAgaWYgKHRoaXMuQ3VycmVudFBsYXllci5JbmRleCA9PSB0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHBvaW50cyA9IFVpLkdldEFjY3VtdWxhdGVkKCk7XHJcbiAgICAgICAgICAgIC8vIE11c3QgaGF2ZSBlbm91Z2ggcG9pbnRzIHRvIHN0YXJ0XHJcbiAgICAgICAgICAgIGlmIChwb2ludHMgIT0gMCAmJiB0aGlzLkN1cnJlbnRQbGF5ZXIuVG90YWxQb2ludHMgPCB0aGlzLlNldHRpbmdzLlN0YXJ0dXAgJiYgcG9pbnRzIDwgdGhpcy5TZXR0aW5ncy5TdGFydHVwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwb2ludHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgVWkuQWRkQWxlcnQoXCJMZSBqb3VldXIgZG9pdCBhdm9pciBhdSBtb2lucyBcIiArIHRoaXMuU2V0dGluZ3MuU3RhcnR1cCArIFwiIHBvdXIgY29tbWVuY2VyIMOgIGN1bXVsZXJcIiwgVWkuQWxlcnRTZXZlcml0eS53YXJuaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBNdXN0IG5vdCBidXN0IHRhcmdldCBcclxuICAgICAgICAgICAgaWYgKCh0aGlzLkN1cnJlbnRQbGF5ZXIuVG90YWxQb2ludHMgKyBwb2ludHMgPiB0aGlzLlNldHRpbmdzLlRhcmdldCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBvaW50cyA9IDA7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkxlIGpvdWV1ciBkb2l0IGZpbmlyIMOgIGV4YWN0ZW1lbnQgOiBcIiArIHRoaXMuU2V0dGluZ3MuVGFyZ2V0ICsgXCIgcG9pbnRzXCIsIFVpLkFsZXJ0U2V2ZXJpdHkud2FybmluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyLkFkZFBvaW50KHBvaW50cyk7XHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFBvaW50cyA9IHBvaW50cztcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgY2FuIG5vdyBhY2N1bXVsYXRlIGxhc3RcclxuICAgICAgICAgICAgaWYgKCF0aGlzLkN1cnJlbnRQbGF5ZXIuQ2FuQWNjdW11bGF0ZUxhc3QgJiYgdGhpcy5DdXJyZW50UGxheWVyLlRvdGFsUG9pbnRzID49IHRoaXMuU2V0dGluZ3MuQ3VtdWwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuQ3VycmVudFBsYXllci5DYW5BY2N1bXVsYXRlTGFzdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE86IHNwZWNpYWwgbWFya1xyXG4gICAgICAgICAgICAgICAgVWkuQWRkQWxlcnQodGhpcy5DdXJyZW50UGxheWVyLk5hbWUgKyBcIiBwZXV4IG1haW50ZW5hbnQgY3VtdWxlciBsZSBzY29yZSBwcsOpY8OpZGVudFwiLCBVaS5BbGVydFNldmVyaXR5LmluZm8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGlmIHRhcmdldCByZWFjaGVkIGZsYWcgYXMgYSB3aW5uZXJcclxuICAgICAgICAgICAgaWYgKHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyA9PSB0aGlzLlNldHRpbmdzLlRhcmdldClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIGEgbGVnZW5kYXJ5IHdpbm5pbmcgc3RhclxyXG4gICAgICAgICAgICAgICAgVWkuQWRkU3Rhcih0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyLlN0YXJDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgLy8gZmxhZyBsYXN0IHJvdW5kIGlmIG5vdCBhbGxyZWFkeSBkb25lXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9PSAtMSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4ID0gdGhpcy5DdXJyZW50UGxheWVyLkluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIFVpLkFkZEFsZXJ0KFwiRGVybmnDqHJlIHJvbmRlICFcIiwgVWkuQWxlcnRTZXZlcml0eS5pbmZvKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBVaS5BZGRQb2ludCh0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXgsIHRoaXMuUm91bmRDb3VudCwgcG9pbnRzLCB0aGlzLkN1cnJlbnRQbGF5ZXIuVG90YWxQb2ludHMpO1xyXG4gICAgICAgICAgICBVaS5TZXRBY2N1bXVsYXRlZCgwKTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcm91bmQgY29tcGxldGVkXHJcbiAgICAgICAgICAgIGlmIChuZXh0SW5kZXggPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5Sb3VuZENvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9TZXQgbmV4dCBwbGF5ZXJcclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyID0gdGhpcy5QbGF5ZXJzW25leHRJbmRleF07XHJcbiAgICAgICAgICAgIFVpLlNldEN1cmVudFBsYXllcihuZXh0SW5kZXgpO1xyXG4gICAgICAgICAgICAvLyBpZiB0aGUgbGFzdCByb3VuZCBpbmRleCBpcyB0aGUgbmV4dHIgdGhlbiBnYW1lIG92ZXIgY29uZmV0aWVzJ24gc2hpdHpcclxuICAgICAgICAgICAgaWYgKG5leHRJbmRleCA9PSB0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkdhbWUgT3ZlciAhXCIsIFVpLkFsZXJ0U2V2ZXJpdHkuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFNhdmVHYW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBpbnQgR2V0TmV4dEluZGV4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXh0SW5kZXggPSAodGhpcy5DdXJyZW50UGxheWVyICE9IG51bGwgPyB0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXggKyAxIDogMCk7XHJcbiAgICAgICAgICAgIGlmIChuZXh0SW5kZXggPiB0aGlzLkdldE1heEluZGV4KCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5leHRJbmRleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBpbnQgR2V0UHJldmlvdXNJbmRleCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcHJldkluZGV4ID0gKHRoaXMuQ3VycmVudFBsYXllciAhPSBudWxsID8gdGhpcy5DdXJyZW50UGxheWVyLkluZGV4IC0gMSA6IHRoaXMuR2V0TWF4SW5kZXgoKSk7XHJcbiAgICAgICAgICAgIGlmIChwcmV2SW5kZXggPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmV2SW5kZXggPSB0aGlzLkdldE1heEluZGV4KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZJbmRleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIEFjY3VtdWxhdGVMYXN0KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLkN1cnJlbnRQbGF5ZXIgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuQ3VycmVudFBsYXllci5DYW5BY2N1bXVsYXRlTGFzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVWkuQWNjdW11bGF0ZSh0aGlzLkxhc3RQb2ludHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVWkuQWRkQWxlcnQoXCJMZSBqb3VldXIgZG9pdCBhdm9pciBhdSBtb2lucyBcIiArIHRoaXMuU2V0dGluZ3MuQ3VtdWwgKyBcIiBwb3VyIGN1bXVsZXIgbGVzIHBvaW50cyBwcsOpY8OpZGVudHNcIiwgVWkuQWxlcnRTZXZlcml0eS53YXJuaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgTmV4dFBsYXllckFjY3VtdWxhdGVMYXN0KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuTmV4dFBsYXllcigpO1xyXG4gICAgICAgICAgICB0aGlzLkFjY3VtdWxhdGVMYXN0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBDYW5jZWxMYXN0TW92ZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBIYXMgYSBnYW1lIHN0YXJ0ZWQgP1xyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyID09IG51bGwgfHwgKHRoaXMuQ3VycmVudFBsYXllci5JbmRleCA9PSAwICYmIHRoaXMuUm91bmRDb3VudCA9PSAwKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBwcmV2aW91c0luZGV4ID0gdGhpcy5HZXRQcmV2aW91c0luZGV4KCk7XHJcbiAgICAgICAgICAgIC8vIHJlc3RvcmUgYWNjdW11bGF0b3JcclxuICAgICAgICAgICAgVWkuU2V0QWNjdW11bGF0ZWQodGhpcy5MYXN0UG9pbnRzKTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgbGFzdCByb3VuZCB3YXMgd2lubmluZyBtb3ZlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4ID09IHByZXZpb3VzSW5kZXgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB3ZSB1bmRvIGEgcm91bmRcclxuICAgICAgICAgICAgaWYgKHByZXZpb3VzSW5kZXggPT0gdGhpcy5HZXRNYXhJbmRleCgpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJvdW5kQ291bnQtLTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzZXQgcHJldmlvdXMgcGxheWVyXHJcbiAgICAgICAgICAgIHRoaXMuQ3VycmVudFBsYXllciA9IEdldFBsYXllcmJ5SW5kZXgocHJldmlvdXNJbmRleCk7XHJcbiAgICAgICAgICAgIC8vIHNldCBpbiB1aVxyXG4gICAgICAgICAgICBVaS5TZXRDdXJlbnRQbGF5ZXIocHJldmlvdXNJbmRleCk7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBwb2ludHNcclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyLlJlbW92ZUxhc3RQb2ludHMoKTtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHBvaW50cyBmcm9tIHVpXHJcbiAgICAgICAgICAgIFVpLlJlbW92ZVBvaW50cyhwcmV2aW91c0luZGV4LCB0aGlzLlJvdW5kQ291bnQsIHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyk7XHJcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgcHJldmlvdXMgcG9pbnRzXHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFBvaW50cyA9IHRoaXMuR2V0UGxheWVyYnlJbmRleCh0aGlzLkdldFByZXZpb3VzSW5kZXgoKSkuTGFzdFBvaW50cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFJlc2V0KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIFJlLUFwcGx5IChuZXcpcnVsZXNcclxuICAgICAgICAgICAgdGhpcy5TZXR0aW5ncyA9IFVpLkdldFBhcmFtcygpO1xyXG5cclxuICAgICAgICAgICAgZm9yZWFjaCAodmFyIHBsYXllciBpbiB0aGlzLlBsYXllcnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5SZXNldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVpLlJlc2V0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPSAtMTtcclxuICAgICAgICAgICAgdGhpcy5MYXN0UG9pbnRzID0gMDtcclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyID0gU3lzdGVtLkxpbnEuRW51bWVyYWJsZS5GaXJzdE9yRGVmYXVsdDxQbGF5ZXI+KHRoaXMuUGxheWVycyk7XHJcbiAgICAgICAgICAgIHRoaXMuUm91bmRDb3VudCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBOZXdHYW1lKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHJ1bGVzXHJcbiAgICAgICAgICAgIHRoaXMuU2V0dGluZ3MgPSBVaS5HZXRQYXJhbXMoKTtcclxuICAgICAgICAgICAgLy8gRmx1c2ggcGxheWVyc1xyXG4gICAgICAgICAgICB0aGlzLlBsYXllcnMuQ2xlYXIoKTtcclxuICAgICAgICAgICAgVWkuQ2xlYXJQbGF5ZXJDb250YWluZXIoKTtcclxuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIHJlc3RcclxuICAgICAgICAgICAgdGhpcy5SZXNldCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgUmVtb3ZlUGxheWVyKGludCBwbGF5ZXJJbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBHZXRQbGF5ZXJieUluZGV4KHBsYXllckluZGV4KTtcclxuICAgICAgICAgICAgaWYgKHBsYXllciA9PSBudWxsKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICB0aGlzLlBsYXllcnMuUmVtb3ZlKHBsYXllcik7XHJcbiAgICAgICAgICAgIC8vIFJlLWluZGV4XHJcbiAgICAgICAgICAgIGludCBpZHggPSAwO1xyXG4gICAgICAgICAgICBmb3JlYWNoICh2YXIgY3VyUGxheWVyIGluIHRoaXMuUGxheWVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY3VyUGxheWVyLkluZGV4ID0gaWR4Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9UT0RPOiByZS1pbmRleCB1aVxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZnJvbSB1aVxyXG4gICAgICAgICAgICBVaS5SZW1vdmVQbGF5ZXJDb250YWluZXIocGxheWVySW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIFBsYXllciBHZXRQbGF5ZXJieUluZGV4KGludCBwbGF5ZXJJbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLlNpbmdsZU9yRGVmYXVsdDxQbGF5ZXI+KHRoaXMuUGxheWVycywoRnVuYzxQbGF5ZXIsYm9vbD4pKHNnID0+IHNnLkluZGV4ID09IHBsYXllckluZGV4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBTYXZlR2FtZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBXaW5kb3cuTG9jYWxTdG9yYWdlLlNldEl0ZW0oTWFuYWdlci5zYXZlZEdhbWVTdGF0ZUtleSwgSlNPTi5TdHJpbmdpZnkodGhpcywgbmV3IHN0cmluZ1tdIHsgXCJTZXR0aW5nc1wiLCBcIlJvdW5kQ291bnRcIiwgXCJMYXN0UG9pbnRzXCIsIFwiTGFzdFJvdW5kUGxheWVySW5kZXhcIiwgXCJDdXJyZW50UGxheWVyXCIgfSkpO1xyXG4gICAgICAgICAgICBXaW5kb3cuTG9jYWxTdG9yYWdlLlNldEl0ZW0oTWFuYWdlci5zYXZlZEdhbWVQbGF5ZXJzS2V5LCBKU09OLlN0cmluZ2lmeSh0aGlzLlBsYXllcnMuVG9BcnJheSgpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBMb2FkR2FtZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2xkTWFuYWdlciA9IEpTT04uUGFyc2U8TWFuYWdlcj4oKHN0cmluZylXaW5kb3cuTG9jYWxTdG9yYWdlLkdldEl0ZW0oTWFuYWdlci5zYXZlZEdhbWVTdGF0ZUtleSkpO1xyXG4gICAgICAgICAgICB2YXIgb2xkUGxheWVycyA9IEpTT04uUGFyc2VBc0FycmF5PFBsYXllcj4oKHN0cmluZylXaW5kb3cuTG9jYWxTdG9yYWdlLkdldEl0ZW0oTWFuYWdlci5zYXZlZEdhbWVQbGF5ZXJzS2V5KSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlBsYXllcnMgPSBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLlRvTGlzdDxQbGF5ZXI+KG9sZFBsYXllcnMpO1xyXG4gICAgICAgICAgICB0aGlzLlNldHRpbmdzID0gb2xkTWFuYWdlci5TZXR0aW5ncztcclxuICAgICAgICAgICAgdGhpcy5Sb3VuZENvdW50ID0gb2xkTWFuYWdlci5Sb3VuZENvdW50O1xyXG4gICAgICAgICAgICB0aGlzLkxhc3RQb2ludHMgPSBvbGRNYW5hZ2VyLkxhc3RQb2ludHM7XHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPSBvbGRNYW5hZ2VyLkxhc3RSb3VuZFBsYXllckluZGV4O1xyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSBvbGRNYW5hZ2VyLkN1cnJlbnRQbGF5ZXI7XHJcblxyXG4gICAgICAgICAgICAvLyBSZWJ1aWxkIHRoZSB1aVxyXG4gICAgICAgICAgICBVaS5DbGVhclBsYXllckNvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICBmb3JlYWNoICh2YXIgcGxheWVyIGluIHRoaXMuUGxheWVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVWkuQWRkUGxheWVyQ29udGFpbmVyKHBsYXllcik7XHJcbiAgICAgICAgICAgICAgICAvL1JlLUFkZCBwb2ludHMgaGlzdG9yeVxyXG4gICAgICAgICAgICAgICAgRW51bWVyYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgIC5SYW5nZSgwLCBwbGF5ZXIuUG9pbnRzLkNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIC5aaXAocGxheWVyLlBvaW50cywgKHJvdW5kLCBwb2ludCkgPT4gbmV3IHsgcm91bmQsIHBvaW50IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLkFnZ3JlZ2F0ZTxpbnQ+KDAsIChjdXIsIG54dCkgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBjdXIgKz0gbnh0LnBvaW50OyBVaS5BZGRQb2ludChwbGF5ZXIuSW5kZXgsIG54dC5yb3VuZCwgbnh0LnBvaW50LCBjdXIpOyByZXR1cm4gY3VyOyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXN0b3JlIHN0YXJ6XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllci5TdGFyQ291bnQ7IGkrKykgeyBVaS5BZGRTdGFyKHBsYXllci5JbmRleCk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBVaS5TZXRDdXJlbnRQbGF5ZXIodGhpcy5DdXJyZW50UGxheWVyLkluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLkxpbnE7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG51c2luZyBTeXN0ZW0uVGhyZWFkaW5nO1xyXG51c2luZyBTeXN0ZW0uVGhyZWFkaW5nLlRhc2tzO1xyXG51c2luZyBCcmlkZ2UuQm9vdHN0cmFwMztcclxudXNpbmcgQnJpZGdlLkh0bWw1O1xyXG51c2luZyBCcmlkZ2UualF1ZXJ5MjtcclxudXNpbmcgRGljZS5Db21wb25lbnQ7XHJcblxyXG5uYW1lc3BhY2UgRGljZVxyXG57XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjbGFzcyBVaVxyXG4gICAge1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgY2xhc3MgRGljZVZpZXdcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBpbnQgUGxheWVyU2xvdHMgPSAxMjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJDb250YWluZXJJZCA9IFwiZGljZS1zY29yZWJvYXJkXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyQ29sdW1uQXR0cmlidXRlID0gXCJkYXRhLXBsYXllci1jb250YWluZXJcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJQYW5lbEF0dHJpYnV0ZSA9IFwiZGF0YS1wbGF5ZXItcGFuZWxcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJQYW5lbFRpdGxlQmFzZUlkID0gXCJkaWNlLXBsYXllci1uYW1lLVwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlID0gXCJkaWNlLXBsYXllci10b3RhbFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclNjb3JlQm9hcmRBdHRyaWJ1dGUgPSBcImRpY2UtcGxheWVyLXNjb3JlYm9hcmRcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJQb2ludHNSb3VuZEF0dHJpYnV0ZSA9IFwiZGljZS1zY29yZS1yb3VuZFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBvaW50c0FjY3VtdWxhdG9ySWQgPSBcImRpY2UtcG9pbnQtYWNjdW11bGF0b3JcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBBbGVydEJhc2VJZCA9IFwiZGljZS1hbGVydC1cIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQYXJhbVRhcmdldElkID0gXCJkaWNlLXBhcmFtLXRhcmdldFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBhcmFtU3RhcnR1cElkID0gXCJkaWNlLXBhcmFtLXN0YXJ0dXBcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQYXJhbWN1bXVsSWQgPSBcImRpY2UtcGFyYW0tY3VtdWxcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQYXJhbUNvbGxhcHNpYmxlSWQgPSBcImRpY2UtcGFyYW1zXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBzdGF0aWMgaW50IEFsZXJ0Q291bnQgPSAwO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3QgaW50IEFsZXJ0RGVsYXkgPSAzMDAwO1xyXG4gICAgICAgICAgICBwdWJsaWMgc3RhdGljIGludCBQcmV2aW91c0NvbHVtblNpemUgPSAwO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1pbkNvbFNpemVYcyA9IDQ7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWluQ29sU2l6ZVNtID0gMztcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBNaW5Db2xTaXplTWQgPSAzO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1pbkNvbFNpemVMZyA9IDI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUmVuYW1lSWQgPSBcImRpY2UtcmVuYW1lXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUmVuYW1lSW5wdXRJZCA9IFwiZGljZS1yZW5hbWUtaW5wdXRcIjtcclxuICAgICAgICAgICAgcHVibGljIHN0YXRpYyBQbGF5ZXIgUmVuYW1lQ3VycmVudFBsYXllciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIGNsYXNzIEFsZXJ0U2V2ZXJpdHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgc3VjY2VzcyA9IFwiYWxlcnQtc3VjY2Vzc1wiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIHdhcm5pbmcgPSBcImFsZXJ0LXdhcm5pbmdcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBpbmZvID0gXCJhbGVydC1pbmZvXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgZGFuZ2VyID0gXCJhbGVydC1kYW5nZXJcIjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLy8gPHN1bW1hcnk+XHJcbiAgICAgICAgLy8vIEFkZCB0aGUgdWkgY29sdW1uIHBsYXllciBjb250YWluZXJcclxuICAgICAgICAvLy8gPC9zdW1tYXJ5PlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInBsYXllck9iamVjdFwiPjwvcGFyYW0+XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFkZFBsYXllckNvbnRhaW5lcihQbGF5ZXIgcGxheWVyT2JqZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gR2V0IG1haW4gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHZhciBzY29yZWJvYXJkID0galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllckNvbnRhaW5lcklkKTtcclxuICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29sdW1uXHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJDb250YWluZXIgPSBuZXcgalF1ZXJ5KFwiPGRpdj5cIik7XHJcbiAgICAgICAgICAgIHBsYXllckNvbnRhaW5lci5BdHRyKERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSwgcGxheWVyT2JqZWN0LkluZGV4KTtcclxuICAgICAgICAgICAgLy8gUGFuZWwgd2l0aCB0aXRsZSBhbmQgc2NvcmVib2FyZFxyXG4gICAgICAgICAgICB2YXIgcGxheWVyUGFuZWwgPSBuZXcgalF1ZXJ5KFwiPGRpdj5cIik7XHJcbiAgICAgICAgICAgIHBsYXllclBhbmVsXHJcbiAgICAgICAgICAgICAgICAuQWRkQ2xhc3MoXCJwYW5lbCBwYW5lbC1kZWZhdWx0XCIpXHJcbiAgICAgICAgICAgICAgICAuQXR0cihEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSwgcGxheWVyT2JqZWN0LkluZGV4KVxyXG4gICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJwYW5lbC1oZWFkaW5nIGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgICAgICAvLyBBZGRpbmcgdGl0bGVcclxuICAgICAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8aDM+XCIpLkFkZENsYXNzKFwicGFuZWwtdGl0bGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkF0dHIoXCJpZFwiLCBEaWNlVmlldy5QbGF5ZXJQYW5lbFRpdGxlQmFzZUlkICsgcGxheWVyT2JqZWN0LkluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8c3Bhbj5cIikuQWRkQ2xhc3MoXCJwbGF5ZXItbmFtZVwiKS5UZXh0KHBsYXllck9iamVjdC5OYW1lKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPHNwYW4+XCIpLkFkZENsYXNzKFwiZ2x5cGhpY29uIGdseXBoaWNvbi1lZGl0IHB1bGwtcmlnaHQgcGxheWVyLWljb25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5PbihcImNsaWNrXCIsIG51bGwsIHBsYXllck9iamVjdC5JbmRleC5Ub1N0cmluZygpLCAoQWN0aW9uPGpRdWVyeUV2ZW50PilVaS5TaG93UmVuYW1lKSkpKVxyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGJvZHkgKHNjb3JlYm9hcmQpXHJcbiAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcInBhbmVsLWJvZHkgbG93LXBhZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjx1bD5cIikuQWRkQ2xhc3MoXCJsaXN0LWdyb3VwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BdHRyKERpY2VWaWV3LlBsYXllclNjb3JlQm9hcmRBdHRyaWJ1dGUsIHBsYXllck9iamVjdC5JbmRleCkpKVxyXG4gICAgICAgICAgICAgICAgLy8gVG90YWwgaW4gZm9vdGVyXHJcbiAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcInBhbmVsLWZvb3RlclwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjxoNT5cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkFkZENsYXNzKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BdHRyKERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlLCBwbGF5ZXJPYmplY3QuSW5kZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5UZXh0KFwiVG90YWw6IDBcIikpKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHRvIGNvbnRhaW5lcnNcclxuICAgICAgICAgICAgcGxheWVyQ29udGFpbmVyLkFwcGVuZChwbGF5ZXJQYW5lbCk7XHJcbiAgICAgICAgICAgIHNjb3JlYm9hcmQuQXBwZW5kKHBsYXllckNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIC8vIEZvcmNlIHdyYXBwaW5nIG9uIGEgbmV3IGxpbmVcclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVMZykgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcmVib2FyZC5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS1sZy1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVNZCkgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcmVib2FyZC5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS1tZC1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVTbSkgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcmVib2FyZC5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS1zbS1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVYcykgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcmVib2FyZC5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS14cy1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGNvbHVtbnMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBVaS5TZXRDb2x1bW5DbGFzcygpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW1vdmVQbGF5ZXJDb250YWluZXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSArIFwiPVwiICsgcGxheWVySW5kZXggKyBcIl1cIikuUmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2V0Q29sdW1uQ2xhc3MoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBsYXllckNvdW50ID0gTWFuYWdlci5JbnN0YW5jZS5QbGF5ZXJzLkNvdW50O1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVycyA9IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJDb250YWluZXJJZCkuRmluZChcImRpdltcIiArIERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSArIFwiXVwiKTtcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzWHMgPSBNYXRoLk1heChEaWNlVmlldy5QcmV2aW91c0NvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVYcyk7XHJcbiAgICAgICAgICAgIHZhciBwcmV2aW91c1NtID0gTWF0aC5NYXgoRGljZVZpZXcuUHJldmlvdXNDb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplU20pO1xyXG4gICAgICAgICAgICB2YXIgcHJldmlvdXNNZCA9IE1hdGguTWF4KERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZU1kKTtcclxuICAgICAgICAgICAgaWYgKERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcnMuUmVtb3ZlQ2xhc3MoXCJjb2wtbGctXCIgKyBEaWNlVmlldy5QcmV2aW91c0NvbHVtblNpemUgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wteHMtXCIgKyBwcmV2aW91c1hzICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLXNtLVwiICsgcHJldmlvdXNTbSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC1tZC1cIiArIHByZXZpb3VzTWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5TaXplID0gKGludClNYXRoLk1heChNYXRoLkZsb29yKChkZWNpbWFsKURpY2VWaWV3LlBsYXllclNsb3RzIC8gcGxheWVyQ291bnQpLCBEaWNlVmlldy5NaW5Db2xTaXplTGcpO1xyXG4gICAgICAgICAgICB2YXIgY29sdW1uU2l6ZVhzID0gTWF0aC5NYXgoY29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZVhzKTtcclxuICAgICAgICAgICAgdmFyIGNvbHVtblNpemVTbSA9IE1hdGguTWF4KGNvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVTbSk7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5TaXplTWQgPSBNYXRoLk1heChjb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplTWQpO1xyXG4gICAgICAgICAgICBjb250YWluZXJzLkFkZENsYXNzKFwiY29sLWxnLVwiICsgY29sdW1uU2l6ZSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLXhzLVwiICsgY29sdW1uU2l6ZVhzICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wtc20tXCIgKyBjb2x1bW5TaXplU20gK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC1tZC1cIiArIGNvbHVtblNpemVNZCk7XHJcbiAgICAgICAgICAgIERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSA9IGNvbHVtblNpemU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2V0Q3VyZW50UGxheWVyKGludCBwbGF5ZXJJbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCJkaXZbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSArIFwiXVwiKVxyXG4gICAgICAgICAgICAuUmVtb3ZlQ2xhc3MoXCJwYW5lbC1wcmltYXJ5XCIpXHJcbiAgICAgICAgICAgIC5BZGRDbGFzcyhcInBhbmVsLWRlZmF1bHRcIik7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCJkaXZbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSArIFwiPVwiICsgcGxheWVySW5kZXggKyBcIl1cIilcclxuICAgICAgICAgICAgLlJlbW92ZUNsYXNzKFwicGFuZWwtZGVmYXVsdFwiKVxyXG4gICAgICAgICAgICAuQWRkQ2xhc3MoXCJwYW5lbC1wcmltYXJ5XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFkZFBvaW50KGludCBwbGF5ZXJJbmRleCwgaW50IHJvdW5kTnVtYmVyLCBpbnQgcG9pbnRzLCBpbnQgdG90YWxQb2ludHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFBhbmVsID0galF1ZXJ5LlNlbGVjdChcImRpdltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsQXR0cmlidXRlICsgXCI9XCIgKyBwbGF5ZXJJbmRleCArIFwiXVwiKTtcclxuICAgICAgICAgICAgY3VycmVudFBhbmVsLkZpbmQoXCJbXCIgKyBEaWNlVmlldy5QbGF5ZXJTY29yZUJvYXJkQXR0cmlidXRlICsgXCJdXCIpXHJcbiAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8bGk+XCIpLkFkZENsYXNzKFwibGlzdC1ncm91cC1pdGVtIGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgICAgICAuQXR0cihEaWNlVmlldy5QbGF5ZXJQb2ludHNSb3VuZEF0dHJpYnV0ZSwgcm91bmROdW1iZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgLlRleHQocG9pbnRzKSk7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYW5lbC5GaW5kKFwiW1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgKyBcIl1cIikuVGV4dChcIlRvdGFsOiBcIiArIHRvdGFsUG9pbnRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW1vdmVQb2ludHMoaW50IHBsYXllckluZGV4LCBpbnQgcm91bmROdW1iZXIsIGludCB0b3RhbFBvaW50cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50UGFuZWwgPSBqUXVlcnkuU2VsZWN0KFwiZGl2W1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxBdHRyaWJ1dGUgKyBcIj1cIiArIHBsYXllckluZGV4ICsgXCJdXCIpO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFuZWwuRmluZChcIltcIiArIERpY2VWaWV3LlBsYXllclBvaW50c1JvdW5kQXR0cmlidXRlICsgXCI9XCIgKyByb3VuZE51bWJlciArIFwiXVwiKVxyXG4gICAgICAgICAgICAgICAgLlJlbW92ZSgpO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFuZWwuRmluZChcIltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlICsgXCJdXCIpLlRleHQoXCJUb3RhbDogXCIgKyB0b3RhbFBvaW50cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgUmVzZXQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllclNjb3JlQm9hcmRBdHRyaWJ1dGUgKyBcIl1cIikuSHRtbChcIlwiKTtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlICsgXCJdXCIpLlRleHQoXCJUb3RhbDogMFwiKTtcclxuICAgICAgICAgICAgVWkuU2V0Q3VyZW50UGxheWVyKDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFjY3VtdWxhdGUoaW50IHBvaW50cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhY2N1bXVsYXRvciA9IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQb2ludHNBY2N1bXVsYXRvcklkKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRWYWx1ZSA9IFVpLkdldEFjY3VtdWxhdGVkKGFjY3VtdWxhdG9yKTtcclxuICAgICAgICAgICAgYWNjdW11bGF0b3IuVmFsKChjdXJyZW50VmFsdWUgKyBwb2ludHMpLlRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgR2V0QWNjdW11bGF0ZWQob2JqZWN0IHNlbGVjdG9yID0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgPz8galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBvaW50c0FjY3VtdWxhdG9ySWQpO1xyXG4gICAgICAgICAgICBpbnQgdmFsdWU7XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKCgoalF1ZXJ5KXNlbGVjdG9yKS5WYWwoKSwgb3V0IHZhbHVlKSkgeyB2YWx1ZSA9IDA7IH1cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBvYmplY3QgU2V0QWNjdW11bGF0ZWQoaW50IHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQb2ludHNBY2N1bXVsYXRvcklkKS5WYWwodmFsdWUuVG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQWRkQWxlcnQoc3RyaW5nIG1lc3NhZ2UsIHN0cmluZyBzZXZlcml0eSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IERpY2VWaWV3LkFsZXJ0Q291bnQrKztcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcImJvZHlcIikuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcImFsZXJ0IGZhZGUgaW4gYWxlcnQtZml4ZWQtdG9wIGFsZXJ0LWRpc21pc3NpYmxlIFwiICsgc2V2ZXJpdHkpXHJcbiAgICAgICAgICAgICAgICAuQXR0cihcImlkXCIsIERpY2VWaWV3LkFsZXJ0QmFzZUlkICsgY291bnQpXHJcbiAgICAgICAgICAgICAgICAuVGV4dChtZXNzYWdlKSk7XHJcbiAgICAgICAgICAgIC8vQXV0byBDbG9zZVxyXG5cclxuICAgICAgICAgICAgV2luZG93LlNldFRpbWVvdXQoKEFjdGlvbikoKCkgPT4geyBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuQWxlcnRCYXNlSWQgKyBjb3VudCkuQWxlcnQoXCJjbG9zZVwiKTsgfSksIERpY2VWaWV3LkFsZXJ0RGVsYXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBHYW1lU2V0dGluZ3MgR2V0UGFyYW1zKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGludCB0YXJnZXQsIHN0YXJ0dXAsIGN1bXVsO1xyXG4gICAgICAgICAgICBpZiAoIWludC5UcnlQYXJzZShqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGFyYW1UYXJnZXRJZCkuVmFsKCksIG91dCB0YXJnZXQpKSB7IHRhcmdldCA9IDIwMDAwOyB9XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QYXJhbVN0YXJ0dXBJZCkuVmFsKCksIG91dCBzdGFydHVwKSkgeyBzdGFydHVwID0gNTAwMDsgfVxyXG4gICAgICAgICAgICBpZiAoIWludC5UcnlQYXJzZShqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGFyYW1jdW11bElkKS5WYWwoKSwgb3V0IGN1bXVsKSkgeyBjdW11bCA9IDUwMDsgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEdhbWVTZXR0aW5nc1xyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgVGFyZ2V0ID0gdGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgU3RhcnR1cCA9IHN0YXJ0dXAsXHJcbiAgICAgICAgICAgICAgICBDdW11bCA9IGN1bXVsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQ2xlYXJQbGF5ZXJDb250YWluZXIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllckNvbnRhaW5lcklkKS5IdG1sKFwiXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFkZFN0YXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBhbmVsVGl0bGVCYXNlSWQgKyBwbGF5ZXJJbmRleCkuQXBwZW5kKG5ldyBqUXVlcnkoXCI8c3Bhbj5cIikuQWRkQ2xhc3MoXCJnbHlwaGljb24gZ2x5cGhpY29uLXN0YXIgcHVsbC1yaWdodCBwbGF5ZXItaWNvblwiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2hvd1JlbmFtZShvYmplY3QgdGhlRXZlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgalF1ZXJ5RXZlbnQgPSB0aGVFdmVudCBhcyBqUXVlcnlFdmVudDtcclxuICAgICAgICAgICAgaWYgKGpRdWVyeUV2ZW50ID09IG51bGwpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIC8vIFNldCBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgICAgICBEaWNlVmlldy5SZW5hbWVDdXJyZW50UGxheWVyID0gTWFuYWdlci5JbnN0YW5jZS5HZXRQbGF5ZXJieUluZGV4KGludC5QYXJzZShqUXVlcnlFdmVudC5EYXRhLlRvU3RyaW5nKCkpKTtcclxuICAgICAgICAgICAgLy8gSW5pdCB0aGUgcmVuYW1lIGlucHV0IHRvIHRoZSBjdXJyZW50IG5hbWVcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlJlbmFtZUlucHV0SWQpLlZhbChEaWNlVmlldy5SZW5hbWVDdXJyZW50UGxheWVyLk5hbWUpO1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUmVuYW1lSWQpLk1vZGFsKFwic2hvd1wiKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2lkZVJlbmFtZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUmVuYW1lSWQpLk1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW5hbWUoc3RyaW5nIG5ld05hbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdOYW1lID0gc3RyaW5nLklzTnVsbE9yV2hpdGVTcGFjZShuZXdOYW1lKSA/IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5SZW5hbWVJbnB1dElkKS5WYWwoKSA6IG5ld05hbWU7XHJcbiAgICAgICAgICAgIERpY2VWaWV3LlJlbmFtZUN1cnJlbnRQbGF5ZXIuTmFtZSA9IG5ld05hbWU7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbFRpdGxlQmFzZUlkICsgRGljZVZpZXcuUmVuYW1lQ3VycmVudFBsYXllci5JbmRleCArIFwiIC5wbGF5ZXItbmFtZVwiKS5UZXh0KG5ld05hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXQp9Cg==
