using Server.Repositories.Base;
using Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Server.Repositories
{
    public class UserRepository : Repository<User, int>
    {
        public UserRepository(HundirLaFlotaContext context) : base(context){ }


    }
}
