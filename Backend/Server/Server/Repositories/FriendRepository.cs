using Server.Models;
using Server.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace Server.Repositories
{
    public class FriendRepository : Repository<Friend,int>
    {
        public FriendRepository(HundirLaFlotaContext context) : base(context) { }

        public async Task<>

    }
}
