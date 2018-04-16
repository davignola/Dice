// Main
if (!dice) {
    var dice = {};
}
dice.ui = new function () {
    var self = this;

    this.diceView = {
        playerSlots: 12,
        playerContainerId: "dice-scoreboard",
        playerColumnAttribute: "data-player-container",
        playerPanelAttribute: "data-player-panel",
        playerPanelTitleBaseId: "dice-player-name-",
        playerPanelFooterAttribute: "dice-player-total",
        playerScoreBoardAttribute: "dice-player-scoreboard",
        playerPointsRoundAttribute: "dice-score-round",
        playerPointsAccumulatorId: "dice-point-accumulator",
        alertBaseId: "dice-alert-",
        paramTargetId: "dice-param-target",
        paramStartupId: "dice-param-startup",
        paramcumulId: "dice-param-cumul",
        paramCollapsibleId: "dice-params",
        alertCount: 0,
        alertDelay: 3000,
        previousColumnSize: 0,
        minColSizeXs: 4,
        minColSizeSm: 3,
        minColSizeMd: 3,
        minColSizeLg: 2,
        renameId: "dice-rename",
        renameInputId: "dice-rename-input",
        renameCurrentObject: null
    };

    this.alertSeverity = {
        success: "alert-success",
        warning: "alert-warning",
        info: "alert-info",
        danger: "alert-danger"
    };

    this.addPlayerContainer = function (playerObject) {
        /// <summary>Add the ui column player container</summary>
        /// <param name="playerObject" type="dice.components.Player"></param>
        // Get main container
        var scoreboard = $("#" + self.diceView.playerContainerId);
        // This is the column
        var playerContainer = $("<div>");
        playerContainer.attr(self.diceView.playerColumnAttribute, playerObject.index);
        // Panel with title and scoreboard
        var playerPanel = $("<div>");
        playerPanel
            .addClass("panel panel-default")
            .attr(self.diceView.playerPanelAttribute, playerObject.index)
            .append($("<div>").addClass("panel-heading")
                // Adding title
                .append($("<h3>").addClass("panel-title")
                    .attr("id", self.diceView.playerPanelTitleBaseId + playerObject.index)
                    .text(playerObject.name)
                    .on("dblclick", null, playerObject, self.showRename)))
            // Adding body (scoreboard)
            .append($("<div>").addClass("panel-body low-pad")
                .append($("<ul>").addClass("list-group")
                    .attr(self.diceView.playerScoreBoardAttribute, playerObject.index)))
            // Total in footer
            .append($("<div>").addClass("panel-footer")
                .append($("<h5>")
                    .addClass("")
                    .attr(self.diceView.playerPanelFooterAttribute, playerObject.index)
                    .text("Total: 0")));
        // Adding to containers
        playerContainer.append(playerPanel);
        scoreboard.append(playerContainer);
        // Force wrapping on a new line
        if ((playerObject.index + 1) % (self.diceView.playerSlots / self.diceView.minColSizeLg) === 0) {
            scoreboard.append($("<div>").addClass("clearfix visible-lg-block"));
        }
        if ((playerObject.index + 1) % (self.diceView.playerSlots / self.diceView.minColSizeMd) === 0) {
            scoreboard.append($("<div>").addClass("clearfix visible-md-block"));
        }
        if ((playerObject.index + 1) % (self.diceView.playerSlots / self.diceView.minColSizeSm) === 0) {
            scoreboard.append($("<div>").addClass("clearfix visible-sm-block"));
        }
        if ((playerObject.index + 1) % (self.diceView.playerSlots / self.diceView.minColSizeXs) === 0) {
            scoreboard.append($("<div>").addClass("clearfix visible-xs-block"));
        }
        // update columns classes
        self.setColumnClass();
    };

    this.removePlayerContainer = function (playerIndex) {
        $("[" + self.diceView.playerColumnAttribute + "=" + playerIndex + "]").remove();
    }

    this.setColumnClass = function () {
        var playerCount = dice.manager.players.length;
        var containers = $("#" + self.diceView.playerContainerId).find("div[" + self.diceView.playerColumnAttribute + "]");
        var previousXs = Math.max(self.diceView.previousColumnSize, self.diceView.minColSizeXs);
        var previousSm = Math.max(self.diceView.previousColumnSize, self.diceView.minColSizeSm);
        var previousMd = Math.max(self.diceView.previousColumnSize, self.diceView.minColSizeMd);
        if (self.diceView.previousColumnSize > 0) {
            containers.removeClass("col-lg-" + self.diceView.previousColumnSize +
                " col-xs-" + previousXs +
                " col-sm-" + previousSm +
                " col-md-" + previousMd);
        }
        var columnSize = Math.max(Math.floor(self.diceView.playerSlots / playerCount), self.diceView.minColSizeLg);
        var columnSizeXs = Math.max(columnSize, self.diceView.minColSizeXs);
        var columnSizeSm = Math.max(columnSize, self.diceView.minColSizeSm);
        var columnSizeMd = Math.max(columnSize, self.diceView.minColSizeMd);
        containers.addClass("col-lg-" + columnSize +
            " col-xs-" + columnSizeXs +
            " col-sm-" + columnSizeSm +
            " col-md-" + columnSizeMd);
        self.diceView.previousColumnSize = columnSize;
    };

    this.setCurentPlayer = function (playerIndex) {
        $("div[" + self.diceView.playerPanelAttribute + "]")
            .removeClass("panel-primary")
            .addClass("panel-default");
        $("div[" + self.diceView.playerPanelAttribute + "=" + playerIndex + "]")
            .removeClass("panel-default")
            .addClass("panel-primary");
    };

    this.addPoint = function (playerIndex, roundNumber, points, totalPoints) {
        var currentPanel = $("div[" + self.diceView.playerPanelAttribute + "=" + playerIndex + "]");
        currentPanel.find("[" + self.diceView.playerScoreBoardAttribute + "]")
            .append($("<li>").addClass("list-group-item low-pad")
                .attr(self.diceView.playerPointsRoundAttribute, roundNumber)
                .text(points));
        currentPanel.find("[" + self.diceView.playerPanelFooterAttribute + "]").text("Total: " + totalPoints);
    };

    this.removePoints = function (playerIndex, roundNumber, totalPoints) {
        var currentPanel = $("div[" + self.diceView.playerPanelAttribute + "=" + playerIndex + "]");
        currentPanel.find("[" + self.diceView.playerPointsRoundAttribute + "=" + roundNumber + "]")
            .remove();
        currentPanel.find("[" + self.diceView.playerPanelFooterAttribute + "]").text("Total: " + totalPoints);
    };

    this.reset = function () {
        $("[" + self.diceView.playerScoreBoardAttribute + "]").html("");
        $("[" + self.diceView.playerPanelFooterAttribute + "]").text("Total: 0");
        self.setCurentPlayer(0);
    };

    this.accumulate = function (points) {
        var accumulator = $("#" + self.diceView.playerPointsAccumulatorId);
        var currentValue = self.getAccumulated(accumulator);
        accumulator.val(currentValue + points);
    };

    this.getAccumulated = function (selector) {
        var accumulator = selector || $("#" + self.diceView.playerPointsAccumulatorId);
        return Number(accumulator.val()) || 0;
    };

    this.setAccumulated = function (value) {
        return $("#" + self.diceView.playerPointsAccumulatorId).val(value || 0);
    };

    this.addAlert = function (message, severity) {
        var count = self.diceView.alertCount++;
        $("body").append($("<div>").addClass("alert fade in alert-fixed-top alert-dismissible " + severity)
            .attr("id", self.diceView.alertBaseId + count)
            .text(message)
            /*.append($("<a>").attr("href", "#")
                            .attr("data-dismiss", "alert")
                            .attr("aria-label", "close")
                            .addClass("close")
                            .html("&times;"))*/);
        //Auto Close
        setTimeout(function () { $("#" + self.diceView.alertBaseId + count).alert("close"); }, self.diceView.alertDelay);
    };

    this.getParams = function () {
        return {
            target: Number($("#" + self.diceView.paramTargetId).val()) || 20000,
            startup: Number($("#" + self.diceView.paramStartupId).val()) || 500,
            cumul: Number($("#" + self.diceView.paramcumulId).val()) || 5000
        };
    };

    this.clearPlayerContainer = function () {
        $("#" + self.diceView.playerContainerId).html("");
    };

    this.addStar = function (playerIndex) {
        $("#" + self.diceView.playerPanelTitleBaseId + playerIndex).append($("<span>").addClass("glyphicon glyphicon-star pull-right"));
    };

    this.showRename = function (event) {
        // Set current object
        self.diceView.renameCurrentObject = event.data;
        // Init the rename input to the current name
        $("#" + self.diceView.renameInputId).val(self.diceView.renameCurrentObject.name);
        $("#" + self.diceView.renameId).modal("show");

    };

    this.hideRename = function () {
        $("#" + self.diceView.renameId).modal("hide");
    }

    this.rename = function (newName) {
        newName = newName || $("#" + self.diceView.renameInputId).val();
        self.diceView.renameCurrentObject.name = newName;
        $("#" + self.diceView.playerPanelTitleBaseId + self.diceView.renameCurrentObject.index).text(newName);
    };
};