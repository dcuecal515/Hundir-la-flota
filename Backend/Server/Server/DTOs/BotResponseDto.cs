namespace Server.DTOs
{
    public class BotResponseDto
    {
        public string Message { get; set; }
        public bool YourImpacted { get; set; } = false;
        public string YourShoot { get; set; } = string.Empty;
        public bool BotImpacted { get; set; } = false;
        public string BotAtack { get; set; } = string.Empty;
    }
}
