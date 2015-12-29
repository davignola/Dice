using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Dice.Startup))]
namespace Dice
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
