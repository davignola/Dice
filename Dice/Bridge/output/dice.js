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
                savedGameStateKey: null
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
                    this.savedGameStateKey = "DiceSaveGameStateV2";
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
                Dice.Ui.AddPlayerContainer(newPlayer, this.Players.Count);
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
                window.localStorage.setItem(Dice.Manager.savedGameStateKey, JSON.stringify(this));
            },
            LoadGame: function () {
                var $t, $t1;
                var oldManager = Newtonsoft.Json.JsonConvert.DeserializeObject(Bridge.cast(window.localStorage.getItem(Dice.Manager.savedGameStateKey), System.String), Dice.Manager);

                if (oldManager == null) {
                    return;
                }

                this.Players.clear();
                this.Players.AddRange(System.Linq.Enumerable.from(oldManager.Players).select(function (s) {
                        var $t;
                        return ($t = new Dice.Component.Player.ctor(), $t.Points = new (System.Collections.Generic.List$1(System.Int32)).$ctor1(s.Points), $t.CanAccumulateLast = s.CanAccumulateLast, $t.Index = s.Index, $t.Name = s.Name, $t.StarCount = s.StarCount, $t);
                    }));
                this.Settings = ($t = new Dice.Component.GameSettings(), $t.Cumul = oldManager.Settings.Cumul, $t.Startup = oldManager.Settings.Startup, $t.Target = oldManager.Settings.Target, $t);
                this.RoundCount = oldManager.RoundCount;
                this.LastPoints = oldManager.LastPoints;
                this.LastRoundPlayerIndex = oldManager.LastRoundPlayerIndex;
                this.CurrentPlayer = System.Linq.Enumerable.from(this.Players).single(function (sg) {
                        return sg.Index === oldManager.CurrentPlayer.Index;
                    });

                Dice.Ui.ClearPlayerContainer();
                $t = Bridge.getEnumerator(System.Linq.Enumerable.from(this.Players).toList(Dice.Component.Player));
                try {
                    while ($t.moveNext()) {
                        var player = $t.Current;
                        Dice.Ui.AddPlayerContainer(player, this.Players.Count);
                        $t1 = Bridge.getEnumerator(System.Linq.Enumerable.from(player.Points).select(function (s, i) {
                                return { s: s, i: i };
                            }));
                        try {
                            while ($t1.moveNext()) {
                                var points = $t1.Current;
                                Dice.Ui.AddPoint(player.Index, points.i, points.s, points.i === ((player.Points.Count - 1) | 0) ? System.Linq.Enumerable.from(player.Points).sum() : 0);
                            }
                        } finally {
                            if (Bridge.is($t1, System.IDisposable)) {
                                $t1.System$IDisposable$Dispose();
                            }
                        }
                        for (var i = 0; i < player.StarCount; i = (i + 1) | 0) {
                            Dice.Ui.AddStar(player.Index);
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
                 * @param   {number}                   playerCount
                 * @return  {void}
                 */
                AddPlayerContainer: function (playerObject, playerCount) {
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
                    Dice.Ui.SetColumnClass(playerCount);
                },
                RemovePlayerContainer: function (playerIndex) {
                    $("[data-player-container=" + playerIndex + "]").remove();
                },
                SetColumnClass: function (playerCount) {
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICJEaWNlLmpzIiwKICAic291cmNlUm9vdCI6ICIiLAogICJzb3VyY2VzIjogWyJDb21wb25lbnQvUGxheWVyLmNzIiwiTWFuYWdlci5jcyIsIlVpLmNzIl0sCiAgIm5hbWVzIjogWyIiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFrQnVDQSxPQUFPQTs7Ozs7b0JBQ1JBLE9BQU9BLDRCQUEwQ0E7Ozs7Ozs4QkFGckRBLEtBQUlBOzs7OztnQkFRMUJBO2dCQUNBQSxhQUFRQTs7OEJBR0VBLE1BQWFBOztnQkFFdkJBLFlBQU9BO2dCQUNQQSxhQUFRQTs7OztnQ0FHU0E7Z0JBRWpCQSxnQkFBV0E7Ozs7Ozs7Ozs7OztnQkFRWEEsSUFBSUEsNEJBQWdDQTtvQkFFaENBLG1CQUFtQkEsNEJBQWlDQTs7OztnQkFNeERBO2dCQUNBQTs7Ozs7Ozs7Ozs7Ozt3QkNuQ21DQSxPQUFPQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrQkFlaEJBLEtBQUlBO2dDQUVIQSxVQUFJQTs0Q0FHREE7Ozs7Ozs7OztpQ0FJWkE7Z0JBRWxCQSxlQUFlQTtnQkFDZkEsT0FBT0EsaUNBQTBCQSxRQUFRQSxZQUFZQSxDQUFDQSx3QkFBZ0JBO2dCQUN0RUEsZ0JBQWdCQSxJQUFJQSw2QkFBT0EsTUFBTUE7Z0JBQ2pDQSxpQkFBWUE7Z0JBQ1pBLDJCQUFzQkEsV0FBV0E7Z0JBQ2pDQSxJQUFJQTtvQkFFQUEscUJBQXFCQTtvQkFDckJBLHdCQUFtQkE7Ozs7Z0JBTXZCQSxPQUFPQSw0QkFBbUNBLHNCQUFXQSw0QkFBbUNBLGtCQUFRQSxBQUFtQkE7K0JBQU1BO3lCQUFhQTs7O2dCQU10SUEsZ0JBQWdCQTtnQkFFaEJBLElBQUlBLHNCQUFzQkE7b0JBQVFBLHVEQUFrREE7b0JBQXdCQTs7O2dCQUc1R0EsSUFBSUEsNkJBQTRCQTtvQkFFNUJBOztnQkFFSkEsYUFBYUE7Z0JBRWJBLElB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QUlBLENBQUNBLHNCQUFhQSxBQUFDQSxZQUFRQSxvQkFBcUJBO3dCQUFVQTs7b0JBQzFEQSxPQUFPQTs7MENBR3lCQTtvQkFFaENBLE9BQU9BLEVBQWNBLCtCQUE4Q0E7O29DQUczQ0EsU0FBZ0JBOztvQkFFeENBLDRCQUFZQTtvQkFDWkEsaUJBQTZCQSxvQkFBNkJBLHNEQUFxREEsNEJBQy9GQSx1Q0FBdUJBLFlBQzdCQTs7b0JBR1ZBLGtCQUFrQkEsQUFBU0E7d0JBQVFBLEVBQWNBLGlCQUE2QkE7dUJBQTJCQTs7OztvQkFLekdBO29CQUNBQSxJQUFJQSxDQUFDQSxzQkFBYUEsRUFBY0EsNkJBQXlDQTt3QkFBV0E7O29CQUNwRkEsSUFBSUEsQ0FBQ0Esc0JBQWFBLEVBQWNBLDhCQUEwQ0E7d0JBQVlBOztvQkFDdEZBLElBQUlBLENBQUNBLHNCQUFhQSxFQUFjQSw0QkFBd0NBO3dCQUFVQTs7b0JBQ2xGQSxPQUFPQSxVQUFJQSwyQ0FHRUEsdUJBQ0NBLHNCQUNGQTs7O29CQU1aQSxFQUFjQTs7bUNBR1NBO29CQUV2QkEsRUFBY0EsdUJBQXdDQSxvQkFBb0JBOztzQ0FHaERBO29CQUUxQkEsa0JBQWtCQTtvQkFDbEJBLElBQUlBLGVBQWVBO3dCQUFRQTs7b0JBRTNCQSx1Q0FBK0JBLHVDQUF1Q0EsbUJBQVVBO29CQUVoRkEsRUFBY0EsMEJBQWtDQTtvQkFDaERBLEVBQWNBOzs7O29CQU1kQSxFQUFjQTs7a0NBR1FBO29CQUV0QkEsVUFBVUEsaUNBQTBCQSxXQUFXQSxFQUFjQSw4QkFBc0NBO29CQUNuR0EsNENBQW9DQTtvQkFDcENBLEVBQWNBLHVCQUF3Q0EsbUVBQTJEQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQTdPdEVBIiwKICAic291cmNlc0NvbnRlbnQiOiBbInVzaW5nIFN5c3RlbTtcclxudXNpbmcgU3lzdGVtLkNvbGxlY3Rpb25zLkdlbmVyaWM7XHJcbnVzaW5nIFN5c3RlbS5MaW5xO1xyXG51c2luZyBTeXN0ZW0uVGV4dDtcclxudXNpbmcgU3lzdGVtLlRocmVhZGluZy5UYXNrcztcclxudXNpbmcgQnJpZGdlO1xyXG5cclxubmFtZXNwYWNlIERpY2UuQ29tcG9uZW50XHJcbntcclxuICAgIC8vLyA8c3VtbWFyeT5cclxuICAgIC8vLyBQbGF5ZXIgY2xhc3NcclxuICAgIC8vLyA8L3N1bW1hcnk+XHJcbiAgICBbUmVmbGVjdGFibGVdXHJcbiAgICBwdWJsaWMgY2xhc3MgUGxheWVyXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0cmluZyBOYW1lO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgSW5kZXg7XHJcbiAgICAgICAgcHVibGljIExpc3Q8aW50PiBQb2ludHMgPSBuZXcgTGlzdDxpbnQ+KCk7XHJcbiAgICAgICAgcHVibGljIGludCBUb3RhbFBvaW50cyB7IGdldCB7IHJldHVybiBQb2ludHMuU3VtKCk7IH0gfVxyXG4gICAgICAgIHB1YmxpYyBpbnQgTGFzdFBvaW50cyB7IGdldCB7IHJldHVybiBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkxhc3RPckRlZmF1bHQ8aW50PihQb2ludHMpOyB9IH1cclxuICAgICAgICBwdWJsaWMgaW50IFN0YXJDb3VudDtcclxuICAgICAgICBwdWJsaWMgYm9vbCBDYW5BY2N1bXVsYXRlTGFzdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBwdWJsaWMgUGxheWVyKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE5hbWUgPSBcIkRlZmF1bHRcIjtcclxuICAgICAgICAgICAgSW5kZXggPSAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBQbGF5ZXIoc3RyaW5nIG5hbWUsIGludCBpbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE5hbWUgPSBuYW1lO1xyXG4gICAgICAgICAgICBJbmRleCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWRkUG9pbnQoaW50IHBvaW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUG9pbnRzLkFkZChwb2ludCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLy8gPHN1bW1hcnk+XHJcbiAgICAgICAgLy8vIFJlbW92ZSBsYXN0IHBvaW50IGVudHJ5XHJcbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cclxuICAgICAgICBwdWJsaWMgdm9pZCBSZW1vdmVMYXN0UG9pbnRzKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkFueTxpbnQ+KHRoaXMuUG9pbnRzKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5Qb2ludHMuUmVtb3ZlKFN5c3RlbS5MaW5xLkVudW1lcmFibGUuTGFzdDxpbnQ+KHRoaXMuUG9pbnRzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFJlc2V0KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFBvaW50cy5DbGVhcigpO1xyXG4gICAgICAgICAgICBDYW5BY2N1bXVsYXRlTGFzdCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuIiwidXNpbmcgU3lzdGVtO1xyXG51c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYztcclxudXNpbmcgU3lzdGVtLkxpbnE7XHJcbnVzaW5nIFN5c3RlbS5UZXh0O1xyXG51c2luZyBTeXN0ZW0uVGhyZWFkaW5nLlRhc2tzO1xyXG51c2luZyBCcmlkZ2UuSHRtbDU7XHJcbnVzaW5nIERpY2UuQ29tcG9uZW50O1xyXG51c2luZyBCcmlkZ2U7XHJcbnVzaW5nIE5ld3RvbnNvZnQuSnNvbjtcclxuXHJcblxyXG5uYW1lc3BhY2UgRGljZVxyXG57XHJcbiAgICBwdWJsaWMgc2VhbGVkIGNsYXNzIE1hbmFnZXJcclxuICAgIHtcclxuICAgICAgICBwcml2YXRlIE1hbmFnZXIoKVxyXG4gICAgICAgIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgTWFuYWdlciBJbnN0YW5jZSB7IGdldCB7IHJldHVybiBOZXN0ZWQuaW5zdGFuY2U7IH0gfVxyXG5cclxuICAgICAgICBwcml2YXRlIGNsYXNzIE5lc3RlZFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gRXhwbGljaXQgc3RhdGljIGNvbnN0cnVjdG9yIHRvIHRlbGwgQyMgY29tcGlsZXJcclxuICAgICAgICAgICAgLy8gbm90IHRvIG1hcmsgdHlwZSBhcyBiZWZvcmVmaWVsZGluaXRcclxuICAgICAgICAgICAgc3RhdGljIE5lc3RlZCgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW50ZXJuYWwgc3RhdGljIHJlYWRvbmx5IE1hbmFnZXIgaW5zdGFuY2UgPSBuZXcgTWFuYWdlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBjb25zdCBzdHJpbmcgc2F2ZWRHYW1lU3RhdGVLZXkgPSBcIkRpY2VTYXZlR2FtZVN0YXRlVjJcIjtcclxuXHJcbiAgICAgICAgcHVibGljIExpc3Q8UGxheWVyPiBQbGF5ZXJzID0gbmV3IExpc3Q8UGxheWVyPigpO1xyXG4gICAgICAgIHB1YmxpYyBQbGF5ZXIgQ3VycmVudFBsYXllcjtcclxuICAgICAgICBwdWJsaWMgR2FtZVNldHRpbmdzIFNldHRpbmdzID0gbmV3IEdhbWVTZXR0aW5ncyB7IFN0YXJ0dXAgPSA1MDAsIEN1bXVsID0gNTAwMCwgVGFyZ2V0ID0gMjAwMDAgfTtcclxuXHJcbiAgICAgICAgLy8gR2FtZSBlbmRzIHdoZW4gYSBwbGF5ZXIgbWF0Y2hlcyB0aGlzIGlkXHJcbiAgICAgICAgcHVibGljIGludCBMYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgIHB1YmxpYyBpbnQgUm91bmRDb3VudCA9IDA7XHJcbiAgICAgICAgcHVibGljIGludCBMYXN0UG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWRkUGxheWVyKHN0cmluZyBuYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld0luZGV4ID0gR2V0TWF4SW5kZXgoKSArIDE7XHJcbiAgICAgICAgICAgIG5hbWUgPSBzdHJpbmcuSXNOdWxsT3JXaGl0ZVNwYWNlKG5hbWUpID8gXCJKb3VldXIgXCIgKyAobmV3SW5kZXggKyAxKSA6IG5hbWU7XHJcbiAgICAgICAgICAgIHZhciBuZXdQbGF5ZXIgPSBuZXcgUGxheWVyKG5hbWUsIG5ld0luZGV4KTtcclxuICAgICAgICAgICAgUGxheWVycy5BZGQobmV3UGxheWVyKTtcclxuICAgICAgICAgICAgVWkuQWRkUGxheWVyQ29udGFpbmVyKG5ld1BsYXllciwgUGxheWVycy5Db3VudCk7XHJcbiAgICAgICAgICAgIGlmIChuZXdJbmRleCA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSBuZXdQbGF5ZXI7XHJcbiAgICAgICAgICAgICAgICBVaS5TZXRDdXJlbnRQbGF5ZXIobmV3SW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgaW50IEdldE1heEluZGV4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkFueTxQbGF5ZXI+KFBsYXllcnMpID8gU3lzdGVtLkxpbnEuRW51bWVyYWJsZS5NYXg8UGxheWVyPihQbGF5ZXJzLChGdW5jPFBsYXllcixpbnQ+KShteCA9PiBteC5JbmRleCkpIDogLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBOZXh0UGxheWVyKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEluaXRcclxuICAgICAgICAgICAgdmFyIG5leHRJbmRleCA9IEdldE5leHRJbmRleCgpO1xyXG4gICAgICAgICAgICAvLyBhY2N1bXVsYXRlIGN1cnJlbnQgcG9pbnRzXHJcbiAgICAgICAgICAgIGlmICh0aGlzLkN1cnJlbnRQbGF5ZXIgPT0gbnVsbCkgeyBVaS5BZGRBbGVydChcIkFqb3V0ZXogZGVzIGpvdWV1cnMgcG91ciBjb21tZW5jZXJcIiwgVWkuQWxlcnRTZXZlcml0eS5pbmZvKTsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiB0aGUgbGFzdCByb3VuZCBpbmRleCBpcyBvdXJzIHdlIGFyZSBhbHJlYWR5IGdhbWUgb3ZlclxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLkluZGV4ID09IHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9pbnRzID0gVWkuR2V0QWNjdW11bGF0ZWQoKTtcclxuICAgICAgICAgICAgLy8gTXVzdCBoYXZlIGVub3VnaCBwb2ludHMgdG8gc3RhcnRcclxuICAgICAgICAgICAgaWYgKHBvaW50cyAhPSAwICYmIHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyA8IHRoaXMuU2V0dGluZ3MuU3RhcnR1cCAmJiBwb2ludHMgPCB0aGlzLlNldHRpbmdzLlN0YXJ0dXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBvaW50cyA9IDA7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkxlIGpvdWV1ciBkb2l0IGF2b2lyIGF1IG1vaW5zIFwiICsgdGhpcy5TZXR0aW5ncy5TdGFydHVwICsgXCIgcG91ciBjb21tZW5jZXIgw6AgY3VtdWxlclwiLCBVaS5BbGVydFNldmVyaXR5Lndhcm5pbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE11c3Qgbm90IGJ1c3QgdGFyZ2V0IFxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyArIHBvaW50cyA+IHRoaXMuU2V0dGluZ3MuVGFyZ2V0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcG9pbnRzID0gMDtcclxuICAgICAgICAgICAgICAgIFVpLkFkZEFsZXJ0KFwiTGUgam91ZXVyIGRvaXQgZmluaXIgw6AgZXhhY3RlbWVudCA6IFwiICsgdGhpcy5TZXR0aW5ncy5UYXJnZXQgKyBcIiBwb2ludHNcIiwgVWkuQWxlcnRTZXZlcml0eS53YXJuaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuQWRkUG9pbnQocG9pbnRzKTtcclxuICAgICAgICAgICAgdGhpcy5MYXN0UG9pbnRzID0gcG9pbnRzO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBjYW4gbm93IGFjY3VtdWxhdGUgbGFzdFxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuQ3VycmVudFBsYXllci5DYW5BY2N1bXVsYXRlTGFzdCAmJiB0aGlzLkN1cnJlbnRQbGF5ZXIuVG90YWxQb2ludHMgPj0gdGhpcy5TZXR0aW5ncy5DdW11bClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyLkNhbkFjY3VtdWxhdGVMYXN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vVE9ETzogc3BlY2lhbCBtYXJrXHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydCh0aGlzLkN1cnJlbnRQbGF5ZXIuTmFtZSArIFwiIHBldXggbWFpbnRlbmFudCBjdW11bGVyIGxlIHNjb3JlIHByw6ljw6lkZW50XCIsIFVpLkFsZXJ0U2V2ZXJpdHkuaW5mbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgdGFyZ2V0IHJlYWNoZWQgZmxhZyBhcyBhIHdpbm5lclxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLlRvdGFsUG9pbnRzID09IHRoaXMuU2V0dGluZ3MuVGFyZ2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgYSBsZWdlbmRhcnkgd2lubmluZyBzdGFyXHJcbiAgICAgICAgICAgICAgICBVaS5BZGRTdGFyKHRoaXMuQ3VycmVudFBsYXllci5JbmRleCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuU3RhckNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAvLyBmbGFnIGxhc3Qgcm91bmQgaWYgbm90IGFsbHJlYWR5IGRvbmVcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLkxhc3RSb3VuZFBsYXllckluZGV4ID09IC0xKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPSB0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgVWkuQWRkQWxlcnQoXCJEZXJuacOocmUgcm9uZGUgIVwiLCBVaS5BbGVydFNldmVyaXR5LmluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVpLkFkZFBvaW50KHRoaXMuQ3VycmVudFBsYXllci5JbmRleCwgdGhpcy5Sb3VuZENvdW50LCBwb2ludHMsIHRoaXMuQ3VycmVudFBsYXllci5Ub3RhbFBvaW50cyk7XHJcbiAgICAgICAgICAgIFVpLlNldEFjY3VtdWxhdGVkKDApO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByb3VuZCBjb21wbGV0ZWRcclxuICAgICAgICAgICAgaWYgKG5leHRJbmRleCA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJvdW5kQ291bnQrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL1NldCBuZXh0IHBsYXllclxyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSB0aGlzLlBsYXllcnNbbmV4dEluZGV4XTtcclxuICAgICAgICAgICAgVWkuU2V0Q3VyZW50UGxheWVyKG5leHRJbmRleCk7XHJcbiAgICAgICAgICAgIC8vIGlmIHRoZSBsYXN0IHJvdW5kIGluZGV4IGlzIHRoZSBuZXh0ciB0aGVuIGdhbWUgb3ZlciBjb25mZXRpZXMnbiBzaGl0elxyXG4gICAgICAgICAgICBpZiAobmV4dEluZGV4ID09IHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFVpLkFkZEFsZXJ0KFwiR2FtZSBPdmVyICFcIiwgVWkuQWxlcnRTZXZlcml0eS5zdWNjZXNzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgU2F2ZUdhbWUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGludCBHZXROZXh0SW5kZXgoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5leHRJbmRleCA9ICh0aGlzLkN1cnJlbnRQbGF5ZXIgIT0gbnVsbCA/IHRoaXMuQ3VycmVudFBsYXllci5JbmRleCArIDEgOiAwKTtcclxuICAgICAgICAgICAgaWYgKG5leHRJbmRleCA+IHRoaXMuR2V0TWF4SW5kZXgoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV4dEluZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dEluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGludCBHZXRQcmV2aW91c0luZGV4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBwcmV2SW5kZXggPSAodGhpcy5DdXJyZW50UGxheWVyICE9IG51bGwgPyB0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXggLSAxIDogdGhpcy5HZXRNYXhJbmRleCgpKTtcclxuICAgICAgICAgICAgaWYgKHByZXZJbmRleCA8IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZXZJbmRleCA9IHRoaXMuR2V0TWF4SW5kZXgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldkluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgQWNjdW11bGF0ZUxhc3QoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuQ3VycmVudFBsYXllciA9PSBudWxsKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5DdXJyZW50UGxheWVyLkNhbkFjY3VtdWxhdGVMYXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BY2N1bXVsYXRlKHRoaXMuTGFzdFBvaW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVaS5BZGRBbGVydChcIkxlIGpvdWV1ciBkb2l0IGF2b2lyIGF1IG1vaW5zIFwiICsgdGhpcy5TZXR0aW5ncy5DdW11bCArIFwiIHBvdXIgY3VtdWxlciBsZXMgcG9pbnRzIHByw6ljw6lkZW50c1wiLCBVaS5BbGVydFNldmVyaXR5Lndhcm5pbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBOZXh0UGxheWVyQWNjdW11bGF0ZUxhc3QoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5OZXh0UGxheWVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuQWNjdW11bGF0ZUxhc3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIENhbmNlbExhc3RNb3ZlKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEhhcyBhIGdhbWUgc3RhcnRlZCA/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLkN1cnJlbnRQbGF5ZXIgPT0gbnVsbCB8fCAodGhpcy5DdXJyZW50UGxheWVyLkluZGV4ID09IDAgJiYgdGhpcy5Sb3VuZENvdW50ID09IDApKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzSW5kZXggPSB0aGlzLkdldFByZXZpb3VzSW5kZXgoKTtcclxuICAgICAgICAgICAgLy8gcmVzdG9yZSBhY2N1bXVsYXRvclxyXG4gICAgICAgICAgICBVaS5TZXRBY2N1bXVsYXRlZCh0aGlzLkxhc3RQb2ludHMpO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBsYXN0IHJvdW5kIHdhcyB3aW5uaW5nIG1vdmVcclxuICAgICAgICAgICAgaWYgKHRoaXMuTGFzdFJvdW5kUGxheWVySW5kZXggPT0gcHJldmlvdXNJbmRleClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHdlIHVuZG8gYSByb3VuZFxyXG4gICAgICAgICAgICBpZiAocHJldmlvdXNJbmRleCA9PSB0aGlzLkdldE1heEluZGV4KCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUm91bmRDb3VudC0tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNldCBwcmV2aW91cyBwbGF5ZXJcclxuICAgICAgICAgICAgdGhpcy5DdXJyZW50UGxheWVyID0gR2V0UGxheWVyYnlJbmRleChwcmV2aW91c0luZGV4KTtcclxuICAgICAgICAgICAgLy8gc2V0IGluIHVpXHJcbiAgICAgICAgICAgIFVpLlNldEN1cmVudFBsYXllcihwcmV2aW91c0luZGV4KTtcclxuICAgICAgICAgICAgLy8gcmVtb3ZlIHBvaW50c1xyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIuUmVtb3ZlTGFzdFBvaW50cygpO1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgcG9pbnRzIGZyb20gdWlcclxuICAgICAgICAgICAgVWkuUmVtb3ZlUG9pbnRzKHByZXZpb3VzSW5kZXgsIHRoaXMuUm91bmRDb3VudCwgdGhpcy5DdXJyZW50UGxheWVyLlRvdGFsUG9pbnRzKTtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSBwcmV2aW91cyBwb2ludHNcclxuICAgICAgICAgICAgdGhpcy5MYXN0UG9pbnRzID0gdGhpcy5HZXRQbGF5ZXJieUluZGV4KHRoaXMuR2V0UHJldmlvdXNJbmRleCgpKS5MYXN0UG9pbnRzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHZvaWQgUmVzZXQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gUmUtQXBwbHkgKG5ldylydWxlc1xyXG4gICAgICAgICAgICB0aGlzLlNldHRpbmdzID0gVWkuR2V0UGFyYW1zKCk7XHJcblxyXG4gICAgICAgICAgICBmb3JlYWNoICh2YXIgcGxheWVyIGluIHRoaXMuUGxheWVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLlJlc2V0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgVWkuUmVzZXQoKTtcclxuICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB0aGlzLkxhc3RQb2ludHMgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLkN1cnJlbnRQbGF5ZXIgPSBTeXN0ZW0uTGlucS5FbnVtZXJhYmxlLkZpcnN0T3JEZWZhdWx0PFBsYXllcj4odGhpcy5QbGF5ZXJzKTtcclxuICAgICAgICAgICAgdGhpcy5Sb3VuZENvdW50ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIE5ld0dhbWUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgcnVsZXNcclxuICAgICAgICAgICAgdGhpcy5TZXR0aW5ncyA9IFVpLkdldFBhcmFtcygpO1xyXG4gICAgICAgICAgICAvLyBGbHVzaCBwbGF5ZXJzXHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycy5DbGVhcigpO1xyXG4gICAgICAgICAgICBVaS5DbGVhclBsYXllckNvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgcmVzdFxyXG4gICAgICAgICAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBSZW1vdmVQbGF5ZXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBsYXllciA9IEdldFBsYXllcmJ5SW5kZXgocGxheWVySW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAocGxheWVyID09IG51bGwpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycy5SZW1vdmUocGxheWVyKTtcclxuICAgICAgICAgICAgLy8gUmUtaW5kZXhcclxuICAgICAgICAgICAgaW50IGlkeCA9IDA7XHJcbiAgICAgICAgICAgIGZvcmVhY2ggKHZhciBjdXJQbGF5ZXIgaW4gdGhpcy5QbGF5ZXJzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjdXJQbGF5ZXIuSW5kZXggPSBpZHgrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL1RPRE86IHJlLWluZGV4IHVpXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIHVpXHJcbiAgICAgICAgICAgIFVpLlJlbW92ZVBsYXllckNvbnRhaW5lcihwbGF5ZXJJbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgUGxheWVyIEdldFBsYXllcmJ5SW5kZXgoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIFN5c3RlbS5MaW5xLkVudW1lcmFibGUuU2luZ2xlT3JEZWZhdWx0PFBsYXllcj4odGhpcy5QbGF5ZXJzLChGdW5jPFBsYXllcixib29sPikoc2cgPT4gc2cuSW5kZXggPT0gcGxheWVySW5kZXgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB2b2lkIFNhdmVHYW1lKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFdpbmRvdy5Mb2NhbFN0b3JhZ2UuU2V0SXRlbShNYW5hZ2VyLnNhdmVkR2FtZVN0YXRlS2V5LCBKU09OLlN0cmluZ2lmeSh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdm9pZCBMb2FkR2FtZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2xkTWFuYWdlciA9IEpzb25Db252ZXJ0LkRlc2VyaWFsaXplT2JqZWN0PE1hbmFnZXI+KChzdHJpbmcpV2luZG93LkxvY2FsU3RvcmFnZS5HZXRJdGVtKE1hbmFnZXIuc2F2ZWRHYW1lU3RhdGVLZXkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEtleSBkb2VzIG5vdCBleGlzdCBvciBpcyBiYWRcclxuICAgICAgICAgICAgaWYgKG9sZE1hbmFnZXIgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuUGxheWVycy5DbGVhcigpO1xyXG4gICAgICAgICAgICAvLyBQcm9wZXJseSBjcmVhdGUgbmV3IG9iamVjdHNcclxuICAgICAgICAgICAgdGhpcy5QbGF5ZXJzLkFkZFJhbmdlKFN5c3RlbS5MaW5xLkVudW1lcmFibGUuU2VsZWN0PFBsYXllcixQbGF5ZXI+KG9sZE1hbmFnZXIuUGxheWVycywoRnVuYzxQbGF5ZXIsUGxheWVyPikocyA9PiBuZXcgUGxheWVyXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFBvaW50cyA9IG5ldyBMaXN0PGludD4ocy5Qb2ludHMpLFxyXG4gICAgICAgICAgICAgICAgQ2FuQWNjdW11bGF0ZUxhc3QgPSBzLkNhbkFjY3VtdWxhdGVMYXN0LFxyXG4gICAgICAgICAgICAgICAgSW5kZXggPSBzLkluZGV4LFxyXG4gICAgICAgICAgICAgICAgTmFtZSA9IHMuTmFtZSxcclxuICAgICAgICAgICAgICAgIFN0YXJDb3VudCA9IHMuU3RhckNvdW50XHJcbiAgICAgICAgICAgIH0pKSk7XHJcbiAgICAgICAgICAgIHRoaXMuU2V0dGluZ3MgPSBuZXcgR2FtZVNldHRpbmdzXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIEN1bXVsID0gb2xkTWFuYWdlci5TZXR0aW5ncy5DdW11bCxcclxuICAgICAgICAgICAgICAgIFN0YXJ0dXAgPSBvbGRNYW5hZ2VyLlNldHRpbmdzLlN0YXJ0dXAsXHJcbiAgICAgICAgICAgICAgICBUYXJnZXQgPSBvbGRNYW5hZ2VyLlNldHRpbmdzLlRhcmdldFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB0aGlzLlJvdW5kQ291bnQgPSBvbGRNYW5hZ2VyLlJvdW5kQ291bnQ7XHJcbiAgICAgICAgICAgIHRoaXMuTGFzdFBvaW50cyA9IG9sZE1hbmFnZXIuTGFzdFBvaW50cztcclxuICAgICAgICAgICAgdGhpcy5MYXN0Um91bmRQbGF5ZXJJbmRleCA9IG9sZE1hbmFnZXIuTGFzdFJvdW5kUGxheWVySW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuQ3VycmVudFBsYXllciA9IFN5c3RlbS5MaW5xLkVudW1lcmFibGUuU2luZ2xlPFBsYXllcj4odGhpcy5QbGF5ZXJzLChGdW5jPFBsYXllcixib29sPikoc2cgPT4gc2cuSW5kZXggPT0gb2xkTWFuYWdlci5DdXJyZW50UGxheWVyLkluZGV4KSk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZWJ1aWxkIHRoZSB1aVxyXG4gICAgICAgICAgICBVaS5DbGVhclBsYXllckNvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICAvLyBpdGVyYXRlIGEgbGlzdCBjbG9uZVxyXG4gICAgICAgICAgICBmb3JlYWNoICh2YXIgcGxheWVyIGluIFN5c3RlbS5MaW5xLkVudW1lcmFibGUuVG9MaXN0PFBsYXllcj4odGhpcy5QbGF5ZXJzKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVWkuQWRkUGxheWVyQ29udGFpbmVyKHBsYXllciwgdGhpcy5QbGF5ZXJzLkNvdW50KTtcclxuICAgICAgICAgICAgICAgIC8vUmUtQWRkIHBvaW50cyBoaXN0b3J5XHJcbiAgICAgICAgICAgICAgICBmb3JlYWNoICh2YXIgcG9pbnRzIGluIHBsYXllci5Qb2ludHMuU2VsZWN0KChzLCBpKSA9PiBuZXcgeyBzLCBpIH0pKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFVpLkFkZFBvaW50KHBsYXllci5JbmRleCwgcG9pbnRzLmksIHBvaW50cy5zLCBwb2ludHMuaSA9PSBwbGF5ZXIuUG9pbnRzLkNvdW50IC0gMSA/IHBsYXllci5Qb2ludHMuU3VtKCkgOiAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFJlc3RvcmUgc3RhcnpcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxheWVyLlN0YXJDb3VudDsgaSsrKSB7IFVpLkFkZFN0YXIocGxheWVyLkluZGV4KTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVpLlNldEN1cmVudFBsYXllcih0aGlzLkN1cnJlbnRQbGF5ZXIuSW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJ1c2luZyBTeXN0ZW07XHJcbnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljO1xyXG51c2luZyBTeXN0ZW0uTGlucTtcclxudXNpbmcgU3lzdGVtLlRleHQ7XHJcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmc7XHJcbnVzaW5nIFN5c3RlbS5UaHJlYWRpbmcuVGFza3M7XHJcbnVzaW5nIEJyaWRnZS5Cb290c3RyYXAzO1xyXG51c2luZyBCcmlkZ2UuSHRtbDU7XHJcbnVzaW5nIEJyaWRnZS5qUXVlcnkyO1xyXG51c2luZyBEaWNlLkNvbXBvbmVudDtcclxuXHJcbm5hbWVzcGFjZSBEaWNlXHJcbntcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIFVpXHJcbiAgICB7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBjbGFzcyBEaWNlVmlld1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBQbGF5ZXJTbG90cyA9IDEyO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllckNvbnRhaW5lcklkID0gXCJkaWNlLXNjb3JlYm9hcmRcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQbGF5ZXJDb2x1bW5BdHRyaWJ1dGUgPSBcImRhdGEtcGxheWVyLWNvbnRhaW5lclwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBhbmVsQXR0cmlidXRlID0gXCJkYXRhLXBsYXllci1wYW5lbFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBhbmVsVGl0bGVCYXNlSWQgPSBcImRpY2UtcGxheWVyLW5hbWUtXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgPSBcImRpY2UtcGxheWVyLXRvdGFsXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyU2NvcmVCb2FyZEF0dHJpYnV0ZSA9IFwiZGljZS1wbGF5ZXItc2NvcmVib2FyZFwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclBvaW50c1JvdW5kQXR0cmlidXRlID0gXCJkaWNlLXNjb3JlLXJvdW5kXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGxheWVyUG9pbnRzQWNjdW11bGF0b3JJZCA9IFwiZGljZS1wb2ludC1hY2N1bXVsYXRvclwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFBsYXllclJvd0F0dHJpYnV0ZSA9IFwiZGljZS1wbGF5ZXItcm93XCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgQWxlcnRCYXNlSWQgPSBcImRpY2UtYWxlcnQtXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1UYXJnZXRJZCA9IFwiZGljZS1wYXJhbS10YXJnZXRcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyBQYXJhbVN0YXJ0dXBJZCA9IFwiZGljZS1wYXJhbS1zdGFydHVwXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1jdW11bElkID0gXCJkaWNlLXBhcmFtLWN1bXVsXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgUGFyYW1Db2xsYXBzaWJsZUlkID0gXCJkaWNlLXBhcmFtc1wiO1xyXG4gICAgICAgICAgICBwdWJsaWMgc3RhdGljIGludCBBbGVydENvdW50ID0gMDtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBBbGVydERlbGF5ID0gMzAwMDtcclxuICAgICAgICAgICAgcHVibGljIHN0YXRpYyBpbnQgUHJldmlvdXNDb2x1bW5TaXplID0gMDtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBNaW5Db2xTaXplWHMgPSA0O1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3QgaW50IE1pbkNvbFNpemVTbSA9IDM7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBpbnQgTWluQ29sU2l6ZU1kID0gMztcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IGludCBNaW5Db2xTaXplTGcgPSAyO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFJlbmFtZUlkID0gXCJkaWNlLXJlbmFtZVwiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIFJlbmFtZUlucHV0SWQgPSBcImRpY2UtcmVuYW1lLWlucHV0XCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBzdGF0aWMgUGxheWVyIFJlbmFtZUN1cnJlbnRQbGF5ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBjbGFzcyBBbGVydFNldmVyaXR5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIHN1Y2Nlc3MgPSBcImFsZXJ0LXN1Y2Nlc3NcIjtcclxuICAgICAgICAgICAgcHVibGljIGNvbnN0IHN0cmluZyB3YXJuaW5nID0gXCJhbGVydC13YXJuaW5nXCI7XHJcbiAgICAgICAgICAgIHB1YmxpYyBjb25zdCBzdHJpbmcgaW5mbyA9IFwiYWxlcnQtaW5mb1wiO1xyXG4gICAgICAgICAgICBwdWJsaWMgY29uc3Qgc3RyaW5nIGRhbmdlciA9IFwiYWxlcnQtZGFuZ2VyXCI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlxyXG4gICAgICAgIC8vLyBBZGQgdGhlIHVpIGNvbHVtbiBwbGF5ZXIgY29udGFpbmVyXHJcbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJwbGF5ZXJPYmplY3RcIj48L3BhcmFtPlxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBBZGRQbGF5ZXJDb250YWluZXIoUGxheWVyIHBsYXllck9iamVjdCwgaW50IHBsYXllckNvdW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gR2V0IG1haW4gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHZhciBzY29yZWJvYXJkID0galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllckNvbnRhaW5lcklkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1heCA2IGl0ZW0gcGVyIHJlYWwgcm93XHJcbiAgICAgICAgICAgIHZhciByb3dJbmRleCA9IENvbnZlcnQuVG9JbnQzMihwbGF5ZXJPYmplY3QuSW5kZXggLyAoRGljZVZpZXcuUGxheWVyU2xvdHMgLyBEaWNlVmlldy5NaW5Db2xTaXplTGcpKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJSb3cgPSBzY29yZWJvYXJkLkZpbmQoc3RyaW5nLkZvcm1hdChcIltQbGF5ZXJSb3dBdHRyaWJ1dGU9ezB9XVwiLCByb3dJbmRleCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHBsYXllclJvdy5MZW5ndGggPD0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyUm93ID0gbmV3IGpRdWVyeShcIjxkaXY+XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLkFkZENsYXNzKFwicm93IGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgICAgICAuQXR0cihcIlBsYXllclJvd0F0dHJpYnV0ZVwiLCByb3dJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBzY29yZWJvYXJkLkFwcGVuZChwbGF5ZXJSb3cpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvcnJlY3Qgcm93IGhlaWdodHNcclxuICAgICAgICAgICAgICAgIHNjb3JlYm9hcmQuRmluZChcIltQbGF5ZXJSb3dBdHRyaWJ1dGVdXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLlJlbW92ZUNsYXNzKFwiZmlsbC1oZWlnaHQtXCIgKyByb3dJbmRleClcclxuICAgICAgICAgICAgICAgICAgICAuQWRkQ2xhc3MoXCJmaWxsLWhlaWdodC1cIiArIChyb3dJbmRleCArIDEpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29sdW1uXHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJDb250YWluZXIgPSBuZXcgalF1ZXJ5KFwiPGRpdj5cIik7XHJcbiAgICAgICAgICAgIHBsYXllckNvbnRhaW5lci5BdHRyKERpY2VWaWV3LlBsYXllckNvbHVtbkF0dHJpYnV0ZSwgcGxheWVyT2JqZWN0LkluZGV4KVxyXG4gICAgICAgICAgICAgICAgLkFkZENsYXNzKFwiZmlsbC1oZWlnaHRcIik7XHJcbiAgICAgICAgICAgIC8vIFBhbmVsIHdpdGggdGl0bGUgYW5kIHNjb3JlYm9hcmRcclxuICAgICAgICAgICAgdmFyIHBsYXllclBhbmVsID0gbmV3IGpRdWVyeShcIjxkaXY+XCIpO1xyXG4gICAgICAgICAgICBwbGF5ZXJQYW5lbFxyXG4gICAgICAgICAgICAgICAgLkFkZENsYXNzKFwicGFuZWwgcGFuZWwtZGVmYXVsdCBsb3ctcGFkXCIpXHJcbiAgICAgICAgICAgICAgICAuQXR0cihEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSwgcGxheWVyT2JqZWN0LkluZGV4KVxyXG4gICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJwYW5lbC1oZWFkaW5nIGxvdy1wYWRcIilcclxuICAgICAgICAgICAgICAgICAgICAvLyBBZGRpbmcgdGl0bGVcclxuICAgICAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8aDM+XCIpLkFkZENsYXNzKFwicGFuZWwtdGl0bGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkF0dHIoXCJpZFwiLCBEaWNlVmlldy5QbGF5ZXJQYW5lbFRpdGxlQmFzZUlkICsgcGxheWVyT2JqZWN0LkluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8c3Bhbj5cIikuQWRkQ2xhc3MoXCJwbGF5ZXItbmFtZVwiKS5UZXh0KHBsYXllck9iamVjdC5OYW1lKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPHNwYW4+XCIpLkFkZENsYXNzKFwiZ2x5cGhpY29uIGdseXBoaWNvbi1lZGl0IHB1bGwtcmlnaHQgcGxheWVyLWljb25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5PbihcImNsaWNrXCIsIG51bGwsIHBsYXllck9iamVjdC5JbmRleC5Ub1N0cmluZygpLCAoQWN0aW9uPGpRdWVyeUV2ZW50PilVaS5TaG93UmVuYW1lKSkpKVxyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGJvZHkgKHNjb3JlYm9hcmQpXHJcbiAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcInBhbmVsLWJvZHkgbG93LXBhZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5BcHBlbmQobmV3IGpRdWVyeShcIjx1bD5cIikuQWRkQ2xhc3MoXCJsaXN0LWdyb3VwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5BdHRyKERpY2VWaWV3LlBsYXllclNjb3JlQm9hcmRBdHRyaWJ1dGUsIHBsYXllck9iamVjdC5JbmRleCkpKVxyXG4gICAgICAgICAgICAgICAgLy8gVG90YWwgaW4gZm9vdGVyXHJcbiAgICAgICAgICAgICAgICAuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcInBhbmVsLWZvb3RlciBsb3ctcGFkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLkFwcGVuZChuZXcgalF1ZXJ5KFwiPGg1PlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuQWRkQ2xhc3MoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLkF0dHIoRGljZVZpZXcuUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUsIHBsYXllck9iamVjdC5JbmRleClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLlRleHQoXCJUb3RhbDogMFwiKSkpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgdG8gY29udGFpbmVyc1xyXG4gICAgICAgICAgICBwbGF5ZXJDb250YWluZXIuQXBwZW5kKHBsYXllclBhbmVsKTtcclxuICAgICAgICAgICAgcGxheWVyUm93LkFwcGVuZChwbGF5ZXJDb250YWluZXIpO1xyXG4gICAgICAgICAgICAvLyBGb3JjZSB3cmFwcGluZyBvbiBhIG5ldyBsaW5lXHJcbiAgICAgICAgICAgIC8vaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVMZykgPT0gMClcclxuICAgICAgICAgICAgLy97XHJcbiAgICAgICAgICAgIC8vICAgIHNjb3JlYm9hcmQuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcImNsZWFyZml4IHZpc2libGUtbGctYmxvY2tcIikpO1xyXG4gICAgICAgICAgICAvL31cclxuICAgICAgICAgICAgLy8gQnJlYWsgaW50byBsb2dpY2FsIHJvd3Mgb24gc21hbGwgZGV2aWNlc1xyXG4gICAgICAgICAgICBpZiAoKHBsYXllck9iamVjdC5JbmRleCArIDEpICUgKERpY2VWaWV3LlBsYXllclNsb3RzIC8gRGljZVZpZXcuTWluQ29sU2l6ZU1kKSA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXJSb3cuQXBwZW5kKG5ldyBqUXVlcnkoXCI8ZGl2PlwiKS5BZGRDbGFzcyhcImNsZWFyZml4IHZpc2libGUtbWQtYmxvY2tcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgocGxheWVyT2JqZWN0LkluZGV4ICsgMSkgJSAoRGljZVZpZXcuUGxheWVyU2xvdHMgLyBEaWNlVmlldy5NaW5Db2xTaXplU20pID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBsYXllclJvdy5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiY2xlYXJmaXggdmlzaWJsZS1zbS1ibG9ja1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKChwbGF5ZXJPYmplY3QuSW5kZXggKyAxKSAlIChEaWNlVmlldy5QbGF5ZXJTbG90cyAvIERpY2VWaWV3Lk1pbkNvbFNpemVYcykgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyUm93LkFwcGVuZChuZXcgalF1ZXJ5KFwiPGRpdj5cIikuQWRkQ2xhc3MoXCJjbGVhcmZpeCB2aXNpYmxlLXhzLWJsb2NrXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyB1cGRhdGUgY29sdW1ucyBjbGFzc2VzXHJcbiAgICAgICAgICAgIFVpLlNldENvbHVtbkNsYXNzKHBsYXllckNvdW50KTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgUmVtb3ZlUGxheWVyQ29udGFpbmVyKGludCBwbGF5ZXJJbmRleClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCJbXCIgKyBEaWNlVmlldy5QbGF5ZXJDb2x1bW5BdHRyaWJ1dGUgKyBcIj1cIiArIHBsYXllckluZGV4ICsgXCJdXCIpLlJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIFNldENvbHVtbkNsYXNzKGludCBwbGF5ZXJDb3VudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXJzID0galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllckNvbnRhaW5lcklkKS5GaW5kKFwiZGl2W1wiICsgRGljZVZpZXcuUGxheWVyQ29sdW1uQXR0cmlidXRlICsgXCJdXCIpO1xyXG4gICAgICAgICAgICB2YXIgcHJldmlvdXNYcyA9IE1hdGguTWF4KERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZVhzKTtcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzU20gPSBNYXRoLk1heChEaWNlVmlldy5QcmV2aW91c0NvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVTbSk7XHJcbiAgICAgICAgICAgIHZhciBwcmV2aW91c01kID0gTWF0aC5NYXgoRGljZVZpZXcuUHJldmlvdXNDb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplTWQpO1xyXG4gICAgICAgICAgICBpZiAoRGljZVZpZXcuUHJldmlvdXNDb2x1bW5TaXplID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGFpbmVycy5SZW1vdmVDbGFzcyhcImNvbC1sZy1cIiArIERpY2VWaWV3LlByZXZpb3VzQ29sdW1uU2l6ZSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC14cy1cIiArIHByZXZpb3VzWHMgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wtc20tXCIgKyBwcmV2aW91c1NtICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLW1kLVwiICsgcHJldmlvdXNNZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGNvbHVtblNpemUgPSAoaW50KU1hdGguTWF4KE1hdGguRmxvb3IoKGRlY2ltYWwpRGljZVZpZXcuUGxheWVyU2xvdHMgLyBwbGF5ZXJDb3VudCksIERpY2VWaWV3Lk1pbkNvbFNpemVMZyk7XHJcbiAgICAgICAgICAgIHZhciBjb2x1bW5TaXplWHMgPSBNYXRoLk1heChjb2x1bW5TaXplLCBEaWNlVmlldy5NaW5Db2xTaXplWHMpO1xyXG4gICAgICAgICAgICB2YXIgY29sdW1uU2l6ZVNtID0gTWF0aC5NYXgoY29sdW1uU2l6ZSwgRGljZVZpZXcuTWluQ29sU2l6ZVNtKTtcclxuICAgICAgICAgICAgdmFyIGNvbHVtblNpemVNZCA9IE1hdGguTWF4KGNvbHVtblNpemUsIERpY2VWaWV3Lk1pbkNvbFNpemVNZCk7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lcnMuQWRkQ2xhc3MoXCJjb2wtbGctXCIgKyBjb2x1bW5TaXplICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBjb2wteHMtXCIgKyBjb2x1bW5TaXplWHMgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvbC1zbS1cIiArIGNvbHVtblNpemVTbSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgY29sLW1kLVwiICsgY29sdW1uU2l6ZU1kKTtcclxuICAgICAgICAgICAgRGljZVZpZXcuUHJldmlvdXNDb2x1bW5TaXplID0gY29sdW1uU2l6ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBTZXRDdXJlbnRQbGF5ZXIoaW50IHBsYXllckluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcImRpdltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsQXR0cmlidXRlICsgXCJdXCIpXHJcbiAgICAgICAgICAgIC5SZW1vdmVDbGFzcyhcInBhbmVsLXByaW1hcnlcIilcclxuICAgICAgICAgICAgLkFkZENsYXNzKFwicGFuZWwtZGVmYXVsdFwiKTtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcImRpdltcIiArIERpY2VWaWV3LlBsYXllclBhbmVsQXR0cmlidXRlICsgXCI9XCIgKyBwbGF5ZXJJbmRleCArIFwiXVwiKVxyXG4gICAgICAgICAgICAuUmVtb3ZlQ2xhc3MoXCJwYW5lbC1kZWZhdWx0XCIpXHJcbiAgICAgICAgICAgIC5BZGRDbGFzcyhcInBhbmVsLXByaW1hcnlcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQWRkUG9pbnQoaW50IHBsYXllckluZGV4LCBpbnQgcm91bmROdW1iZXIsIGludCBwb2ludHMsIGludCB0b3RhbFBvaW50cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50UGFuZWwgPSBqUXVlcnkuU2VsZWN0KFwiZGl2W1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxBdHRyaWJ1dGUgKyBcIj1cIiArIHBsYXllckluZGV4ICsgXCJdXCIpO1xyXG4gICAgICAgICAgICB2YXIgc2Nyb2xsRWxlbWVudCA9IGN1cnJlbnRQYW5lbC5GaW5kKFwiLnBhbmVsLWJvZHlcIik7XHJcbiAgICAgICAgICAgIHZhciBuZXdJdGVtID0gbmV3IGpRdWVyeShcIjxsaT5cIikuQWRkQ2xhc3MoXCJsaXN0LWdyb3VwLWl0ZW0gbG93LXBhZFwiKVxyXG4gICAgICAgICAgICAgICAgLkF0dHIoRGljZVZpZXcuUGxheWVyUG9pbnRzUm91bmRBdHRyaWJ1dGUsIHJvdW5kTnVtYmVyKVxyXG4gICAgICAgICAgICAgICAgLlRleHQocG9pbnRzKTtcclxuICAgICAgICAgICAgY3VycmVudFBhbmVsLkZpbmQoXCJbXCIgKyBEaWNlVmlldy5QbGF5ZXJTY29yZUJvYXJkQXR0cmlidXRlICsgXCJdXCIpLkFwcGVuZChuZXdJdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHNjcm9sbCB0byBlbGVtZW50XHJcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuU2Nyb2xsVG9wKHNjcm9sbEVsZW1lbnQuU2Nyb2xsVG9wKCkgKyBuZXdJdGVtLlBvc2l0aW9uKCkuVG9wXHJcbiAgICAgICAgICAgICAgICAtIHNjcm9sbEVsZW1lbnQuSGVpZ2h0KCkgICsgbmV3SXRlbS5IZWlnaHQoKSApO1xyXG5cclxuICAgICAgICAgICAgY3VycmVudFBhbmVsLkZpbmQoXCJbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEZvb3RlckF0dHJpYnV0ZSArIFwiXVwiKS5UZXh0KFwiVG90YWw6IFwiICsgdG90YWxQb2ludHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIFJlbW92ZVBvaW50cyhpbnQgcGxheWVySW5kZXgsIGludCByb3VuZE51bWJlciwgaW50IHRvdGFsUG9pbnRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRQYW5lbCA9IGpRdWVyeS5TZWxlY3QoXCJkaXZbXCIgKyBEaWNlVmlldy5QbGF5ZXJQYW5lbEF0dHJpYnV0ZSArIFwiPVwiICsgcGxheWVySW5kZXggKyBcIl1cIik7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYW5lbC5GaW5kKFwiW1wiICsgRGljZVZpZXcuUGxheWVyUG9pbnRzUm91bmRBdHRyaWJ1dGUgKyBcIj1cIiArIHJvdW5kTnVtYmVyICsgXCJdXCIpXHJcbiAgICAgICAgICAgICAgICAuUmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYW5lbC5GaW5kKFwiW1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgKyBcIl1cIikuVGV4dChcIlRvdGFsOiBcIiArIHRvdGFsUG9pbnRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBSZXNldCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiW1wiICsgRGljZVZpZXcuUGxheWVyU2NvcmVCb2FyZEF0dHJpYnV0ZSArIFwiXVwiKS5IdG1sKFwiXCIpO1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiW1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxGb290ZXJBdHRyaWJ1dGUgKyBcIl1cIikuVGV4dChcIlRvdGFsOiAwXCIpO1xyXG4gICAgICAgICAgICBVaS5TZXRDdXJlbnRQbGF5ZXIoMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQWNjdW11bGF0ZShpbnQgcG9pbnRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFjY3VtdWxhdG9yID0galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBvaW50c0FjY3VtdWxhdG9ySWQpO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFZhbHVlID0gVWkuR2V0QWNjdW11bGF0ZWQoYWNjdW11bGF0b3IpO1xyXG4gICAgICAgICAgICBhY2N1bXVsYXRvci5WYWwoKGN1cnJlbnRWYWx1ZSArIHBvaW50cykuVG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIGludCBHZXRBY2N1bXVsYXRlZChvYmplY3Qgc2VsZWN0b3IgPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciA/PyBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGxheWVyUG9pbnRzQWNjdW11bGF0b3JJZCk7XHJcbiAgICAgICAgICAgIGludCB2YWx1ZTtcclxuICAgICAgICAgICAgaWYgKCFpbnQuVHJ5UGFyc2UoKChqUXVlcnkpc2VsZWN0b3IpLlZhbCgpLCBvdXQgdmFsdWUpKSB7IHZhbHVlID0gMDsgfVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIG9iamVjdCBTZXRBY2N1bXVsYXRlZChpbnQgdmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4galF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBsYXllclBvaW50c0FjY3VtdWxhdG9ySWQpLlZhbCh2YWx1ZS5Ub1N0cmluZygpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBBZGRBbGVydChzdHJpbmcgbWVzc2FnZSwgc3RyaW5nIHNldmVyaXR5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gRGljZVZpZXcuQWxlcnRDb3VudCsrO1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiYm9keVwiKS5BcHBlbmQobmV3IGpRdWVyeShcIjxkaXY+XCIpLkFkZENsYXNzKFwiYWxlcnQgZmFkZSBpbiBhbGVydC1maXhlZC10b3AgYWxlcnQtZGlzbWlzc2libGUgXCIgKyBzZXZlcml0eSlcclxuICAgICAgICAgICAgICAgIC5BdHRyKFwiaWRcIiwgRGljZVZpZXcuQWxlcnRCYXNlSWQgKyBjb3VudClcclxuICAgICAgICAgICAgICAgIC5UZXh0KG1lc3NhZ2UpKTtcclxuICAgICAgICAgICAgLy9BdXRvIENsb3NlXHJcblxyXG4gICAgICAgICAgICBXaW5kb3cuU2V0VGltZW91dCgoQWN0aW9uKSgoKSA9PiB7IGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5BbGVydEJhc2VJZCArIGNvdW50KS5BbGVydChcImNsb3NlXCIpOyB9KSwgRGljZVZpZXcuQWxlcnREZWxheSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIEdhbWVTZXR0aW5ncyBHZXRQYXJhbXMoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW50IHRhcmdldCwgc3RhcnR1cCwgY3VtdWw7XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QYXJhbVRhcmdldElkKS5WYWwoKSwgb3V0IHRhcmdldCkpIHsgdGFyZ2V0ID0gMjAwMDA7IH1cclxuICAgICAgICAgICAgaWYgKCFpbnQuVHJ5UGFyc2UoalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlBhcmFtU3RhcnR1cElkKS5WYWwoKSwgb3V0IHN0YXJ0dXApKSB7IHN0YXJ0dXAgPSA1MDAwOyB9XHJcbiAgICAgICAgICAgIGlmICghaW50LlRyeVBhcnNlKGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5QYXJhbWN1bXVsSWQpLlZhbCgpLCBvdXQgY3VtdWwpKSB7IGN1bXVsID0gNTAwOyB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgR2FtZVNldHRpbmdzXHJcbiAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICBUYXJnZXQgPSB0YXJnZXQsXHJcbiAgICAgICAgICAgICAgICBTdGFydHVwID0gc3RhcnR1cCxcclxuICAgICAgICAgICAgICAgIEN1bXVsID0gY3VtdWxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBDbGVhclBsYXllckNvbnRhaW5lcigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGxheWVyQ29udGFpbmVySWQpLkh0bWwoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgQWRkU3RhcihpbnQgcGxheWVySW5kZXgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxUaXRsZUJhc2VJZCArIHBsYXllckluZGV4KS5BcHBlbmQobmV3IGpRdWVyeShcIjxzcGFuPlwiKS5BZGRDbGFzcyhcImdseXBoaWNvbiBnbHlwaGljb24tc3RhciBwdWxsLXJpZ2h0IHBsYXllci1pY29uXCIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdm9pZCBTaG93UmVuYW1lKG9iamVjdCB0aGVFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBqUXVlcnlFdmVudCA9IHRoZUV2ZW50IGFzIGpRdWVyeUV2ZW50O1xyXG4gICAgICAgICAgICBpZiAoalF1ZXJ5RXZlbnQgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgLy8gU2V0IGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgICAgICAgIERpY2VWaWV3LlJlbmFtZUN1cnJlbnRQbGF5ZXIgPSBEaWNlLk1hbmFnZXIuSW5zdGFuY2UuR2V0UGxheWVyYnlJbmRleChpbnQuUGFyc2UoalF1ZXJ5RXZlbnQuRGF0YS5Ub1N0cmluZygpKSk7XHJcbiAgICAgICAgICAgIC8vIEluaXQgdGhlIHJlbmFtZSBpbnB1dCB0byB0aGUgY3VycmVudCBuYW1lXHJcbiAgICAgICAgICAgIGpRdWVyeS5TZWxlY3QoXCIjXCIgKyBEaWNlVmlldy5SZW5hbWVJbnB1dElkKS5WYWwoRGljZVZpZXcuUmVuYW1lQ3VycmVudFBsYXllci5OYW1lKTtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlJlbmFtZUlkKS5Nb2RhbChcInNob3dcIik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHN0YXRpYyB2b2lkIFNpZGVSZW5hbWUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgalF1ZXJ5LlNlbGVjdChcIiNcIiArIERpY2VWaWV3LlJlbmFtZUlkKS5Nb2RhbChcImhpZGVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc3RhdGljIHZvaWQgUmVuYW1lKHN0cmluZyBuZXdOYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3TmFtZSA9IHN0cmluZy5Jc051bGxPcldoaXRlU3BhY2UobmV3TmFtZSkgPyBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUmVuYW1lSW5wdXRJZCkuVmFsKCkgOiBuZXdOYW1lO1xyXG4gICAgICAgICAgICBEaWNlVmlldy5SZW5hbWVDdXJyZW50UGxheWVyLk5hbWUgPSBuZXdOYW1lO1xyXG4gICAgICAgICAgICBqUXVlcnkuU2VsZWN0KFwiI1wiICsgRGljZVZpZXcuUGxheWVyUGFuZWxUaXRsZUJhc2VJZCArIERpY2VWaWV3LlJlbmFtZUN1cnJlbnRQbGF5ZXIuSW5kZXggKyBcIiAucGxheWVyLW5hbWVcIikuVGV4dChuZXdOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl0KfQo=
