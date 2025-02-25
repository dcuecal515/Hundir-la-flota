using Server.Models;
using Server.Repositories.Base;

namespace Server.Repositories
{
    public class GameInfoRepository : Repository<GameInfo, int>
    {   
    public GameInfoRepository(HundirLaFlotaContext context) : base(context) { }
        
    }
}
