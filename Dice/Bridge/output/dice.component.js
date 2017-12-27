/**
 * @version 1.0.0.0
 * @copyright Copyright ©  2017
 * @compiler Bridge.NET 15.7.0
 */
Bridge.assembly("Dice", function ($asm, globals) {
    "use strict";

    Bridge.define("Dice.Component.GameSettings", {
        $kind: "struct",
        statics: {
            getDefaultValue: function () { return new Dice.Component.GameSettings(); }
        },
        target: 0,
        startup: 0,
        cumul: 0,
        ctor: function () {
            this.$initialize();
        },
        getHashCode: function () {
            var h = Bridge.addHash([5591610627, this.target, this.startup, this.cumul]);
            return h;
        },
        equals: function (o) {
            if (!Bridge.is(o, Dice.Component.GameSettings)) {
                return false;
            }
            return Bridge.equals(this.target, o.target) && Bridge.equals(this.startup, o.startup) && Bridge.equals(this.cumul, o.cumul);
        },
        $clone: function (to) {
            var s = to || new Dice.Component.GameSettings();
            s.target = this.target;
            s.startup = this.startup;
            s.cumul = this.cumul;
            return s;
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
        name: null,
        index: 0,
        points: null,
        starCount: 0,
        canAccumulateLast: false,
        config: {
            init: function () {
                this.points = new (System.Collections.Generic.List$1(System.Int32))();
            }
        },
        ctor: function () {
            this.$initialize();
            this.name = "Default";
            this.index = -1;
        },
        $ctor1: function (name, index) {
            this.$initialize();
            this.name = name;
            this.index = index;
        },
        getTotalPoints: function () {
            return System.Linq.Enumerable.from(this.points).sum();
        },
        getLastPoints: function () {
            return System.Linq.Enumerable.from(this.points).lastOrDefault(null, 0);
        },
        addPoint: function (point) {
            this.points.add(point);
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
        removeLastPoints: function () {
            if (System.Linq.Enumerable.from(this.points).any()) {
                this.points.remove(System.Linq.Enumerable.from(this.points).last());
            }
        },
        reset: function () {
            this.points.clear();
            this.canAccumulateLast = false;
        }
    });
});
