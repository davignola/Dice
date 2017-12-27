using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Bridge;

namespace Dice.Component
{
    /// <summary>
    /// Player class
    /// </summary>
    [Reflectable]
    public class Player
    {
        public string Name;
        public int Index;
        public List<int> Points = new List<int>();
        public int TotalPoints { get { return Points.Sum(); } }
        public int LastPoints { get { return Points.LastOrDefault(); } }
        public int StarCount;
        public bool CanAccumulateLast = false;

        public Player()
        {
            Name = "Default";
            Index = -1;
        }

        public Player(string name, int index)
        {
            Name = name;
            Index = index;
        }

        public void AddPoint(int point)
        {
            Points.Add(point);
        }

        /// <summary>
        /// Remove last point entry
        /// </summary>
        public void RemoveLastPoints()
        {
            if (this.Points.Any())
            {
                this.Points.Remove(this.Points.Last());
            }
        }

        public void Reset()
        {
            Points.Clear();
            CanAccumulateLast = false;
        }

    }
}
