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

                    var rowIndex = System.Convert.toInt32(Bridge.box(((Bridge.Int.div(playerObject.Index, (6))) | 0), System.Int32));

                    var playerRow = scoreboard.find(System.String.format("[PlayerRowAttribute={0}]", [Bridge.box(rowIndex, System.Int32)]));

                    if (playerRow.length <= 0) {
                        playerRow = $("<div>").addClass("row low-pad").attr("PlayerRowAttribute", rowIndex);
                        scoreboard.append(playerRow);

                        scoreboard.find("[PlayerRowAttribute]").removeClass("fill-height-" + rowIndex).addClass("fill-height-" + (((rowIndex + 1) | 0)));
                    }

                    var playerContainer = $("<div>");
                    playerContainer.attr(Dice.Ui.DiceView.PlayerColumnAttribute, playerObject.Index).addClass("fill-height");
                    var playerPanel = $("<div>");
                    playerPanel.addClass("panel panel-default low-pad").attr(Dice.Ui.DiceView.PlayerPanelAttribute, playerObject.Index).append($("<div>").addClass("panel-heading low-pad").append($("<h3>").addClass("panel-title").attr("id", (Dice.Ui.DiceView.PlayerPanelTitleBaseId || "") + playerObject.Index).append($("<span>").addClass("player-name").text(playerObject.Name)).append($("<span>").addClass("glyphicon glyphicon-edit pull-right player-icon").on("click", null, Bridge.toString(playerObject.Index), Dice.Ui.ShowRename)))).append($("<div>").addClass("panel-body low-pad").append($("<ul>").addClass("list-group").attr(Dice.Ui.DiceView.PlayerScoreBoardAttribute, playerObject.Index))).append($("<div>").addClass("panel-footer low-pad").append($("<h5>").addClass("").attr(Dice.Ui.DiceView.PlayerPanelFooterAttribute, playerObject.Index).text("Total: 0")));
                    playerContainer.append(playerPanel);
                    playerRow.append(playerContainer);
                    if ((((playerObject.Index + 1) | 0)) % (4) === 0) {
                        playerRow.append($("<div>").addClass("clearfix visible-md-block"));
                    }
                    if ((((playerObject.Index + 1) | 0)) % (4) === 0) {
                        playerRow.append($("<div>").addClass("clearfix visible-sm-block"));
                    }
                    if ((((playerObject.Index + 1) | 0)) % (3) === 0) {
                        playerRow.append($("<div>").addClass("clearfix visible-xs-block"));
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
                    var scrollElement = currentPanel.find(".panel-body");
                    var newItem = $("<li>").addClass("list-group-item low-pad").attr(Dice.Ui.DiceView.PlayerPointsRoundAttribute, roundNumber).text(points);
                    currentPanel.find("[dice-player-scoreboard]").append(newItem);

                    scrollElement.scrollTop(((((((scrollElement.scrollTop() + newItem.position().top) | 0) - scrollElement.height()) | 0) + newItem.height()) | 0));

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
                PlayerRowAttribute: null,
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
                    this.PlayerRowAttribute = "dice-player-row";
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJEaWNlLmpzIiwKICAic291cmNlUm9vdCI6ICIiLAogICJzb3VyY2VzIjogWyJDb21wb25lbnQvUGxheWVyLmNzIiwiTWFuYWdlci5jcyIsIlVpLmNzIl0sCiAgIm5hbWVzIjogWyIiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFrQnVDQSxPQUFPQTs7Ozs7b0JBQ1JBLE9BQU9BLDRCQUEwQ0E7Ozs7Ozs4QkFGckRBLEtBQUlBOzs7OztnQkFRMUJBO2dCQUNBQSxhQUFRQTs7OEJBR0VBLE1BQWFBOztnQkFFdkJBLFlBQU9BO2dCQUNQQSxhQUFRQTs7OztnQ0FHU0E7Z0JBRWpCQSxnQkFBV0E7Ozs7Ozs7Ozs7OztnQkFRWEEsSUFBSUEsNEJBQWdDQTtvQkFFaENBLG1CQUFtQkEsNEJBQWlDQTs7OztnQkFNeERBO2dCQUNBQTs7Ozs7Ozs7Ozs7Ozs7d0JDckNtQ0EsT0FBT0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytCQWdCaEJBLEtBQUlBO2dDQUVIQSxVQUFJQTs0Q0FHREE7Ozs7Ozs7OztpQ0FJWkE7Z0JBRWxCQSxlQUFlQTtnQkFDZkEsT0FBT0EsaUNBQTBCQSxRQUFRQSxZQUFZQSxDQUFDQSx3QkFBZ0JBO2dCQUN0RUEsZ0JBQWdCQSxJQUFJQSw2QkFBT0EsTUFBTUE7Z0JBQ2pDQSxpQkFBWUE7Z0JBQ1pBLDJCQUFzQkE7Z0JBQ3RCQSxJQUFJQTtvQkFFQUEscUJBQXFCQTtvQkFDckJBLHdCQUFtQkE7Ozs7Z0JBTXZCQSxPQUFPQSw0QkFBbUNBLHNCQUFXQSw0QkFBbUNBLGtCQUFRQSxBQUFtQkE7K0JBQU1BO3lCQUFhQTs7O2dCQU10SUEsZ0JBQWdCQTtnQkFFaEJBLElBQUlBLHNCQUFzQkE7b0JBQVFBLHVEQUFrREE7b0JBQXdCQTs7O2dCQUc1R0EsSUFBSUEsNkJBQTRCQTtvQkFFNUJBOztnQkFFSkEsYUFBYUE7Z0JBRWJBLElBQUlB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QThDQTs7b0NBRzNDQSxTQUFnQkE7O29CQUV4Q0EsNEJBQVlBO29CQUNaQSxpQkFBNkJBLG9CQUE2QkEsc0RBQXFEQSw0QkFDL0ZBLHVDQUF1QkEsWUFDN0JBOztvQkFHVkEsa0JBQWtCQSxBQUFTQTt3QkFBUUEsRUFBY0EsaUJBQTZCQTt1QkFBMkJBOzs7O29CQUt6R0E7b0JBQ0FBLElBQUlBLENBQUNBLHNCQUFhQSxFQUFjQSw2QkFBeUNBO3dCQUFXQTs7b0JBQ3BGQSxJQUFJQSxDQUFDQSxzQkFBYUEsRUFBY0EsOEJBQTBDQTt3QkFBWUE7O29CQUN0RkEsSUFBSUEsQ0FBQ0Esc0JBQWFBLEVBQWNBLDRCQUF3Q0E7d0JBQVVBOztvQkFDbEZBLE9BQU9BLFVBQUlBLDJDQUdFQSx1QkFDQ0Esc0JBQ0ZBOzs7b0JBTVpBLEVBQWNBOzttQ0FHU0E7b0JBRXZCQSxFQUFjQSx1QkFBd0NBLG9CQUFvQkE7O3NDQUdoREE7b0JBRTFCQSxrQkFBa0JBO29CQUNsQkEsSUFBSUEsZUFBZUE7d0JBQVFBOztvQkFFM0JBLHVDQUErQkEsdUNBQWtDQSxtQkFBVUE7b0JBRTNFQSxFQUFjQSwwQkFBa0NBO29CQUNoREEsRUFBY0E7Ozs7b0JBTWRBLEVBQWNBOztrQ0FHUUE7b0JBRXRCQSxVQUFVQSxpQ0FBMEJBLFdBQVdBLEVBQWNBLDhCQUFzQ0E7b0JBQ25HQSw0Q0FBb0NBO29CQUNwQ0EsRUFBY0EsdUJBQXdDQSxtRUFBMkRBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUNBOU90RUEiLAogICJzb3VyY2VzQ29udGVudCI6IFsidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLkxpbnE7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG51c2luZyBTeXN0ZW0uVGhyZWFkaW5nLlRhc2tzO1xyXG51c2luZyBCcmlkZ2U7XHJcblxyXG5uYW1lc3BhY2UgRGljZS5Db21wb25lbnRcclxue1xyXG4gICAgLy8vIDxzdW1tYXJ5PlxyXG4gICAgLy8vIFBsYXllciBjbGFzc1xyXG4gICAgLy8vIDwvc3VtbWFyeT5cclxuICAgIFtSZWZsZWN0YWJsZV1cclxuICAgIHB1YmxpYyBjbGFzcyBQbGF5ZXJcclxuICAgIHtcclxuICAgICAgICBwdWJsaWMgc3RyaW5nIE5hbWU7XHJcbiAgICAgICAgcHVibGljIGludCBJbmRleDtcclxuICAgICAgICBwdWJsaWMgTGlzdDxpbnQ+IFBvaW50cyA9IG5ldyBMaXN0PGludD4oKTtcclxuICAgICAgICBwdWJsaWMgaW50IFRvdGFsUG9pbnRzIHsgZ2V0IHsgcmV0dXJuIFBvaW50cy5TdW0oKTsgfSB9XHJcbiAgICAgICAgcHVibGljIGludCBMYXN0UG9pbnRzIHsgZ2V0IHsgcmV0dXJuIFN5c3RlbS5MaW5xLkVudW1lcmFibGUuTGFzdE9yRGVmYXVsdDxpbnQ+KFBvaW50cyk7IH0gfVxyXG4gICAgICAgIHB1YmxpYyBpbnQgU3RhckNvdW50O1xyXG4gICAgICAgIHB1YmxpYyBib29sIENhbkFjY3VtdWxhdGVMYXN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHB1YmxpYyBQbGF5ZXIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTmFtZSA9IFwiRGVmYXVsdFwiO1xyXG4gICAgICAgICAgICBJbmRleCA9IC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIFBsYXllcihzdHJpbmcgbmFtZSwgaW50IGluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgTmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICAgIEluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBBZGRQb2ludChpbnQgcG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBQb2ludHMuQWRkKHBvaW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vLyA8c3VtbWFyeT5cclxuICAgICAgICAvLy8gUmVtb3ZlIGxhc3QgcG9pbnQgZW50cnlcclxuICAgICAgICAvLy8gPC9zdW1tYXJ5PlxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFJlbW92ZUxhc3RQb2ludHMoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKFN5c3RlbS5MaW5xLkVudW1lcmFibGUuQW55PGludD4odGhpcy5Qb2ludHMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlBvaW50cy5SZW1vdmUoU3lzdGVtLkxpbnEuRW51bWVyYWJsZS5MYXN0PGludD4odGhpcy5Qb2ludHMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgUmVzZXQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUG9pbnRzLkNsZWFyKCk7XHJcbiAgICAgICAgICAgIENhbkFjY3VtdWxhdGVMYXN0ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uTGlucTtcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmcuVGFza3M7XHJcbnVzaW5nIEJyaWRnZS5IdG1sNTtcclxudXNpbmcgRGljZS5Db21wb25lbnQ7XHJcbnVzaW5nIEJyaWRnZTtcclxuXHJcbm5hbWVzcGFjZSBEaWNlXHJcbntcclxuICAgIHB1YmxpYyBzZWFsZWQgY2xhc3MgTWFuYWdlclxyXG4gICAge1xyXG4gICAgICAgIHByaXZhdGUgTWFuYWdlcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBNYW5hZ2VyIEluc3RhbmNlIHsgZ2V0IHsgcmV0dXJuIE5lc3RlZC5pbnN0YW5jZTsgfSB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgY2xhc3MgTmVzdGVkXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBFeHBsaWNpdCBzdGF0aWMgY29uc3RydWN0b3IgdG8gdGVsbCBDIyBjb21waWxlclxyXG4gICAgICAgICAgICAvLyBub3QgdG8gbWFyayB0eXBlIGFzIGJlZm9yZWZpZWxkaW5pdFxyXG4gICAgICAgICAgICBzdGF0aWMgTmVzdGVkKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpbnRlcm5hbCBzdGF0aWMgcmVhZG9ubHkgTWFuYWdlciBpbnN0YW5jZSA9IG5ldyBNYW5hZ2VyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGNvbnN0IHN0cmluZyBzYXZlZEdhbWVTdGF0ZUtleSA9IFwiRGljZVNhdmVHYW1lU3RhdGVcIjtcclxuICAgICAgICBwcml2YXRlIGNvbnN0IHN0cmluZyBzYXZlZEdhbWVQbGF5ZXJzS2V5ID0gXCJEaWNlU2F2ZVBsYXllcnNcIjtcclxuXHJcbiAgICAgICAgcHVibGljIExpc3Q8UGxheWVyPiBQbGF5ZXJzID0gbmV3IExpc3Q8UGxheWVyPigpO1xyXG4gICAgICAgIHB1YmxpYyBQbGF5ZXIgQ3VycmVudFBsYXllcjtcclxuICAgICAgICBwdWJsaWMgR2FtZVNldHRpbmdzIFNldHRpbmdzID0gbmV3IEdhbWVTZXR0aW5ncyB7IFN0YXJ0dXAgPSA1MDAsIEN1bXVsID0gNTAwMCwgVGFyZ2V0ID0gMjAwMDAgfTtcclxuXHJcbiAgICAgICAgLy8gR2FtZSBlbmRzIHdoZW4gYSBwbGF5ZXIgbWF0Y2hlcyB0aGlzIGlkXHJcbiAgICAgICAgcHVibGljIGludCBMYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgUm91bmRDb3VudCA9IDA7XHJcbiAgICAgICAgcHVibGljIGludCBMYXN0UG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWRkUGxheWVyKHN0cmluZyBuYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld0luZGV4ID0gR2V0TWF4SW5kZXgoKSArIDE7XHJcbiAgICAgICAgICAgIG5hbWUgPSBzdHJpbmcuSXNOdWxsT3JXaGl0ZVNwYWNlKG5hbWUpID8gXCJKb3VldXIgXCIgKyAobmV3SW5kZXggKyAxKSA6IG5hbWU7XHJcbiAgICAgICAgICAgIHZhciBuZXdQbGF5ZXIgPSBuZXcgUGxheWVyKG5hbWUsIG5ld0luZGV4KTtcclxuICAgICAgICAgICAgUGxheWVycy5BZGQobmV3UGxheWVyKTtcclxuICAgICAgICAgICAgVWkuQWRkUGxheWVyQ29udGFpbmVyKG5ld1BsYXllcik7XHJcbiAgICAgICAgICAgIGlmIChuZXdJbmRleCA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSBuZXdQbGF5ZXI7XHJcbiAgICAgICAgICAgICAgICBVaS5TZXRDdXJlbnRQbGF5ZXIobmV3SW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IEdldE1heEluZGV4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkFueTxQbGF5ZXI+KFBsYXllcnMpID8gU3lzdGVtLkxpbnEuRW51bWVyYWJsZS5NYXg8UGxheWVyPihQbGF5ZXJzLChGdW5jPFBsYXllcixpbnQ+KShteCA9PiBteC5JbmRleCkpIDogLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBOZXh0UGxheWVyKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEluaXRcclxuICAgICAgICAgICAgdmFyIG5leHRJbmRleCA9IEdldE5leHRJbmRleCgpO1xyXG4gICAgICAgICAgICAvLyBhY2N1bXVsYXRlIGN1cnJlbnQgcG9pbnRzXHJcbiAgICAgICAgICAgIGlmICh0aGlzLkN1cnJlbnRQbGF5ZXIgPT0gbnVsbCkgeyBVaS5BZGRBbGVydChcIkFqb3V0ZXogZGVzIGpvdWV1cnMgcG91ciBjb21tZW5jZXJcIiwgVWkuQWxlcnRTZXZlcml0eS5pbmZvKTsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiB0aGUgbGFzdCByb3VuZCBpbmRleCBpcyBvdXJzIHdlIGFyZSBhbHJlYWR5IGdhbWUgb3ZlclxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLkluZGV4ID09IHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9pbnRzID0gVWkuR2V0QWNjdW11bGF0ZWQoKTtcclxuICAgICAgICAgICAgLy8gTXVzdCBoYXZlIGVub3VnaCBwb2ludHMgdG8gc3RhcnRcclxuICAgICAgICAgICAgaWYgKHBvaW50cyAhPSAwICYmIHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyA8IHRoaXMuU2V0dGluZ3MuU3RhcnR1cCAmJiBwb2ludHMgPCB0aGlzLlNldHRpbmdzLlN0YXJ0dXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBvaW50cyA9IDA7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkxlIGpvdWV1ciBkb2l0IGF2b2lyIGF1IG1vaW5zIFwiICsgdGhpcy5TZXR0aW5ncy5TdGFydHVwICsgXCIgcG91ciBjb21tZW5jZXIgw6AgY3VtdWxlclwiLCBVaS5BbGVydFNldmVyaXR5Lndhcm5pbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE11c3Qgbm90IGJ1c3QgdGFyZ2V0IFxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyArIHBvaW50cyA+IHRoaXMuU2V0dGluZ3MuVGFyZ2V0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcG9pbnRzID0gMDtcclxuICAgICAgICAgICAgICAgIFVpLkFkZEFsZXJ0KFwiTGUgam91ZXVyIGRvaXQgZmluaXIgw6AgZXhhY3RlbWVudCA6IFwiICsgdGhpcy5TZXR0aW5ncy5UYXJnZXQgKyBcIiBwb2ludHNcIiwgVWkuQWxlcnRTZXZlcml0eS53YXJuaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuQWRkUG9pbnQocG9pbnRzKTtcclxuICAgICAgICAgICAgdGhpcy5MYXN0UG9pbnRzID0gcG9pbnRzO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBjYW4gbm93IGFjY3VtdWxhdGUgbGFzdFxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuQ3VycmVudFBsYXllci5DYW5BY2N1bXVsYXRlTGFzdCAmJiB0aGlzLkN1cnJlbnRQbGF5ZXIuVG90YWxQb2ludHMgPj0gdGhpcy5TZXR0aW5ncy5DdW11bClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyLkNhbkFjY3VtdWxhdGVMYXN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vVE9ETzogc3BlY2lhbCBtYXJrXHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydCh0aGlzLkN1cnJlbnRQbGF5ZXIuTmFtZSArIFwiIHBldXggbWFpbnRlbmFudCBjdW11bGVyIGxlIHNjb3JlIHByw6ljw6lkZW50XCIsIFVpLkFsZXJ0U2V2ZXJpdHkuaW5mbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgdGFyZ2V0IHJlYWNoZWQgZmxhZyBhcyBhIHdpbm5lclxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLlRvdGFsUG9pbnRzID09IHRoaXMuU2V0dGluZ3MuVGFyZ2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgYSBsZWdlbmRhcnkgd2lubmluZyBzdGFyXHJcbiAgICAgICAgICAgICAgICBVaS5BZGRTdGFyKHRoaXMuQ3VycmVudFBsYXllci5JbmRleCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuU3RhckNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAvLyBmbGFnIGxhc3Qgcm91bmQgaWYgbm90IGFsbHJlYWR5IGRvbmVcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4ID09IC0xKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPSB0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgVWkuQWRkQWxlcnQoXCJEZXJuacOocmUgcm9uZGUgIVwiLCBVaS5BbGVydFNldmVyaXR5LmluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVpLkFkZFBvaW50KHRoaXMuQ3VycmVudFBsYXllci5JbmRleCwgdGhpcy5Sb3VuZENvdW50LCBwb2ludHMsIHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyk7XHJcbiAgICAgICAgICAgIFVpLlNldEFjY3VtdWxhdGVkKDApO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByb3VuZCBjb21wbGV0ZWRcclxuICAgICAgICAgICAgaWYgKG5leHRJbmRleCA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJvdW5kQ291bnQrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL1NldCBuZXh0IHBsYXllclxyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSB0aGlzLlBsYXllcnNbbmV4dEluZGV4XTtcclxuICAgICAgICAgICAgVWkuU2V0Q3VyZW50UGxheWVyKG5leHRJbmRleCk7XHJcbiAgICAgICAgICAgIC8vIGlmIHRoZSBsYXN0IHJvdW5kIGluZGV4IGlzIHRoZSBuZXh0ciB0aGVuIGdhbWUgb3ZlciBjb25mZXRpZXMnbiBzaGl0elxyXG4gICAgICAgICAgICBpZiAobmV4dEluZGV4ID09IHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFVpLkFkZEFsZXJ0KFwiR2FtZSBPdmVyICFcIiwgVWkuQWxlcnRTZXZlcml0eS5zdWNjZXNzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgU2F2ZUdhbWUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGludCBHZXROZXh0SW5kZXgoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5leHRJbmRleCA9ICh0aGlzLkN1cnJlbnRQbGF5ZXIgIT0gbnVsbCA/IHRoaXMuQ3VycmVudFBsYXllci5JbmRleCArIDEgOiAwKTtcclxuICAgICAgICAgICAgaWYgKG5leHRJbmRleCA+IHRoaXMuR2V0TWF4SW5kZXgoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV4dEluZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dEluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBHZXRQcmV2aW91c0luZGV4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBwcmV2SW5kZXggPSAodGhpcy5DdXJyZW50UGxheWVyICE9IG51bGwgPyB0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXggLSAxIDogdGhpcy5HZXRNYXhJbmRleCgpKTtcclxuICAgICAgICAgICAgaWYgKHByZXZJbmRleCA8IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZXZJbmRleCA9IHRoaXMuR2V0TWF4SW5kZXgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldkluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWNjdW11bGF0ZUxhc3QoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuQ3VycmVudFBsYXllciA9PSBudWxsKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLkNhbkFjY3VtdWxhdGVMYXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BY2N1bXVsYXRlKHRoaXMuTGFzdFBvaW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkxlIGpvdWV1ciBkb2l0IGF2b2lyIGF1IG1vaW5zIFwiICsgdGhpcy5TZXR0aW5ncy5DdW11bCArIFwiIHBvdXIgY3VtdWxlciBsZXMgcG9pbnRzIHByw6ljw6lkZW50c1wiLCBVaS5BbGVydFNldmVyaXR5Lndhcm5pbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBOZXh0UGxheWVyQWNjdW11bGF0ZUxhc3QoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5OZXh0UGxheWVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuQWNjdW11bGF0ZUxhc3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIENhbmNlbExhc3RNb3ZlKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEhhcyBhIGdhbWUgc3RhcnRlZCA/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLkN1cnJlbnRQbGF5ZXIgPT0gbnVsbCB8fCAodGhpcy5DdXJyZW50UGxheWVyLkluZGV4ID09IDAgJiYgdGhpcy5Sb3VuZENvdW50ID09IDApKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzSW5kZXggPSB0aGlzLkdldFByZXZpb3VzSW5kZXgoKTtcclxuICAgICAgICAgICAgLy8gcmVzdG9yZSBhY2N1bXVsYXRvclxyXG4gICAgICAgICAgICBVaS5TZXRBY2N1bXVsYXRlZCh0aGlzLkxhc3RQb2ludHMpO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBsYXN0IHJvdW5kIHdhcyB3aW5uaW5nIG1vdmVcclxuICAgICAgICAgICAgaWYgKHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPT0gcHJldmlvdXNJbmRleClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHdlIHVuZG8gYSByb3VuZFxyXG4gICAgICAgICAgICBpZiAocHJldmlvdXNJbmRleCA9PSB0aGlzLkdldE1heEluZGV4KCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUm91bmRDb3VudC0tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNldCBwcmV2aW91cyBwbGF5ZXJcclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyID0gR2V0UGxheWVyYnlJbmRleChwcmV2aW91c0luZGV4KTtcclxuICAgICAgICAgICAgLy8gc2V0IGluIHVpXHJcbiAgICAgICAgICAgIFVpLlNldEN1cmVudFBsYXllcihwcmV2aW91c0luZGV4KTtcclxuICAgICAgICAgICAgLy8gcmVtb3ZlIHBvaW50c1xyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuUmVtb3ZlTGFzdFBvaW50cygpO1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgcG9pbnRzIGZyb20gdWlcclxuICAgICAgICAgICAgVWkuUmVtb3ZlUG9pbnRzKHByZXZpb3VzSW5kZXgsIHRoaXMuUm91bmRDb3VudCwgdGhpcy5DdXJyZW50UGxheWVyLlRvdGFsUG9pbnRzKTtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSBwcmV2aW91cyBwb2ludHNcclxuICAgICAgICAgICAgdGhpcy5MYXN0UG9pbnRzID0gdGhpcy5HZXRQbGF5ZXJieUluZGV4KHRoaXMuR2V0UHJldmlvdXNJbmRleCgpKS5MYXN0UG9pbnRzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgUmVzZXQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gUmUtQXBwbHkgKG5ldylydWxlc1xyXG4gICAgICAgICAgICB0aGlzLlNldHRpbmdzID0gVWkuR2V0UGFyYW1zKCk7XHJcblxyXG4gICAgICAgICAgICBmb3JlYWNoICh2YXIgcGxheWVyIGluIHRoaXMuUGxheWVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLlJlc2V0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgVWkuUmVzZXQoKTtcclxuICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB0aGlzLkxhc3RQb2ludHMgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkZpcnN0T3JEZWZhdWx0PFBsYXllcj4odGhpcy5QbGF5ZXJzKTtcclxuICAgICAgICAgICAgdGhpcy5Sb3VuZENvdW50ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIE5ld0dhbWUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgcnVsZXNcclxuICAgICAgICAgICAgdGhpcy5TZXR0aW5ncyA9IFVpLkdldFBhcmFtcygpO1xyXG4gICAgICAgICAgICAvLyBGbHVzaCBwbGF5ZXJzXHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycy5DbGVhcigpO1xyXG4gICAgICAgICAgICBVaS5DbGVhclBsYXllckNvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgcmVzdFxyXG4gICAgICAgICAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBSZW1vdmVQbGF5ZXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBsYXllciA9IEdldFBsYXllcmJ5SW5kZXgocGxheWVySW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAocGxheWVyID09IG51bGwpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycy5SZW1vdmUocGxheWVyKTtcclxuICAgICAgICAgICAgLy8gUmUtaW5kZXhcclxuICAgICAgICAgICAgaW50IGlkeCA9IDA7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKHZhciBjdXJQbGF5ZXIgaW4gdGhpcy5QbGF5ZXJzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjdXJQbGF5ZXIuSW5kZXggPSBpZHgrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL1RPRE86IHJlLWluZGV4IHVpXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIHVpXHJcbiAgICAgICAgICAgIFVpLlJlbW92ZVBsYXllckNvbnRhaW5lcihwbGF5ZXJJbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgUGxheWVyIEdldFBsYXllcmJ5SW5kZXgoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIFN5c3RlbS5MaW5xLkVudW1lcmFibGUuU2luZ2xlT3JEZWZhdWx0PFBsYXllcj4odGhpcy5QbGF5ZXJzLChGdW5jPFBsYXllcixib29sPikoc2cgPT4gc2cuSW5kZXggPT0gcGxheWVySW5kZXgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFNhdmVHYW1lKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFdpbmRvdy5Mb2NhbFN0b3JhZ2UuU2V0SXRlbShNYW5hZ2VyLnNhdmVkR2FtZVN0YXRlS2V5LCBKU09OLlN0cmluZ2lmeSh0aGlzLCBuZXcgc3RyaW5nW10geyBcIlNldHRpbmdzXCIsIFwiUm91bmRDb3VudFwiLCBcIkxhc3RQb2ludHNcIiwgXCJMYXN0Um91bmRQbGF5ZXJJbmRleFwiLCBcIkN1cnJlbnRQbGF5ZXJcIiB9KSk7XHJcbiAgICAgICAgICAgIFdpbmRvdy5Mb2NhbFN0b3JhZ2UuU2V0SXRlbShNYW5hZ2VyLnNhdmVkR2FtZVBsYXllcnNLZXksIEpTT04uU3RyaW5naWZ5KHRoaXMuUGxheWVycy5Ub0FycmF5KCkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIExvYWRHYW1lKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvbGRNYW5hZ2VyID0gSlNPTi5QYXJzZTxNYW5hZ2VyPigoc3RyaW5nKVdpbmRvdy5Mb2NhbFN0b3JhZ2UuR2V0SXRlbShNYW5hZ2VyLnNhdmVkR2FtZVN0YXRlS2V5KSk7XHJcbiAgICAgICAgICAgIHZhciBvbGRQbGF5ZXJzID0gSlNPTi5QYXJzZUFzQXJyYXk8UGxheWVyPigoc3RyaW5nKVdpbmRvdy5Mb2NhbFN0b3JhZ2UuR2V0SXRlbShNYW5hZ2VyLnNhdmVkR2FtZVBsYXllcnNLZXkpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycyA9IFN5c3RlbS5MaW5xLkVudW1lcmFibGUuVG9MaXN0PFBsYXllcj4ob2xkUGxheWVycyk7XHJcbiAgICAgICAgICAgIHRoaXMuU2V0dGluZ3MgPSBvbGRNYW5hZ2VyLlNldHRpbmdzO1xyXG4gICAgICAgICAgICB0aGlzLlJvdW5kQ291bnQgPSBvbGRNYW5hZ2VyLlJvdW5kQ291bnQ7XHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFBvaW50cyA9IG9sZE1hbmFnZXIuTGFzdFBvaW50cztcclxuICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IG9sZE1hbmFnZXIuTGFzdFJvdW5kUGxheWVySW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuQ3VycmVudFBsYXllciA9IG9sZE1hbmFnZXIuQ3VycmVudFBsYXllcjtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlYnVpbGQgdGhlIHVpXHJcbiAgICAgICAgICAgIFVpLkNsZWFyUGxheWVyQ29udGFpbmVyKCk7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKHZhciBwbGF5ZXIgaW4gdGhpcy5QbGF5ZXJzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRQbGF5ZXJDb250YWluZXIocGxheWVyKTtcclxuICAgICAgICAgICAgICAgIC8vUmUtQWRkIHBvaW50cyBoaXN0b3J5XHJcbiAgICAgICAgICAgICAgICBFbnVtZXJhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLlJhbmdlKDAsIHBsYXllci5Qb2ludHMuQ291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgLlppcChwbGF5ZXIuUG9pbnRzLCAocm91bmQsIHBvaW50KSA9PiBuZXcgeyByb3VuZCwgcG9pbnQgfSlcclxuICAgICAgICAgICAgICAgICAgICAuQWdncmVnYXRlPGludD4oMCwgKGN1ciwgbnh0KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGN1ciArPSBueHQucG9pbnQ7IFVpLkFkZFBvaW50KHBsYXllci5JbmRleCwgbnh0LnJvdW5kLCBueHQucG9pbnQsIGN1cik7IHJldHVybiBjdXI7IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlc3RvcmUgc3RhcnpcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxheWVyLlN0YXJDb3VudDsgaSsrKSB7IFVpLkFkZFN0YXIocGxheWVyLkluZGV4KTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVpLlNldEN1cmVudFBsYXllcih0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uTGlucTtcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmc7XHJcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmcuVGFza3M7XHJcbnVzaW5nIEJyaWRnZS5Cb290c3RyYXAzO1xyXG51c2luZyBCcmlkZ2UuSHRtbDU7XHJcbnVzaW5nIEJyaWRnZS5qUXVlcnkyO1xyXG51c2luZyBEaWNlLkNvbXBvbmVudDtcclxuXHJcbm5hbWVzcGFjZSBEaWNlXHJcbntcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIFVpXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBjbGFzcyBEaWNlVmlld1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBQbGF5ZXJTbG90cyA9IDEyO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllckNvbnRhaW5lcklkID0gXCJkaWNlLXNjb3JlYm9hcmRcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJDb2x1bW5BdHRyaWJ1dGUgPSBcImRhdGEtcGxheWVyLWNvbnRhaW5lclwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBhbmVsQXR0cmlidXRlID0gXCJkYXRhLXBsYXllci1wYW5lbFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBhbmVsVGl0bGVCYXNlSWQgPSBcImRpY2UtcGxheWVyLW5hbWUtXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgPSBcImRpY2UtcGxheWVyLXRvdGFsXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyU2NvcmVCb2FyZEF0dHJpYnV0ZSA9IFwiZGljZS1wbGF5ZXItc2NvcmVib2FyZFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBvaW50c1JvdW5kQXR0cmlidXRlID0gXCJkaWNlLXNjb3JlLXJvdW5kXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyUG9pbnRzQWNjdW11bGF0b3JJZCA9IFwiZGljZS1wb2ludC1hY2N1bXVsYXRvclwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclJvd0F0dHJpYnV0ZSA9IFwiZGljZS1wbGF5ZXItcm93XCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgQWxlcnRCYXNlSWQgPSBcImRpY2UtYWxlcnQtXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1UYXJnZXRJZCA9IFwiZGljZS1wYXJhbS10YXJnZXRcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQYXJhbVN0YXJ0dXBJZCA9IFwiZGljZS1wYXJhbS1zdGFydHVwXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1jdW11bElkID0gXCJkaWNlLXBhcmFtLWN1bXVsXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1Db2xsYXBzaWJsZUlkID0gXCJkaWNlLXBhcmFtc1wiO1xyXG4gICAgICAgICAgICBwdWJsaWMgc3RhdGljIGludCBBbGVydENvdW50ID0gMDtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBBbGVydERlbGF5ID0gMzAwMDtcclxuICAgICAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgUHJldmlvdXNDb2x1bW5TaXplID0gMDtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBNaW5Db2xTaXplWHMgPSA0O1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1pbkNvbFNpemVTbSA9IDM7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWluQ29sU2l6ZU1kID0gMztcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBNaW5Db2xTaXplTGcgPSAyO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFJlbmFtZUlkID0gXCJkaWNlLXJlbmFtZVwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFJlbmFtZUlucHV0SWQgPSBcImRpY2UtcmVuYW1lLWlucHV0XCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBzdGF0aWMgUGxheWVyIFJlbmFtZUN1cnJlbnRQbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBjbGFzcyBBbGVydFNldmVyaXR5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIHN1Y2Nlc3MgPSBcImFsZXJ0LXN1Y2Nlc3NcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyB3YXJuaW5nID0gXCJhbGVydC13YXJuaW5nXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgaW5mbyA9IFwiYWxlcnQtaW5mb1wiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIGRhbmdlciA9IFwiYWxlcnQtZGFuZ2VyXCI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlxyXG4gICAgICAgIC8vLyBBZGQgdGhlIHVpIGNvbHVtbiBwbGF5ZXIgY29udGFpbmVyXHJcbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJwbGF5ZXJPYmplY3RcIj48L3BhcmFtPlxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBBZGRQbGF5ZXJDb250YWluZXIoUGxheWVyIHBsYXllck9iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEdldCBtYWluIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB2YXIgc2NvcmVib2FyZCA9IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJDb250YWluZXJJZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXggNiBpdGVtIHBlciByZWFsIHJvd1xyXG4gICAgICAgICAgICB2YXIgcm93SW5kZXggPSBDb252ZXJ0LlRvSW50MzIocGxheWVyT2JqZWN0LkluZGV4IC8gKERpY2VWaWV3LlBsYXllclNsb3RzIC8gRGljZVZpZXcuTWluQ29sU2l6ZUxnKSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcGxheWVyUm93ID0gc2NvcmVib2FyZC5GaW5kKHN0cmluZy5Gb3JtYXQoXCJbUGxheWVyUm93QXR0cmlidXRlPXswfV1cIiwgcm93SW5kZXgpKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwbGF5ZXJSb3cuTGVuZ3RoIDw9IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBsYXllclJvdyA9IG5ldyBqUXVlcnkoXCI8ZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5BZGRDbGFzcyhcInJvdyBsb3ctcGFkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLkF0dHIoXCJQbGF5ZXJSb3dBdHRyaWJ1dGVcIiwgcm93SW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgc2NvcmVib2FyZC5BcHBlbmQocGxheWVyUm93KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb3JyZWN0IHJvdyBoZWlnaHRzXHJcbiAgICAgICAgICAgICAgICBzY29yZWJvYXJkLkZpbmQoXCJbUGxheWVyUm93QXR0cmlidXRlXVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5SZW1vdmVDbGFzcyhcImZpbGwtaGVpZ2h0LVwiICsgcm93SW5kZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgLkFkZENsYXNzKFwiZmlsbC1oZWlnaHQtXCIgKyAocm93SW5kZXggKyAxKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbHVtblxyXG4gICAgICAgICAgICB2YXIgcGxheWVyQ29udGFpbmVyID0gbmV3IGpRdWVyeShcIjxkaXY+XCIpO1xyXG4gICAgICAgICAgICBwbGF5ZXJDb250YWluZXIuQXR0cihEaWNlVmlldy5QbGF5ZXJDb2x1bW5BdHRyaWJ1dGUsIHBsYXllck9iamVjdC5JbmRleClcclxuICAgICAgICAgICAgICAgIC5BZGRDbGFzcyhcImZpbGwtaGVpZ2h0XCIpO1xyXG4gICAgICAgICAgICAvLyBQYW5lbCB3aXRoIHRpdGxlIGFuZCBzY29yZWJvYXJkXHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJQYW5lbCA9IG5ldyBqUXVlcnkoXCI8ZGl2PlwiKTtcclxuICAgICAgICAgICAgcGxheWVyUGFuZWxcclxuICAgICAgICAgICAgICAgIC5BZGRDbGFzcyhcInBhbmVsIHBhbmVsLWRlZmF1bHQgbG93LXBhZFwiKVxyXG4gICAgICAgICAgICAgICAgLkF0dHIoRGljZVZpZXcuUGxheWVyUGFuZWxBdHRyaWJ1dGUsIHBsYXllck9iamVjdC5JbmRleClcclxuICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwicGFuZWwtaGVhZGluZyBsb3ctcGFkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkaW5nIHRpdGxlXHJcbiAgICAgICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGgzPlwiKS5BZGRDbGFzcyhcInBhbmVsLXRpdGxlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BdHRyKFwiaWRcIiwgRGljZVZpZXcuUGxheWVyUGFuZWxUaXRsZUJhc2VJZCArIHBsYXllck9iamVjdC5JbmRleClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPHNwYW4+XCIpLkFkZENsYXNzKFwicGxheWVyLW5hbWVcIikuVGV4dChwbGF5ZXJPYmplY3QuTmFtZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjxzcGFuPlwiKS5BZGRDbGFzcyhcImdseXBoaWNvbiBnbHlwaGljb24tZWRpdCBwdWxsLXJpZ2h0IHBsYXllci1pY29uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuT24oXCJjbGlja1wiLCBudWxsLCBwbGF5ZXJPYmplY3QuSW5kZXguVG9TdHJpbmcoKSwgKEFjdGlvbjxqUXVlcnlFdmVudD4pVWkuU2hvd1JlbmFtZSkpKSlcclxuICAgICAgICAgICAgICAgIC8vIEFkZGluZyBib2R5IChzY29yZWJvYXJkKVxyXG4gICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJwYW5lbC1ib2R5IGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8dWw+XCIpLkFkZENsYXNzKFwibGlzdC1ncm91cFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuQXR0cihEaWNlVmlldy5QbGF5ZXJTY29yZUJvYXJkQXR0cmlidXRlLCBwbGF5ZXJPYmplY3QuSW5kZXgpKSlcclxuICAgICAgICAgICAgICAgIC8vIFRvdGFsIGluIGZvb3RlclxyXG4gICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJwYW5lbC1mb290ZXIgbG93LXBhZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjxoNT5cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkFkZENsYXNzKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BdHRyKERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlLCBwbGF5ZXJPYmplY3QuSW5kZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5UZXh0KFwiVG90YWw6IDBcIikpKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHRvIGNvbnRhaW5lcnNcclxuICAgICAgICAgICAgcGxheWVyQ29udGFpbmVyLkFwcGVuZChwbGF5ZXJQYW5lbCk7XHJcbiAgICAgICAgICAgIHBsYXllclJvdy5BcHBlbmQocGxheWVyQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgLy8gRm9yY2Ugd3JhcHBpbmcgb24gYSBuZXcgbGluZVxyXG4gICAgICAgICAgICAvL2lmICgocGxheWVyT2JqZWN0LkluZGV4ICsgMSkgJSAoRGljZVZpZXcuUGxheWVyU2xvdHMgLyBEaWNlVmlldy5NaW5Db2xTaXplTGcpID09IDApXHJcbiAgICAgICAgICAgIC8ve1xyXG4gICAgICAgICAgICAvLyAgICBzY29yZWJvYXJkLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJjbGVhcmZpeCB2aXNpYmxlLWxnLWJsb2NrXCIpKTtcclxuICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgIC8vIEJyZWFrIGludG8gbG9naWNhbCByb3dzIG9uIHNtYWxsIGRldmljZXNcclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVNZCkgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyUm93LkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJjbGVhcmZpeCB2aXNpYmxlLW1kLWJsb2NrXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoKHBsYXllck9iamVjdC5JbmRleCArIDEpICUgKERpY2VWaWV3LlBsYXllclNsb3RzIC8gRGljZVZpZXcuTWluQ29sU2l6ZVNtKSA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXJSb3cuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcImNsZWFyZml4IHZpc2libGUtc20tYmxvY2tcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgocGxheWVyT2JqZWN0LkluZGV4ICsgMSkgJSAoRGljZVZpZXcuUGxheWVyU2xvdHMgLyBEaWNlVmlldy5NaW5Db2xTaXplWHMpID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBsYXllclJvdy5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS14cy1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGNvbHVtbnMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBVaS5TZXRDb2x1bW5DbGFzcygpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW1vdmVQbGF5ZXJDb250YWluZXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSArIFwiPVwiICsgcGxheWVySW5kZXggKyBcIl1cIikuUmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2V0Q29sdW1uQ2xhc3MoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBsYXllckNvdW50ID0gTWFuYWdlci5JbnN0YW5jZS5QbGF5ZXJzLkNvdW50O1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVycyA9IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJDb250YWluZXJJZCkuRmluZChcImRpdltcIiArIERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSArIFwiXVwiKTtcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzWHMgPSBNYXRoLk1heChEaWNlVmlldy5QcmV2aW91c0NvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVYcyk7XHJcbiAgICAgICAgICAgIHZhciBwcmV2aW91c1NtID0gTWF0aC5NYXgoRGljZVZpZXcuUHJldmlvdXNDb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplU20pO1xyXG4gICAgICAgICAgICB2YXIgcHJldmlvdXNNZCA9IE1hdGguTWF4KERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZU1kKTtcclxuICAgICAgICAgICAgaWYgKERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcnMuUmVtb3ZlQ2xhc3MoXCJjb2wtbGctXCIgKyBEaWNlVmlldy5QcmV2aW91c0NvbHVtblNpemUgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wteHMtXCIgKyBwcmV2aW91c1hzICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLXNtLVwiICsgcHJldmlvdXNTbSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC1tZC1cIiArIHByZXZpb3VzTWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5TaXplID0gKGludClNYXRoLk1heChNYXRoLkZsb29yKChkZWNpbWFsKURpY2VWaWV3LlBsYXllclNsb3RzIC8gcGxheWVyQ291bnQpLCBEaWNlVmlldy5NaW5Db2xTaXplTGcpO1xyXG4gICAgICAgICAgICB2YXIgY29sdW1uU2l6ZVhzID0gTWF0aC5NYXgoY29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZVhzKTtcclxuICAgICAgICAgICAgdmFyIGNvbHVtblNpemVTbSA9IE1hdGguTWF4KGNvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVTbSk7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5TaXplTWQgPSBNYXRoLk1heChjb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplTWQpO1xyXG4gICAgICAgICAgICBjb250YWluZXJzLkFkZENsYXNzKFwiY29sLWxnLVwiICsgY29sdW1uU2l6ZSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLXhzLVwiICsgY29sdW1uU2l6ZVhzICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wtc20tXCIgKyBjb2x1bW5TaXplU20gK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC1tZC1cIiArIGNvbHVtblNpemVNZCk7XHJcbiAgICAgICAgICAgIERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSA9IGNvbHVtblNpemU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2V0Q3VyZW50UGxheWVyKGludCBwbGF5ZXJJbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCJkaXZbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSArIFwiXVwiKVxyXG4gICAgICAgICAgICAuUmVtb3ZlQ2xhc3MoXCJwYW5lbC1wcmltYXJ5XCIpXHJcbiAgICAgICAgICAgIC5BZGRDbGFzcyhcInBhbmVsLWRlZmF1bHRcIik7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCJkaXZbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSArIFwiPVwiICsgcGxheWVySW5kZXggKyBcIl1cIilcclxuICAgICAgICAgICAgLlJlbW92ZUNsYXNzKFwicGFuZWwtZGVmYXVsdFwiKVxyXG4gICAgICAgICAgICAuQWRkQ2xhc3MoXCJwYW5lbC1wcmltYXJ5XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFkZFBvaW50KGludCBwbGF5ZXJJbmRleCwgaW50IHJvdW5kTnVtYmVyLCBpbnQgcG9pbnRzLCBpbnQgdG90YWxQb2ludHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFBhbmVsID0galF1ZXJ5LlNlbGVjdChcImRpdltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsQXR0cmlidXRlICsgXCI9XCIgKyBwbGF5ZXJJbmRleCArIFwiXVwiKTtcclxuICAgICAgICAgICAgdmFyIHNjcm9sbEVsZW1lbnQgPSBjdXJyZW50UGFuZWwuRmluZChcIi5wYW5lbC1ib2R5XCIpO1xyXG4gICAgICAgICAgICB2YXIgbmV3SXRlbSA9IG5ldyBqUXVlcnkoXCI8bGk+XCIpLkFkZENsYXNzKFwibGlzdC1ncm91cC1pdGVtIGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgIC5BdHRyKERpY2VWaWV3LlBsYXllclBvaW50c1JvdW5kQXR0cmlidXRlLCByb3VuZE51bWJlcilcclxuICAgICAgICAgICAgICAgIC5UZXh0KHBvaW50cyk7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYW5lbC5GaW5kKFwiW1wiICsgRGljZVZpZXcuUGxheWVyU2NvcmVCb2FyZEF0dHJpYnV0ZSArIFwiXVwiKS5BcHBlbmQobmV3SXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBzY3JvbGwgdG8gZWxlbWVudFxyXG4gICAgICAgICAgICBzY3JvbGxFbGVtZW50LlNjcm9sbFRvcChzY3JvbGxFbGVtZW50LlNjcm9sbFRvcCgpICsgbmV3SXRlbS5Qb3NpdGlvbigpLlRvcFxyXG4gICAgICAgICAgICAgICAgLSBzY3JvbGxFbGVtZW50LkhlaWdodCgpICArIG5ld0l0ZW0uSGVpZ2h0KCkgKTtcclxuXHJcbiAgICAgICAgICAgIGN1cnJlbnRQYW5lbC5GaW5kKFwiW1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgKyBcIl1cIikuVGV4dChcIlRvdGFsOiBcIiArIHRvdGFsUG9pbnRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW1vdmVQb2ludHMoaW50IHBsYXllckluZGV4LCBpbnQgcm91bmROdW1iZXIsIGludCB0b3RhbFBvaW50cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50UGFuZWwgPSBqUXVlcnkuU2VsZWN0KFwiZGl2W1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxBdHRyaWJ1dGUgKyBcIj1cIiArIHBsYXllckluZGV4ICsgXCJdXCIpO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFuZWwuRmluZChcIltcIiArIERpY2VWaWV3LlBsYXllclBvaW50c1JvdW5kQXR0cmlidXRlICsgXCI9XCIgKyByb3VuZE51bWJlciArIFwiXVwiKVxyXG4gICAgICAgICAgICAgICAgLlJlbW92ZSgpO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFuZWwuRmluZChcIltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlICsgXCJdXCIpLlRleHQoXCJUb3RhbDogXCIgKyB0b3RhbFBvaW50cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgUmVzZXQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllclNjb3JlQm9hcmRBdHRyaWJ1dGUgKyBcIl1cIikuSHRtbChcIlwiKTtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsRm9vdGVyQXR0cmlidXRlICsgXCJdXCIpLlRleHQoXCJUb3RhbDogMFwiKTtcclxuICAgICAgICAgICAgVWkuU2V0Q3VyZW50UGxheWVyKDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFjY3VtdWxhdGUoaW50IHBvaW50cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhY2N1bXVsYXRvciA9IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQb2ludHNBY2N1bXVsYXRvcklkKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRWYWx1ZSA9IFVpLkdldEFjY3VtdWxhdGVkKGFjY3VtdWxhdG9yKTtcclxuICAgICAgICAgICAgYWNjdW11bGF0b3IuVmFsKChjdXJyZW50VmFsdWUgKyBwb2ludHMpLlRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgR2V0QWNjdW11bGF0ZWQob2JqZWN0IHNlbGVjdG9yID0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgPz8galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBvaW50c0FjY3VtdWxhdG9ySWQpO1xyXG4gICAgICAgICAgICBpbnQgdmFsdWU7XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKCgoalF1ZXJ5KXNlbGVjdG9yKS5WYWwoKSwgb3V0IHZhbHVlKSkgeyB2YWx1ZSA9IDA7IH1cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBvYmplY3QgU2V0QWNjdW11bGF0ZWQoaW50IHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQb2ludHNBY2N1bXVsYXRvcklkKS5WYWwodmFsdWUuVG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQWRkQWxlcnQoc3RyaW5nIG1lc3NhZ2UsIHN0cmluZyBzZXZlcml0eSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IERpY2VWaWV3LkFsZXJ0Q291bnQrKztcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcImJvZHlcIikuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcImFsZXJ0IGZhZGUgaW4gYWxlcnQtZml4ZWQtdG9wIGFsZXJ0LWRpc21pc3NpYmxlIFwiICsgc2V2ZXJpdHkpXHJcbiAgICAgICAgICAgICAgICAuQXR0cihcImlkXCIsIERpY2VWaWV3LkFsZXJ0QmFzZUlkICsgY291bnQpXHJcbiAgICAgICAgICAgICAgICAuVGV4dChtZXNzYWdlKSk7XHJcbiAgICAgICAgICAgIC8vQXV0byBDbG9zZVxyXG5cclxuICAgICAgICAgICAgV2luZG93LlNldFRpbWVvdXQoKEFjdGlvbikoKCkgPT4geyBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuQWxlcnRCYXNlSWQgKyBjb3VudCkuQWxlcnQoXCJjbG9zZVwiKTsgfSksIERpY2VWaWV3LkFsZXJ0RGVsYXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBHYW1lU2V0dGluZ3MgR2V0UGFyYW1zKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGludCB0YXJnZXQsIHN0YXJ0dXAsIGN1bXVsO1xyXG4gICAgICAgICAgICBpZiAoIWludC5UcnlQYXJzZShqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGFyYW1UYXJnZXRJZCkuVmFsKCksIG91dCB0YXJnZXQpKSB7IHRhcmdldCA9IDIwMDAwOyB9XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QYXJhbVN0YXJ0dXBJZCkuVmFsKCksIG91dCBzdGFydHVwKSkgeyBzdGFydHVwID0gNTAwMDsgfVxyXG4gICAgICAgICAgICBpZiAoIWludC5UcnlQYXJzZShqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGFyYW1jdW11bElkKS5WYWwoKSwgb3V0IGN1bXVsKSkgeyBjdW11bCA9IDUwMDsgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEdhbWVTZXR0aW5nc1xyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgVGFyZ2V0ID0gdGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgU3RhcnR1cCA9IHN0YXJ0dXAsXHJcbiAgICAgICAgICAgICAgICBDdW11bCA9IGN1bXVsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQ2xlYXJQbGF5ZXJDb250YWluZXIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllckNvbnRhaW5lcklkKS5IdG1sKFwiXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIEFkZFN0YXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBhbmVsVGl0bGVCYXNlSWQgKyBwbGF5ZXJJbmRleCkuQXBwZW5kKG5ldyBqUXVlcnkoXCI8c3Bhbj5cIikuQWRkQ2xhc3MoXCJnbHlwaGljb24gZ2x5cGhpY29uLXN0YXIgcHVsbC1yaWdodCBwbGF5ZXItaWNvblwiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2hvd1JlbmFtZShvYmplY3QgdGhlRXZlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgalF1ZXJ5RXZlbnQgPSB0aGVFdmVudCBhcyBqUXVlcnlFdmVudDtcclxuICAgICAgICAgICAgaWYgKGpRdWVyeUV2ZW50ID09IG51bGwpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIC8vIFNldCBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgICAgICBEaWNlVmlldy5SZW5hbWVDdXJyZW50UGxheWVyID0gTWFuYWdlci5JbnN0YW5jZS5HZXRQbGF5ZXJieUluZGV4KGludC5QYXJzZShqUXVlcnlFdmVudC5EYXRhLlRvU3RyaW5nKCkpKTtcclxuICAgICAgICAgICAgLy8gSW5pdCB0aGUgcmVuYW1lIGlucHV0IHRvIHRoZSBjdXJyZW50IG5hbWVcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlJlbmFtZUlucHV0SWQpLlZhbChEaWNlVmlldy5SZW5hbWVDdXJyZW50UGxheWVyLk5hbWUpO1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUmVuYW1lSWQpLk1vZGFsKFwic2hvd1wiKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgU2lkZVJlbmFtZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUmVuYW1lSWQpLk1vZGFsKFwiaGlkZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZW5hbWUoc3RyaW5nIG5ld05hbWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdOYW1lID0gc3RyaW5nLklzTnVsbE9yV2hpdGVTcGFjZShuZXdOYW1lKSA/IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5SZW5hbWVJbnB1dElkKS5WYWwoKSA6IG5ld05hbWU7XHJcbiAgICAgICAgICAgIERpY2VWaWV3LlJlbmFtZUN1cnJlbnRQbGF5ZXIuTmFtZSA9IG5ld05hbWU7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbFRpdGxlQmFzZUlkICsgRGljZVZpZXcuUmVuYW1lQ3VycmVudFBsYXllci5JbmRleCArIFwiIC5wbGF5ZXItbmFtZVwiKS5UZXh0KG5ld05hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXQp9Cg==
