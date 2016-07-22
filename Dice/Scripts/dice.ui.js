// Main
if (!dice) {
    var dice = {};
}
dice.ui = new function () {
    var self = this;

    var diceView = {
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
        alertCount: 0,
        alertDelay: 3000,
        previousColumnSize: 0,
        minColSizeXs: 4,
        minColSizeSm: 3,
        minColSizeMd: 3,
        minColSizeLg: 2
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
        var scoreboard = $("#" + diceView.playerContainerId);
        // This is the column
        var playerContainer = $("<div>");
        playerContainer.attr(diceView.playerColumnAttribute, playerObject.index);
        // Panel with title and scoreboard
        var playerPanel = $("<div>");
        playerPanel
            .addClass("panel panel-default")
            .attr(diceView.playerPanelAttribute, playerObject.index)
            .append($("<div>").addClass("panel-heading")
                // Adding title
                .append($("<h3>").addClass("panel-title")
                    .attr("id", diceView.playerPanelTitleBaseId + playerObject.index)
                    .text(playerObject.name)))
            // Adding body (scoreboard)
            .append($("<div>").addClass("panel-body low-pad")
                .append($("<ul>").addClass("list-group")
                    .attr(diceView.playerScoreBoardAttribute, playerObject.index)))
            // Total in footer
            .append($("<div>").addClass("panel-footer")
                .append($("<h5>")
                    .addClass("")
                    .attr(diceView.playerPanelFooterAttribute, playerObject.index)
                    .text("Total: 0")));
        // Adding to containers
        playerContainer.append(playerPanel);
        scoreboard.append(playerContainer);
        // update columns classes
        self.setColumnClass();
    };

    this.setColumnClass = function () {
        var playerCount = dice.manager.players.length;
        var containers = $("#" + diceView.playerContainerId).find("div[" + diceView.playerColumnAttribute + "]");
        var previousXs = Math.max(diceView.previousColumnSize, diceView.minColSizeXs);
        var previousSm = Math.max(diceView.previousColumnSize, diceView.minColSizeSm);
        var previousMd = Math.max(diceView.previousColumnSize, diceView.minColSizeMd);
        if (diceView.previousColumnSize > 0) {
            containers.removeClass("col-lg-" + diceView.previousColumnSize +
                                   " col-xs-" + previousXs +
                                   " col-sm-" + previousSm +
                                   " col-md-" + previousMd);
        }
        var columnSize = Math.max(Math.floor(diceView.playerSlots / playerCount), diceView.minColSizeLg);
        var columnSizeXs = Math.max(columnSize, diceView.minColSizeXs);
        var columnSizeSm = Math.max(columnSize, diceView.minColSizeSm);
        var columnSizeMd = Math.max(columnSize, diceView.minColSizeMd);
        containers.addClass("col-lg-" + columnSize +
                            " col-xs-" + columnSizeXs +
                            " col-sm-" + columnSizeSm +
                            " col-md-" + columnSizeMd);
        diceView.previousColumnSize = columnSize;
    };

    this.setCurentPlayer = function (playerIndex) {
        $("div[" + diceView.playerPanelAttribute + "]")
            .removeClass("panel-primary")
            .addClass("panel-default");
        $("div[" + diceView.playerPanelAttribute + "=" + playerIndex + "]")
            .removeClass("panel-default")
            .addClass("panel-primary");
    };

    this.addPoint = function (playerIndex, roundNumber, points, totalPoints) {
        var currentPanel = $("div[" + diceView.playerPanelAttribute + "=" + playerIndex + "]");
        currentPanel.find("[" + diceView.playerScoreBoardAttribute + "]")
            .append($("<li>").addClass("list-group-item low-pad")
                .attr(diceView.playerPointsRoundAttribute, roundNumber)
                .text(points));
        currentPanel.find("[" + diceView.playerPanelFooterAttribute + "]").text("Total: " + totalPoints);
    };

    this.removePoints = function (playerIndex, roundNumber, totalPoints) {
        var currentPanel = $("div[" + diceView.playerPanelAttribute + "=" + playerIndex + "]");
        currentPanel.find("[" + diceView.playerPointsRoundAttribute + "=" + roundNumber + "]")
            .remove();
        currentPanel.find("[" + diceView.playerPanelFooterAttribute + "]").text("Total: " + totalPoints);
    };

    this.reset = function () {
        $("[" + diceView.playerScoreBoardAttribute + "]").html("");
        $("[" + diceView.playerPanelFooterAttribute + "]").text("Total: 0");
        self.setCurentPlayer(0);
    };

    this.accumulate = function (points) {
        var accumulator = $("#" + diceView.playerPointsAccumulatorId);
        var currentValue = self.getAccumulated(accumulator);
        accumulator.val(currentValue + points);
    };

    this.getAccumulated = function (selector) {
        var accumulator = selector || $("#" + diceView.playerPointsAccumulatorId);
        return Number(accumulator.val()) || 0;
    };
    this.setAccumulated = function (value) {
        return $("#" + diceView.playerPointsAccumulatorId).val(value || 0);
    };

    this.addAlert = function (message, severity) {
        var count = diceView.alertCount++;
        $("body").append($("<div>").addClass("alert fade in alert-fixed-top alert-dismissible " + severity)
            .attr("id", diceView.alertBaseId + count)
            .text(message)
            /*.append($("<a>").attr("href", "#")
                            .attr("data-dismiss", "alert")
                            .attr("aria-label", "close")
                            .addClass("close")
                            .html("&times;"))*/);
        //Auto Close
        setTimeout(function () { $("#" + diceView.alertBaseId + count).alert("close"); }, diceView.alertDelay);
    };

    this.getParams = function () {
        return {
            target: Number($("#" + diceView.paramTargetId).val()) || 20000,
            startup: Number($("#" + diceView.paramStartupId).val()) || 500,
            cumul: Number($("#" + diceView.paramcumulId).val()) || 5000
        };
    }

    this.clearPlayerContainer = function () {
        $("#" + diceView.playerContainerId).html("");
    };

};