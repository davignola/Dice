using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Bridge.Bootstrap3;
using Bridge.Html5;
using Bridge.jQuery2;
using Dice.Component;

namespace Dice
{

    public static class Ui
    {
        public static class DiceView
        {
            public const int PlayerSlots = 12;
            public const string PlayerContainerId = "dice-scoreboard";
            public const string PlayerColumnAttribute = "data-player-container";
            public const string PlayerPanelAttribute = "data-player-panel";
            public const string PlayerPanelTitleBaseId = "dice-player-name-";
            public const string PlayerPanelFooterAttribute = "dice-player-total";
            public const string PlayerScoreBoardAttribute = "dice-player-scoreboard";
            public const string PlayerPointsRoundAttribute = "dice-score-round";
            public const string PlayerPointsAccumulatorId = "dice-point-accumulator";
            public const string AlertBaseId = "dice-alert-";
            public const string ParamTargetId = "dice-param-target";
            public const string ParamStartupId = "dice-param-startup";
            public const string ParamcumulId = "dice-param-cumul";
            public const string ParamCollapsibleId = "dice-params";
            public static int AlertCount = 0;
            public const int AlertDelay = 3000;
            public static int PreviousColumnSize = 0;
            public const int MinColSizeXs = 4;
            public const int MinColSizeSm = 3;
            public const int MinColSizeMd = 3;
            public const int MinColSizeLg = 2;
            public const string RenameId = "dice-rename";
            public const string RenameInputId = "dice-rename-input";
            public static Player RenameCurrentPlayer = null;
        }

        public static class AlertSeverity
        {
            public const string success = "alert-success";
            public const string warning = "alert-warning";
            public const string info = "alert-info";
            public const string danger = "alert-danger";
        };

        /// <summary>
        /// Add the ui column player container
        /// </summary>
        /// <param name="playerObject"></param>
        public static void AddPlayerContainer(Player playerObject)
        {
            // Get main container
            var scoreboard = jQuery.Select("#" + DiceView.PlayerContainerId);
            // This is the column
            var playerContainer = new jQuery("<div>");
            playerContainer.Attr(DiceView.PlayerColumnAttribute, playerObject.Index);
            // Panel with title and scoreboard
            var playerPanel = new jQuery("<div>");
            playerPanel
                .AddClass("panel panel-default")
                .Attr(DiceView.PlayerPanelAttribute, playerObject.Index)
                .Append(new jQuery("<div>").AddClass("panel-heading")
                    // Adding title
                    .Append(new jQuery("<h3>").AddClass("panel-title")
                        .Attr("id", DiceView.PlayerPanelTitleBaseId + playerObject.Index)
                        .Text(playerObject.Name)
                        .On("dblclick", playerObject.Index.ToString(), (Action<jQueryEvent>)Ui.ShowRename)))
                // Adding body (scoreboard)
                .Append(new jQuery("<div>").AddClass("panel-body low-pad")
                    .Append(new jQuery("<ul>").AddClass("list-group")
                        .Attr(DiceView.PlayerScoreBoardAttribute, playerObject.Index)))
                // Total in footer
                .Append(new jQuery("<div>").AddClass("panel-footer")
                    .Append(new jQuery("<h5>")
                        .AddClass("")
                        .Attr(DiceView.PlayerPanelFooterAttribute, playerObject.Index)
                        .Text("Total: 0")));
            // Adding to containers
            playerContainer.Append(playerPanel);
            scoreboard.Append(playerContainer);
            // Force wrapping on a new line
            if ((playerObject.Index + 1) % (DiceView.PlayerSlots / DiceView.MinColSizeLg) == 0)
            {
                scoreboard.Append(new jQuery("<div>").AddClass("clearfix visible-lg-block"));
            }
            if ((playerObject.Index + 1) % (DiceView.PlayerSlots / DiceView.MinColSizeMd) == 0)
            {
                scoreboard.Append(new jQuery("<div>").AddClass("clearfix visible-md-block"));
            }
            if ((playerObject.Index + 1) % (DiceView.PlayerSlots / DiceView.MinColSizeSm) == 0)
            {
                scoreboard.Append(new jQuery("<div>").AddClass("clearfix visible-sm-block"));
            }
            if ((playerObject.Index + 1) % (DiceView.PlayerSlots / DiceView.MinColSizeXs) == 0)
            {
                scoreboard.Append(new jQuery("<div>").AddClass("clearfix visible-xs-block"));
            }
            // update columns classes
            Ui.SetColumnClass();
        }


        public static void RemovePlayerContainer(int playerIndex)
        {
            jQuery.Select("[" + DiceView.PlayerColumnAttribute + "=" + playerIndex + "]").Remove();
        }

        public static void SetColumnClass()
        {
            var playerCount = Manager.Instance.Players.Count;
            var containers = jQuery.Select("#" + DiceView.PlayerContainerId).Find("div[" + DiceView.PlayerColumnAttribute + "]");
            var previousXs = Math.Max(DiceView.PreviousColumnSize, DiceView.MinColSizeXs);
            var previousSm = Math.Max(DiceView.PreviousColumnSize, DiceView.MinColSizeSm);
            var previousMd = Math.Max(DiceView.PreviousColumnSize, DiceView.MinColSizeMd);
            if (DiceView.PreviousColumnSize > 0)
            {
                containers.RemoveClass("col-lg-" + DiceView.PreviousColumnSize +
                                       " col-xs-" + previousXs +
                                       " col-sm-" + previousSm +
                                       " col-md-" + previousMd);
            }
            var columnSize = (int)Math.Max(Math.Floor((decimal)DiceView.PlayerSlots / playerCount), DiceView.MinColSizeLg);
            var columnSizeXs = Math.Max(columnSize, DiceView.MinColSizeXs);
            var columnSizeSm = Math.Max(columnSize, DiceView.MinColSizeSm);
            var columnSizeMd = Math.Max(columnSize, DiceView.MinColSizeMd);
            containers.AddClass("col-lg-" + columnSize +
                                " col-xs-" + columnSizeXs +
                                " col-sm-" + columnSizeSm +
                                " col-md-" + columnSizeMd);
            DiceView.PreviousColumnSize = columnSize;
        }

        public static void SetCurentPlayer(int playerIndex)
        {
            jQuery.Select("div[" + DiceView.PlayerPanelAttribute + "]")
            .RemoveClass("panel-primary")
            .AddClass("panel-default");
            jQuery.Select("div[" + DiceView.PlayerPanelAttribute + "=" + playerIndex + "]")
            .RemoveClass("panel-default")
            .AddClass("panel-primary");
        }

        public static void AddPoint(int playerIndex, int roundNumber, int points, int totalPoints)
        {
            var currentPanel = jQuery.Select("div[" + DiceView.PlayerPanelAttribute + "=" + playerIndex + "]");
            currentPanel.Find("[" + DiceView.PlayerScoreBoardAttribute + "]")
                .Append(new jQuery("<li>").AddClass("list-group-item low-pad")
                    .Attr(DiceView.PlayerPointsRoundAttribute, roundNumber)
                    .Text(points));
            currentPanel.Find("[" + DiceView.PlayerPanelFooterAttribute + "]").Text("Total: " + totalPoints);
        }

        public static void RemovePoints(int playerIndex, int roundNumber, int totalPoints)
        {
            var currentPanel = jQuery.Select("div[" + DiceView.PlayerPanelAttribute + "=" + playerIndex + "]");
            currentPanel.Find("[" + DiceView.PlayerPointsRoundAttribute + "=" + roundNumber + "]")
                .Remove();
            currentPanel.Find("[" + DiceView.PlayerPanelFooterAttribute + "]").Text("Total: " + totalPoints);
        }

        public static void Reset()
        {
            jQuery.Select("[" + DiceView.PlayerScoreBoardAttribute + "]").Html("");
            jQuery.Select("[" + DiceView.PlayerPanelFooterAttribute + "]").Text("Total: 0");
            Ui.SetCurentPlayer(0);
        }

        public static void Accumulate(int points)
        {
            var accumulator = jQuery.Select("#" + DiceView.PlayerPointsAccumulatorId);
            var currentValue = Ui.GetAccumulated(accumulator);
            accumulator.Val((currentValue + points).ToString());
        }

        public static int GetAccumulated(object selector = null)
        {
            selector = selector ?? jQuery.Select("#" + DiceView.PlayerPointsAccumulatorId);
            int value;
            if (!int.TryParse(((jQuery)selector).Val(), out value)) { value = 0; }
            return value;
        }

        public static object SetAccumulated(int value)
        {
            return jQuery.Select("#" + DiceView.PlayerPointsAccumulatorId).Val(value.ToString());
        }

        public static void AddAlert(string message, string severity)
        {
            var count = DiceView.AlertCount++;
            jQuery.Select("body").Append(new jQuery("<div>").AddClass("alert fade in alert-fixed-top alert-dismissible " + severity)
                .Attr("id", DiceView.AlertBaseId + count)
                .Text(message));
            //Auto Close

            Window.SetTimeout(() => { jQuery.Select("#" + DiceView.AlertBaseId + count).Alert("close"); }, DiceView.AlertDelay);
        }

        public static GameSettings GetParams()
        {
            int target, startup, cumul;
            if (!int.TryParse(jQuery.Select("#" + DiceView.ParamTargetId).Val(), out target)) { target = 20000; }
            if (!int.TryParse(jQuery.Select("#" + DiceView.ParamStartupId).Val(), out startup)) { startup = 5000; }
            if (!int.TryParse(jQuery.Select("#" + DiceView.ParamcumulId).Val(), out cumul)) { cumul = 500; }
            return new GameSettings
            {

                Target = target,
                Startup = startup,
                Cumul = cumul
            };
        }

        public static void ClearPlayerContainer()
        {
            jQuery.Select("#" + DiceView.PlayerContainerId).Html("");
        }

        public static void AddStar(int playerIndex)
        {
            jQuery.Select("#" + DiceView.PlayerPanelTitleBaseId + playerIndex).Append(new jQuery("<span>").AddClass("glyphicon glyphicon-star pull-right"));
        }

        public static void ShowRename(object theEvent)
        {
            // Set current object
            DiceView.RenameCurrentPlayer = Manager.Instance.GetPlayerbyIndex((int)((jQueryEvent)theEvent).Data);
            // Init the rename input to the current name
            jQuery.Select("#" + DiceView.RenameInputId).Val(DiceView.RenameCurrentPlayer.Name);
            jQuery.Select("#" + DiceView.RenameId).Modal("show");

        }

        public static void SideRename()
        {
            jQuery.Select("#" + DiceView.RenameId).Modal("hide");
        }

        public static void Rename(string newName)
        {
            newName = string.IsNullOrWhiteSpace(newName) ? jQuery.Select("#" + DiceView.RenameInputId).Val() : newName;
            DiceView.RenameCurrentPlayer.Name = newName;
            jQuery.Select("#" + DiceView.PlayerPanelTitleBaseId + DiceView.RenameCurrentPlayer.Index).Text(newName);
        }
    }
}
