namespace Server
{
    public class UnitOfWork
    {
        private readonly HundirLaFlotaContext _context;
        public UnitOfWork(HundirLaFlotaContext context)
        {
            _context = context;
        }

        
    }
}
