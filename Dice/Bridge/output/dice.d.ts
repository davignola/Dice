/// <reference path="./bridge.d.ts" />/// <reference path="./dice.component.d.ts" />

declare module Dice {
    export interface Manager {
        players: System.Collections.Generic.List$1<Dice.Component.Player>;
        currentPlayer: Dice.Component.Player;
        settings: Dice.Component.GameSettings;
        lastRoundPlayerIndex: number;
        roundCount: number;
        lastPoints: number;
        addPlayer(name: string): void;
        getMaxIndex(): number;
        nextPlayer(): void;
        getNextIndex(): number;
        getPreviousIndex(): number;
        accumulateLast(): void;
        nextPlayerAccumulateLast(): void;
        cancelLastMove(): void;
        reset(): void;
        newGame(): void;
        removePlayer(playerIndex: number): void;
        getPlayerbyIndex(playerIndex: number): Dice.Component.Player;
        saveGame(): void;
        loadGame(): void;
    }
    export interface ManagerFunc extends Function {
        prototype: Manager;
        Nested: Manager.NestedFunc;
        getInstance(): Dice.Manager;
    }
    var Manager: ManagerFunc;
    module Manager {
        export interface Nested {
        }
        export interface NestedFunc extends Function {
            prototype: Nested;
            new (): Nested;
        }
    }

    export interface Ui {
    }
    export interface UiFunc extends Function {
        prototype: Ui;
        AlertSeverity: Ui.AlertSeverityFunc;
        DiceView: Ui.DiceViewFunc;
        new (): Ui;
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
        addPlayerContainer(playerObject: Dice.Component.Player): void;
        removePlayerContainer(playerIndex: number): void;
        setColumnClass(): void;
        setCurentPlayer(playerIndex: number): void;
        addPoint(playerIndex: number, roundNumber: number, points: number, totalPoints: number): void;
        removePoints(playerIndex: number, roundNumber: number, totalPoints: number): void;
        reset(): void;
        accumulate(points: number): void;
        getAccumulated(selector?: Object): number;
        setAccumulated(value: number): Object;
        addAlert(message: string, severity: string): void;
        getParams(): Dice.Component.GameSettings;
        clearPlayerContainer(): void;
        addStar(playerIndex: number): void;
        showRename(theEvent: Object): void;
        sideRename(): void;
        rename(newName: string): void;
    }
    var Ui: UiFunc;
    module Ui {
        export interface AlertSeverity {
        }
        export interface AlertSeverityFunc extends Function {
            prototype: AlertSeverity;
            new (): AlertSeverity;
            success: string;
            warning: string;
            info: string;
            danger: string;
        }

        export interface DiceView {
        }
        export interface DiceViewFunc extends Function {
            prototype: DiceView;
            new (): DiceView;
            PlayerSlots: number;
            PlayerContainerId: string;
            PlayerColumnAttribute: string;
            PlayerPanelAttribute: string;
            PlayerPanelTitleBaseId: string;
            PlayerPanelFooterAttribute: string;
            PlayerScoreBoardAttribute: string;
            PlayerPointsRoundAttribute: string;
            PlayerPointsAccumulatorId: string;
            AlertBaseId: string;
            ParamTargetId: string;
            ParamStartupId: string;
            ParamcumulId: string;
            ParamCollapsibleId: string;
            alertCount: number;
            AlertDelay: number;
            previousColumnSize: number;
            MinColSizeXs: number;
            MinColSizeSm: number;
            MinColSizeMd: number;
            MinColSizeLg: number;
            RenameId: string;
            RenameInputId: string;
            renameCurrentPlayer: Dice.Component.Player;
        }
    }

}
