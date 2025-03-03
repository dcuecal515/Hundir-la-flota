namespace Server.DTOs
{
    public class FinishGameMessageDto
    {
        public string Message { get; set; }
        public int YourScore { get; set; }
        public int OpponentScore { get; set; }
        public string Position { get; set; }
        public bool YourImpacted { get; set; }
    }
}
