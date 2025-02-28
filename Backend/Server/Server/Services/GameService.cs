using Server.Models;

namespace Server.Services
{
    public class GameService
    {
        private readonly UnitOfWork _unitOfWork;
        public GameService(UnitOfWork unitOfWork) {
            _unitOfWork = unitOfWork;
        }

        public async Task<Game> CreateGame(int time)
        {

            Game game=new Game();
            game.Time = time;
            Game Newgame = await InsertGameAsync(game);
            return Newgame;
        }
        public async Task createGameInfo(GameInfo gameInfo)
        {
            GameInfo newGameInfo = await _unitOfWork.GameInfoRepository.InsertAsync(gameInfo);
            await _unitOfWork.SaveAsync();
        }
        public async Task<Game> InsertGameAsync(Game game)
        {
            // Hace falta añadir aqui un nuevo historial
            Game newGame = await _unitOfWork.GameRepository.InsertAsync(game);
            await _unitOfWork.SaveAsync();
            return newGame;
        }
        public async Task<Game> GetGameById(int id)
        {
            return await _unitOfWork.GameRepository.GetByIdAsync(id);
        }
        public async Task UpdateGameAsync(Game game)
        {
            _unitOfWork.GameRepository.Update(game);
            await _unitOfWork.SaveAsync();
        }
    }
}
