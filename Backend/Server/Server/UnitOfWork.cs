using Server.Repositories;

namespace Server
{
    public class UnitOfWork
    {
        private readonly HundirLaFlotaContext _context;

        public UnitOfWork(HundirLaFlotaContext context)
        {
            _context = context;
        }

        private UserRepository _userRepository;

        public UserRepository UserRepository => _userRepository ??= new UserRepository(_context);

        private RequestRepository _requestRepository;

        public RequestRepository RequestRepository => _requestRepository ??= new RequestRepository(_context);

        public HundirLaFlotaContext Context => _context;

        public async Task<bool> SaveAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
