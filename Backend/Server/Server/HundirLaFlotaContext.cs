using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server
{
    public class HundirLaFlotaContext : DbContext
    {
        private readonly Settings _settings;
        public HundirLaFlotaContext (Settings settings)
        {
            _settings = settings;
        }

        private const string DATABASE_PATH = "hundirlaflota.db";

        // Hay que añadir los nuevos modelos cuando los tengamos
        public DbSet<User> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            #if DEBUG
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
            #else
                optionsBuilder.UseMySql(_settings.DatabaseConnection, ServerVersion.AutoDetect(_settings.DatabaseConnection));
            #endif
        }

    }
}
