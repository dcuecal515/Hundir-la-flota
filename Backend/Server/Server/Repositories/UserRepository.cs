using Server.Repositories.Base;
using Server.Models;
using Server.DTOs;
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
                    .Include(user => user.friends)
                    .FirstOrDefaultAsync(user => user.Email.Equals(identifier));
            } else
            {
                return await GetQueryable()
                    .Include(user => user.friends)
                    .FirstOrDefaultAsync(user => user.NickName.Equals(identifier));
            }
        }
        public async Task<IEnumerable<User>> getAllUserByName(string name,int id)
        {
            IEnumerable<User> users= await GetQueryable().Where(user=>user.NickName.ToLower().Contains(name)).Where(user => user.Id != id).ToListAsync();
            return users;
        }
        public async Task<User> GetAllFriend(int id)
        {
            return await GetQueryable().Include(user =>user.friends).FirstOrDefaultAsync(user=>user.Id==id);
        }
        public async Task<UserProfileDataDto> GetUserByIdAsync(int id)
        {
            User user = await GetQueryable().Include(user => user.games).FirstOrDefaultAsync(user=>user.Id== id);
            if (user == null)
            {
                
                Console.WriteLine("Fallo al obtener usuario "+id);
                return null;
            } else
            {
                Console.WriteLine("Usuario obtenido");
                return new UserProfileDataDto
                {
                    NickName = user.NickName,
                    Avatar = user.Avatar,
                    Email = user.Email,
                    GamesPlayed = user.games
                };
            }
            
        }

        public async Task<User> GetIfExistUserByNickName(string nickName)
        {
            return await GetQueryable().FirstOrDefaultAsync(user=>user.NickName==nickName);
        }
        public async Task<User> GetIfExistUserByEmail(string email)
        {
            return await GetQueryable().FirstOrDefaultAsync(user => user.Email == email);
        }
    }
}
