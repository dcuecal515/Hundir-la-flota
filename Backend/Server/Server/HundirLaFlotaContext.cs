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
        public DbSet<Request> Requests { get; set; }
        public DbSet<Friend> Friends { get; set; }
        public DbSet<Game> Games { get; set; }
        public DbSet<GameInfo> GameInfo { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            #if DEBUG
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
#else
                string connection = "Server=db14338.databaseasp.net; Database=db14338; Uid=db14338; Pwd=4b=BA2w?6#Wm;";
                optionsBuilder.UseMysql(connection,ServerVersion.AutoDetect(connection));
#endif
        }

    }
}
