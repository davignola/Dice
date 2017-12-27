/// <reference path="./bridge.d.ts" />

declare module Dice.Component {
    export interface GameSettings {
        target: number;
        startup: number;
        cumul: number;
        getHashCode(): Dice.Component.GameSettings;
        equals(o: Dice.Component.GameSettings): Boolean;
        $clone(to: Dice.Component.GameSettings): Dice.Component.GameSettings;
    }
    export interface GameSettingsFunc extends Function {
        prototype: GameSettings;
        new (): GameSettings;
    }
    var GameSettings: GameSettingsFunc;

    /** @namespace Dice.Component */

    /**
     * Player class
     *
     * @public
     * @class Dice.Component.Player
     */
    export interface Player {
        name: string;
        index: number;
        points: System.Collections.Generic.List$1<number>;
        starCount: number;
        canAccumulateLast: boolean;
        getTotalPoints(): number;
        getLastPoints(): number;
        addPoint(point: number): void;
        /**
         * Remove last point entry
         *
         * @instance
         * @public
         * @this Dice.Component.Player
         * @memberof Dice.Component.Player
         * @return  {void}
         */
        removeLastPoints(): void;
        reset(): void;
    }
    export interface PlayerFunc extends Function {
        prototype: Player;
        ctor: {
            new (): Player
        };
        $ctor1: {
            new (name: string, index: number): Player
        };
    }
    var Player: PlayerFunc;
}