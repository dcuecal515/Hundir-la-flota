using Server.Repositories.Base;
using Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Server.Repositories
{
    public class UserRepository : Repository<User, int>
    {
        public UserRepository(HundirLaFlotaContext context) : base(context){ }

        public async Task<User> GetByIdentifierAsync(string identifier)
        {
            bool isEmail = Regex.IsMatch(identifier, "^[a-z0-9.]+@[a-z0-9]+\\.[a-z]+(\\.[a-z]+)?$", RegexOptions.IgnoreCase); // Comprueba si es un email o no

            if (isEmail)
            {
                return await GetQueryable()
                    .FirstOrDefaultAsync(user => user.Email.Equals(identifier));
            } else
            {
                return await GetQueryable()
                    .FirstOrDefaultAsync(user => user.NickName.Equals(identifier));
            }
        }
    }
}
