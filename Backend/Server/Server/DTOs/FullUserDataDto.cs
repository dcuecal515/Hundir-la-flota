namespace Server.DTOs
{
    public class FullUserDataDto
    {
        public int Id { get; set; }
        public string NickName { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public List<GameInfoDto> Games { get; set; }
        public int TotalGames { get; set; }
    }
}
