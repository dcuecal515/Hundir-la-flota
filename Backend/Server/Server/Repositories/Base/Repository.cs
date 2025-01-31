﻿using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;

namespace Server.Repositories.Base
{
    public class Repository<TEntity, TId> : IRepository<TEntity, TId> where TEntity : class
    {
        protected readonly HundirLaFlotaContext _context;

        public Repository(HundirLaFlotaContext context)
        {
            _context = context;
        }

        public async Task<ICollection<TEntity>> GetAllAsync()
        {
            return await _context.Set<TEntity>().ToArrayAsync();
        }

        public async Task<TEntity> GetByIdAsync(TId id)
        {
            return await _context.Set<TEntity>().FindAsync(id);
        }



        public IQueryable<TEntity> GetQueryable(bool asNoTracking = true)
        {
            DbSet<TEntity> entities = _context.Set<TEntity>();
            return asNoTracking ? entities.AsNoTracking() : entities;
        }

        public void Add(TEntity entity)
        {
            _context.Set<TEntity>().Add(entity);
        }

        public void Delete(TEntity entity)
        {
            _context.Set<TEntity>().Remove(entity);
        }

        public async Task<bool> ExistAsync(TId id)
        {
            return await GetByIdAsync(id) != null;
        }

        public async Task<TEntity> InsertAsync(TEntity entity)
        {
            EntityEntry<TEntity> entry = await _context.Set<TEntity>().AddAsync(entity);
            return entry.Entity;
        }

        public void Update(TEntity entity)
        {
            _context.Set<TEntity>().Update(entity);
        }
    }
}
