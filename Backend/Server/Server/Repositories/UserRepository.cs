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

            User user = await GetQueryable()
                .FirstOrDefaultAsync(user=>user.Id== id);
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
        public async Task<FullUserDataDto> GetFullUserById(int id)
        {
            User user = await GetQueryable()
                                      .Include(u => u.gameInfos)
                                      .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return null; 
            }

            var gameIds = user.gameInfos.Select(gi => gi.GameId).ToList();

            // Para evitar la referencia ciclica separamos en dos las peticiones a la base de datos
            var games = await _context.Games
                                      .Where(g => gameIds.Contains(g.Id))
                                      .Include(g => g.gameInfos)
                                          .ThenInclude(gi => gi.User)
                                      .ToListAsync();

            FullUserDataDto fullUserData = new FullUserDataDto
            {
                Id = id,
                NickName = user.NickName,
                Email = user.Email,
                Avatar = user.Avatar,
                Games = new List<GameInfoDto>()
            };

            foreach (var gameInfo in user.gameInfos)
            {
                var game = games.FirstOrDefault(g => g.Id == gameInfo.GameId);
                if (game == null) continue;

                var opponent = game.gameInfos.FirstOrDefault(g => g.UserId != user.Id);
                string opponentNickName = opponent?.User?.NickName ?? "Bot1";

                fullUserData.Games.Add(new GameInfoDto
                {
                    Score = gameInfo.Score,
                    State = gameInfo.State,
                    TimeSeconds = game.Time,
                    OpponentNickName = opponentNickName
                });
            }

            return fullUserData;
        }
        public async Task<ICollection<User>> getAllUserExceptId(int id)
        {
            return await GetQueryable()
                .Where(user => user.Id != id)
                .ToArrayAsync();
        }

    }
}
