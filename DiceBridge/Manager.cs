using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Bridge.Html5;
using Dice.Component;
using Bridge;

namespace Dice
{
    public sealed class Manager
    {
        private Manager()
        {
        }

        public static Manager Instance { get { return Nested.instance; } }

        private class Nested
        {
            // Explicit static constructor to tell C# compiler
            // not to mark type as beforefieldinit
            static Nested()
            {
            }

            internal static readonly Manager instance = new Manager();
        }

        private const string savedGameStateKey = "DiceSaveGameState";
        private const string savedGamePlayersKey = "DiceSavePlayers";

        public List<Player> Players = new List<Player>();
        public Player CurrentPlayer;
        public GameSettings Settings = new GameSettings { Startup = 500, Cumul = 5000, Target = 20000 };

        // Game ends when a player matches this id
        public int LastRoundPlayerIndex = -1;
        public int RoundCount = 0;
        public int LastPoints = 0;

        public void AddPlayer(string name)
        {
            var newIndex = GetMaxIndex() + 1;
            name = string.IsNullOrWhiteSpace(name) ? "Joueur " + (newIndex + 1) : name;
            var newPlayer = new Player(name, newIndex);
            Players.Add(newPlayer);
            Ui.AddPlayerContainer(newPlayer);
            if (newIndex == 0)
            {
                this.CurrentPlayer = newPlayer;
                Ui.SetCurentPlayer(newIndex);
            }
        }

        public int GetMaxIndex()
        {
            return Players.Any() ? Players.Max(mx => mx.Index) : -1;
        }

        public void NextPlayer()
        {
            // Init
            var nextIndex = GetNextIndex();
            // accumulate current points
            if (this.CurrentPlayer == null) { Ui.AddAlert("Ajoutez des joueurs pour commencer", Ui.AlertSeverity.info); return; }

            // if the last round index is ours we are already game over
            if (this.CurrentPlayer.Index == this.LastRoundPlayerIndex)
            {
                return;
            }
            var points = Ui.GetAccumulated();
            // Must have enough points to start
            if (points != 0 && this.CurrentPlayer.TotalPoints < this.Settings.Startup && points < this.Settings.Startup)
            {
                points = 0;
                Ui.AddAlert("Le joueur doit avoir au moins " + this.Settings.Startup + " pour commencer à cumuler", Ui.AlertSeverity.warning);
            }
            // Must not bust target 
            if ((this.CurrentPlayer.TotalPoints + points > this.Settings.Target))
            {
                points = 0;
                Ui.AddAlert("Le joueur doit finir à exactement : " + this.Settings.Target + " points", Ui.AlertSeverity.warning);
            }
            this.CurrentPlayer.AddPoint(points);
            this.LastPoints = points;
            // Check if can now accumulate last
            if (!this.CurrentPlayer.CanAccumulateLast && this.CurrentPlayer.TotalPoints >= this.Settings.Cumul)
            {
                this.CurrentPlayer.CanAccumulateLast = true;
                //TODO: special mark
                Ui.AddAlert(this.CurrentPlayer.Name + " peux maintenant cumuler le score précédent", Ui.AlertSeverity.info);
            }
            // if target reached flag as a winner
            if (this.CurrentPlayer.TotalPoints == this.Settings.Target)
            {
                // Add a legendary winning star
                Ui.AddStar(this.CurrentPlayer.Index);
                this.CurrentPlayer.StarCount++;
                // flag last round if not allready done
                if (this.LastRoundPlayerIndex == -1)
                {
                    this.LastRoundPlayerIndex = this.CurrentPlayer.Index;
                    Ui.AddAlert("Dernière ronde !", Ui.AlertSeverity.info);
                }
            }
            Ui.AddPoint(this.CurrentPlayer.Index, this.RoundCount, points, this.CurrentPlayer.TotalPoints);
            Ui.SetAccumulated(0);
            // Check if round completed
            if (nextIndex == 0)
            {
                this.RoundCount++;
            }
            //Set next player
            this.CurrentPlayer = this.Players[nextIndex];
            Ui.SetCurentPlayer(nextIndex);
            // if the last round index is the nextr then game over confeties'n shitz
            if (nextIndex == this.LastRoundPlayerIndex)
            {
                Ui.AddAlert("Game Over !", Ui.AlertSeverity.success);
            }

            SaveGame();
        }
        public int GetNextIndex()
        {
            var nextIndex = (this.CurrentPlayer != null ? this.CurrentPlayer.Index + 1 : 0);
            if (nextIndex > this.GetMaxIndex())
            {
                nextIndex = 0;
            }
            return nextIndex;
        }

        public int GetPreviousIndex()
        {
            var prevIndex = (this.CurrentPlayer != null ? this.CurrentPlayer.Index - 1 : this.GetMaxIndex());
            if (prevIndex < 0)
            {
                prevIndex = this.GetMaxIndex();
            }
            return prevIndex;
        }

        public void AccumulateLast()
        {
            if (this.CurrentPlayer == null) { return; }
            if (this.CurrentPlayer.CanAccumulateLast)
            {
                Ui.Accumulate(this.LastPoints);
            }
            else
            {
                Ui.AddAlert("Le joueur doit avoir au moins " + this.Settings.Cumul + " pour cumuler les points précédents", Ui.AlertSeverity.warning);
            }
        }

        public void NextPlayerAccumulateLast()
        {
            this.NextPlayer();
            this.AccumulateLast();
        }

        public void CancelLastMove()
        {
            // Has a game started ?
            if (this.CurrentPlayer == null || (this.CurrentPlayer.Index == 0 && this.RoundCount == 0))
            {
                return;
            }
            var previousIndex = this.GetPreviousIndex();
            // restore accumulator
            Ui.SetAccumulated(this.LastPoints);
            // Check if last round was winning move
            if (this.LastRoundPlayerIndex == previousIndex)
            {
                this.LastRoundPlayerIndex = -1;
            }
            // check if we undo a round
            if (previousIndex == this.GetMaxIndex())
            {
                this.RoundCount--;
            }
            // set previous player
            this.CurrentPlayer = GetPlayerbyIndex(previousIndex);
            // set in ui
            Ui.SetCurentPlayer(previousIndex);
            // remove points
            this.CurrentPlayer.RemoveLastPoints();
            // Remove points from ui
            Ui.RemovePoints(previousIndex, this.RoundCount, this.CurrentPlayer.TotalPoints);
            // Restore previous points
            this.LastPoints = this.GetPlayerbyIndex(this.GetPreviousIndex()).LastPoints;
        }

        public void Reset()
        {
            // Re-Apply (new)rules
            this.Settings = Ui.GetParams();

            foreach (var player in this.Players)
            {
                player.Reset();
            }
            Ui.Reset();
            this.LastRoundPlayerIndex = -1;
            this.LastPoints = 0;
            this.CurrentPlayer = this.Players.FirstOrDefault();
            this.RoundCount = 0;
        }

        public void NewGame()
        {
            // Apply rules
            this.Settings = Ui.GetParams();
            // Flush players
            this.Players.Clear();
            Ui.ClearPlayerContainer();
            // Reset the rest
            this.Reset();
        }

        public void RemovePlayer(int playerIndex)
        {
            var player = GetPlayerbyIndex(playerIndex);
            if (player == null) { return; }
            this.Players.Remove(player);
            // Re-index
            int idx = 0;
            foreach (var curPlayer in this.Players)
            {
                curPlayer.Index = idx++;
            }
            //TODO: re-index ui
            // Remove from ui
            Ui.RemovePlayerContainer(playerIndex);
        }

        public Player GetPlayerbyIndex(int playerIndex)
        {
            return this.Players.SingleOrDefault(sg => sg.Index == playerIndex);
        }

        public void SaveGame()
        {
            Window.LocalStorage.SetItem(Manager.savedGameStateKey, JSON.Stringify(this, new string[] { "Settings", "RoundCount", "LastPoints", "LastRoundPlayerIndex", "CurrentPlayer" }));
            Window.LocalStorage.SetItem(Manager.savedGamePlayersKey, JSON.Stringify(this.Players.ToArray()));
        }

        public void LoadGame()
        {
            var oldManager = JSON.Parse<Manager>((string)Window.LocalStorage.GetItem(Manager.savedGameStateKey));
            var oldPlayers = JSON.ParseAsArray<Player>((string)Window.LocalStorage.GetItem(Manager.savedGamePlayersKey));

            this.Players = oldPlayers.ToList();
            this.Settings = oldManager.Settings;
            this.RoundCount = oldManager.RoundCount;
            this.LastPoints = oldManager.LastPoints;
            this.LastRoundPlayerIndex = oldManager.LastRoundPlayerIndex;
            this.CurrentPlayer = oldManager.CurrentPlayer;

            // Rebuild the ui
            Ui.ClearPlayerContainer();
            foreach (var player in this.Players)
            {
                Ui.AddPlayerContainer(player);
                //Re-Add points history
                Enumerable
                    .Range(0, player.Points.Count)
                    .Zip(player.Points, (round, point) => new { round, point })
                    .Aggregate(0, (cur, nxt) =>
                        { cur += nxt.point; Ui.AddPoint(player.Index, nxt.round, nxt.point, cur); return cur; });

                // Restore starz
                for (var i = 0; i < player.StarCount; i++) { Ui.AddStar(player.Index); }
            }
            Ui.SetCurentPlayer(this.CurrentPlayer.Index);
        }
    }
}
