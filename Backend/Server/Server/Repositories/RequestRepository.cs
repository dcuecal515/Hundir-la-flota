using Server.Models;
using Server.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace Server.Repositories
{
    public class RequestRepository : Repository<Request, int>
    {
        public RequestRepository(HundirLaFlotaContext context) : base(context) { }

        public async Task<Request> GetRequestByUsersId(int userId, int user2Id)
        {
            return await GetQueryable()
                .FirstOrDefaultAsync(request =>
                (request.SenderUserId.Equals(userId) && request.ReceivingUserId.Equals(user2Id))
                ||
                (request.SenderUserId.Equals(user2Id) && request.ReceivingUserId.Equals(userId))
                        );
        }
    }
}
