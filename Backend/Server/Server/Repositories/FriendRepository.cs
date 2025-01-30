using Server.Models;
using Server.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace Server.Repositories
{
    public class FriendRepository : Repository<Friend,int>
    {
        public FriendRepository(HundirLaFlotaContext context) : base(context) { }

        //public async Task<>

        public bool GetIfUsersAreFriends(User user1, User user2)
        {
            foreach (var friend in user1.friends)
            {
                if (friend.FriendId.Equals(user2.Id))
                {
                    return true;
                }
            }
            return false;
        }

    }
}
