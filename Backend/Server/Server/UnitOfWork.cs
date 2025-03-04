﻿using Server.Repositories;

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

        private FriendRepository _friendRepository;

        public FriendRepository FriendRepository => _friendRepository ??= new FriendRepository(_context);

        private GameRepository _gameRepository;

        public GameRepository GameRepository => _gameRepository ??= new GameRepository(_context);

        private GameInfoRepository _gameinfoRepository;

        public GameInfoRepository GameInfoRepository => _gameinfoRepository ??= new GameInfoRepository(_context);

        public HundirLaFlotaContext Context => _context;

        public async Task<bool> SaveAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
