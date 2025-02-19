using Server.Models;
using Server.Repositories.Base;

namespace Server.Repositories
{
    public class GameRepository : Repository<Game, int>
    {
        public GameRepository(HundirLaFlotaContext context) : base(context) { }
    }
}
